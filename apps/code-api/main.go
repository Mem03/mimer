package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"sigs.k8s.io/yaml"
)

// AI-First Response Types

type Action struct {
	Action   string `json:"action"`
	Endpoint string `json:"endpoint,omitempty"`
}

type GitStatusResponse struct {
	Type     string   `json:"type"`
	Repo     string   `json:"repo"`
	Branch   string   `json:"branch"`
	Status   string   `json:"status"` // HEALTHY, WARNING, ERROR
	Dirty    bool     `json:"dirty"`
	Actions  []Action `json:"actions"`
	Message  string   `json:"message,omitempty"`
	Timestamp string  `json:"timestamp"`
}

type GitCloneResponse struct {
	Type     string   `json:"type"`
	Repo     string   `json:"repo"`
	LocalPath string  `json:"local_path"`
	Status   string   `json:"status"`
	Actions  []Action `json:"actions"`
	Message  string   `json:"message,omitempty"`
	Timestamp string  `json:"timestamp"`
}

type MinIOListResponse struct {
	Type     string    `json:"type"`
	Bucket   string    `json:"bucket"`
	Path     string    `json:"path"`
	Status   string    `json:"status"`
	Files    []MinIOFile `json:"files"`
	Actions  []Action  `json:"actions"`
	Timestamp string   `json:"timestamp"`
}

type MinIOFile struct {
	Name      string `json:"name"`
	Size      int64  `json:"size"`
	IsDir     bool   `json:"is_dir"`
	Modified  string `json:"modified,omitempty"`
}

type MinIOReadResponse struct {
	Type     string   `json:"type"`
	Bucket   string   `json:"bucket"`
	Path     string   `json:"path"`
	Content  string   `json:"content"`
	Status   string   `json:"status"`
	Actions  []Action `json:"actions"`
	Timestamp string  `json:"timestamp"`
}

type ExecuteRequest struct {
	Repo     string `json:"repo"`
	Branch   string `json:"branch"`
	FilePath string `json:"file_path"`
	JobType  string `json:"job_type"` // "spark" or "python"
}

type ExecuteResponse struct {
	Type          string   `json:"type"`
	JobID         string   `json:"job_id"`
	Namespace     string   `json:"namespace"`
	Repo          string   `json:"repo"`
	Branch        string   `json:"branch"`
	FilePath      string   `json:"file_path"`
	JobType       string   `json:"job_type"`
	Status        string   `json:"status"` // PENDING, RUNNING, COMPLETED, FAILED
	Progress      string   `json:"progress,omitempty"`
	OutputLocation string  `json:"output_location"`
	Actions       []Action `json:"actions"`
	Message       string   `json:"message,omitempty"`
	Timestamp     string   `json:"timestamp"`
}

type HealthResponse struct {
	Status    string   `json:"status"`
	Timestamp string   `json:"timestamp"`
	Actions   []Action `json:"actions"`
}

// Global Clients
var (
	minioClient *minio.Client
	k8sClient   *kubernetes.Clientset
	gitToken    string
	namespace   string = "mimer"
)

// CORS Middleware
func setHeaders(w http.ResponseWriter) {
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}
	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setHeaders(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	}
}

// Initialize MinIO Client
func initMinioClient() (*minio.Client, error) {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	if accessKeyID == "" {
		accessKeyID = "admin"
	}
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")
	if secretAccessKey == "" {
		secretAccessKey = "minio123"
	}

	return minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false,
	})
}

// Initialize K8s Client
func initK8sClient() (*kubernetes.Clientset, error) {
	// Try in-cluster config first
	config, err := rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig
		kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create k8s config: %v", err)
		}
	}

	return kubernetes.NewForConfig(config)
}

// Helper to extract GitHub token from Authorization header
func extractTokenFromRequest(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return gitToken // Fall back to env var
	}
	// Expecting "Bearer <token>"
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return gitToken // Fall back to env var
	}
	return strings.TrimSpace(parts[1])
}

// Git Operations

func handleGitClone(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RepoURL string `json:"repo_url"`
		LocalPath string `json:"local_path,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RepoURL == "" {
		http.Error(w, "repo_url is required", http.StatusBadRequest)
		return
	}

	// Extract token from request header or use global
	token := extractTokenFromRequest(r)
	if token == "" {
		response := GitCloneResponse{
			Type:     "git_clone",
			Repo:     req.RepoURL,
			LocalPath: req.LocalPath,
			Status:   "ERROR",
			Message:  "GitHub token required in Authorization header or GITHUB_TOKEN env var",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Actions: []Action{
				{Action: "Configure token", Endpoint: "/settings"},
			},
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	// Generate local path if not provided
	if req.LocalPath == "" {
		repoName := filepath.Base(req.RepoURL)
		repoName = strings.TrimSuffix(repoName, ".git")
		req.LocalPath = filepath.Join("/tmp", "repos", repoName)
	}

	// Remove existing repo if it exists
	os.RemoveAll(req.LocalPath)

	// Create parent directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(req.LocalPath), 0755); err != nil {
		response := GitCloneResponse{
			Type:     "git_clone",
			Repo:     req.RepoURL,
			LocalPath: req.LocalPath,
			Status:   "ERROR",
			Message:  "Failed to create directory: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Actions: []Action{
				{Action: "Retry clone", Endpoint: "/git/clone"},
			},
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	// Clone the repository
	// For GitHub HTTPS, use token as username with empty password
	_, err := git.PlainClone(req.LocalPath, false, &git.CloneOptions{
		URL: req.RepoURL,
		Auth: &githttp.BasicAuth{
			Username: token,    // GitHub: use token as username
			Password: "",       // No password needed
		},
		Progress: os.Stdout,
	})

	if err != nil {
		response := GitCloneResponse{
			Type:     "git_clone",
			Repo:     req.RepoURL,
			LocalPath: req.LocalPath,
			Status:   "ERROR",
			Message:  err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Actions: []Action{
				{Action: "Retry clone", Endpoint: "/git/clone"},
				{Action: "Check repository URL", Endpoint: ""},
			},
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	response := GitCloneResponse{
		Type:     "git_clone",
		Repo:     req.RepoURL,
		LocalPath: req.LocalPath,
		Status:   "HEALTHY",
		Message:  "Repository cloned successfully",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "List files", Endpoint: "/minio/ls?path=" + req.LocalPath},
			{Action: "Check git status", Endpoint: "/git/status?repo=" + req.RepoURL},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func handleGitSave(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RepoURL  string `json:"repo_url"`
		LocalPath string `json:"local_path"`
		FilePath string `json:"file_path"`
		Content  string `json:"content"`
		CommitMsg string `json:"commit_msg"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RepoURL == "" || req.LocalPath == "" || req.FilePath == "" {
		http.Error(w, "repo_url, local_path, and file_path are required", http.StatusBadRequest)
		return
	}

	// Write content to file
	fullPath := filepath.Join(req.LocalPath, req.FilePath)
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		http.Error(w, "Failed to create directory: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to write file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Git add and commit
	repo, err := git.PlainOpen(req.LocalPath)
	if err != nil {
		http.Error(w, "Failed to open repository: "+err.Error(), http.StatusInternalServerError)
		return
	}

	worktree, err := repo.Worktree()
	if err != nil {
		http.Error(w, "Failed to get worktree: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = worktree.Add(req.FilePath)
	if err != nil {
		http.Error(w, "Failed to add file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	commitMsg := req.CommitMsg
	if commitMsg == "" {
		commitMsg = "Update " + req.FilePath
	}

	_, err = worktree.Commit(commitMsg, &git.CommitOptions{})
	if err != nil {
		http.Error(w, "Failed to commit: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Push to remote
	token := extractTokenFromRequest(r)
	if token == "" {
		token = gitToken
	}
	err = repo.Push(&git.PushOptions{
		RemoteName: "origin",
		Auth: &githttp.BasicAuth{
			Username: token,    // GitHub: use token as username
			Password: "",       // No password needed
		},
		Progress: os.Stdout,
	})

	if err != nil {
		response := GitStatusResponse{
			Type:     "git_save",
			Repo:     req.RepoURL,
			Status:   "WARNING",
			Message:  "File saved and committed but push failed: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Actions: []Action{
				{Action: "Retry push", Endpoint: "/git/save"},
				{Action: "Check git status", Endpoint: "/git/status?repo=" + req.RepoURL},
			},
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	response := GitStatusResponse{
		Type:     "git_save",
		Repo:     req.RepoURL,
		Status:   "HEALTHY",
		Message:  "File saved, committed, and pushed successfully",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "View file", Endpoint: "/minio/read?path=" + filepath.Join(req.LocalPath, req.FilePath)},
			{Action: "Execute code", Endpoint: "/execute"},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func handleGitStatus(w http.ResponseWriter, r *http.Request) {
	repoURL := r.URL.Query().Get("repo")
	localPath := r.URL.Query().Get("local_path")

	if repoURL == "" {
		http.Error(w, "repo query parameter is required", http.StatusBadRequest)
		return
	}

	if localPath == "" {
		repoName := filepath.Base(repoURL)
		repoName = strings.TrimSuffix(repoName, ".git")
		localPath = filepath.Join("/tmp", "repos", repoName)
	}

	repo, err := git.PlainOpen(localPath)
	if err != nil {
		response := GitStatusResponse{
			Type:     "git_status",
			Repo:     repoURL,
			Status:   "ERROR",
			Message:  "Repository not found: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Actions: []Action{
				{Action: "Clone repository", Endpoint: "/git/clone"},
			},
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	worktree, err := repo.Worktree()
	if err != nil {
		http.Error(w, "Failed to get worktree", http.StatusInternalServerError)
		return
	}

	status, err := worktree.Status()
	if err != nil {
		http.Error(w, "Failed to get status", http.StatusInternalServerError)
		return
	}

	isDirty := len(status) > 0

	var statusStr string
	if isDirty {
		statusStr = "WARNING"
	} else {
		statusStr = "HEALTHY"
	}

	// Get current branch
	ref, err := repo.Head()
	branch := "unknown"
	if err == nil {
		branch = ref.Name().Short()
	}

	response := GitStatusResponse{
		Type:     "git_status",
		Repo:     repoURL,
		Branch:   branch,
		Status:   statusStr,
		Dirty:    isDirty,
		Message:  fmt.Sprintf("%d files modified", len(status)),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Commit changes", Endpoint: "/git/save"},
			{Action: "Pull latest", Endpoint: ""},
		},
	}
	json.NewEncoder(w).Encode(response)
}

// MinIO Operations

func handleMinIOList(w http.ResponseWriter, r *http.Request) {
	bucket := r.URL.Query().Get("bucket")
	path := r.URL.Query().Get("path")

	if bucket == "" {
		bucket = "mimer"
	}

	if path == "" {
		path = "."
	}

	ctx := context.Background()
	objects := minioClient.ListObjects(ctx, bucket, minio.ListObjectsOptions{
		Prefix:    path,
		Recursive: false,
	})

	var files []MinIOFile
	for obj := range objects {
		if obj.Err != nil {
			continue
		}
		files = append(files, MinIOFile{
			Name:     obj.Key,
			Size:     obj.Size,
			IsDir:    strings.HasSuffix(obj.Key, "/"),
			Modified: obj.LastModified.Format(time.RFC3339),
		})
	}

	// If path doesn't end with / and we got no results, try with /
	if len(files) == 0 && !strings.HasSuffix(path, "/") {
		pathWithSlash := path + "/"
		objects = minioClient.ListObjects(ctx, bucket, minio.ListObjectsOptions{
			Prefix:    pathWithSlash,
			Recursive: false,
		})
		for obj := range objects {
			if obj.Err != nil {
				continue
			}
			files = append(files, MinIOFile{
				Name:     obj.Key,
				Size:     obj.Size,
				IsDir:    strings.HasSuffix(obj.Key, "/"),
				Modified: obj.LastModified.Format(time.RFC3339),
			})
		}
	}

	response := MinIOListResponse{
		Type:     "minio_list",
		Bucket:   bucket,
		Path:     path,
		Status:   "HEALTHY",
		Files:    files,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Read file", Endpoint: "/minio/read?bucket=" + bucket + "&path="},
			{Action: "Upload file", Endpoint: "/minio/write?bucket=" + bucket},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func handleMinIORead(w http.ResponseWriter, r *http.Request) {
	bucket := r.URL.Query().Get("bucket")
	path := r.URL.Query().Get("path")

	if bucket == "" {
		bucket = "mimer"
	}

	if path == "" {
		http.Error(w, "path query parameter is required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	obj, err := minioClient.GetObject(ctx, bucket, path, minio.GetObjectOptions{})
	if err != nil {
		http.Error(w, "Failed to read file: "+err.Error(), http.StatusNotFound)
		return
	}
	defer obj.Close()

	content, err := io.ReadAll(obj)
	if err != nil {
		http.Error(w, "Failed to read file content: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := MinIOReadResponse{
		Type:     "minio_read",
		Bucket:   bucket,
		Path:     path,
		Content:  string(content),
		Status:   "HEALTHY",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Edit file", Endpoint: "/git/save"},
			{Action: "List directory", Endpoint: "/minio/ls?bucket=" + bucket + "&path=" + filepath.Dir(path)},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func handleMinIOWrite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bucket := r.URL.Query().Get("bucket")
	path := r.URL.Query().Get("path")

	if bucket == "" {
		bucket = "mimer"
	}

	if path == "" {
		http.Error(w, "path query parameter is required", http.StatusBadRequest)
		return
	}

	content, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	_, err = minioClient.PutObject(ctx, bucket, path, bytes.NewReader(content), int64(len(content)), minio.PutObjectOptions{})
	if err != nil {
		http.Error(w, "Failed to write file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := MinIOReadResponse{
		Type:     "minio_write",
		Bucket:   bucket,
		Path:     path,
		Content:  string(content),
		Status:   "HEALTHY",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Read file", Endpoint: "/minio/read?bucket=" + bucket + "&path=" + path},
			{Action: "List directory", Endpoint: "/minio/ls?bucket=" + bucket + "&path=" + filepath.Dir(path)},
		},
	}
	json.NewEncoder(w).Encode(response)
}

// Execute Operations

func handleExecute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Repo == "" || req.FilePath == "" {
		http.Error(w, "repo and file_path are required", http.StatusBadRequest)
		return
	}

	if req.JobType == "" {
		req.JobType = "python"
	}

	if req.Branch == "" {
		req.Branch = "main"
	}

	jobID := uuid.New().String()

	// Create a unique output location
	outputLocation := fmt.Sprintf("minio://outputs/%s/", jobID)

	// Create the job based on type
	var err error
	if req.JobType == "spark" {
		err = submitSparkJob(req, jobID, outputLocation)
	} else {
		err = submitK8sJob(req, jobID, outputLocation)
	}

	if err != nil {
		response := ExecuteResponse{
			Type:          "execute",
			JobID:         jobID,
			Namespace:     namespace,
			Repo:          req.Repo,
			Branch:        req.Branch,
			FilePath:      req.FilePath,
			JobType:       req.JobType,
			Status:        "ERROR",
			OutputLocation: outputLocation,
			Message:       err.Error(),
			Timestamp:     time.Now().UTC().Format(time.RFC3339),
			Actions: []Action{
				{Action: "Retry execution", Endpoint: "/execute"},
				{Action: "Check job logs", Endpoint: "/execute/" + jobID},
			},
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	response := ExecuteResponse{
		Type:          "execute",
		JobID:         jobID,
		Namespace:     namespace,
		Repo:          req.Repo,
		Branch:        req.Branch,
		FilePath:      req.FilePath,
		JobType:       req.JobType,
		Status:        "PENDING",
		Progress:      "0%",
		OutputLocation: outputLocation,
		Message:       "Job submitted successfully",
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Poll job status", Endpoint: "/execute/" + jobID},
			{Action: "Cancel job", Endpoint: "/execute/" + jobID + "/cancel"},
			{Action: "View outputs", Endpoint: "/minio/ls?bucket=outputs&path=" + jobID},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func handleExecuteStatus(w http.ResponseWriter, r *http.Request) {
	jobID := r.URL.Path[len("/execute/"):]
	if jobID == "" {
		http.Error(w, "job_id is required", http.StatusBadRequest)
		return
	}

	// In a real implementation, this would query K8s for job status
	// For now, we'll simulate it
	// Check if job exists in our "database" (for demo purposes, we'll just return a simulated status)

	// Simulate different statuses based on job ID
	var status, progress, message string
	switch {
	case strings.HasPrefix(jobID, "completed"):
		status = "COMPLETED"
		progress = "100%"
		message = "Job completed successfully"
	case strings.HasPrefix(jobID, "failed"):
		status = "FAILED"
		progress = "0%"
		message = "Job failed"
	default:
		status = "RUNNING"
		progress = "50%"
		message = "Job is running"
	}

	response := ExecuteResponse{
		Type:          "execute_status",
		JobID:         jobID,
		Namespace:     namespace,
		Status:        status,
		Progress:      progress,
		OutputLocation: fmt.Sprintf("minio://outputs/%s/", jobID),
		Message:       message,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Poll job status", Endpoint: "/execute/" + jobID},
			{Action: "View outputs", Endpoint: "/minio/ls?bucket=outputs&path=" + jobID},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func submitSparkJob(req ExecuteRequest, jobID, outputLocation string) error {
	// Create SparkApplication manifest
	sparkApp := map[string]interface{}{
		"apiVersion": "sparkoperator.k8s.io/v1beta2",
		"kind":       "SparkApplication",
		"metadata": map[string]interface{}{
			"name":      "spark-job-" + jobID,
			"namespace": namespace,
			"labels": map[string]string{
				"job-id": jobID,
			},
		},
		"spec": map[string]interface{}{
			"type": "Python",
			"mode": "cluster",
			"image": "ghcr.io/spark-operator/spark:v3.5.0",
			"imagePullPolicy": "Always",
			"mainApplicationFile": "local:///opt/spark/work-dir/" + filepath.Base(req.FilePath),
			"sparkVersion": "3.5.0",
			"restartPolicy": map[string]interface{}{
				"type": "Never",
			},
			"volumes": []map[string]interface{}{
				{
					"name": "repo-volume",
					"hostPath": map[string]interface{}{
						"path": "/tmp/repos/" + filepath.Base(req.Repo),
						"type": "Directory",
					},
				},
			},
			"volumeMounts": []map[string]interface{}{
				{
					"name":      "repo-volume",
					"mountPath": "/opt/spark/work-dir",
				},
			},
			"driver": map[string]interface{}{
				"cores":     1,
				"memory":    "2g",
				"serviceAccount": "spark",
			},
			"executor": map[string]interface{}{
				"cores":     1,
				"memory":    "2g",
				"instances": 1,
			},
		},
	}

	// Marshal to YAML
	yamlContent, err := yaml.Marshal(sparkApp)
	if err != nil {
		return fmt.Errorf("failed to marshal spark application: %v", err)
	}

	// Write to temp file and apply with kubectl
	tmpFile := "/tmp/spark-app-" + jobID + ".yaml"
	if err := os.WriteFile(tmpFile, yamlContent, 0644); err != nil {
		return fmt.Errorf("failed to write spark manifest: %v", err)
	}
	defer os.Remove(tmpFile)

	cmd := exec.Command("kubectl", "apply", "-f", tmpFile, "-n", namespace)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to submit spark job: %v, stderr: %s", err, stderr.String())
	}

	return nil
}

func submitK8sJob(req ExecuteRequest, jobID, outputLocation string) error {
	// Create a simple K8s Job for Python execution
	job := &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "python-job-" + jobID,
			Namespace: namespace,
			Labels: map[string]string{
				"job-id":   jobID,
				"job-type": "python",
			},
		},
		Spec: batchv1.JobSpec{
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"job-id": jobID,
					},
				},
				Spec: corev1.PodSpec{
					RestartPolicy: corev1.RestartPolicyNever,
					Containers: []corev1.Container{
						{
							Name:  "python-executor",
							Image: "python:3.11-slim",
							Command: []string{"python", filepath.Base(req.FilePath)},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "repo-volume",
									MountPath: "/workdir",
								},
							},
						},
					},
					Volumes: []corev1.Volume{
						{
							Name: "repo-volume",
							VolumeSource: corev1.VolumeSource{
								HostPath: &corev1.HostPathVolumeSource{
									Path: "/tmp/repos/" + filepath.Base(req.Repo),
								},
							},
						},
					},
				},
			},
		},
	}

	// Create the job using client-go
	_, err := k8sClient.BatchV1().Jobs(namespace).Create(context.Background(), job, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create k8s job: %v", err)
	}

	return nil
}

// Health Check

func handleHealthz(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "HEALTHY",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Actions: []Action{
			{Action: "Check system status", Endpoint: "/healthz"},
		},
	}
	json.NewEncoder(w).Encode(response)
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Load environment variables
	gitToken = os.Getenv("GITHUB_TOKEN")
	if gitToken == "" {
		logger.Warn("GITHUB_TOKEN not set, git operations will fail")
	}

	// Initialize clients
	var err error
	minioClient, err = initMinioClient()
	if err != nil {
		logger.Error("Failed to initialize MinIO client", "error", err)
		os.Exit(1)
	}

	k8sClient, err = initK8sClient()
	if err != nil {
		logger.Error("Failed to initialize K8s client", "error", err)
		os.Exit(1)
	}

	logger.Info("Clients initialized successfully")

	// Set up routes
	http.HandleFunc("/git/clone", corsMiddleware(handleGitClone))
	http.HandleFunc("/git/save", corsMiddleware(handleGitSave))
	http.HandleFunc("/git/status", corsMiddleware(handleGitStatus))
	http.HandleFunc("/minio/ls", corsMiddleware(handleMinIOList))
	http.HandleFunc("/minio/read", corsMiddleware(handleMinIORead))
	http.HandleFunc("/minio/write", corsMiddleware(handleMinIOWrite))
	http.HandleFunc("/execute", corsMiddleware(handleExecute))
	http.HandleFunc("/execute/", corsMiddleware(handleExecuteStatus))
	http.HandleFunc("/healthz", corsMiddleware(handleHealthz))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	logger.Info("Starting Code API server", "port", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		logger.Error("Server failed", "error", err)
		os.Exit(1)
	}
}

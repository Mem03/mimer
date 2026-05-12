package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// VM_URL is the local tunneled VictoriaMetrics address (as per Makefile tunnel: 8428)
const vmURL = "http://localhost:8428/api/v1/query"

// Response formats for AI Agent Orchestrator
type MetricAction struct {
	Action string `json:"action"`
}

type MetricItem struct {
	Name    string         `json:"name"`
	Value   string         `json:"value"`
	Status  string         `json:"status"` // HEALTHY, WARNING, CRITICAL
	Actions []MetricAction `json:"actions"`
}

type MetricsResponse struct {
	Type    string       `json:"type"`
	Metrics []MetricItem `json:"metrics"`
}

// Git clone request/response types
type GitCloneRequest struct {
	RepoURL string `json:"repo_url"`
}

type GitCloneResponse struct {
	Status  string `json:"status"`  // HEALTHY, ERROR
	Message string `json:"message"` // Error message if status is ERROR
	Path    string `json:"path"`    // Local path where repo was cloned
}

// Proxies raw queries to VictoriaMetrics
func queryVM(query string) ([]byte, error) {
	reqURL := fmt.Sprintf("%s?query=%s", vmURL, url.QueryEscape(query))
	resp, err := http.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("VictoriaMetrics returned status %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// Helper to set CORS and JSON headers
func setHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
}

// Helper to extract GitHub token from Authorization header
func extractGitHubToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	// Expecting "Bearer <token>"
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

// Inject GitHub token into repo URL for authentication
func injectTokenIntoURL(repoURL, token string) string {
	// Parse the URL
	parsed, err := url.Parse(repoURL)
	if err != nil {
		return repoURL
	}

	// For HTTPS GitHub URLs, inject token using oauth2 as username
	// GitHub requires: https://oauth2:<TOKEN>@github.com/owner/repo.git
	if parsed.Scheme == "https" && parsed.Host == "github.com" {
		parsed.User = url.UserPassword("oauth2", token)
		return parsed.String()
	}

	// For SSH URLs, we can't inject tokens - return as-is
	// The caller will need to handle SSH auth differently
	return repoURL
}

// handleGitClone handles POST /git/clone requests
func handleGitClone(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract GitHub token from Authorization header
	token := extractGitHubToken(r)
	slog.Info("Git clone request received", "token_present", token != "", "method", r.Method)
	if token == "" {
		response := GitCloneResponse{
			Status:  "ERROR",
			Message: "GitHub token required in Authorization header",
		}
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Parse request body
	var req GitCloneRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response := GitCloneResponse{
			Status:  "ERROR",
			Message: "Invalid request body: " + err.Error(),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	if req.RepoURL == "" {
		response := GitCloneResponse{
			Status:  "ERROR",
			Message: "repo_url is required",
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Inject token into URL for git authentication
	authURL := injectTokenIntoURL(req.RepoURL, token)
	slog.Info("Git clone attempt", "original_url", req.RepoURL, "auth_url", authURL)

	// Extract repo name for local path
	repoName := filepath.Base(req.RepoURL)
	if strings.HasSuffix(repoName, ".git") {
		repoName = strings.TrimSuffix(repoName, ".git")
	}
	localPath := filepath.Join("/tmp/repos", repoName)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
		response := GitCloneResponse{
			Status:  "ERROR",
			Message: "Failed to create directory: " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Remove existing repo if it exists
	os.RemoveAll(localPath)

	// Execute git clone
	cmd := exec.Command("git", "clone", authURL, localPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		response := GitCloneResponse{
			Status:  "ERROR",
			Message: "Git clone failed: " + string(output) + " - " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Success
	response := GitCloneResponse{
		Status:  "HEALTHY",
		Message: "Repository cloned successfully",
		Path:    localPath,
	}
	json.NewEncoder(w).Encode(response)
}

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	setHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	queryType := r.URL.Query().Get("type")
	if queryType == "" {
		http.Error(w, "missing 'type' parameter", http.StatusBadRequest)
		return
	}

	var response MetricsResponse
	response.Type = queryType
	response.Metrics = make([]MetricItem, 0)

	switch queryType {
	case "memory_pressure":
		response.Metrics = append(response.Metrics, MetricItem{
			Name:   "jupyter-mimer-user-alpha",
			Value:  "85%",
			Status: "WARNING",
			Actions: []MetricAction{
				{Action: "Suggest Spark join optimization"},
				{Action: "Request user to clear cache"},
			},
		})
		response.Metrics = append(response.Metrics, MetricItem{
			Name:   "jupyter-mimer-user-beta",
			Value:  "95%",
			Status: "CRITICAL",
			Actions: []MetricAction{
				{Action: "Restart pod"},
				{Action: "Increase memory limit"},
			},
		})
	case "storage_growth":
		response.Metrics = append(response.Metrics, MetricItem{
			Name:   "raw-data",
			Value:  "150GB",
			Status: "HEALTHY",
			Actions: []MetricAction{
				{Action: "Run vacuum on Delta tables"},
			},
		})
	case "efficiency":
		response.Metrics = append(response.Metrics, MetricItem{
			Name:   "cluster-cpu-efficiency",
			Value:  "45%",
			Status: "WARNING",
			Actions: []MetricAction{
				{Action: "Scale down underutilized nodes"},
			},
		})
	default:
		rawQuery := r.URL.Query().Get("query")
		if rawQuery != "" {
			data, err := queryVM(rawQuery)
			if err != nil {
				http.Error(w, "Error querying VM: "+err.Error(), http.StatusInternalServerError)
				return
			}
			w.Write(data)
			return
		}
		http.Error(w, "unknown type parameter", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(response)
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	http.HandleFunc("/api/metrics", handleMetrics)
	http.HandleFunc("/git/clone", handleGitClone)

	port := "8081"
	slog.Info("Starting Metrics API server", "port", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		slog.Error("Server failed", "error", err.Error())
		os.Exit(1)
	}
}

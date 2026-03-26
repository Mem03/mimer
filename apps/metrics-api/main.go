package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
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
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
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

	port := "8081"
	slog.Info("Starting Metrics API server", "port", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		slog.Error("Server failed", "error", err.Error())
		os.Exit(1)
	}
}

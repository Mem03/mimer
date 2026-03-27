package main

import (
	"log/slog"
	"net/http"
	"os"
	"strings"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Middleware for Production CORS
	http.HandleFunc("/api/metrics", func(w http.ResponseWriter, r *http.Request) {
		allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
		if allowedOrigin == "" {
			allowedOrigin = "http://localhost:3000" // Local dev fallback
		}

		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		handleMetrics(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	slog.Info("Starting Production-Ready Metrics API", "port", port, "vm_url", os.Getenv("VM_URL"))
	if err := http.ListenAndServe(":" + port, nil); err != nil {
		slog.Error("Server failed", "error", err.Error())
		os.Exit(1)
	}
}
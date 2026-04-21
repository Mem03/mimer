package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

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
		usageMap := fetchMetricMap(`sum(container_memory_usage_bytes{namespace="mimer", pod=~"jupyter-.*"}) by (pod)`, "pod")
		limitMap := fetchMetricMap(`sum(container_spec_memory_limit_bytes{namespace="mimer", pod=~"jupyter-.*"}) by (pod)`, "pod")
		trendMap := fetchMetricMap(`delta(container_memory_usage_bytes{namespace="mimer", pod=~"jupyter-.*"}[15m])`, "pod")
		restartsMap := fetchMetricMap(`sum(kube_pod_container_status_restarts_total{namespace="mimer", pod=~"jupyter-.*"}) by (pod)`, "pod")
		throttleMap := fetchMetricMap(`sum(rate(container_cpu_cfs_throttled_seconds_total{namespace="mimer", pod=~"jupyter-.*"}[5m])) by (pod)`, "pod")
		networkMap := fetchMetricMap(`sum(rate(container_network_receive_bytes_total{namespace="mimer", pod=~"jupyter-.*"}[5m])) by (pod)`, "pod")

		for podName, usageBytes := range usageMap {
			usageMB := usageBytes / (1024 * 1024)
			limitMB := limitMap[podName] / (1024 * 1024)
			limitStr := "Unlimited"
			if limitMB > 0 && limitMB < 9000000 {
				limitStr = fmt.Sprintf("%.1f MB", limitMB)
			}
			trendMB := trendMap[podName] / (1024 * 1024)
			trendSign := "+"
			if trendMB < 0 {
				trendSign = ""
			}
			throttled := "No"
			if throttleMap[podName] > 0.1 {
				throttled = "Yes"
			}
			netMBps := networkMap[podName] / (1024 * 1024)

			response.Metrics = append(response.Metrics, MetricItem{
				Name:         podName,
				Usage:        fmt.Sprintf("%.1f MB", usageMB),
				Limit:        limitStr,
				Trend15m:     fmt.Sprintf("%s%.1f MB", trendSign, trendMB),
				Restarts:     int(restartsMap[podName]),
				CPUThrottled: throttled,
				NetworkRx:    fmt.Sprintf("%.2f MB/s", netMBps),
			})
		}

	// case "storage_growth":
	// 	usageMap := fetchMetricMap(`sum(kubelet_volume_stats_used_bytes{namespace="mimer"}) by (persistentvolumeclaim)`, "persistentvolumeclaim")
	// 	capacityMap := fetchMetricMap(`sum(kubelet_volume_stats_capacity_bytes{namespace="mimer"}) by (persistentvolumeclaim)`, "persistentvolumeclaim")

	// 	for pvcName, usageBytes := range usageMap {
	// 		usageGB := usageBytes / (1024 * 1024 * 1024)
	// 		capBytes, exists := capacityMap[pvcName]
	// 		limitStr := "Unknown"
	// 		if exists {
	// 			limitStr = fmt.Sprintf("%.2f GB", capBytes/(1024*1024*1024))
	// 		}

	// 		response.Metrics = append(response.Metrics, MetricItem{
	// 			Name:  pvcName,
	// 			Usage: fmt.Sprintf("%.2f GB", usageGB),
	// 			Limit: limitStr,
	// 		})
	// 	}

	// NEW: Ephemeral Storage Endpoint!
	// case "ephemeral_storage":
	// 	usageMap := fetchMetricMap(`sum(container_fs_usage_bytes{namespace="mimer", pod=~"jupyter-.*"}) by (pod)`, "pod")
	// 	limitMap := fetchMetricMap(`sum(container_fs_limit_bytes{namespace="mimer", pod=~"jupyter-.*"}) by (pod)`, "pod")

	// 	for podName, usageBytes := range usageMap {
	// 		usageGB := usageBytes / (1024 * 1024 * 1024)
	// 		limitGB := limitMap[podName] / (1024 * 1024 * 1024)
			
	// 		limitStr := "Unlimited"
	// 		if limitGB > 0 && limitGB < 9000000 {
	// 			limitStr = fmt.Sprintf("%.2f GB", limitGB)
	// 		}

	// 		response.Metrics = append(response.Metrics, MetricItem{
	// 			Name:  podName,
	// 			Usage: fmt.Sprintf("%.2f GB", usageGB),
	// 			Limit: limitStr,
	// 		})
	// 	}
	case "storage_growth":
		// Removed sum() by() wrapper. Just grab the raw metric directly!
		usageMap := fetchMetricMap(`kubelet_volume_stats_used_bytes{namespace="mimer"}`, "persistentvolumeclaim")
		capacityMap := fetchMetricMap(`kube_persistentvolumeclaim_resource_requests_storage_bytes{namespace="mimer"}`, "persistentvolumeclaim")

		for pvcName, capBytes := range capacityMap {
			limitGB := capBytes / (1024 * 1024 * 1024)
			limitStr := fmt.Sprintf("%.2f GB", limitGB)

			usageBytes, hasUsage := usageMap[pvcName]
			usageStr := "Local (Unmeasured)" // Fallback for Minikube hostPath
			
			if hasUsage {
				// Format as MB so we can see small tables
				usageMB := usageBytes / (1024 * 1024)
				usageStr = fmt.Sprintf("%.2f MB", usageMB)
			}

			response.Metrics = append(response.Metrics, MetricItem{
				Name:  pvcName,
				Usage: usageStr,
				Limit: limitStr,
			})
		}

	case "ephemeral_storage":
		// Removed sum() by() wrapper here too!
		usageMap := fetchMetricMap(`container_fs_usage_bytes{namespace="mimer", pod=~"jupyter-.*"}`, "pod")
		limitMap := fetchMetricMap(`container_fs_limit_bytes{namespace="mimer", pod=~"jupyter-.*"}`, "pod")

		for podName, usageBytes := range usageMap {
			usageKB := usageBytes / 1024
			limitKB := limitMap[podName] / 1024
			
			limitStr := "Unlimited"
			if limitKB > 0 && limitKB < 9000000000 {
				limitStr = fmt.Sprintf("%.2f KB", limitKB)
			}

			response.Metrics = append(response.Metrics, MetricItem{
				Name:  podName,
				Usage: fmt.Sprintf("%.2f KB", usageKB),
				Limit: limitStr,
			})
		}

	case "efficiency":
		cpuMap := fetchMetricMap(`sum(rate(container_cpu_usage_seconds_total{namespace="mimer", pod!=""}[5m])) by (pod)`, "pod")
		for podName, cpuCores := range cpuMap {
			response.Metrics = append(response.Metrics, MetricItem{
				Name:  podName,
				Usage: fmt.Sprintf("%.3f Cores", cpuCores),
				Limit: "N/A",
			})
		}

	case "sre":
		// SRE: Virtual Site Reliability Engineer - System health analysis
		// Fetch key reliability indicators for user-facing pods (Jupyter + MinIO)
		restartsMap := fetchMetricMap(`sum(kube_pod_container_status_restarts_total{namespace="mimer", pod=~"jupyter-.*|minio-.*"}) by (pod)`, "pod")
		memoryUsageMap := fetchMetricMap(`sum(container_memory_usage_bytes{namespace="mimer", pod=~"jupyter-.*|minio-.*"}) by (pod)`, "pod")
		memoryLimitMap := fetchMetricMap(`sum(container_spec_memory_limit_bytes{namespace="mimer", pod=~"jupyter-.*|minio-.*"}) by (pod)`, "pod")
		cpuThrottleMap := fetchMetricMap(`sum(rate(container_cpu_cfs_throttled_seconds_total{namespace="mimer", pod=~"jupyter-.*|minio-.*"}[5m])) by (pod)`, "pod")
		networkRxMap := fetchMetricMap(`sum(rate(container_network_receive_bytes_total{namespace="mimer", pod=~"jupyter-.*|minio-.*"}[5m])) by (pod)`, "pod")
		memoryTrendMap := fetchMetricMap(`delta(container_memory_usage_bytes{namespace="mimer", pod=~"jupyter-.*|minio-.*"}[15m]) by (pod)`, "pod")

		for podName := range restartsMap {
			usageBytes := memoryUsageMap[podName]
			usageMB := usageBytes / (1024 * 1024)
			limitBytes := memoryLimitMap[podName]
			limitMB := limitBytes / (1024 * 1024)
			limitStr := "Unlimited"
			if limitMB > 0 && limitMB < 9000000 {
				limitStr = fmt.Sprintf("%.1f MB", limitMB)
			}

			trendMB := memoryTrendMap[podName] / (1024 * 1024)
			trendSign := "+"
			if trendMB < 0 {
				trendSign = ""
			}

			throttled := "No"
			if cpuThrottleMap[podName] > 0.1 {
				throttled = "Yes"
			}

			netMBps := networkRxMap[podName] / (1024 * 1024)

			// Determine overall health status
			status := "Healthy"
			if restartsMap[podName] > 0 {
				status = "Degraded"
			}
			if throttled == "Yes" {
				status = "Critical"
			}

			response.Metrics = append(response.Metrics, MetricItem{
				Name:         podName,
				Usage:        fmt.Sprintf("%s (%.1f MB)", status, usageMB),
				Limit:        limitStr,
				Trend15m:     fmt.Sprintf("%s%.1f MB", trendSign, trendMB),
				Restarts:     int(restartsMap[podName]),
				CPUThrottled: throttled,
				NetworkRx:    fmt.Sprintf("%.2f MB/s", netMBps),
			})
		}

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
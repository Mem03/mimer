package main

// --- AI Agent Response Formats ---
type MetricItem struct {
	Name         string `json:"name"`
	Usage        string `json:"usage"`           // e.g., "1850.5 MB"
	Limit        string `json:"limit"`           // e.g., "2048.0 MB" or "Unlimited"
	Trend15m     string `json:"trend_15m"`       // e.g., "+120.5 MB"
	Restarts     int    `json:"restarts"`        // Crash loop indicator
	CPUThrottled string `json:"cpu_throttled"`   // "Yes" or "No"
	NetworkRx    string `json:"network_receive"` // Download velocity (MB/s)
}

type MetricsResponse struct {
	Type    string       `json:"type"`
	Metrics []MetricItem `json:"metrics"`
}

// --- VictoriaMetrics Parser Structs ---
type VMResponse struct {
	Status string `json:"status"`
	Data   VMData `json:"data"`
}

type VMData struct {
	ResultType string     `json:"resultType"`
	Result     []VMResult `json:"result"`
}

type VMResult struct {
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value"`
}
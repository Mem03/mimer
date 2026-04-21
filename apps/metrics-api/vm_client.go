package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
)

// Dynamically gets the URL depending on if it's running locally or in Kubernetes
func getVMURL() string {
	vmUrl := os.Getenv("VM_URL")
	if vmUrl == "" {
		return "http://localhost:8428/api/v1/query" // Fallback for local testing
	}
	return vmUrl
}

func queryVM(query string) ([]byte, error) {
	// FIX: Calling getVMURL() instead of the hardcoded constant
	reqURL := fmt.Sprintf("%s?query=%s", getVMURL(), url.QueryEscape(query))
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

func fetchAndParseVM(query string) (*VMResponse, error) {
	data, err := queryVM(query)
	if err != nil {
		return nil, err
	}

	var vmResp VMResponse
	if err := json.Unmarshal(data, &vmResp); err != nil {
		return nil, err
	}
	return &vmResp, nil
}

func parseVMValue(val []interface{}) float64 {
	if len(val) == 2 {
		if strVal, ok := val[1].(string); ok {
			f, _ := strconv.ParseFloat(strVal, 64)
			return f
		}
	}
	return 0
}

func fetchMetricMap(query string, labelName string) map[string]float64 {
	result := make(map[string]float64)

	data, err := queryVM(query)
	if err != nil {
		fmt.Printf("❌ VM HTTP Error for query: %s | Err: %v\n", query, err)
		return result
	}

	var vmResp struct {
		Status string `json:"status"`
		Data   struct {
			Result []struct {
				Metric map[string]string `json:"metric"`
				Value  []interface{}     `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.Unmarshal(data, &vmResp); err != nil {
		fmt.Printf("❌ JSON Parse Error for query: %s | Err: %v\n", query, err)
		return result
	}

	for _, res := range vmResp.Data.Result {
		labelValue := res.Metric[labelName]
		if labelValue == "" {
			continue
		}

		// Prometheus values usually look like [1774605381.617, "536870912000"]
		if len(res.Value) >= 2 {
			// Scenario A: It's a string (Standard Prometheus format)
			if valStr, ok := res.Value[1].(string); ok {
				if val, err := strconv.ParseFloat(valStr, 64); err == nil {
					result[labelValue] = val
				} else {
					fmt.Printf("⚠️ Could not convert string '%s' to float\n", valStr)
				}
			} else if valFloat, ok := res.Value[1].(float64); ok {
				// Scenario B: It came in as a raw number
				result[labelValue] = valFloat
			}
		}
	}

	// 🔍 DEBUG: Print exactly what we parsed
	fmt.Printf("✅ Found %d items for label '%s'\n", len(result), labelName)

	return result
}
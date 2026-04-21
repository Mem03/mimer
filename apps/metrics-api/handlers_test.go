package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleMetrics_MissingType(t *testing.T) {
	// 1. Setup a request without the "type" parameter
	req, err := http.NewRequest("GET", "/api/metrics", nil)
	if err != nil {
		t.Fatal(err)
	}

	// 2. Record the response
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(handleMetrics)

	// 3. Execute the handler
	handler.ServeHTTP(rr, req)

	// 4. Assert that we get a 400 Bad Request
	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "missing 'type' parameter\n"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}
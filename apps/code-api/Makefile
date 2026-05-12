.PHONY: build run test clean

# Build the code-api binary
build:
	go build -o code-api main.go

# Run the code-api server
run:
	go run main.go

# Test the code-api
test:
	go test ./...

# Clean build artifacts
clean:
	rm -f code-api

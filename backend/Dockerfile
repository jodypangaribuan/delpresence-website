# Build stage
FROM golang:1.24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o delpresence-server ./cmd/server

# Runtime stage
FROM alpine:latest

# Install netcat for wait-for-it script
RUN apk --no-cache add netcat-openbsd

# Create app directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/delpresence-server .

# Copy environment file
COPY .env .

# Expose port
EXPOSE 8080

# Command
CMD ["./delpresence-server"] 
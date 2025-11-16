# Build stage
FROM public.ecr.aws/docker/library/golang:1.25-alpine AS builder
WORKDIR /app

# Copy go mod and source files
COPY go.mod ./
COPY *.go ./

# Download dependencies and tidy (this will create go.sum)
RUN go mod download && go mod tidy

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Run stage
FROM public.ecr.aws/docker/library/alpine:latest
RUN apk --no-cache add ca-certificates ffmpeg imagemagick
WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]

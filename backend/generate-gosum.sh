#!/bin/bash

# Dockerfile을 임시로 수정하여 go.sum 생성
cat > Dockerfile.temp << 'EOF'
FROM public.ecr.aws/docker/library/golang:1.25-alpine
WORKDIR /app
COPY go.mod .
RUN go mod download && go mod tidy
EOF

# go.sum 생성
docker build -f Dockerfile.temp -t temp-go-mod .
docker run --rm temp-go-mod cat go.sum > go.sum
docker rmi temp-go-mod
rm Dockerfile.temp

echo "go.sum generated successfully"

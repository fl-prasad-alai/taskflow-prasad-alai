# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git build-base

WORKDIR /app

ENV GOPROXY=direct
ENV GOSUMDB=off

# Allow go to resolve and update go.sum during build (no pre-committed go.sum needed)
ENV GOFLAGS=-mod=mod
ENV GONOSUMDB=*
ENV CGO_ENABLED=0
ENV GOOS=linux

COPY go.mod ./
RUN go mod tidy
RUN go mod download

COPY . .
RUN go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /server /app/server

EXPOSE 8080

ENTRYPOINT ["/app/server"]

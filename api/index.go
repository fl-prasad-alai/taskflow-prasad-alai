package handler

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"taskflow/backend/pkg/handler"
	"taskflow/backend/pkg/store"
)

// ── App state ─────────────────────────────────────────────────────────────────
//
// We intentionally do NOT use sync.Once here.  Vercel freezes/thaws function
// instances; after a thaw the pgxpool connections are stale.  sync.Once would
// permanently lock us into a broken handler.  Instead we hold a mutex and
// re-create the handler whenever the DB becomes unreachable.

var (
	mu      sync.Mutex
	appH    *handler.Handler
	appS    *store.Store
	initAt  time.Time
)

// ensureReady returns a live handler, (re-)initialising if necessary.
// Returns false and writes a 503 if initialisation fails.
func ensureReady(w http.ResponseWriter, r *http.Request) (*handler.Handler, bool) {
	mu.Lock()
	defer mu.Unlock()

	// If we have a handler, verify the DB is still reachable (2-second budget).
	if appH != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if appS.Ping(ctx) == nil {
			return appH, true
		}
		// Connection is stale — tear down and reinitialise below.
		slog.Warn("database ping failed; reinitialising",
			"uptime", time.Since(initAt).Round(time.Second))
		appS.Close()
		appH = nil
		appS = nil
	}

	dbURL    := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")
	if dbURL == "" || jwtSecret == "" {
		http.Error(w, `{"error":"server misconfigured: missing DATABASE_URL or JWT_SECRET"}`,
			http.StatusServiceUnavailable)
		return nil, false
	}

	// Use a background context for store.New — the pool must outlive the
	// single request that triggered initialisation, otherwise its background
	// goroutines are cancelled the moment the request completes.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	s, err := store.New(ctx, dbURL)
	if err != nil {
		slog.Error("database connect failed", "error", err)
		http.Error(w, `{"error":"service unavailable — could not reach database"}`,
			http.StatusServiceUnavailable)
		return nil, false
	}

	appS   = s
	appH   = handler.New(s, []byte(jwtSecret), slog.Default())
	initAt = time.Now()
	slog.Info("handler initialised", "at", initAt)
	return appH, true
}

// Handler is the Vercel serverless entrypoint.
// Vercel routes /api/* here; we strip the /api prefix so Chi sees the
// original paths (/auth/login, /projects, /projects/{id}, etc.)
func Handler(w http.ResponseWriter, r *http.Request) {
	h, ok := ensureReady(w, r)
	if !ok {
		return
	}

	// Strip /api prefix — Chi router was built without it.
	r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api")
	if r.URL.RawPath != "" {
		r.URL.RawPath = strings.TrimPrefix(r.URL.RawPath, "/api")
	}
	if r.URL.Path == "" {
		r.URL.Path = "/"
	}

	h.Router("").ServeHTTP(w, r)
}

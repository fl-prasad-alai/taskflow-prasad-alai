package handler

import (
	"context"
	"net/http"
	"os"
	"strings"
	"sync"

	"taskflow/backend/pkg/handler"
	"taskflow/backend/pkg/store"
)

var (
	once    sync.Once
	h       *handler.Handler
	initErr error
)

func initApp() {
	dbURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	s, err := store.New(context.Background(), dbURL)
	if err != nil {
		initErr = err
		return
	}

	h = handler.New(s, []byte(jwtSecret), nil)
}

// Handler is the Vercel serverless entrypoint.
// Vercel routes /api/* here; we strip the /api prefix so Chi sees
// the original paths (/auth/login, /projects, /projects/{id}, etc.)
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)

	if initErr != nil {
		http.Error(w, "service unavailable: "+initErr.Error(), http.StatusServiceUnavailable)
		return
	}

	// Strip /api prefix — Chi router was built without it
	r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api")
	if r.URL.RawPath != "" {
		r.URL.RawPath = strings.TrimPrefix(r.URL.RawPath, "/api")
	}
	if r.URL.Path == "" {
		r.URL.Path = "/"
	}

	h.Router("").ServeHTTP(w, r)
}

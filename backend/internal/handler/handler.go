// Package handler wires up HTTP routes and provides shared response helpers.
package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	appMiddleware "github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/store"
)

// Handler holds application-wide dependencies shared across HTTP handlers.
type Handler struct {
	store     *store.Store
	jwtSecret []byte
	log       *slog.Logger
}

// New returns a configured Handler.
func New(s *store.Store, jwtSecret []byte, log *slog.Logger) *Handler {
	return &Handler{store: s, jwtSecret: jwtSecret, log: log}
}

// Router builds and returns the fully wired chi router.
func (h *Handler) Router(corsOrigin string) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware(corsOrigin))

	// Public routes
	r.Post("/auth/register", h.Register)
	r.Post("/auth/login", h.Login)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.Authenticate(h.jwtSecret))

		r.Get("/users", h.ListUsers)

		r.Get("/projects", h.ListProjects)
		r.Post("/projects", h.CreateProject)
		r.Get("/projects/{id}", h.GetProject)
		r.Patch("/projects/{id}", h.UpdateProject)
		r.Delete("/projects/{id}", h.DeleteProject)
		r.Get("/projects/{id}/stats", h.GetProjectStats)

		r.Get("/projects/{id}/tasks", h.ListTasks)
		r.Post("/projects/{id}/tasks", h.CreateTask)

		r.Patch("/tasks/{id}", h.UpdateTask)
		r.Delete("/tasks/{id}", h.DeleteTask)
	})

	return r
}

// --- response helpers -------------------------------------------------------

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeValidationError(w http.ResponseWriter, fields map[string]string) {
	writeJSON(w, http.StatusBadRequest, map[string]any{
		"error":  "validation failed",
		"fields": fields,
	})
}

func readJSON(r *http.Request, v any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(v)
}

// --- route param helpers ----------------------------------------------------

func urlParam(r *http.Request, key string) string {
	return chi.URLParam(r, key)
}

// --- CORS middleware ---------------------------------------------------------

func corsMiddleware(origin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// --- store error mapping ----------------------------------------------------

func httpStatus(err error) int {
	switch {
	case errors.Is(err, store.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, store.ErrConflict):
		return http.StatusConflict
	default:
		return http.StatusInternalServerError
	}
}

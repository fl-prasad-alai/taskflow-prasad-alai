package handler

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	appMiddleware "taskflow/backend/internal/middleware"
	"taskflow/backend/internal/store"
)

// ListProjects returns projects the current user owns or has tasks in.
// GET /projects
func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	projects, err := h.store.ListProjectsForUser(r.Context(), claims.UserID)
	if err != nil {
		h.log.Error("list projects", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if projects == nil {
		projects = []*store.Project{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"projects": projects})
}

// CreateProject creates a new project owned by the current user.
// POST /projects
func (h *Handler) CreateProject(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	var req struct {
		Name        string  `json:"name"`
		Description *string `json:"description"`
	}
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		writeValidationError(w, map[string]string{"name": "is required"})
		return
	}

	project, err := h.store.CreateProject(r.Context(), store.CreateProjectParams{
		Name:        strings.TrimSpace(req.Name),
		Description: req.Description,
		OwnerID:     claims.UserID,
	})
	if err != nil {
		h.log.Error("create project", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, project)
}

// GetProject returns a project and all its tasks.
// GET /projects/:id
func (h *Handler) GetProject(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	proj, err := h.store.GetProjectWithTasks(r.Context(), id)
	if err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}
	writeJSON(w, http.StatusOK, proj)
}

// UpdateProject partially updates a project (owner only).
// PATCH /projects/:id
func (h *Handler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	id, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	existing, err := h.store.GetProjectByID(r.Context(), id)
	if err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}
	if existing.OwnerID != claims.UserID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
	}
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name != nil && strings.TrimSpace(*req.Name) == "" {
		writeValidationError(w, map[string]string{"name": "cannot be empty"})
		return
	}

	updated, err := h.store.UpdateProject(r.Context(), store.UpdateProjectParams{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
	})
	if err != nil {
		h.log.Error("update project", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// DeleteProject removes a project (owner only).
// DELETE /projects/:id
func (h *Handler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	id, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	existing, err := h.store.GetProjectByID(r.Context(), id)
	if err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}
	if existing.OwnerID != claims.UserID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if err := h.store.DeleteProject(r.Context(), id); err != nil {
		h.log.Error("delete project", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GetProjectStats returns task aggregate counts for a project.
// GET /projects/:id/stats
func (h *Handler) GetProjectStats(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	stats, err := h.store.GetProjectStats(r.Context(), id)
	if err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func errorMessage(status int) string {
	switch status {
	case http.StatusNotFound:
		return "not found"
	case http.StatusForbidden:
		return "forbidden"
	default:
		return "internal error"
	}
}

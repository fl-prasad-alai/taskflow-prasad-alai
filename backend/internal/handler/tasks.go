package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	appMiddleware "github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/store"
)

var validStatuses = map[string]bool{"todo": true, "in_progress": true, "done": true}
var validPriorities = map[string]bool{"low": true, "medium": true, "high": true}

// ListTasks returns tasks for a project, with optional ?status= and ?assignee= filters.
// GET /projects/:id/tasks
func (h *Handler) ListTasks(w http.ResponseWriter, r *http.Request) {
	projectID, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	if _, err := h.store.GetProjectByID(r.Context(), projectID); err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}

	filter := store.ListTasksFilter{ProjectID: projectID}

	if s := r.URL.Query().Get("status"); s != "" {
		if !validStatuses[s] {
			writeValidationError(w, map[string]string{"status": "must be todo, in_progress, or done"})
			return
		}
		filter.Status = &s
	}
	if a := r.URL.Query().Get("assignee"); a != "" {
		aid, err := uuid.Parse(a)
		if err != nil {
			writeValidationError(w, map[string]string{"assignee": "must be a valid UUID"})
			return
		}
		filter.AssigneeID = &aid
	}

	tasks, err := h.store.ListTasks(r.Context(), filter)
	if err != nil {
		h.log.Error("list tasks", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if tasks == nil {
		tasks = []*store.Task{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"tasks": tasks})
}

// CreateTask creates a task inside a project.
// POST /projects/:id/tasks
func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	projectID, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if _, err := h.store.GetProjectByID(r.Context(), projectID); err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}

	var req struct {
		Title       string     `json:"title"`
		Description *string    `json:"description"`
		Priority    string     `json:"priority"`
		AssigneeID  *uuid.UUID `json:"assignee_id"`
		DueDate     *string    `json:"due_date"`
	}
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	fields := map[string]string{}
	if strings.TrimSpace(req.Title) == "" {
		fields["title"] = "is required"
	}
	if req.Priority == "" {
		req.Priority = "medium"
	} else if !validPriorities[req.Priority] {
		fields["priority"] = "must be low, medium, or high"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		d, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			writeValidationError(w, map[string]string{"due_date": "must be YYYY-MM-DD"})
			return
		}
		dueDate = &d
	}

	task, err := h.store.CreateTask(r.Context(), store.CreateTaskParams{
		Title:       strings.TrimSpace(req.Title),
		Description: req.Description,
		Priority:    req.Priority,
		ProjectID:   projectID,
		AssigneeID:  req.AssigneeID,
		CreatedBy:   claims.UserID,
		DueDate:     dueDate,
	})
	if err != nil {
		h.log.Error("create task", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, task)
}

// UpdateTask partially updates a task.
// PATCH /tasks/:id
func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	taskID, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	existing, err := h.store.GetTaskByID(r.Context(), taskID)
	if err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}

	project, err := h.store.GetProjectByID(r.Context(), existing.ProjectID)
	if err != nil {
		h.log.Error("get project for task update", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if project.OwnerID != claims.UserID && existing.CreatedBy != claims.UserID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	// Decode into a raw map so we can distinguish absent fields from explicit nulls.
	var raw map[string]json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	params := store.UpdateTaskParams{ID: taskID}
	validationFields := map[string]string{}

	if v, ok := raw["title"]; ok {
		var s string
		if err := json.Unmarshal(v, &s); err != nil || strings.TrimSpace(s) == "" {
			validationFields["title"] = "cannot be empty"
		} else {
			params.Title = &s
		}
	}
	if v, ok := raw["description"]; ok {
		var s *string
		if err := json.Unmarshal(v, &s); err == nil {
			params.Description = s
		}
	}
	if v, ok := raw["status"]; ok {
		var s string
		if err := json.Unmarshal(v, &s); err != nil || !validStatuses[s] {
			validationFields["status"] = "must be todo, in_progress, or done"
		} else {
			params.Status = &s
		}
	}
	if v, ok := raw["priority"]; ok {
		var s string
		if err := json.Unmarshal(v, &s); err != nil || !validPriorities[s] {
			validationFields["priority"] = "must be low, medium, or high"
		} else {
			params.Priority = &s
		}
	}
	if v, ok := raw["assignee_id"]; ok {
		var s *string
		if err := json.Unmarshal(v, &s); err == nil {
			if s == nil {
				params.ClearAssignee = true
			} else {
				aid, err := uuid.Parse(*s)
				if err != nil {
					validationFields["assignee_id"] = "must be a valid UUID"
				} else {
					params.AssigneeID = &aid
				}
			}
		}
	}
	if v, ok := raw["due_date"]; ok {
		var s *string
		if err := json.Unmarshal(v, &s); err == nil {
			if s == nil || *s == "" {
				params.ClearDueDate = true
			} else {
				d, err := time.Parse("2006-01-02", *s)
				if err != nil {
					validationFields["due_date"] = "must be YYYY-MM-DD"
				} else {
					params.DueDate = &d
				}
			}
		}
	}

	if len(validationFields) > 0 {
		writeValidationError(w, validationFields)
		return
	}

	updated, err := h.store.UpdateTask(r.Context(), params)
	if err != nil {
		h.log.Error("update task", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// DeleteTask removes a task (project owner or task creator only).
// DELETE /tasks/:id
func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	claims := appMiddleware.ClaimsFromContext(r.Context())

	taskID, err := uuid.Parse(urlParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}

	task, err := h.store.GetTaskByID(r.Context(), taskID)
	if err != nil {
		status := httpStatus(err)
		writeError(w, status, errorMessage(status))
		return
	}

	project, err := h.store.GetProjectByID(r.Context(), task.ProjectID)
	if err != nil {
		h.log.Error("get project for task delete", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if project.OwnerID != claims.UserID && task.CreatedBy != claims.UserID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	if err := h.store.DeleteTask(r.Context(), taskID); err != nil {
		h.log.Error("delete task", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

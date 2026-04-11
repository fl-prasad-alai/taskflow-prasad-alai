package handler

import (
	"net/http"
	"strings"

	"github.com/taskflow/backend/internal/auth"
	"github.com/taskflow/backend/internal/store"
	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

// Register creates a new user account.
// POST /auth/register
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate
	fields := map[string]string{}
	if strings.TrimSpace(req.Name) == "" {
		fields["name"] = "is required"
	}
	if strings.TrimSpace(req.Email) == "" {
		fields["email"] = "is required"
	} else if !strings.Contains(req.Email, "@") {
		fields["email"] = "is invalid"
	}
	if len(req.Password) < 8 {
		fields["password"] = "must be at least 8 characters"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		h.log.Error("bcrypt error", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	user, err := h.store.CreateUser(r.Context(), store.CreateUserParams{
		Name:         strings.TrimSpace(req.Name),
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
	})
	if err != nil {
		if err == store.ErrConflict {
			writeValidationError(w, map[string]string{"email": "already registered"})
			return
		}
		h.log.Error("create user", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	token, err := auth.NewToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		h.log.Error("jwt sign", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"token": token,
		"user":  user,
	})
}

// Login authenticates a user and returns a JWT.
// POST /auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	fields := map[string]string{}
	if strings.TrimSpace(req.Email) == "" {
		fields["email"] = "is required"
	}
	if req.Password == "" {
		fields["password"] = "is required"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	user, err := h.store.GetUserByEmail(r.Context(), strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		// Don't reveal whether the email exists
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := auth.NewToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		h.log.Error("jwt sign", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user":  user,
	})
}

// ListUsers returns all users (for the assignee picker).
// GET /users
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.store.ListUsers(r.Context())
	if err != nil {
		h.log.Error("list users", "err", err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if users == nil {
		users = []*store.UserSummary{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

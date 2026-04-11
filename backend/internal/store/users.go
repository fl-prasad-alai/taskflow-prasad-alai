package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ErrNotFound is returned when a requested record does not exist.
var ErrNotFound = errors.New("not found")

// ErrConflict is returned when a unique constraint is violated.
var ErrConflict = errors.New("conflict")

// CreateUser inserts a new user and returns the created record.
func (s *Store) CreateUser(ctx context.Context, p CreateUserParams) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, name, email, password_hash, created_at
	`, p.Name, p.Email, p.PasswordHash).Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &u, nil
}

// GetUserByEmail looks up a user by their email address.
func (s *Store) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, created_at
		FROM users WHERE email = $1
	`, email).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

// GetUserByID looks up a user by their UUID.
func (s *Store) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, created_at
		FROM users WHERE id = $1
	`, id).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

// ListUsers returns all users (id, name, email only – no password hash).
func (s *Store) ListUsers(ctx context.Context) ([]*UserSummary, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, name, email FROM users ORDER BY name`)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []*UserSummary
	for rows.Next() {
		var u UserSummary
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

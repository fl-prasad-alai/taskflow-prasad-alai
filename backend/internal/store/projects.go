package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// CreateProject inserts a new project and returns it.
func (s *Store) CreateProject(ctx context.Context, p CreateProjectParams) (*Project, error) {
	var proj Project
	err := s.pool.QueryRow(ctx, `
		INSERT INTO projects (name, description, owner_id)
		VALUES ($1, $2, $3)
		RETURNING id, name, description, owner_id, created_at
	`, p.Name, p.Description, p.OwnerID).Scan(
		&proj.ID, &proj.Name, &proj.Description, &proj.OwnerID, &proj.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}
	return &proj, nil
}

// GetProjectByID returns the project with the given id, or ErrNotFound.
func (s *Store) GetProjectByID(ctx context.Context, id uuid.UUID) (*Project, error) {
	var proj Project
	err := s.pool.QueryRow(ctx, `
		SELECT id, name, description, owner_id, created_at
		FROM projects WHERE id = $1
	`, id).Scan(&proj.ID, &proj.Name, &proj.Description, &proj.OwnerID, &proj.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get project: %w", err)
	}
	return &proj, nil
}

// GetProjectWithTasks returns a project and all of its tasks (with assignee info).
func (s *Store) GetProjectWithTasks(ctx context.Context, projectID uuid.UUID) (*ProjectWithTasks, error) {
	proj, err := s.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}

	tasks, err := s.ListTasks(ctx, ListTasksFilter{ProjectID: projectID})
	if err != nil {
		return nil, err
	}

	return &ProjectWithTasks{Project: *proj, Tasks: tasks}, nil
}

// ListProjectsForUser returns projects where the user is the owner OR is
// assigned to at least one task.
func (s *Store) ListProjectsForUser(ctx context.Context, userID uuid.UUID) ([]*Project, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at
		FROM projects p
		LEFT JOIN tasks t ON t.project_id = p.id
		WHERE p.owner_id = $1 OR t.assignee_id = $1
		ORDER BY p.created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}
	defer rows.Close()

	var projects []*Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan project: %w", err)
		}
		projects = append(projects, &p)
	}
	return projects, rows.Err()
}

// UpdateProject applies partial updates to a project. Only non-nil fields are changed.
func (s *Store) UpdateProject(ctx context.Context, p UpdateProjectParams) (*Project, error) {
	setClauses := []string{}
	args := []any{}
	argN := 1

	if p.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argN))
		args = append(args, *p.Name)
		argN++
	}
	if p.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argN))
		args = append(args, *p.Description)
		argN++
	}
	if len(setClauses) == 0 {
		return s.GetProjectByID(ctx, p.ID)
	}

	args = append(args, p.ID)
	query := fmt.Sprintf(`
		UPDATE projects SET %s WHERE id = $%d
		RETURNING id, name, description, owner_id, created_at
	`, strings.Join(setClauses, ", "), argN)

	var proj Project
	err := s.pool.QueryRow(ctx, query, args...).Scan(
		&proj.ID, &proj.Name, &proj.Description, &proj.OwnerID, &proj.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update project: %w", err)
	}
	return &proj, nil
}

// DeleteProject removes a project and cascades to its tasks.
func (s *Store) DeleteProject(ctx context.Context, id uuid.UUID) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete project: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// GetProjectStats returns aggregate task counts by status and assignee.
func (s *Store) GetProjectStats(ctx context.Context, projectID uuid.UUID) (*ProjectStats, error) {
	// verify project exists
	if _, err := s.GetProjectByID(ctx, projectID); err != nil {
		return nil, err
	}

	stats := &ProjectStats{
		ProjectID: projectID,
		ByStatus:  map[string]int{"todo": 0, "in_progress": 0, "done": 0},
	}

	// counts by status
	rows, err := s.pool.Query(ctx, `
		SELECT status::text, COUNT(*) FROM tasks WHERE project_id = $1 GROUP BY status
	`, projectID)
	if err != nil {
		return nil, fmt.Errorf("stats by status: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		stats.ByStatus[status] = count
		stats.Total += count
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// counts by assignee
	aRows, err := s.pool.Query(ctx, `
		SELECT u.id, u.name, COUNT(t.id)
		FROM tasks t
		JOIN users u ON u.id = t.assignee_id
		WHERE t.project_id = $1 AND t.assignee_id IS NOT NULL
		GROUP BY u.id, u.name
		ORDER BY COUNT(t.id) DESC
	`, projectID)
	if err != nil {
		return nil, fmt.Errorf("stats by assignee: %w", err)
	}
	defer aRows.Close()
	for aRows.Next() {
		var as AssigneeStat
		if err := aRows.Scan(&as.AssigneeID, &as.AssigneeName, &as.Count); err != nil {
			return nil, err
		}
		stats.ByAssignee = append(stats.ByAssignee, as)
	}
	return stats, aRows.Err()
}

package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// scanTask reads a task row (with optional assignee columns) into a Task.
// The caller must include the assignee join columns: a.id, a.name, a.email
// (or three NULLs when the assignee is absent).
func scanTask(row pgx.Row) (*Task, error) {
	var t Task
	var aID *uuid.UUID
	var aName, aEmail *string

	err := row.Scan(
		&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority,
		&t.ProjectID, &t.AssigneeID, &t.CreatedBy,
		&t.DueDate, &t.CreatedAt, &t.UpdatedAt,
		&aID, &aName, &aEmail,
	)
	if err != nil {
		return nil, err
	}
	if aID != nil {
		t.Assignee = &UserSummary{ID: *aID, Name: *aName, Email: *aEmail}
	}
	return &t, nil
}

const taskSelectSQL = `
	SELECT
		t.id, t.title, t.description, t.status::text, t.priority::text,
		t.project_id, t.assignee_id, t.created_by,
		t.due_date, t.created_at, t.updated_at,
		a.id, a.name, a.email
	FROM tasks t
	LEFT JOIN users a ON a.id = t.assignee_id
`

// GetTaskByID returns a single task or ErrNotFound.
func (s *Store) GetTaskByID(ctx context.Context, id uuid.UUID) (*Task, error) {
	row := s.pool.QueryRow(ctx, taskSelectSQL+` WHERE t.id = $1`, id)
	t, err := scanTask(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get task: %w", err)
	}
	return t, nil
}

// ListTasks returns tasks for a project with optional filters and pagination.
func (s *Store) ListTasks(ctx context.Context, f ListTasksFilter) ([]*Task, error) {
	conditions := []string{"t.project_id = $1"}
	args := []any{f.ProjectID}
	argN := 2

	if f.Status != nil {
		conditions = append(conditions, fmt.Sprintf("t.status = $%d::task_status", argN))
		args = append(args, *f.Status)
		argN++
	}
	if f.AssigneeID != nil {
		conditions = append(conditions, fmt.Sprintf("t.assignee_id = $%d", argN))
		args = append(args, *f.AssigneeID)
		argN++
	}

	query := taskSelectSQL + " WHERE " + strings.Join(conditions, " AND ") +
		" ORDER BY t.created_at DESC"

	if f.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argN, argN+1)
		offset := 0
		if f.Page > 1 {
			offset = (f.Page - 1) * f.Limit
		}
		args = append(args, f.Limit, offset)
	}

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	var tasks []*Task
	for rows.Next() {
		t, err := scanTask(rows)
		if err != nil {
			return nil, fmt.Errorf("scan task: %w", err)
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

// CreateTask inserts a task and returns it with assignee info populated.
func (s *Store) CreateTask(ctx context.Context, p CreateTaskParams) (*Task, error) {
	var id uuid.UUID
	err := s.pool.QueryRow(ctx, `
		INSERT INTO tasks (title, description, priority, project_id, assignee_id, created_by, due_date)
		VALUES ($1, $2, $3::task_priority, $4, $5, $6, $7)
		RETURNING id
	`, p.Title, p.Description, p.Priority, p.ProjectID, p.AssigneeID, p.CreatedBy, p.DueDate).
		Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return s.GetTaskByID(ctx, id)
}

// UpdateTask applies a partial update and returns the updated task.
func (s *Store) UpdateTask(ctx context.Context, p UpdateTaskParams) (*Task, error) {
	setClauses := []string{}
	args := []any{}
	argN := 1

	if p.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argN))
		args = append(args, *p.Title)
		argN++
	}
	if p.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argN))
		args = append(args, *p.Description)
		argN++
	}
	if p.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d::task_status", argN))
		args = append(args, *p.Status)
		argN++
	}
	if p.Priority != nil {
		setClauses = append(setClauses, fmt.Sprintf("priority = $%d::task_priority", argN))
		args = append(args, *p.Priority)
		argN++
	}
	if p.ClearAssignee {
		setClauses = append(setClauses, "assignee_id = NULL")
	} else if p.AssigneeID != nil {
		setClauses = append(setClauses, fmt.Sprintf("assignee_id = $%d", argN))
		args = append(args, *p.AssigneeID)
		argN++
	}
	if p.ClearDueDate {
		setClauses = append(setClauses, "due_date = NULL")
	} else if p.DueDate != nil {
		setClauses = append(setClauses, fmt.Sprintf("due_date = $%d", argN))
		args = append(args, *p.DueDate)
		argN++
	}

	if len(setClauses) == 0 {
		return s.GetTaskByID(ctx, p.ID)
	}

	args = append(args, p.ID)
	query := fmt.Sprintf(
		`UPDATE tasks SET %s WHERE id = $%d`,
		strings.Join(setClauses, ", "), argN,
	)
	_, err := s.pool.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return s.GetTaskByID(ctx, p.ID)
}

// DeleteTask removes a task.
func (s *Store) DeleteTask(ctx context.Context, id uuid.UUID) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// isUniqueViolation checks whether the error is a PostgreSQL unique constraint violation.
func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "23505")
}

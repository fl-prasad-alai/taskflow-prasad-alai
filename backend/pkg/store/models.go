package store

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user.
type User struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// UserSummary is a lightweight user representation embedded inside other objects.
type UserSummary struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Email string    `json:"email"`
}

// Project represents a project owned by a user.
type Project struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	OwnerID     uuid.UUID  `json:"owner_id"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ProjectWithTasks includes the project's task list.
type ProjectWithTasks struct {
	Project
	Tasks []*Task `json:"tasks"`
}

// Task represents a unit of work inside a project.
type Task struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Description *string      `json:"description"`
	Status      string       `json:"status"`
	Priority    string       `json:"priority"`
	ProjectID   uuid.UUID    `json:"project_id"`
	AssigneeID  *uuid.UUID   `json:"assignee_id"`
	Assignee    *UserSummary `json:"assignee"`
	CreatedBy   uuid.UUID    `json:"created_by"`
	DueDate     *time.Time   `json:"due_date"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// ProjectStats holds aggregate task counts for a project.
type ProjectStats struct {
	ProjectID  uuid.UUID           `json:"project_id"`
	Total      int                 `json:"total"`
	ByStatus   map[string]int      `json:"by_status"`
	ByAssignee []AssigneeStat      `json:"by_assignee"`
}

// AssigneeStat holds per-assignee task count.
type AssigneeStat struct {
	AssigneeID   uuid.UUID `json:"assignee_id"`
	AssigneeName string    `json:"assignee_name"`
	Count        int       `json:"count"`
}

// CreateUserParams holds the inputs for creating a user.
type CreateUserParams struct {
	Name         string
	Email        string
	PasswordHash string
}

// CreateProjectParams holds the inputs for creating a project.
type CreateProjectParams struct {
	Name        string
	Description *string
	OwnerID     uuid.UUID
}

// UpdateProjectParams holds updatable project fields (nil = keep existing).
type UpdateProjectParams struct {
	ID          uuid.UUID
	Name        *string
	Description *string
}

// CreateTaskParams holds the inputs for creating a task.
type CreateTaskParams struct {
	Title       string
	Description *string
	Priority    string
	ProjectID   uuid.UUID
	AssigneeID  *uuid.UUID
	CreatedBy   uuid.UUID
	DueDate     *time.Time
}

// UpdateTaskParams holds updatable task fields (nil = keep existing).
type UpdateTaskParams struct {
	ID          uuid.UUID
	Title       *string
	Description *string
	Status      *string
	Priority    *string
	AssigneeID  *uuid.UUID
	ClearAssignee bool
	DueDate     *time.Time
	ClearDueDate  bool
}

// ListTasksFilter holds optional filter criteria for task listing.
type ListTasksFilter struct {
	ProjectID  uuid.UUID
	Status     *string
	AssigneeID *uuid.UUID
	Page       int
	Limit      int
}

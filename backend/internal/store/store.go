// Package store provides database access for all domain entities.
package store

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskflow/backend/migrations"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
)

// Store wraps a pgxpool.Pool and exposes typed data-access methods.
type Store struct {
	pool *pgxpool.Pool
}

// New creates a Store backed by a connection pool. It retries the connection
// up to maxRetries times to accommodate slow container start-ups.
func New(ctx context.Context, databaseURL string) (*Store, error) {
	var pool *pgxpool.Pool
	var err error

	for i := range 10 {
		pool, err = pgxpool.New(ctx, databaseURL)
		if err == nil {
			if pingErr := pool.Ping(ctx); pingErr == nil {
				break
			} else {
				pool.Close()
				err = pingErr
			}
		}
		wait := time.Duration(i+1) * time.Second
		fmt.Printf("waiting for database (attempt %d/10): %v\n", i+1, err)
		time.Sleep(wait)
	}
	if err != nil {
		return nil, fmt.Errorf("connecting to database: %w", err)
	}

	return &Store{pool: pool}, nil
}

// Close releases all pool connections.
func (s *Store) Close() {
	s.pool.Close()
}

// RunMigrations runs all pending up migrations using the embedded SQL files.
func RunMigrations(databaseURL string) error {
	src, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("creating migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, databaseURL)
	if err != nil {
		return fmt.Errorf("creating migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("running migrations: %w", err)
	}
	return nil
}

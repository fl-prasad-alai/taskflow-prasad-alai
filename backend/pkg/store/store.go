// Package store provides database access for all domain entities.
package store

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"taskflow/backend/migrations"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
)

// Store wraps a pgxpool.Pool and exposes typed data-access methods.
type Store struct {
	pool *pgxpool.Pool
}

// New creates a Store backed by a connection pool. It retries the connection
// up to maxRetries times to accommodate slow container start-ups.
func New(ctx context.Context, databaseURL string) (*Store, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parsing database URL: %w", err)
	}

	// Serverless-friendly pool settings:
	//   • No minimum connections held open (avoids Supabase idle-killer)
	//   • Connections recycled after 5 min (before most providers kill them)
	//   • Health check on every acquire so stale connections are never used
	cfg.MaxConns = 5
	cfg.MinConns = 0
	// Close idle connections after 30s so Supabase's idle-connection killer
	// (which fires around 60s on the free tier) never sees them.
	cfg.MaxConnIdleTime = 30 * time.Second
	// Force-recycle after 5 min regardless of activity.
	cfg.MaxConnLifetime = 5 * time.Minute
	// Let the pool proactively detect dead connections in the background.
	cfg.HealthCheckPeriod = 30 * time.Second
	// NOTE: do NOT set BeforeAcquire with conn.Ping — that runs a prepared
	// statement under the hood which Supabase's PgBouncer (port 6543, tx mode)
	// rejects, causing every connection acquire to fail.
	//
	// Use simple-protocol queries (no server-side prepared statements) so the
	// pool works correctly with both a direct Postgres connection AND Supabase's
	// PgBouncer endpoint.  This is safe for all query types used in this app.
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	var pool *pgxpool.Pool
	for i := range 10 {
		pool, err = pgxpool.NewWithConfig(ctx, cfg)
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

// Ping verifies that the database is reachable.
func (s *Store) Ping(ctx context.Context) error {
	return s.pool.Ping(ctx)
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

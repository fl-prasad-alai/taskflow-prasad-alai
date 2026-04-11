package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"taskflow/backend/internal/config"
	"taskflow/backend/internal/handler"
	"taskflow/backend/internal/store"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		log.Error("loading config", "err", err)
		os.Exit(1)
	}

	ctx := context.Background()

	// Wait for the database (retry loop inside store.New).
	db, err := store.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connecting to database", "err", err)
		os.Exit(1)
	}
	defer db.Close()
	log.Info("database connected")

	// Run pending migrations — safe to call even when no migrations are pending.
	log.Info("running migrations")
	if err := store.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Error("migrations failed", "err", err)
		os.Exit(1)
	}
	log.Info("migrations complete")

	h := handler.New(db, []byte(cfg.JWTSecret), log)
	router := h.Router(cfg.CORSOrigin)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown on SIGTERM / SIGINT.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		log.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	<-quit
	log.Info("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("shutdown error", "err", err)
	}
	log.Info("server stopped")
}

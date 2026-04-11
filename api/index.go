package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"

	"taskflow/backend/internal/handler"
	"taskflow/backend/internal/store"
)

var (
	once    sync.Once
	app     *handler.Handler
	initErr error
)

func initApp() {
	dbURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	// Use context for connection initialization
	s, err := store.New(context.Background(), dbURL)
	if err != nil {
		initErr = err
		return
	}

	// Initialize the handler with the store and logger
	app = handler.New(s, []byte(jwtSecret), nil)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	
	if initErr != nil {
		http.Error(w, "Failed to initialize application: "+initErr.Error(), http.StatusInternalServerError)
		log.Printf("Init error: %v", initErr)
		return
	}

	// Vercel routes everything under /api to this handler.
	// We pass the router to serve the request.
	// CORS origin can be "" for Vercel since they are on the same domain.
	app.Router("").ServeHTTP(w, r)
}
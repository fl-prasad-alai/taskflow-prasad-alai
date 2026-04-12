package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"

	"taskflow/backend/pkg/handler"
	"taskflow/backend/pkg/store"
)

var (
	once    sync.Once
	h       *handler.Handler
	initErr error
)

func initApp() {
	dbURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	// Initialize the store
	s, err := store.New(context.Background(), dbURL)
	if err != nil {
		initErr = err
		return
	}

	// Initialize the handler with dependencies
	h = handler.New(s, []byte(jwtSecret), nil)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	
	if initErr != nil {
		http.Error(w, "Failed to initialize: "+initErr.Error(), http.StatusInternalServerError)
		log.Printf("Init error: %v", initErr)
		return
	}

	// Route traffic through the Chi router
	h.Router("").ServeHTTP(w, r)
}
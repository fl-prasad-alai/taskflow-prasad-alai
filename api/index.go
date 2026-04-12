package handler

import (
    "context"
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

    s, err := store.New(context.Background(), dbURL)
    if err != nil {
        initErr = err
        return
    }

    h = handler.New(s, []byte(jwtSecret), nil)
}

func Handler(w http.ResponseWriter, r *http.Request) {
    once.Do(initApp)
    
    if initErr != nil {
        http.Error(w, "Init error: "+initErr.Error(), http.StatusInternalServerError)
        return
    }

    // Use the router directly without StripPrefix to keep the Auth logic intact
    h.Router("").ServeHTTP(w, r)
}
// Package migrations holds the SQL migration files embedded in the binary.
package migrations

import "embed"

// FS holds all *.sql files in this directory.
//
//go:embed *.sql
var FS embed.FS

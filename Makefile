# Cuban Social - Project Makefile
.PHONY: clean help install setup start server export-events insert-missing-events insert-missing-dry-run insert-missing-force generate-cards list-cards cards json-to-csv compare-data compare-data-verbose

# Default target
help:
	@echo "Cuban Social - Available Make targets:"
	@echo "  install                  - Install all dependencies (Node.js + Python)"
	@echo "  setup                    - Alias for install"
	@echo "  clean                    - Remove all unnecessary files"
	@echo "  start                    - Start local development server on port 8000"
	@echo "  server                   - Alias for start"
	@echo "  export-events            - Export events from Supabase to JSON"
	@echo "  insert-missing-events    - Insert missing events to database"
	@echo "  insert-missing-dry-run   - Dry run of missing events insertion"
	@echo "  insert-missing-force     - Force insert missing events"
	@echo "  generate-cards           - Generate event cards"
	@echo "  list-cards               - List available event cards"
	@echo "  cards                    - Generate and list event cards"
	@echo "  json-to-csv              - Convert JSON data to CSV format"
	@echo "  compare-data             - Compare CSV data"
	@echo "  compare-data-verbose     - Compare CSV data with verbose output"
	@echo "  help                     - Show this help message"
	@echo ""
	@echo "Quick start:"
	@echo "  make install             # Install dependencies"
	@echo "  make start               # Start development server"

# Remove all unnecessary files
clean:
	@echo "🧹 Cleaning all unnecessary files..."
	@find . -name ".DS_Store" -type f -delete 2>/dev/null || true
	@rm -rf node_modules/ 2>/dev/null || true
	@rm -rf .venv/ .qr_venv/ 2>/dev/null || true
	@rm -f *.log package-lock.json 2>/dev/null || true
	@rm -rf .idea/ .vscode/ 2>/dev/null || true
	@rm -rf dist/ build/ *.csv 2>/dev/null || true
	@echo "✅ Clean completed - all unnecessary files removed"

# Start local development server
start:
	@echo "🚀 Starting local development server on http://localhost:8000"
	@echo "   Press Ctrl+C to stop the server"
	@python3 -m http.server 8000

# Alias for start
server: start

# Export events from Supabase to JSON
export-events:
	@echo "📥 Exporting events from Supabase to JSON..."
	@node scripts/supabase-to-json.js

# Insert missing events to database
insert-missing-events:
	@echo "📤 Inserting missing events to database..."
	@python3 scripts/insert-missing-events.py

# Dry run of missing events insertion
insert-missing-dry-run:
	@echo "🔍 Running dry run of missing events insertion..."
	@python3 scripts/insert-missing-events.py --dry-run

# Force insert missing events
insert-missing-force:
	@echo "⚠️  Force inserting missing events..."
	@python3 scripts/insert-missing-events.py --force

# Generate and list available event cards
cards:
	@echo "🎨 Generating event cards..."
	@node scripts/generate-event-cards.js
	@echo "📋 Listing available event cards..."
	@node scripts/list-cards.js
	@echo "✅ Event cards generation and listing completed"

# Convert JSON data to CSV format
json-to-csv:
	@echo "🔄 Converting JSON data to CSV format..."
	@python3 scripts/json_to_csv.py

# Compare CSV data
compare-data:
	@echo "🔍 Comparing CSV data..."
	@python3 scripts/compare-csv.py

# Compare CSV data with verbose output
compare-data-verbose:
	@echo "🔍 Comparing CSV data (verbose)..."
	@python3 scripts/compare-csv.py --verbose

# Install all dependencies
install:
	@echo "🚀 Installing Cuban Social dependencies..."
	@echo "📦 Installing Node.js dependencies..."
	@npm install
	@echo "🐍 Setting up Python virtual environment..."
	@python3 -m venv .venv
	@echo "📋 Installing Python dependencies..."
	@.venv/bin/pip install --upgrade pip
	@.venv/bin/pip install supabase
	@echo "✅ Installation completed!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Activate Python environment: source .venv/bin/activate"
	@echo "  2. Start development server: make start"
	@echo "  3. View all commands: make help"

# Alias for install
setup: install

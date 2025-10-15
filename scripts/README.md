# Scripts

This directory contains utility scripts for managing Cuban Social event data.

## Quick Start

### Setup

1. Install Node.js dependencies: `npm install`
2. Set up Python virtual environment and dependencies:

    ```bash
    # Create virtual environment
    python3 -m venv .venv

    # Activate virtual environment
    source .venv/bin/activate # On macOS/Linux

    # Install Python dependencies
    pip install supabase
    ```

3. Run `npm run` to see all available commands

**Note**: Remember to activate the virtual environment (`source .venv/bin/activate`) before running any Python scripts

### Common Workflows

**Export events from Supabase to JSON files:**

```bash
npm run export-events
```

**Compare data between sources:**

```bash
npm run compare-data
```

**Insert missing events (with preview):**

```bash
npm run insert-missing-dry-run    # Preview first
npm run insert-missing-events     # Actual insertion
```

**Generate monthly event cards:**

```bash
npm run generate-cards
npm run list-cards
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run export-events` | Export events from Supabase to JSON files |
| `npm run insert-missing-events` | Insert missing events from JSON to Supabase |
| `npm run insert-missing-dry-run` | Preview missing events without inserting |
| `npm run insert-missing-force` | Insert missing events without confirmation |
| `npm run generate-cards` | Generate monthly event cards as PNG images |
| `npm run list-cards` | List generated event card files |
| `npm run json-to-csv` | Convert JSON event files to CSV format |
| `npm run compare-data` | Compare Supabase CSV export with JSON files |
| `npm run compare-data-verbose` | Compare with detailed field analysis |

## Event Data Export

`supabase-to-json.js` downloads all approved events from the Supabase database and saves them as individual JSON files in the `data/events/` directory. This maintains compatibility with the existing file-based system while keeping data synchronized with the database.

### Usage

```bash
npm run export-events
# or
node scripts/supabase-to-json.js
```

### Features

- Downloads only approved events from Supabase
- Maintains existing JSON file structure and formatting
- Updates `data/events/index.json` with all event files
- Skips files that haven't been updated (based on `updated_at` timestamps)
- Identifies orphaned files that no longer exist in the database
- Generates appropriate filenames based on event dates (format: `event-YYMMDD.json`)
- Provides detailed summary of export results

### Output

- Individual event JSON files in `data/events/` directory
- Updated `data/events/index.json` with file listing
- Console output showing export statistics and any issues

## Event Data Import

`insert-missing-events.py` inserts events from JSON files that are missing in the Supabase database. This is useful after running the data comparison script and finding events that exist only in JSON files.

### Usage

```bash
npm run insert-missing-events        # With confirmation prompt
npm run insert-missing-dry-run       # Preview only (recommended first)
npm run insert-missing-force         # Skip confirmation
# or
python3 scripts/insert-missing-events.py
python3 scripts/insert-missing-events.py --dry-run
python3 scripts/insert-missing-events.py --force
```

### Prerequisites

- Python package `supabase-py`
- JSON event files in `data/events/` directory

### Features

- Compares JSON files with Supabase database to identify missing events
- Shows preview of events to be inserted before proceeding
- Handles field mapping between JSON structure and database schema
- Transforms data types appropriately (dates, booleans, arrays)
- **Inserts events with 'pending' status for manual review and approval**
- Provides detailed error handling and insertion results
- Supports dry-run mode for safe previewing
- Validates required fields before insertion
- Sets appropriate created_at timestamps

### Command Options

| Flag | Description |
|------|-------------|
| `--dry-run, -d` | Show what would be inserted without making changes |
| `--force, -f` | Skip confirmation prompt |
| `--verbose, -v` | Show detailed output |
| `--help, -h` | Show help message |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DEBUG=true` | Enable detailed error logging and debugging information |

**Usage with debug mode:**

```bash
DEBUG=true npm run insert-missing-events
# or
DEBUG=true python3 scripts/insert-missing-events.py --dry-run
```

### Output

- Inserts missing events into Supabase database with **'pending' status** for manual review
- Console output showing insertion progress and results
- Summary of successful and failed insertions
- Detailed error messages for failed insertions

**Note**: All inserted events will have 'pending' status and require manual approval in the Supabase dashboard before they appear on the website.

## Event Card Generator

`generate-event-cards.js` generates monthly event cards as PNG images based on approved events from the Supabase database. Each month gets a different color scheme, and the cards follow the style shown in the attached reference image.

The script will:

1. Load approved events from Supabase database (`status = 'approved'`)
2. Group events by month and generate a card for each month with events
3. Save cards as PNG files in `data/cards/`

### Usage

```bash
npm run generate-cards
# or
node scripts/generate-event-cards.js
```

To list the generated cards:

```bash
npm run list-cards
# or
node scripts/list-cards.js
```

### Features

- Automatic month color scheme rotation
- Spanish month names and day names
- Time formatting (12-hour format with AM/PM)
- Location name extraction (venue name only)
- Event type badges (salsa, bachata, timba, etc.)
- Rounded corners and modern design
- Automatically generates cards from approved events in the Supabase database

### Output

- Images are saved to `data/cards/` directory
- Filename format: `events-YYYY-MM.png`
- Cards include:
  - Month name and year in header
  - Individual event entries with date, time, location, and event type
  - Color-coded by month
  - Responsive layout that accommodates multiple events

## Data Conversion and Comparison

### Workflow Overview

1. **Export Supabase table as CSV**:
   - In [Supabase](https://supabase.com), go to **Table Editor**
   - Select the `events` table
   - Click on the 3 vertical dots next to the table name
   - Select **Export data** -> **Export table as CSV**
   - Save as `events_rows.csv` in the root directory

2. **Convert JSON files to CSV**:

   ```bash
   npm run json-to-csv
   ```

3. **Compare the data**:

   ```bash
   npm run compare-data              # Basic comparison
   npm run compare-data-verbose      # Detailed field analysis
   ```

4. **Take action based on results**:
   - **Missing in DB**: `npm run insert-missing-events`, then approve the events in the dashboard
   - **Missing in JSON**: `npm run export-events`
   - **Data differences**: Update DB manually, then `npm run export-events`

### Data Conversion

`json_to_csv.py` converts JSON event files to CSV format for analysis and comparison.

#### Usage

```bash
npm run json-to-csv
# or
python3 scripts/json_to_csv.py
```

#### Features

- Converts all event JSON files in `data/events/` to a single CSV file
- Preserves key event fields: date, time, location, type, and status
- Handles missing or malformed data gracefully
- Supports custom field mapping for CSV output
- Outputs timestamped CSV files (format: `events_YYYYMMDD_HHMMSS.csv`)
- Provides summary of conversion results and any errors encountered

#### Output

- CSV file containing all event data in the project root
- Columns include: `id`, `name`, `date`, `end_date`, `location`, `type`, `status`, and other relevant fields
- Console output summarizing conversion results

### Data Comparison

`compare-csv.py` compares events data between Supabase database export (CSV) and JSON files to identify discrepancies.

#### Usage

```bash
npm run compare-data
# or
python3 scripts/compare-csv.py
```

#### Features

- Compares event data between Supabase CSV export (`events_rows.csv`) and latest JSON-to-CSV output
- Identifies missing, extra, or mismatched events in either source
- Highlights differences in key fields (date, time, location, type, status)
- Provides summary statistics of matches and discrepancies
- Handles data type normalization (dates, booleans, arrays)
- Shows field-level analysis in verbose mode
- Outputs detailed comparison report to console

#### Command Options

| Flag | Description |
|------|-------------|
| `--verbose, -v` | Show detailed field analysis and comparison |

#### Output

- Console output with comprehensive comparison results:
  - Events in DB but not in JSON files
  - Events in JSON files but not in DB  
  - Events with field-level differences
  - Summary statistics and recommendations
- Clear indication of required actions for data reconciliation

## Configuration

### Required Files

- `events_rows.csv` - Supabase table export (for comparison)
- `data/events/*.json` - Individual event JSON files
- `data/events/index.json` - Event index file

### Dependencies

**Node.js:**

```bash
npm install
```

**Python:**

```bash
# Create and activate virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install supabase      # Install required packages
```

## Troubleshooting

### Common Issues

1. **Missing CSV files**: Export the events table from Supabase first
2. **Python import errors**: 
   - Make sure you've activated the virtual environment: `source venv/bin/activate`
   - Install required packages: `pip install supabase`
3. **Permission errors**: Ensure write permissions for `data/` directories
4. **Virtual environment not found**: Create it first with `python3 -m venv venv`

### Getting Help

```bash
npm run                                        # Show available commands
DEBUG=true npm run insert-missing-dry-run      # Debug mode with dry run
python3 scripts/insert-missing-events.py --help # Python script help
python3 scripts/compare-csv.py --help           # Comparison script help
```

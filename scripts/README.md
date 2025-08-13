# Scripts

This directory contains utility scripts for managing Cuban Social event data.

## Event Card Generator

### generate-event-cards.js

Generates monthly event cards as PNG images based on approved events from the Supabase database. Each month gets a different color scheme, and the cards follow the style shown in the attached reference image.

The script will:

1. Load approved events from Supabase database (`status = 'approved'`)
2. Group events by month and generate a card for each month with events
3. Save cards as PNG files in `data/cards/`

#### Usage

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

#### Output

- Images are saved to `data/cards/` directory
- Filename format: `events-YYYY-MM.png`
- Cards include:
  - Month name and year in header
  - Individual event entries with date, time, location, and event type
  - Color-coded by month
  - Responsive layout that accommodates multiple events

#### Features

- Automatic month color scheme rotation
- Spanish month names and day names
- Time formatting (12-hour format with AM/PM)
- Location name extraction (venue name only)
- Event type badges (salsa, bachata, timba, etc.)
- Rounded corners and modern design
- Automatically generates cards from approved events in the Supabase database

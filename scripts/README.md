# Scripts

This directory contains utility scripts for managing Cuban Social event data.

## Event Card Generator

### generate-event-cards.js

Generates monthly event cards as PNG images based on the events in `data/events/`. Each month gets a different color scheme, and the cards follow the style shown in the attached reference image.

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
- **Automatic generation**: Cards are automatically updated when new events are added via `csv-to-event-json.js`

---

## CSV to Event JSON Converter

This tool converts CSV-like event submission data (typically from form submissions) into proper JSON format compatible with the Cuban Social event system. **After successfully adding a new event, it automatically regenerates the monthly event cards.**

### CSV Converter Usage

#### NPM Script (Recommended)

```bash
npm run convert-event <input-file> [output-file]
```

#### Node.js Script

```bash
node scripts/csv-to-event-json.js <input-file> [output-file]
node scripts/csv-to-event-json.js - (read from stdin)
```

If no output file is specified, the script automatically generates a filename based on the event date in the format `event-<yymmdd>.json` and saves it to the `data/events/` directory.

### CSV Converter Examples

#### Convert with automatic filename generation

```bash
npm run convert-event data/events-pending/sample-event.csv
# Generates: data/events/event-250906.json (based on event date)
```

#### Convert and specify output file

```bash
npm run convert-event data/events-pending/sample-event.csv data/events/custom-name.json
```

#### Convert from stdin

```bash
cat event-data.csv | npm run convert-event -
```

### Input Format

The script expects a CSV-like format with key-value pairs:

```text
key1
value1
key2
value2
type
  - "timba"
  - "rueda"
```

## Output Format

The script produces JSON compatible with the Cuban Social event system:

```json
{
  "id": "event-1753828924183",
  "name": "Havana Nights",
  "date": "2025-09-06T17:00:00",
  "end_date": "2025-09-06T23:59:00",
  "location": "27309 Jefferson Ave. A -101, Temecula, Ca. 92590",
  "maps_link": "https://maps.google.com/?q=...",
  "type": ["timba", "rueda"],
  "music": "DJ",
  "price": "$25",
  "description": "Event description...",
  "contact": "@951-421-8777",
  "featured": false,
  "status": "pending",
  "created_at": "2025-07-29T22:42:04.183Z"
}
```

## Field Processing

- **Internal fields**: Fields starting with `_`, `requestor_*`, `send_confirmation` are filtered out
- **Type arrays**: Multi-line type arrays are properly parsed
- **Price formatting**: Numeric prices are formatted with `$` prefix
- **Contact formatting**: Phone numbers are prefixed with `@`
- **Default values**: `featured` defaults to `false`
- **Filtered fields**: `end_time`, `time`, `formatted_date`, `recurring_frequency` are excluded as redundant

## Files

- `scripts/csv-to-event-json.js` - Main Node.js conversion script with automatic filename generation

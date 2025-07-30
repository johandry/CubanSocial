# CSV to Event JSON Converter

This tool converts CSV-like event submission data (typically from form submissions) into proper JSON format compatible with the Cuban Social event system.

## Usage

### NPM Script (Recommended)

```bash
npm run convert-event <input-file> [output-file]
```

### Node.js Script

```bash
node scripts/csv-to-event-json.js <input-file> [output-file]
node scripts/csv-to-event-json.js - (read from stdin)
```

If no output file is specified, the script automatically generates a filename based on the event date in the format `event-<yymmdd>.json` and saves it to the `data/events/` directory.

## Examples

### Convert with automatic filename generation

```bash
npm run convert-event data/events-pending/sample-event.csv
# Generates: data/events/event-250906.json (based on event date)
```

### Convert and specify output file

```bash
npm run convert-event data/events-pending/sample-event.csv data/events/custom-name.json
```

### Convert from stdin

```bash
cat event-data.csv | npm run convert-event -
```

## Input Format

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

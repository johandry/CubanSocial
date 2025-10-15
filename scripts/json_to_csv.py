#!/usr/bin/env python3
"""
Script to convert all event JSON files in data/events to CSV format.
"""

import json
import csv
import os
from pathlib import Path
from datetime import datetime


def load_event_files(events_dir):
    """Load all event JSON files from the events directory."""
    events = []
    
    # Get list of event files from index.json
    index_file = events_dir / "index.json"
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            index_data = json.load(f)
            event_files = index_data.get('files', [])
    else:
        # Fallback: get all JSON files except index.json
        event_files = [f.name for f in events_dir.glob("*.json") if f.name != "index.json"]
    
    # Load each event file
    for filename in event_files:
        file_path = events_dir / filename
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    event_data = json.load(f)
                    events.append(event_data)
                    print(f"Loaded: {filename}")
            except json.JSONDecodeError as e:
                print(f"Error loading {filename}: {e}")
            except Exception as e:
                print(f"Unexpected error loading {filename}: {e}")
        else:
            print(f"File not found: {filename}")
    
    return events


def get_all_fields(events):
    """Get all unique fields from all events to create comprehensive CSV headers."""
    all_fields = set()
    for event in events:
        all_fields.update(event.keys())
    
    # Define preferred order for common fields
    preferred_order = [
        'id', 'name', 'date', 'end_date', 'location', 'maps_link', 
        'type', 'music', 'price', 'description', 'contact', 
        'featured', 'status', 'created_at'
    ]
    
    # Start with preferred order, then add any additional fields
    ordered_fields = []
    for field in preferred_order:
        if field in all_fields:
            ordered_fields.append(field)
            all_fields.remove(field)
    
    # Add remaining fields alphabetically
    ordered_fields.extend(sorted(all_fields))
    
    return ordered_fields


def format_field_value(value, field_name=None):
    """Format field values for CSV output."""
    if value is None:
        return ""
    elif isinstance(value, list):
        # Format arrays based on field name
        if field_name == 'type':
            # Use JSON array format for type field: ["item1","item2","item3"]
            quoted_items = [f'"{item}"' for item in value]
            return "[" + ",".join(quoted_items) + "]"
        else:
            # Join other array values with semicolons
            return "; ".join(str(item) for item in value)
    elif isinstance(value, bool):
        return str(value).lower()
    else:
        return str(value)


def convert_to_csv(events, output_file):
    """Convert events list to CSV file."""
    if not events:
        print("No events to convert.")
        return
    
    # Get all fields across all events
    fieldnames = get_all_fields(events)
    
    # Write CSV file
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # Write header
        writer.writeheader()
        
        # Write event data
        for event in events:
            # Create row with formatted values
            row = {}
            for field in fieldnames:
                row[field] = format_field_value(event.get(field), field)
            
            writer.writerow(row)
    
    print(f"Successfully converted {len(events)} events to {output_file}")
    print(f"CSV columns: {', '.join(fieldnames)}")


def main():
    """Main function to execute the conversion."""
    # Get the script directory and navigate to the project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    events_dir = project_root / "data" / "events"
    
    print(f"Looking for events in: {events_dir}")
    
    if not events_dir.exists():
        print(f"Error: Events directory not found at {events_dir}")
        return
    
    # Load all event files
    events = load_event_files(events_dir)
    
    if not events:
        print("No events found to convert.")
        return
    
    # Generate output filename
    output_file = project_root / "events_json.csv"
    
    # Convert to CSV
    convert_to_csv(events, output_file)
    
    print(f"\nConversion complete!")
    print(f"Output file: {output_file}")
    print(f"Total events converted: {len(events)}")


if __name__ == "__main__":
    main()
    main()

#!/usr/bin/env python3
"""
Script to compare events_rows.csv (Supabase export) with JSON-to-CSV output.
"""

import csv
import sys
from pathlib import Path
from datetime import datetime
import json


def load_csv(file_path):
    """Load CSV file and return as list of dictionaries."""
    events = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                events.append(row)
        print(f"Loaded {len(events)} events from {file_path}")
        return events
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []


def normalize_datetime(dt_str):
    """Normalize datetime strings for comparison."""
    if not dt_str:
        return ""
    
    # Remove timezone info and standardize format
    # Handle formats like "2025-08-02 21:00:00+00" and "2025-08-02T21:00:00Z"
    dt_str = dt_str.replace(" ", "T").replace("+00", "").replace("Z", "")
    
    # Truncate to just the main datetime part (remove microseconds if present)
    if "." in dt_str:
        dt_str = dt_str.split(".")[0]
    
    return dt_str


def normalize_boolean(bool_str):
    """Normalize boolean strings."""
    if isinstance(bool_str, bool):
        return str(bool_str).lower()
    if str(bool_str).lower() in ['true', '1', 'yes']:
        return 'true'
    elif str(bool_str).lower() in ['false', '0', 'no', '']:
        return 'false'
    return str(bool_str).lower()


def normalize_array(array_str):
    """Normalize array strings for comparison."""
    if not array_str:
        return []
    
    # Handle JSON array format like ["salsa","bachata"]
    if array_str.startswith('[') and array_str.endswith(']'):
        try:
            return sorted(json.loads(array_str))
        except:
            pass
    
    # Handle semicolon separated format
    if ';' in array_str:
        return sorted([item.strip() for item in array_str.split(';') if item.strip()])
    
    # Single item
    return [array_str.strip()] if array_str.strip() else []


def compare_events(db_events, json_events):
    """Compare events from database export vs JSON files."""
    print("\n" + "="*80)
    print("COMPARISON REPORT")
    print("="*80)
    
    # Create lookup dictionaries
    db_lookup = {event['id']: event for event in db_events}
    json_lookup = {event['id']: event for event in json_events}
    
    # Get all event IDs
    all_ids = set(db_lookup.keys()) | set(json_lookup.keys())
    
    # Events only in DB
    db_only = set(db_lookup.keys()) - set(json_lookup.keys())
    if db_only:
        print(f"\n❌ Events in DB but NOT in JSON files: {len(db_only)}")
        for event_id in sorted(db_only):
            print(f"   - {event_id}: {db_lookup[event_id].get('name', 'No name')}")
    
    # Events only in JSON
    json_only = set(json_lookup.keys()) - set(db_lookup.keys())
    if json_only:
        print(f"\n❌ Events in JSON files but NOT in DB: {len(json_only)}")
        for event_id in sorted(json_only):
            print(f"   - {event_id}: {json_lookup[event_id].get('name', 'No name')}")
    
    # Compare common events
    common_ids = set(db_lookup.keys()) & set(json_lookup.keys())
    print(f"\n✅ Events in BOTH sources: {len(common_ids)}")
    
    # Detailed comparison for common events
    differences = []
    
    for event_id in sorted(common_ids):
        db_event = db_lookup[event_id]
        json_event = json_lookup[event_id]
        
        event_diffs = []
        
        # Compare key fields
        comparison_fields = [
            ('name', str, str),
            ('date', normalize_datetime, normalize_datetime),
            ('end_date', normalize_datetime, normalize_datetime),
            ('location', str, str),
            ('maps_link', str, str),
            ('type', normalize_array, normalize_array),
            ('music', str, str),
            ('price', str, str),
            ('description', str, str),
            ('contact', str, str),
            ('featured', normalize_boolean, normalize_boolean),
            ('status', str, str),
            ('created_at', normalize_datetime, normalize_datetime),
            ('event_url', str, str),
            ('event_url_text', str, str)
        ]
        
        for field, db_normalizer, json_normalizer in comparison_fields:
            db_value = db_normalizer(db_event.get(field, ''))
            json_value = json_normalizer(json_event.get(field, ''))
            
            if db_value != json_value:
                event_diffs.append({
                    'field': field,
                    'db_value': db_value,
                    'json_value': json_value
                })
        
        if event_diffs:
            differences.append({
                'id': event_id,
                'name': json_event.get('name', 'No name'),
                'diffs': event_diffs
            })
    
    # Report differences
    if differences:
        print(f"\n⚠️  Events with DIFFERENCES: {len(differences)}")
        for event in differences:
            print(f"\n   📅 {event['id']}: {event['name']}")
            for diff in event['diffs']:
                print(f"      • {diff['field']}:")
                print(f"        DB:   {repr(diff['db_value'])}")
                print(f"        JSON: {repr(diff['json_value'])}")
    else:
        print(f"\n✅ All {len(common_ids)} common events match perfectly!")
    
    # Summary
    print(f"\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total events in DB export:     {len(db_events)}")
    print(f"Total events in JSON files:    {len(json_events)}")
    print(f"Events in both sources:        {len(common_ids)}")
    print(f"Events only in DB:             {len(db_only)}")
    print(f"Events only in JSON:           {len(json_only)}")
    print(f"Events with differences:       {len(differences)}")
    
    return {
        'total_db': len(db_events),
        'total_json': len(json_events),
        'common': len(common_ids),
        'db_only': len(db_only),
        'json_only': len(json_only),
        'differences': len(differences)
    }


def main():
    """Main function."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Check for verbose mode
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    
    # File paths
    db_csv = project_root / "events_rows.csv"
    json_csv = project_root / "events_json.csv"
    
    print("Comparing CSV files:")
    print(f"  DB Export:     {db_csv}")
    print(f"  JSON-to-CSV:   {json_csv}")
    
    if verbose:
        print(f"  Verbose mode:  ON")
    
    # Check if files exist
    if not db_csv.exists():
        print(f"Error: DB export file not found: {db_csv}")
        return
    
    if not json_csv.exists():
        print(f"Error: JSON-to-CSV file not found: {json_csv}")
        return
    
    # Load CSV files
    db_events = load_csv(db_csv)
    json_events = load_csv(json_csv)
    
    if not db_events and not json_events:
        print("Error: No events loaded from either file")
        return
    
    # Show field comparison if verbose
    if verbose and db_events and json_events:
        print(f"\n📊 Field Analysis:")
        db_fields = set(db_events[0].keys()) if db_events else set()
        json_fields = set(json_events[0].keys()) if json_events else set()
        
        print(f"  DB fields:    {sorted(db_fields)}")
        print(f"  JSON fields:  {sorted(json_fields)}")
        print(f"  Common:       {sorted(db_fields & json_fields)}")
        print(f"  DB only:      {sorted(db_fields - json_fields)}")
        print(f"  JSON only:    {sorted(json_fields - db_fields)}")
    
    # Compare events
    results = compare_events(db_events, json_events)
    
    # Generate timestamp for report
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = project_root / f"comparison_report_{timestamp}.txt"
    
    print(f"\n📄 Detailed report would be saved to: {report_file}")
    print(f"\n💡 Tip: Use --verbose or -v flag for detailed field analysis")


if __name__ == "__main__":
    main()

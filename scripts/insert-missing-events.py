#!/usr/bin/env python3
"""
Script to insert missing events from JSON files into Supabase database.
Run this after compare-csv.py to sync missing events.
"""

import csv
import sys
import json
import os
import urllib.parse
from pathlib import Path
from datetime import datetime
from supabase import create_client, Client

supabase_url = 'https://blctxghtoucdtyvetsar.supabase.co'
supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsY3R4Z2h0b3VjZHR5dmV0c2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM2ODMsImV4cCI6MjA3MDUzOTY4M30.32q6691h1n4Ue_lFXxkaPnzGlz0917C5iljxLFCFDmc'

# Check for debug mode
DEBUG = os.getenv('DEBUG', '').lower() in ['true', '1', 'yes', 'on']

def get_missing_events(db_csv_path, json_csv_path):
    """Get events that are in JSON files but not in database."""
    # Load both CSV files
    db_events = []
    json_events = []
    
    try:
        with open(db_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            db_events = [row for row in reader]
    except Exception as e:
        print(f"❌ Error loading DB CSV: {e}")
        return []
    
    try:
        with open(json_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            json_events = [row for row in reader]
    except Exception as e:
        print(f"❌ Error loading JSON CSV: {e}")
        return []
    
    # Create lookup set of DB event IDs
    db_ids = {event['id'] for event in db_events}
    
    # Find events in JSON but not in DB
    missing_events = [event for event in json_events if event['id'] not in db_ids]
    
    print(f"📊 Found {len(missing_events)} events to insert")
    return missing_events


def transform_event_for_db(event):
    """Transform JSON event data for database insertion."""
    def parse_datetime(dt_str):
        """Parse datetime string and return in ISO format."""
        if not dt_str:
            return None
        
        # Handle different formats
        dt_str = dt_str.replace(" ", "T").replace("+00", "").replace("Z", "")
        
        if "." in dt_str:
            dt_str = dt_str.split(".")[0]
        
        try:
            # Try to parse and return in ISO format
            dt = datetime.fromisoformat(dt_str)
            return dt.isoformat()
        except:
            return None
    
    def parse_boolean(bool_str):
        """Parse boolean string."""
        if isinstance(bool_str, bool):
            return bool_str
        return str(bool_str).lower() in ['true', '1', 'yes']
    
    def parse_array(array_str):
        """Parse array string."""
        if not array_str:
            return []
        
        if array_str.startswith('[') and array_str.endswith(']'):
            try:
                return json.loads(array_str)
            except:
                pass
        
        if ';' in array_str:
            return [item.strip() for item in array_str.split(';') if item.strip()]
        
        return [array_str.strip()] if array_str.strip() else []
    
    # Transform the event
    transformed = {
        'id': event['id'],
        'name': event.get('name', ''),
        'date': parse_datetime(event.get('date')),
        'end_date': parse_datetime(event.get('end_date')),
        'location': event.get('location', ''),
        'maps_link': event.get('maps_link', ''),
        'type': parse_array(event.get('type', '')),
        'music': event.get('music', ''),
        'price': event.get('price', ''),
        'description': event.get('description', ''),
        'contact': event.get('contact', ''),
        'featured': parse_boolean(event.get('featured', False)),
        'status': 'pending',  # Always set to pending for manual review
        'created_at': parse_datetime(event.get('created_at')) or datetime.now().isoformat(),
        'event_url': event.get('event_url', ''),
        'event_url_text': event.get('event_url_text', '')
    }

    print(f"    🛠️  Transformed event {transformed}")
    
    # Remove None values
    return {k: v for k, v in transformed.items() if v is not None}


def insert_events_to_supabase(supabase: Client, events, dry_run=False):
    """Insert events into Supabase database using URL parameters."""
    if not events:
        print("ℹ️  No events to insert")
        return
    
    print(f"📝 {'DRY RUN: Would insert' if dry_run else 'Inserting'} {len(events)} events...")
    
    if DEBUG:
        print("🐛 DEBUG mode enabled - detailed error information will be shown")
    
    success_count = 0
    error_count = 0
    
    for i, event in enumerate(events, 1):
        try:
            # Transform event data
            db_event = transform_event_for_db(event)
            
            print(f"  {i}/{len(events)}: {event['id']} - {event.get('name', 'No name')[:50]}...")
            
            if not dry_run:
                # Convert arrays to PostgreSQL array format for URL
                processed_event = db_event.copy()
                if 'type' in processed_event and isinstance(processed_event['type'], list):
                    # Convert Python list to PostgreSQL array format
                    if processed_event['type']:
                        processed_event['type'] = '{' + ','.join([f'"{item}"' for item in processed_event['type']]) + '}'
                    else:
                        processed_event['type'] = '{}'
                
                # Use upsert with on_conflict parameter to handle duplicates via URL
                result = supabase.table('events').upsert(
                    processed_event,
                    on_conflict='id',
                    ignore_duplicates=False
                ).execute()
                
                if result.data:
                    success_count += 1
                    print(f"    ✅ Inserted successfully")
                else:
                    error_count += 1
                    print(f"    ❌ Insert failed: No data returned")
                    if DEBUG:
                        print(f"    🐛 DEBUG - Full result: {result}")
                        print(f"    🐛 DEBUG - Event data: {json.dumps(processed_event, indent=2, default=str)}")
            else:
                if DEBUG:
                    print(f"    🔍 Would insert: {json.dumps(db_event, indent=2, default=str)}")
                else:
                    print(f"    🔍 Would insert event with status: pending")
                success_count += 1
                
        except Exception as e:
            error_count += 1
            print(f"    ❌ Error inserting event {event['id']}: {e}")
            if DEBUG:
                import traceback
                print(f"    🐛 DEBUG - Full traceback:")
                print(f"    🐛 {traceback.format_exc()}")
                print(f"    🐛 DEBUG - Event data: {json.dumps(event, indent=2, default=str)}")
    
    print(f"\n📈 Results:")
    print(f"  ✅ Successfully {'would insert' if dry_run else 'inserted'}: {success_count}")
    print(f"  ❌ Errors: {error_count}")


def main():
    """Main function."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Parse command line arguments
    dry_run = '--dry-run' in sys.argv or '-d' in sys.argv
    force = '--force' in sys.argv or '-f' in sys.argv
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    
    print("🔄 Missing Events Insertion Script")
    print("=" * 50)
    
    if dry_run:
        print("🔍 DRY RUN MODE: No actual insertions will be made")
    
    if DEBUG:
        print("🐛 DEBUG MODE: Detailed error information enabled")
    
    # Find CSV files
    db_csv = project_root / "events_rows.csv"
    json_csv = project_root / "events_json.csv"
    
    print(f"📁 Using files:")
    print(f"  DB Export:     {db_csv}")
    print(f"  JSON Export:   {json_csv}")
    
    if not db_csv.exists() or not json_csv.exists():
        print("❌ Error: Required CSV files not found")
        if not db_csv.exists():
            print(f"    Missing: {db_csv}")
        if not json_csv.exists():
            print(f"    Missing: {json_csv}")
        return
    
    # Get missing events
    missing_events = get_missing_events(db_csv, json_csv)
    
    if not missing_events:
        print("✅ No missing events found - database is up to date!")
        return
    
    # Show events to be inserted
    print(f"\n📋 Events to insert:")
    for event in missing_events:
        print(f"  • {event['id']}: {event.get('name', 'No name')}")
    
    # Confirm insertion (unless force flag is used)
    if not dry_run and not force:
        response = input(f"\n❓ Insert {len(missing_events)} events into Supabase? (y/N): ")
        if response.lower() != 'y':
            print("🚫 Operation cancelled")
            return
    
    # Create Supabase client
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        return
    
    # Insert events
    insert_events_to_supabase(supabase, missing_events, dry_run)
    
    print(f"\n🎉 {'Dry run completed' if dry_run else 'Insertion completed'}!")
    
    if dry_run:
        print("💡 Run without --dry-run flag to perform actual insertions")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
        print("Usage: python insert-missing-events.py [OPTIONS]")
        print("")
        print("Options:")
        print("  --dry-run, -d    Show what would be inserted without making changes")
        print("  --force, -f      Skip confirmation prompt")
        print("  --verbose, -v    Show detailed output")
        print("  --help, -h       Show this help message")
        print("")
        print("Environment variables:")
        print("  DEBUG=true       Enable detailed error logging and debugging information")
        print("  SUPABASE_URL     Supabase project URL")
        print("  SUPABASE_ANON_KEY or SUPABASE_KEY   Supabase anon key")
    else:
        main()

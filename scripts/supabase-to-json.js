import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration - extracted from your existing client
const SUPABASE_URL = 'https://blctxghtoucdtyvetsar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsY3R4Z2h0b3VjZHR5dmV0c2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM2ODMsImV4cCI6MjA3MDUzOTY4M30.32q6691h1n4Ue_lFXxkaPnzGlz0917C5iljxLFCFDmc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Load all approved events from Supabase database
 */
async function loadEventsFromSupabase() {
    try {
        console.log('📡 Loading events from Supabase...');
        
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log(`✅ Loaded ${events?.length || 0} approved events from Supabase`);
        return events || [];
    } catch (error) {
        console.error('❌ Error loading events from Supabase:', error);
        throw error;
    }
}

/**
 * Adjust datetime by subtracting 7 hours (UTC to Pacific Time)
 * Returns format: YYYY-MM-DDTHH:mm:ss (without milliseconds or timezone)
 */
function adjustDateForTimezone(dateString) {
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        
        // Build the formatted date string manually
        const parts = {
            year: date.getFullYear(),
            month: (date.getMonth() + 1).toString().padStart(2, '0'),
            day: date.getDate().toString().padStart(2, '0'),
            hour: date.getHours().toString().padStart(2, '0'),
            minute: date.getMinutes().toString().padStart(2, '0'),
            second: date.getSeconds().toString().padStart(2, '0')
        };
        
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    } catch (error) {
        console.warn(`⚠️  Could not adjust date: ${dateString}`, error);
        return dateString;
    }
}

/**
 * Transform Supabase event data to match existing JSON file structure
 */
function transformEventToJSONFormat(event) {
    // Transform the event to match the existing JSON structure
    return {
        id: event.id,
        name: event.name,
        date: adjustDateForTimezone(event.date),
        location: event.location,
        maps_link: event.maps_link || "",
        type: Array.isArray(event.type) ? event.type : [event.type],
        music: event.music || "Not specified",
        price: event.price || "Not specified",
        description: event.description || "",
        contact: event.contact || "",
        featured: event.featured || false,
        recurring: event.recurring || false,
        status: event.status,
        created_at: event.created_at,
        updated_at: event.updated_at,
        // Include optional fields if they exist
        ...(event.end_date && { end_date: adjustDateForTimezone(event.end_date) }),
        ...(event.event_url && { event_url: event.event_url }),
        ...(event.event_url_text && { event_url_text: event.event_url_text }),
        ...(event.payment_link && { payment_link: event.payment_link }),
        ...(event.submitted_by && { submitted_by: event.submitted_by })
    };
}

/**
 * Generate filename for event based on its date and ID
 */
function generateEventFilename(event) {
    // Try to extract date for filename
    if (event.date) {
        const eventDate = new Date(event.date);
        if (!isNaN(eventDate.getTime())) {
            const year = eventDate.getFullYear().toString().slice(-2);
            const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
            const day = eventDate.getDate().toString().padStart(2, '0');
            return `event-${year}${month}${day}.json`;
        }
    }
    
    // Fallback to ID-based filename
    if (event.id.startsWith('event-')) {
        return `${event.id}.json`;
    } else {
        return `event-${event.id}.json`;
    }
}

/**
 * Save events to JSON files in data/events directory
 */
async function saveEventsToJSONFiles(events) {
    const eventsDir = path.join(__dirname, '../data/events');
    
    // Ensure events directory exists
    if (!fs.existsSync(eventsDir)) {
        fs.mkdirSync(eventsDir, { recursive: true });
        console.log(`📁 Created directory: ${eventsDir}`);
    }

    const savedFiles = [];
    const skippedFiles = [];

    console.log(`💾 Saving ${events.length} events to JSON files...`);

    for (const event of events) {
        try {
            const transformedEvent = transformEventToJSONFormat(event);
            const filename = generateEventFilename(event);
            const filepath = path.join(eventsDir, filename);

            // Check if file already exists
            if (fs.existsSync(filepath)) {
                // Read existing file to compare
                const existingContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                
                // Simple comparison - if updated_at is newer, overwrite
                const existingUpdated = new Date(existingContent.updated_at || existingContent.created_at);
                const newUpdated = new Date(event.updated_at || event.created_at);
                
                if (newUpdated <= existingUpdated) {
                    console.log(`⏭️  Skipping ${filename} (no updates)`);
                    skippedFiles.push(filename);
                    continue;
                }
            }

            // Write the file
            fs.writeFileSync(filepath, JSON.stringify(transformedEvent, null, 2), 'utf8');
            console.log(`✅ Saved: ${filename}`);
            savedFiles.push(filename);

        } catch (error) {
            console.error(`❌ Error saving event ${event.id}:`, error);
        }
    }

    return { savedFiles, skippedFiles };
}

/**
 * Update the index.json file with all event filenames
 */
async function updateIndexFile(eventsDir) {
    try {
        // Get all JSON files in events directory (except index.json)
        const files = fs.readdirSync(eventsDir)
            .filter(file => file.endsWith('.json') && file !== 'index.json')
            .sort();

        const indexData = {
            files: files,
            last_updated: new Date().toISOString(),
            total_events: files.length
        };

        const indexPath = path.join(eventsDir, 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
        
        console.log(`📄 Updated index.json with ${files.length} files`);
        return files.length;
    } catch (error) {
        console.error('❌ Error updating index file:', error);
        throw error;
    }
}

/**
 * Clean up orphaned JSON files (events that no longer exist in database)
 */
async function cleanupOrphanedFiles(events, eventsDir) {
    try {
        const existingFiles = fs.readdirSync(eventsDir)
            .filter(file => file.endsWith('.json') && file !== 'index.json');

        const eventIds = new Set(events.map(e => e.id));
        const orphanedFiles = [];

        for (const filename of existingFiles) {
            try {
                const filepath = path.join(eventsDir, filename);
                const fileContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                
                if (!eventIds.has(fileContent.id)) {
                    orphanedFiles.push(filename);
                }
            } catch (error) {
                console.warn(`⚠️  Could not read ${filename} for cleanup check`);
            }
        }

        if (orphanedFiles.length > 0) {
            console.log(`🧹 Found ${orphanedFiles.length} orphaned files:`);
            orphanedFiles.forEach(file => console.log(`   - ${file}`));
            
            // Optionally remove orphaned files (commented out for safety)
            // orphanedFiles.forEach(file => {
            //     fs.unlinkSync(path.join(eventsDir, file));
            //     console.log(`🗑️  Removed orphaned file: ${file}`);
            // });
        } else {
            console.log(`✅ No orphaned files found`);
        }

        return orphanedFiles;
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        return [];
    }
}

/**
 * Main function
 */
async function main() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting Supabase to JSON export...\n');

        // Load events from Supabase
        const events = await loadEventsFromSupabase();
        
        if (events.length === 0) {
            console.log('⚠️  No approved events found in database');
            return;
        }

        // Save events to JSON files
        const { savedFiles, skippedFiles } = await saveEventsToJSONFiles(events);
        
        // Update index file
        const eventsDir = path.join(__dirname, '../data/events');
        const totalFiles = await updateIndexFile(eventsDir);
        
        // Clean up orphaned files
        const orphanedFiles = await cleanupOrphanedFiles(events, eventsDir);
        
        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 EXPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Total events in database:    ${events.length}`);
        console.log(`💾 Files saved/updated:         ${savedFiles.length}`);
        console.log(`⏭️  Files skipped (no changes):  ${skippedFiles.length}`);
        console.log(`📄 Total JSON files:            ${totalFiles}`);
        console.log(`🧹 Orphaned files found:        ${orphanedFiles.length}`);
        console.log(`⏱️  Export completed in:        ${duration}s`);
        console.log('='.repeat(60));

        if (savedFiles.length > 0) {
            console.log('\n🎉 Export completed successfully!');
            console.log(`📁 Files saved to: ${eventsDir}`);
        } else {
            console.log('\n✅ All files are up to date, no changes needed');
        }

    } catch (error) {
        console.error('\n❌ Export failed:', error);
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Cuban Social - Supabase to JSON Export

Usage: node scripts/supabase-to-json.js [options]

Options:
  --help, -h     Show this help message
  
Description:
  Downloads all approved events from the Supabase database and saves them
  as individual JSON files in the data/events/ directory. This maintains
  compatibility with the existing file-based system while keeping data
  synchronized with the database.

Features:
  - Downloads only approved events
  - Maintains existing JSON file structure
  - Updates index.json with all event files
  - Skips files that haven't been updated
  - Identifies orphaned files (no longer in database)
  - Generates appropriate filenames based on event dates
    `);
    process.exit(0);
}

// Run the main function
main();

// Export functions for potential reuse
export {
    loadEventsFromSupabase,
    transformEventToJSONFormat,
    saveEventsToJSONFiles,
    updateIndexFile,
    adjustDateForTimezone
};
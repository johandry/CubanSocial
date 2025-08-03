#!/usr/bin/env node

/**
 * Script to convert CSV-like event data to JSON format
 * Usage: node csv-to-event-json.js <input-file> [output-file]
 * If no output file is specified, generates event-<yymmdd>.json in data/events/
 */

const fs = require('fs');
const path = require('path');
const { generateEventCards } = require('./generate-event-cards');

function generateOutputFilename(eventData) {
    if (!eventData.id) {
        throw new Error('Event ID is required to generate filename');
    }
    
    return `data/events/${eventData.id}.json`;
}

function updateEventsIndex(eventFilename) {
    const indexPath = 'data/events/index.json';
    
    try {
        let indexData;
        
        // Read existing index or create new one
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            indexData = JSON.parse(indexContent);
        } else {
            indexData = {
                files: [],
                last_updated: new Date().toISOString()
            };
        }
        
        // Extract just the filename from the full path
        const filename = path.basename(eventFilename);
        
        // Add the new file if it's not already in the list
        if (!indexData.files.includes(filename)) {
            indexData.files.push(filename);
            // Sort files to maintain order
            indexData.files.sort();
        }
        
        // Update the timestamp
        indexData.last_updated = new Date().toISOString();
        
        // Write the updated index
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
        
        return true;
    } catch (error) {
        console.error(`Warning: Could not update events index: ${error.message}`);
        return false;
    }
}

function generateEventId(eventData) {
    if (!eventData.date) {
        throw new Error('Event date is required to generate ID');
    }
    
    // Parse the date and format as yymmdd
    const date = new Date(eventData.date);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Check if there are existing events on the same date
    const eventsDir = 'data/events';
    const baseId = `event-${dateStr}`;
    
    try {
        if (!fs.existsSync(eventsDir)) {
            return baseId;
        }
        
        const files = fs.readdirSync(eventsDir);
        const existingIds = new Set();
        
        // Collect existing event IDs for this date
        for (const file of files) {
            if (file.startsWith(`event-${dateStr}`) && file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(eventsDir, file), 'utf8');
                    const eventObj = JSON.parse(content);
                    if (eventObj.id) {
                        existingIds.add(eventObj.id);
                    }
                } catch (error) {
                    // Ignore files that can't be parsed
                }
            }
        }
        
        // If base ID is available, use it
        if (!existingIds.has(baseId)) {
            return baseId;
        }
        
        // Find the next available number
        let counter = 2;
        let candidateId = `${baseId}-${counter}`;
        while (existingIds.has(candidateId)) {
            counter++;
            candidateId = `${baseId}-${counter}`;
        }
        
        return candidateId;
        
    } catch (error) {
        // If we can't read the directory, just return the base ID
        return baseId;
    }
}

function parseCSVToEvent(csvContent) {
    const lines = csvContent.trim().split('\n');
    const eventData = {};
    
    // Parse the CSV-like format (key-value pairs)
    let i = 0;
    while (i < lines.length) {
        if (i + 1 < lines.length) {
            const key = lines[i].trim();
            i++;
            
            // Skip internal fields that shouldn't be in the final JSON
            if (key.startsWith('_') || key === 'send_confirmation' || key === 'requestor_name' || key === 'requestor_contact') {
                i++; // Skip the value line too
                continue;
            }
            
            let value = lines[i].trim();
            
            // Handle multi-line values (like type arrays)
            if (key === 'type' && value.includes('- "')) {
                const types = [];
                // Current line might be part of the array
                if (value.includes('- "')) {
                    const match = value.match(/- "([^"]+)"/);
                    if (match) types.push(match[1]);
                }
                
                // Look ahead for more array items
                let j = i + 1;
                while (j < lines.length && lines[j].trim().startsWith('- "')) {
                    const match = lines[j].trim().match(/- "([^"]+)"/);
                    if (match) {
                        types.push(match[1]);
                    }
                    j++;
                }
                i = j - 1; // Update i to the last processed line
                value = types;
            } else if (key === 'price') {
                // Convert numeric price to string with $ if it's a number
                if (!isNaN(value) && value !== '') {
                    value = `$${value}`;
                }
            } else if (key === 'featured') {
                // Convert string to boolean
                value = value.toLowerCase() === 'true';
            } else if (key === 'end_time' || key === 'time' || key === 'formatted_date' || key === 'recurring_frequency') {
                // Skip these fields as they're either redundant or internal
                i++;
                continue;
            }
            
            eventData[key] = value;
        }
        i++;
    }
    
    // Set default values for required fields if missing
    if (!eventData.featured) {
        eventData.featured = false;
    }
    
    // Generate event ID if not provided or override existing one to ensure consistency
    if (eventData.date) {
        eventData.id = generateEventId(eventData);
    }
    
    // Ensure contact format
    if (eventData.contact && !eventData.contact.startsWith('@')) {
        eventData.contact = `@${eventData.contact}`;
    }
    
    // Return fields in the specified order
    const orderedEvent = {};
    const fieldOrder = [
        'id', 'name', 'date', 'end_date', 'location', 'maps_link', 'type', 
        'music', 'price', 'description', 'contact', 'featured', 'created_at'
    ];
    
    // Add fields in the specified order if they exist
    for (const field of fieldOrder) {
        if (eventData.hasOwnProperty(field)) {
            orderedEvent[field] = eventData[field];
        }
    }
    
    // Add any remaining fields that weren't in the order list
    for (const [key, value] of Object.entries(eventData)) {
        if (!orderedEvent.hasOwnProperty(key)) {
            orderedEvent[key] = value;
        }
    }
    
    return orderedEvent;
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: node csv-to-event-json.js <input-file> [output-file]');
        console.error('       node csv-to-event-json.js - (to read from stdin)');
        console.error('');
        console.error('If no output file is specified, generates event-<yymmdd>.json in data/events/');
        console.error('based on the event date found in the input data.');
        process.exit(1);
    }
    
    let csvContent;
    const inputFile = args[0];
    
    try {
        if (inputFile === '-') {
            // Read from stdin
            csvContent = fs.readFileSync(0, 'utf8');
        } else {
            csvContent = fs.readFileSync(inputFile, 'utf8');
        }
        
        const eventData = parseCSVToEvent(csvContent);
        const jsonOutput = JSON.stringify(eventData, null, 2);
        
        let outputFile;
        if (args.length > 1) {
            // Use provided output file
            outputFile = args[1];
        } else {
            // Generate output filename based on event date
            outputFile = generateOutputFilename(eventData);
        }
        
        if (outputFile) {
            // Write to output file
            fs.writeFileSync(outputFile, jsonOutput);
            console.log(`Event JSON written to: ${outputFile}`);
            
            // Update the events index
            const indexUpdated = updateEventsIndex(outputFile);
            if (indexUpdated) {
                console.log(`✅ Events index updated`);
            }
            
            // Generate/update monthly event cards
            try {
                console.log(`🎨 Generating monthly event cards...`);
                await generateEventCards();
                console.log(`✅ Monthly event cards updated successfully`);
            } catch (cardError) {
                console.error(`⚠️  Warning: Failed to update event cards: ${cardError.message}`);
                console.error(`   Event was still saved successfully. You can manually run 'npm run generate-cards' later.`);
            }
        } else {
            // Output to stdout
            console.log(jsonOutput);
        }
        
        console.error(`✅ Successfully converted event: ${eventData.name || 'Unnamed Event'}`);
        console.error(`📍 Location: ${eventData.location || 'No location'}`);
        console.error(`📅 Date: ${eventData.date || 'No date'}`);
        console.error(`🎵 Type: ${Array.isArray(eventData.type) ? eventData.type.join(', ') : eventData.type || 'No type'}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// If running directly (not imported)
if (require.main === module) {
    main().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}

module.exports = { parseCSVToEvent };

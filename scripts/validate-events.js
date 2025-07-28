#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validate all event JSON files
 */
function validateEvents() {
    const eventsDir = path.join(__dirname, '../data/events');
    const eventsPendingDir = path.join(__dirname, '../data/events-pending');
    
    let allValid = true;
    let totalEvents = 0;
    
    console.log('🔍 Validating Cuban Social events...\n');
    
    // Validate approved events
    if (fs.existsSync(eventsDir)) {
        const approvedFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.json') && file !== 'index.json');
        console.log(`📅 Validating ${approvedFiles.length} approved events...`);
        
        for (const file of approvedFiles) {
            const filePath = path.join(eventsDir, file);
            if (!validateEventFile(filePath, 'approved')) {
                allValid = false;
            }
            totalEvents++;
        }
    }
    
    // Validate pending events
    if (fs.existsSync(eventsPendingDir)) {
        const pendingFiles = fs.readdirSync(eventsPendingDir).filter(file => file.endsWith('.json') && file !== 'index.json');
        console.log(`⏳ Validating ${pendingFiles.length} pending events...`);
        
        for (const file of pendingFiles) {
            const filePath = path.join(eventsPendingDir, file);
            if (!validateEventFile(filePath, 'pending')) {
                allValid = false;
            }
            totalEvents++;
        }
    }
    
    console.log(`\n📊 Summary: ${totalEvents} total events processed`);
    
    if (allValid) {
        console.log('✅ All events are valid!');
        process.exit(0);
    } else {
        console.log('❌ Some events have validation errors');
        process.exit(1);
    }
}

/**
 * Validate a single event file
 */
function validateEventFile(filePath, status = 'unknown') {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const event = JSON.parse(content);
        const fileName = path.basename(filePath);
        
        const errors = [];
        
        // Required fields
        const requiredFields = ['id', 'name', 'date', 'location', 'maps_link', 'type'];
        for (const field of requiredFields) {
            if (!event[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate ID format
        if (event.id && !event.id.match(/^event-/)) {
            errors.push('ID must start with "event-"');
        }
        
        // Validate name length
        if (event.name && (event.name.length < 5 || event.name.length > 100)) {
            errors.push('Name must be between 5 and 100 characters');
        }
        
        // Validate date format and future date
        if (event.date) {
            const eventDate = new Date(event.date);
            if (isNaN(eventDate.getTime())) {
                errors.push('Invalid date format, use ISO 8601 format');
            } else if (status === 'approved' && eventDate <= new Date()) {
                // Only enforce future dates for approved events
                console.warn(`⚠️  Warning: ${fileName} has past date (${event.date})`);
            }
        }
        
        // Validate location
        if (event.location && event.location.length < 10) {
            errors.push('Location must be at least 10 characters (include full address)');
        }
        
        // Validate maps link
        if (event.maps_link && !event.maps_link.match(/^https?:\/\/.+/)) {
            errors.push('Maps link must be a valid URL');
        }
        
        // Validate dance types
        const validTypes = ['salsa', 'timba', 'bachata', 'merengue', 'rueda', 'cumbia'];
        if (event.type && Array.isArray(event.type)) {
            for (const type of event.type) {
                if (!validTypes.includes(type)) {
                    errors.push(`Invalid dance type: ${type}. Valid types: ${validTypes.join(', ')}`);
                }
            }
        } else if (event.type) {
            errors.push('Type must be an array of dance types');
        }
        
        // Validate music type
        const validMusic = ['Live', 'DJ', 'Mixed', ''];
        if (event.music && !validMusic.includes(event.music)) {
            errors.push(`Invalid music type: ${event.music}. Valid types: ${validMusic.join(', ')}`);
        }
        
        // Validate recurring
        const validRecurring = ['weekly', 'monthly', 'biweekly', ''];
        if (event.recurring && !validRecurring.includes(event.recurring)) {
            errors.push(`Invalid recurring type: ${event.recurring}. Valid types: ${validRecurring.join(', ')}`);
        }
        
        // Check file naming convention
        const expectedFileName = `${event.id}.json`;
        if (fileName !== expectedFileName) {
            errors.push(`File should be named ${expectedFileName}, got ${fileName}`);
        }
        
        if (errors.length > 0) {
            console.log(`❌ ${fileName} (${status}):`);
            errors.forEach(error => console.log(`   • ${error}`));
            return false;
        } else {
            console.log(`✅ ${fileName} (${status})`);
            return true;
        }
        
    } catch (error) {
        console.log(`❌ Error reading ${path.basename(filePath)}: ${error.message}`);
        return false;
    }
}

/**
 * Generate a summary of all events
 */
function generateSummary() {
    const eventsDir = path.join(__dirname, '../data/events');
    const eventsPendingDir = path.join(__dirname, '../data/events-pending');
    
    const summary = {
        totalEvents: 0,
        approvedEvents: 0,
        pendingEvents: 0,
        featuredEvents: 0,
        recurringEvents: 0,
        byDanceType: {},
        byMonth: {},
        upcomingEvents: 0
    };
    
    const now = new Date();
    
    // Process approved events
    if (fs.existsSync(eventsDir)) {
        const files = fs.readdirSync(eventsDir).filter(file => file.endsWith('.json'));
        summary.approvedEvents = files.length;
        
        for (const file of files) {
            const filePath = path.join(eventsDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const event = JSON.parse(content);
                
                // Count dance types
                if (event.type) {
                    for (const type of event.type) {
                        summary.byDanceType[type] = (summary.byDanceType[type] || 0) + 1;
                    }
                }
                
                // Count by month
                if (event.date) {
                    const eventDate = new Date(event.date);
                    const monthKey = eventDate.toISOString().substring(0, 7); // YYYY-MM
                    summary.byMonth[monthKey] = (summary.byMonth[monthKey] || 0) + 1;
                    
                    if (eventDate > now) {
                        summary.upcomingEvents++;
                    }
                }
                
                // Count special events
                if (event.featured) summary.featuredEvents++;
                if (event.recurring) summary.recurringEvents++;
                
            } catch (error) {
                console.warn(`Warning: Could not parse ${file}`);
            }
        }
    }
    
    // Process pending events
    if (fs.existsSync(eventsPendingDir)) {
        const files = fs.readdirSync(eventsPendingDir).filter(file => file.endsWith('.json'));
        summary.pendingEvents = files.length;
    }
    
    summary.totalEvents = summary.approvedEvents + summary.pendingEvents;
    
    return summary;
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--summary')) {
        console.log('📊 Cuban Social Events Summary\n');
        const summary = generateSummary();
        
        console.log(`📅 Total Events: ${summary.totalEvents}`);
        console.log(`✅ Approved: ${summary.approvedEvents}`);
        console.log(`⏳ Pending: ${summary.pendingEvents}`);
        console.log(`⭐ Featured: ${summary.featuredEvents}`);
        console.log(`🔄 Recurring: ${summary.recurringEvents}`);
        console.log(`🗓️  Upcoming: ${summary.upcomingEvents}`);
        
        console.log('\n🕺 By Dance Type:');
        Object.entries(summary.byDanceType)
            .sort(([,a], [,b]) => b - a)
            .forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
        
        console.log('\n📅 By Month:');
        Object.entries(summary.byMonth)
            .sort()
            .forEach(([month, count]) => {
                console.log(`   ${month}: ${count} events`);
            });
    } else {
        validateEvents();
    }
}

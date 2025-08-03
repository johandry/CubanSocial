const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont, CanvasRenderingContext2D } = require('canvas');

// Color schemes for different months
const monthColors = {
    1: '#1e40af',  // January - Blue
    2: '#dc2626',  // February - Red
    3: '#16a34a',  // March - Green
    4: '#ca8a04',  // April - Yellow
    5: '#7c3aed',  // May - Purple
    6: '#ea580c',  // June - Orange
    7: '#0891b2',  // July - Cyan
    8: '#2563eb',  // August - Blue
    9: '#059669',  // September - Emerald
    10: '#d97706', // October - Amber
    11: '#7c2d12', // November - Brown
    12: '#b91c1c'  // December - Red
};

const monthNames = {
    1: 'JANUARY', 2: 'FEBRUARY', 3: 'MARCH', 4: 'APRIL',
    5: 'MAY', 6: 'JUNE', 7: 'JULY', 8: 'AUGUST',
    9: 'SEPTEMBER', 10: 'OCTOBER', 11: 'NOVEMBER', 12: 'DECEMBER'
};

const dayNames = {
    0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY',
    4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY'
};

function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    if (hours === 0 && minutes === 0) return '';
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
    
    return `${displayHours}${displayMinutes}${period}`;
}

function formatPrice(price) {
    if (!price) return '';
    // Truncate price if longer than 8 characters
    if (price.length > 8) {
        return price.substring(0, 5) + '...';
    }
    return price;
}

function getLocationShort(location) {
    // Extract main venue name before the first comma
    const parts = location.split(',');
    return parts[0].trim().toUpperCase();
}

function createEventCard(events, month, year) {
    // Calculate dynamic height based on number of events
    const headerHeight = 200; // Space for title and month
    const eventHeight = 140; // Height per event (120 + 20 margin)
    const footerHeight = 50; // Bottom margin
    const canvasHeight = headerHeight + (events.length * eventHeight) + footerHeight;
    
    const canvas = createCanvas(800, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = monthColors[month];
    ctx.fillRect(0, 0, 800, canvasHeight);
    
    // Header
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SD CASINO EVENTS', 400, 80);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${monthNames[month]} ${year}`, 400, 130);
    
    let currentY = 200;
    
    events.forEach((event, index) => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const dayOfWeek = dayNames[eventDate.getDay()];
        const time = formatTime(event.date);
        const location = getLocationShort(event.location);
        
        // Day circle (separate from event info box)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(50, currentY + 10, 100, 100, 15);
        ctx.fill();
        
        // Day number
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(day.toString(), 100, currentY + 70);
        
        // Day of week
        ctx.font = 'bold 16px Arial';
        ctx.fillText(dayOfWeek, 100, currentY + 90);
        
        // Event info box (touching the date box)
        ctx.fillStyle = '#f0f9ff';
        ctx.beginPath();
        ctx.roundRect(150, currentY + 10, 600, 100, 15);
        ctx.fill();
        
        // Dotted line separator (at the junction)
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(150, currentY + 35);
        ctx.lineTo(150, currentY + 85);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        // Event name
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(event.name.toUpperCase(), 170, currentY + 40);
        
        // Time and location
        ctx.font = '18px Arial';
        if (time) {
            ctx.fillText(time, 170, currentY + 70);
            ctx.fillText(location, 270, currentY + 70);
        } else {
            ctx.fillText(location, 170, currentY + 70);
        }
        
        // Price in green box
        if (event.price) {
            const formattedPrice = formatPrice(event.price);
            const priceWidth = ctx.measureText(formattedPrice).width + 16; // 8px padding on each side
            const priceHeight = 24;
            const priceX = 720 - priceWidth; // Right-aligned
            const priceY = currentY + 58; // Vertically centered with time/location
            
            // Green background box
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.roundRect(priceX, priceY, priceWidth, priceHeight, 6);
            ctx.fill();
            
            // White text for price
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(formattedPrice, priceX + priceWidth / 2, priceY + 16);
            
            // Reset text alignment
            ctx.textAlign = 'left';
        }
        
        // Event types/music
        if (event.type && event.type.length > 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#6b7280';
            const types = event.type.join(' • ').toUpperCase();
            ctx.fillText(types, 170, currentY + 95);
        }
        
        currentY += 140;
    });
    
    return canvas;
}

function groupEventsByMonth(events) {
    const grouped = {};
    
    events.forEach(event => {
        const date = new Date(event.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(event);
    });
    
    // Sort events within each month by date
    Object.keys(grouped).forEach(monthKey => {
        grouped[monthKey].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    
    return grouped;
}

async function generateEventCards() {
    const eventsDir = path.join(__dirname, '../data/events');
    const cardsDir = path.join(__dirname, '../data/cards');
    
    // Ensure cards directory exists
    if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
    }
    
    // Read events index
    const indexPath = path.join(eventsDir, 'index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    // Load all events
    const events = [];
    for (const filename of index.files) {
        const eventPath = path.join(eventsDir, filename);
        const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        events.push(event);
    }
    
    // Group events by month
    const groupedEvents = groupEventsByMonth(events);
    
    // Generate cards for each month
    for (const [monthKey, monthEvents] of Object.entries(groupedEvents)) {
        const [year, month] = monthKey.split('-').map(Number);
        
        console.log(`Generating card for ${monthNames[month]} ${year} with ${monthEvents.length} events`);
        
        const canvas = createEventCard(monthEvents, month, year);
        const buffer = canvas.toBuffer('image/png');
        
        const filename = `events-${year}-${month.toString().padStart(2, '0')}.png`;
        const outputPath = path.join(cardsDir, filename);
        
        fs.writeFileSync(outputPath, buffer);
        console.log(`Generated: ${filename}`);
    }
    
    console.log('Event cards generation completed!');
}

// Add roundRect polyfill if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Run the script
if (require.main === module) {
    generateEventCards().catch(console.error);
}

module.exports = { generateEventCards };

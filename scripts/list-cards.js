#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function listGeneratedCards() {
    const cardsDir = path.join(__dirname, '../data/cards');
    
    if (!fs.existsSync(cardsDir)) {
        console.log('No cards directory found. Run npm run generate-cards first.');
        return;
    }
    
    const files = fs.readdirSync(cardsDir).filter(file => file.endsWith('.png'));
    
    if (files.length === 0) {
        console.log('No event cards found. Run npm run generate-cards to generate them.');
        return;
    }
    
    console.log('\n📅 Generated Event Cards:');
    console.log('========================\n');
    
    files.sort().forEach(file => {
        const filePath = path.join(cardsDir, file);
        const stats = fs.statSync(filePath);
        const fileSize = (stats.size / 1024).toFixed(1);
        
        // Extract month/year from filename
        const match = file.match(/events-(\d{4})-(\d{2})\.png/);
        if (match) {
            const year = match[1];
            const month = parseInt(match[2]);
            const monthNames = {
                1: 'January', 2: 'February', 3: 'March', 4: 'April',
                5: 'May', 6: 'June', 7: 'July', 8: 'August',
                9: 'September', 10: 'October', 11: 'November', 12: 'December'
            };
            
            console.log(`🖼️  ${monthNames[month]} ${year}`);
            console.log(`   File: ${file}`);
            console.log(`   Size: ${fileSize} KB`);
            console.log(`   Modified: ${stats.mtime.toLocaleDateString()}\n`);
        }
    });
    
    console.log(`Total cards: ${files.length}`);
    console.log(`Location: ${cardsDir}`);
    console.log('\n💡 Tip: You can open these PNG files in any image viewer or use them on social media!');
}

if (require.main === module) {
    listGeneratedCards();
}

module.exports = { listGeneratedCards };

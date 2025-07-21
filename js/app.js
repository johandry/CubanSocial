// Cuban Social - Modern Design Application JavaScript

class CubanSocialApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentView = 'list';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    async init() {
        await this.loadEvents();
        this.setupEventListeners();
        this.setupNavigation();
        this.renderFeaturedEvents();
        this.renderUpcomingEvents();
        
        // Initialize with Home section active
        this.showSection('home');
        this.setActiveNavLink('home');
    }

    async loadEvents() {
        try {
            // In a real implementation, this would load from the data/events directory
            this.events = await this.loadSampleEvents();
            this.filteredEvents = [...this.events];
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events. Please refresh the page.');
        }
    }

    async loadSampleEvents() {
        return [
            {
                id: "event-001",
                name: "Salsa Social Night",
                date: "2025-02-07T20:00:00",
                location: "Dance Studio San Diego",
                maps_link: "https://maps.google.com/?q=Dance+Studio+San+Diego",
                type: ["salsa"],
                music: "Live Band",
                price: "$15",
                description: "Weekly Friday night salsa social with live music",
                contact: "info@dancestudio.com",
                featured: true,
                recurring: "weekly"
            },
            {
                id: "event-002",
                name: "Cuban Timba Workshop",
                date: "2025-02-15T15:00:00",
                location: "Latin Dance Academy, NY",
                maps_link: "https://maps.google.com/?q=Latin+Dance+Academy",
                type: ["timba"],
                music: "DJ Set",
                price: "$25",
                description: "Learn authentic Cuban timba with professional instructors",
                contact: "@latinacademy",
                featured: true
            },
            {
                id: "event-003",
                name: "Friday Night Salsa Social",
                date: "2025-02-07T20:00:00",
                location: "Dance Studio Miami, FL",
                maps_link: "https://maps.google.com/?q=Dance+Studio+Miami",
                type: ["salsa"],
                music: "Live Band",
                price: "$15",
                description: "Join us for an evening of salsa dancing",
                featured: false
            },
            {
                id: "event-004",
                name: "Bachata Sensual Night",
                date: "2025-02-16T19:00:00",
                location: "Salsa Club Los Angeles, CA",
                maps_link: "https://maps.google.com/?q=Salsa+Club+Los+Angeles",
                type: ["bachata"],
                music: "DJ Set",
                price: "Free",
                description: "Bachata sensual night with top DJs",
                featured: false
            }
        ];
    }

    setupNavigation() {
        // Navigation between sections
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = e.target.getAttribute('href').substring(1);
                this.showSection(targetSection);
                this.setActiveNavLink(targetSection);
            });
        });
    }

    setActiveNavLink(sectionId) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to the current section's nav link
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section, .home-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section and render appropriate content
        if (sectionId === 'home') {
            // Home: Show only featured events
            document.getElementById('home').style.display = 'block';
            document.querySelector('.upcoming-section').style.display = 'none';
            document.querySelector('.filters-section').style.display = 'none';
            document.getElementById('calendar-container').style.display = 'none';
        } else if (sectionId === 'events') {
            // Events: Show featured + upcoming events with filters and calendar
            document.getElementById('home').style.display = 'block';
            document.querySelector('.upcoming-section').style.display = 'block';
            document.querySelector('.filters-section').style.display = 'block';
            document.getElementById('calendar-container').style.display = this.currentView === 'calendar' ? 'block' : 'none';
        } else {
            // Other sections: Show specific section only
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // Load content for specific sections
                if (sectionId === 'congresses') {
                    this.renderCongresses();
                } else if (sectionId === 'playlists') {
                    this.renderPlaylists();
                }
            }
        }
    }

    setupEventListeners() {
        // View toggle buttons
        const calendarViewBtn = document.getElementById('calendar-view');
        const listViewBtn = document.getElementById('list-view');
        
        calendarViewBtn?.addEventListener('click', () => this.switchView('calendar'));
        listViewBtn?.addEventListener('click', () => this.switchView('list'));

        // Calendar navigation
        document.getElementById('prev-month')?.addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month')?.addEventListener('click', () => this.nextMonth());

        // Filters
        document.getElementById('dance-filter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('music-filter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('location-filter')?.addEventListener('input', () => this.applyFilters());

        // Load more button
        document.getElementById('load-more')?.addEventListener('click', () => this.loadMoreEvents());

        // Form submission
        document.getElementById('event-form')?.addEventListener('submit', (e) => this.handleFormSubmission(e));
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        
        if (view === 'calendar') {
            document.getElementById('calendar-view').classList.add('active');
            document.getElementById('calendar-container').style.display = 'block';
            document.querySelector('.upcoming-section').style.display = 'none';
            this.renderCalendar();
        } else {
            document.getElementById('list-view').classList.add('active');
            document.getElementById('calendar-container').style.display = 'none';
            document.querySelector('.upcoming-section').style.display = 'block';
        }
    }

    renderFeaturedEvents() {
        const container = document.getElementById('featured-events');
        if (!container) return;

        const featuredEvents = this.events.filter(event => event.featured || event.recurring);
        
        container.innerHTML = featuredEvents.map(event => `
            <div class="featured-event-card">
                ${event.recurring ? 
                    `<div class="featured-badge recurring-badge"><i class="fas fa-repeat"></i> Weekly</div>` : 
                    `<div class="featured-badge">Featured</div>`
                }
                <h3 class="event-title">${event.name}</h3>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatEventTime(event.date, event.recurring)}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-music"></i>
                        <span>${event.music}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span class="event-price">${event.price}</span>
                    </div>
                </div>
                <button class="more-info-btn" onclick="app.showEventDetails('${event.id}')">
                    More Info
                </button>
            </div>
        `).join('');
    }

    renderUpcomingEvents() {
        const container = document.getElementById('events-list');
        if (!container) return;

        const upcomingEvents = this.filteredEvents.slice(0, 5); // Show first 5 events
        
        container.innerHTML = upcomingEvents.map(event => `
            <div class="featured-event-card">
                <div class="event-badges">
                    ${event.type.map(type => `<div class="event-type-badge ${type}">${type}</div>`).join('')}
                </div>
                <h3 class="event-title">${event.name}</h3>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatEventTime(event.date, event.recurring)}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-music"></i>
                        <span>${event.music}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span class="event-price">${event.price}</span>
                    </div>
                </div>
                <button class="more-info-btn" onclick="app.showEventDetails('${event.id}')">
                    More Info
                </button>
            </div>
        `).join('');
    }

    renderCalendar() {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;

        // Update calendar title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendar-title').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Clear existing days (keep headers)
        const dayHeaders = Array.from(calendarGrid.children).slice(0, 7);
        calendarGrid.innerHTML = '';
        dayHeaders.forEach(header => calendarGrid.appendChild(header));

        // Get first day of month and number of days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

        // Add empty cells for previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = daysInPrevMonth - i;
            calendarGrid.appendChild(dayDiv);
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            // Check if there are events on this day
            const dayEvents = this.events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day && 
                       eventDate.getMonth() === this.currentMonth && 
                       eventDate.getFullYear() === this.currentYear;
            });

            if (dayEvents.length > 0) {
                dayDiv.classList.add('has-event');
            }

            calendarGrid.appendChild(dayDiv);
        }

        // Add remaining cells for next month
        const totalCells = calendarGrid.children.length - 7; // Subtract headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = day;
            calendarGrid.appendChild(dayDiv);
        }
    }

    previousMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.renderCalendar();
    }

    applyFilters() {
        const danceFilter = document.getElementById('dance-filter')?.value || '';
        const musicFilter = document.getElementById('music-filter')?.value || '';
        const locationFilter = document.getElementById('location-filter')?.value.toLowerCase() || '';

        this.filteredEvents = this.events.filter(event => {
            const matchesDance = !danceFilter || event.type.includes(danceFilter);
            const matchesMusic = !musicFilter || event.music === musicFilter;
            const matchesLocation = !locationFilter || event.location.toLowerCase().includes(locationFilter);
            
            return matchesDance && matchesMusic && matchesLocation;
        });

        this.renderUpcomingEvents();
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        }
    }

    loadMoreEvents() {
        // In a real app, this would load more events from the server
        console.log('Loading more events...');
    }

    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        alert(`${event.name}\n\n${event.description}\n\nDate: ${this.formatDate(event.date)}\nLocation: ${event.location}\nPrice: ${event.price}`);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    formatEventTime(dateString, recurring) {
        if (recurring) {
            const date = new Date(dateString);
            return `Every ${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        }
        return this.formatDate(dateString);
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = this.parseFormData(formData);
        
        try {
            await this.createRequest(eventData);
            this.showSuccessMessage();
            e.target.reset();
        } catch (error) {
            console.error('Error submitting event:', error);
            this.showError('Failed to submit event. Please try again.');
        }
    }

    parseFormData(formData) {
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (key === 'type') {
                if (!data.type) data.type = [];
                data.type.push(value);
            } else {
                data[key] = value;
            }
        }
        
        if (data.date && data.time) {
            data.date = `${data.date}T${data.time}:00`;
        }
        
        if (formData.has('recurring')) {
            data.recurring = data.recurring_frequency || 'weekly';
        }
        
        data.id = 'event-' + Date.now();
        data.created_at = new Date().toISOString();
        
        return data;
    }

    async createRequest(eventData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Would create request with:', eventData);
        return { success: true, request_number: Math.floor(Math.random() * 1000) + 1 };
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.style.cssText = `
            background-color: #10b981;
            color: white;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
        `;
        message.innerHTML = `
            <h4><i class="fas fa-check-circle"></i> Event Submitted Successfully!</h4>
            <p>Your event has been submitted as a request. Admins will review it shortly.</p>
        `;
        
        const form = document.getElementById('event-form');
        form.parentNode.insertBefore(message, form);
        
        setTimeout(() => message.remove(), 5000);
    }

    showError(message) {
        console.error(message);
    }

    renderCongresses() {
        const container = document.getElementById('congress-list');
        if (!container) return;

        const congressData = [
            {
                name: "San Diego Salsa Congress",
                date: "2025-09-15",
                location: "San Diego Convention Center, CA",
                description: "Annual salsa congress featuring international artists and workshops",
                website: "https://sandiegosalsacongress.com",
                artists: ["Frankie Martinez", "Magna Gopal", "Oliver Pineda"]
            },
            {
                name: "LA Bachata Festival",
                date: "2025-10-20",
                location: "Los Angeles, CA",
                description: "Premier bachata festival with sensual and traditional workshops",
                website: "https://labachatafestival.com",
                artists: ["Daniel & Desiree", "Corky & Judith", "Ronald & Alba"]
            }
        ];

        container.innerHTML = congressData.map(congress => `
            <div class="congress-card">
                <h3>${congress.name}</h3>
                <div class="congress-meta">
                    <div class="congress-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(congress.date + 'T09:00:00')}</span>
                    </div>
                    <div class="congress-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${congress.location}</span>
                    </div>
                </div>
                <p>${congress.description}</p>
                <div class="congress-artists">
                    <h4>Featured Artists:</h4>
                    <div class="artist-list">
                        ${congress.artists.map(artist => `<span class="artist-tag">${artist}</span>`).join('')}
                    </div>
                </div>
                <a href="${congress.website}" target="_blank" class="congress-link">
                    <i class="fas fa-external-link-alt"></i> More Info
                </a>
            </div>
        `).join('');
    }

    renderPlaylists() {
        const container = document.getElementById('playlist-grid');
        if (!container) return;

        const playlistData = [
            {
                name: "Best of Cuban Salsa",
                description: "Classic salsa tracks from the masters of Cuban music",
                trackCount: 45,
                duration: "3h 24min",
                spotify: "https://open.spotify.com/playlist/cuban-salsa",
                cover: "🎵"
            },
            {
                name: "Timba Hits 2025",
                description: "Latest timba tracks that are setting dance floors on fire",
                trackCount: 32,
                duration: "2h 18min",
                spotify: "https://open.spotify.com/playlist/timba-2025",
                cover: "🔥"
            },
            {
                name: "Bachata Romántica",
                description: "Smooth bachata for those romantic dance moments",
                trackCount: 28,
                duration: "2h 5min",
                spotify: "https://open.spotify.com/playlist/bachata-romantica",
                cover: "💕"
            },
            {
                name: "Rueda de Casino Mix",
                description: "Perfect tracks for rueda de casino sessions",
                trackCount: 38,
                duration: "2h 55min",
                spotify: "https://open.spotify.com/playlist/rueda-casino",
                cover: "💃"
            }
        ];

        container.innerHTML = playlistData.map(playlist => `
            <div class="playlist-card">
                <div class="playlist-cover">
                    <span class="playlist-emoji">${playlist.cover}</span>
                </div>
                <div class="playlist-info">
                    <h3>${playlist.name}</h3>
                    <p>${playlist.description}</p>
                    <div class="playlist-stats">
                        <span><i class="fas fa-music"></i> ${playlist.trackCount} tracks</span>
                        <span><i class="fas fa-clock"></i> ${playlist.duration}</span>
                    </div>
                    <a href="${playlist.spotify}" target="_blank" class="playlist-link">
                        <i class="fab fa-spotify"></i> Listen on Spotify
                    </a>
                </div>
            </div>
        `).join('');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CubanSocialApp();
});

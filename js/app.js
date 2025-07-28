// Cuban Social - Modern Design Application JavaScript

class CubanSocialApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.congresses = [];
        this.currentView = 'list';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.displayedEventCount = 6; // Track how many events are currently displayed
        this.eventsPerPage = 6; // How many events to load at a time
        this.init();
    }

    async init() {
        await this.loadEvents();
        await this.loadCongresses();
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
            this.events = await this.loadEventsFromDirectory();
            this.filteredEvents = [...this.events];
        } catch (error) {
            console.error('Error loading events:', error);
            // Fallback to sample events if loading from files fails
            this.events = await this.loadSampleEvents();
            this.filteredEvents = [...this.events];
            this.showError('Using sample events. Event files may not be available.');
        }
    }

    async loadEventsFromDirectory() {
        const events = [];
        
        try {
            // Try to load events index file first (if it exists)
            const indexResponse = await fetch('data/events/index.json');
            if (indexResponse.ok) {
                const eventIndex = await indexResponse.json();
                for (const filename of eventIndex.files) {
                    try {
                        const response = await fetch(`data/events/${filename}`);
                        if (response.ok) {
                            const eventData = await response.json();
                            events.push(eventData);
                        }
                    } catch (error) {
                        console.warn(`Error loading ${filename}:`, error);
                    }
                }
            } else {
                // Fallback: try to load known event files
                const eventFiles = [
                    'event-001.json',
                    'event-002.json'
                    // Add more files as they are created
                ];
                
                for (const filename of eventFiles) {
                    try {
                        const response = await fetch(`data/events/${filename}`);
                        if (response.ok) {
                            const eventData = await response.json();
                            events.push(eventData);
                        } else {
                            console.warn(`Could not load ${filename}: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Error loading ${filename}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error accessing events directory:', error);
            throw error;
        }
        
        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return events;
    }

    async loadSampleEvents() {
        return [
            {
                id: "event-001",
                name: "Salsa Social Night",
                date: "2025-02-07T20:00:00",
                end_date: "2025-02-07T23:30:00",
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
                end_date: "2025-02-15T17:00:00",
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
                end_date: "2025-02-17T01:00:00",
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

    async loadCongresses() {
        try {
            this.congresses = await this.loadCongressesFromDirectory();
        } catch (error) {
            console.error('Error loading congresses:', error);
            // Fallback to sample congresses if loading from files fails
            this.congresses = await this.loadSampleCongresses();
            this.showError('Using sample congresses. Congress files may not be available.');
        }
    }

    async loadCongressesFromDirectory() {
        const congresses = [];
        
        try {
            // Try to load congresses index file first (if it exists)
            const indexResponse = await fetch('data/congresses/index.json');
            if (indexResponse.ok) {
                const congressIndex = await indexResponse.json();
                for (const filename of congressIndex.files) {
                    try {
                        const response = await fetch(`data/congresses/${filename}`);
                        if (response.ok) {
                            const congressData = await response.json();
                            congresses.push(congressData);
                        }
                    } catch (error) {
                        console.warn(`Error loading congress ${filename}:`, error);
                    }
                }
            } else {
                // Fallback: try to load known congress files
                const congressFiles = [
                    'sandiego2025.json',
                    'labachata2025.json'
                ];
                
                for (const filename of congressFiles) {
                    try {
                        const response = await fetch(`data/congresses/${filename}`);
                        if (response.ok) {
                            const congressData = await response.json();
                            congresses.push(congressData);
                        } else {
                            console.warn(`Could not load ${filename}: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Error loading congress ${filename}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error accessing congresses directory:', error);
            throw error;
        }
        
        // Sort congresses by date
        congresses.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return congresses;
    }

    async loadSampleCongresses() {
        return [
            {
                id: "sandiego2025",
                name: "San Diego Salsa Congress 2025",
                date: "2025-08-15",
                end_date: "2025-08-18",
                location: "San Diego Convention Center, San Diego, CA",
                maps_link: "https://maps.google.com/?q=San+Diego+Convention+Center",
                description: "The biggest Latin dance event of the year in Southern California.",
                website: "https://sandiegosalsacongress.com",
                type: ["salsa", "bachata", "timba"],
                featured_artists: ["Adolfo Indacochea", "Karen & Ricardo"],
                price: "$299 Full Pass"
            },
            {
                id: "labachata2025",
                name: "LA Bachata Festival 2025",
                date: "2025-10-20",
                end_date: "2025-10-22",
                location: "Los Angeles Convention Center, Los Angeles, CA",
                maps_link: "https://maps.google.com/?q=Los+Angeles+Convention+Center",
                description: "Premier bachata festival with sensual and traditional workshops.",
                website: "https://labachatafestival.com",
                type: ["bachata"],
                featured_artists: ["Daniel & Desiree", "Corky & Judith"],
                price: "$249 Weekend Pass"
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

        const now = new Date();
        const featuredEvents = this.events
            .filter(event => event.featured || event.recurring)
            .filter(event => new Date(event.date) > now) // Only future events
            .slice(0, 3); // Show only first 3 featured events
        
        container.innerHTML = featuredEvents.map(event => `
            <div class="featured-event-card">
                ${event.recurring ? 
                    `<div class="featured-badge recurring-badge"><i class="fas fa-repeat"></i> Weekly</div>` : 
                    `<div class="featured-badge">Featured</div>`
                }
                <h3 class="event-title">${event.name}</h3>
                <div class="event-badges">
                    ${event.type.map(type => `<div class="event-type-badge ${type}">${type}</div>`).join('')}
                </div>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatEventTime(event.date, event.recurring, event.end_date)}</span>
                    </div>
                    <div class="event-meta-item location-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <a href="${event.maps_link}" target="_blank" class="location-link">
                            ${event.location}
                        </a>
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
                <div class="event-actions">
                    <button class="more-info-btn" onclick="app.showEventDetails('${event.id}')">
                        More Info
                    </button>
                    <a href="${event.maps_link}" target="_blank" class="directions-btn">
                        <i class="fas fa-directions"></i> Directions
                    </a>
                </div>
            </div>
        `).join('');
    }

    renderUpcomingEvents() {
        const container = document.getElementById('events-list');
        if (!container) return;

        const upcomingEvents = this.filteredEvents.slice(0, this.displayedEventCount);
        
        container.innerHTML = upcomingEvents.map(event => `
            <div class="featured-event-card">
                <h3 class="event-title">${event.name}</h3>
                <div class="event-badges">
                    ${event.type.map(type => `<div class="event-type-badge ${type}">${type}</div>`).join('')}
                </div>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatEventTime(event.date, event.recurring, event.end_date)}</span>
                    </div>
                    <div class="event-meta-item location-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <a href="${event.maps_link}" target="_blank" class="location-link">
                            ${event.location}
                        </a>
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
                <div class="event-actions">
                    <button class="more-info-btn" onclick="app.showEventDetails('${event.id}')">
                        More Info
                    </button>
                    <a href="${event.maps_link}" target="_blank" class="directions-btn">
                        <i class="fas fa-directions"></i> Directions
                    </a>
                </div>
            </div>
        `).join('');

        // Manage load more button visibility
        this.updateLoadMoreButton();
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
                dayDiv.addEventListener('click', () => this.showDayEvents(day, this.currentMonth, this.currentYear));
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

        // Reset displayed count when filters change
        this.displayedEventCount = this.eventsPerPage;

        this.renderUpcomingEvents();
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        }
    }

    loadMoreEvents() {
        // Increase the displayed event count
        this.displayedEventCount += this.eventsPerPage;
        
        // Re-render the events with the new count
        this.renderUpcomingEvents();
        
        // Add loading animation feedback
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            const originalText = loadMoreBtn.textContent;
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
            
            // Simulate loading delay for better UX
            setTimeout(() => {
                loadMoreBtn.textContent = originalText;
                loadMoreBtn.disabled = false;
            }, 500);
        }
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more');
        if (!loadMoreBtn) return;
        
        // Hide button if all events are displayed
        const hasMoreEvents = this.displayedEventCount < this.filteredEvents.length;
        loadMoreBtn.style.display = hasMoreEvents ? 'block' : 'none';
        
        // Update button text with remaining count
        if (hasMoreEvents) {
            const remainingEvents = this.filteredEvents.length - this.displayedEventCount;
            loadMoreBtn.textContent = `Load More Events (${remainingEvents} remaining)`;
        }
    }

    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const timeDisplay = this.formatEventTime(event.date, event.recurring, event.end_date);
        
        alert(`${event.name}\n\n${event.description}\n\nTime: ${timeDisplay}\nLocation: ${event.location}\nPrice: ${event.price}\nContact: ${event.contact || 'Not specified'}`);
    }

    showDayEvents(day, month, year) {
        // Get events for the specific day
        const dayEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === month && 
                   eventDate.getFullYear() === year;
        });

        if (dayEvents.length === 0) return;

        // Create modal-like container
        const modal = document.createElement('div');
        modal.className = 'day-events-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'day-events-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 16px;
            right: 20px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-light);
        `;
        closeBtn.addEventListener('click', () => modal.remove());

        const dateStr = new Date(year, month, day).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        modalContent.innerHTML = `
            <h3 style="margin-bottom: 20px; color: var(--text-color);">Events on ${dateStr}</h3>
            <div class="day-events-list">
                ${dayEvents.map(event => `
                    <div class="day-event-card" style="
                        background: var(--card-background);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 16px;
                    ">
                        <h4 style="margin-bottom: 8px; color: var(--text-color);">${event.name}</h4>
                        <div class="event-badges" style="margin-bottom: 12px;">
                            ${event.type.map(type => `<div class="event-type-badge ${type}">${type}</div>`).join('')}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-calendar" style="color: var(--text-light);"></i>
                                <span>${this.formatEventTime(event.date, event.recurring, event.end_date)}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-map-marker-alt" style="color: var(--text-light);"></i>
                                <a href="${event.maps_link}" target="_blank" class="location-link">${event.location}</a>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-dollar-sign" style="color: var(--text-light);"></i>
                                <span class="event-price">${event.price}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <button onclick="app.showEventDetails('${event.id}')" class="more-info-btn" style="flex: 1;">
                                More Info
                            </button>
                            <a href="${event.maps_link}" target="_blank" class="directions-btn" style="flex: 1;">
                                <i class="fas fa-directions"></i> Directions
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
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

    formatEventTime(dateString, recurring, endDateString) {
        const startDate = new Date(dateString);
        
        if (recurring) {
            const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
            const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            if (endDateString) {
                const endDate = new Date(endDateString);
                const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                return `Every ${dayName}, ${startTime} - ${endTime}`;
            }
            
            return `Every ${dayName}, ${startTime}`;
        }
        
        // For non-recurring events
        if (endDateString) {
            const endDate = new Date(endDateString);
            const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            // Check if the event spans multiple days
            const daysDifference = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Treat as same day if it's within 24 hours and ends before 6 AM next day
            const isSameEventDay = daysDifference < 1 && (startDate.toDateString() === endDate.toDateString() || endDate.getHours() < 6);
            
            if (!isSameEventDay) {
                // Multi-day event: show full date range
                const startDateStr = startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                const endDateStr = endDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                return `${startDateStr} ${startTime} - ${endDateStr} ${endTime}`;
            } else {
                // Same evening event: show date once, then time range
                const dateStr = startDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                return `${dateStr}, ${startTime} - ${endTime}`;
            }
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
        
        if (data.date && data.end_time) {
            data.end_date = `${data.date.split('T')[0]}T${data.end_time}:00`;
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

        container.innerHTML = this.congresses.map(congress => `
            <div class="congress-card">
                <h3>${congress.name}</h3>
                <div class="congress-meta">
                    <div class="congress-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatEventTime(congress.date, false, congress.end_date)}</span>
                    </div>
                    <div class="congress-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <a href="${congress.maps_link}" target="_blank" class="location-link">
                            ${congress.location}
                        </a>
                    </div>
                    <div class="congress-meta-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span class="event-price">${congress.price}</span>
                    </div>
                </div>
                <p>${congress.description}</p>
                <div class="congress-artists">
                    <h4>Featured Artists:</h4>
                    <div class="artist-list">
                        ${congress.featured_artists.map(artist => `<span class="artist-tag">${artist}</span>`).join('')}
                    </div>
                </div>
                <div class="congress-actions">
                    <a href="${congress.website}" target="_blank" class="congress-link">
                        <i class="fas fa-external-link-alt"></i> More Info & Registration
                    </a>
                    <a href="${congress.maps_link}" target="_blank" class="directions-btn">
                        <i class="fas fa-directions"></i> Directions
                    </a>
                </div>
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

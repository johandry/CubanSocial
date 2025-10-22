// Cuban Social - Modern Design Application JavaScript
import { supabase } from './supabaseClient.js';

class CubanSocialApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.congresses = [];
        this.playlists = [];
        this.currentView = 'list';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.displayedEventCount = 6; // Track how many events are currently displayed
        this.eventsPerPage = 6; // How many events to load at a time
        
        this.init();
    }

    // Analytics helper function
    trackEvent(eventName, parameters = {}) {
        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'Cuban Social',
                event_label: parameters.label || '',
                value: parameters.value || 0,
                ...parameters
            });
        }
        
        // Console log for debugging
        console.log(`Analytics: ${eventName}`, parameters);
    }

    async init() {
        console.log('App initialization started');
        this.trackEvent('app_initialized', { timestamp: new Date().toISOString() });
        
        try {
            await this.loadEvents();
            console.log(`Loaded ${this.events.length} events`);
            this.trackEvent('events_loaded', { count: this.events.length });
            
            await this.loadCongresses();
            console.log(`Loaded ${this.congresses.length} congresses`);
            this.trackEvent('congresses_loaded', { count: this.congresses.length });
            
            await this.loadPlaylists();
            console.log(`Loaded ${this.playlists.length} playlists`);
            this.trackEvent('playlists_loaded', { count: this.playlists.length });
            
            this.setupEventListeners();
            this.setupNavigation();
            
            console.log('About to render upcoming events');
            this.renderUpcomingEvents();
            console.log('Rendered upcoming events');
            
            // Load monthly cards for carousel
            await this.loadMonthlyCards();
            this.setupCarousel();
            
            // Initialize with Landing section active only if no section is currently visible
            const currentlyVisibleSection = document.querySelector('.section[style*="block"], .events-section[style*="block"], .landing-section[style*="block"]');
            if (!currentlyVisibleSection) {
                console.log('No section currently visible, showing Landing section');
                this.showSection('landing');
                this.setActiveNavLink('landing');
            } else {
                console.log('A section is already visible, skipping default landing section');
            }
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    async loadEvents() {
        try {
            // Try to load from API first
            try {
                this.events = await this.loadEventsFromAPI();
                console.log('Successfully loaded events from API');
            } catch (apiError) {
                console.warn('API failed, falling back to local data:', apiError.message);
                // Fallback to local data if API fails
                this.events = await this.loadEventsFromDirectory();
                console.log('Successfully loaded events from local directory');
            }
            
            // Apply filters instead of copying all events
            this.applyFilters();
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError(`Failed to load events: ${error.message}`);
            this.events = [];
            this.filteredEvents = [];
        }
    }

    async loadEventsFromAPI() {
        try {
            console.log('Loading events from Supabase API...');
            
            // Fetch approved events from Supabase
            const { data: events, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'approved')
                .order('date', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log(`Loaded ${events?.length || 0} approved events from API`);
            return events || [];
        } catch (error) {
            console.error('Error loading events from API:', error);
            throw error;
        }
    }

    async loadEventsFromDirectory() {
        const events = [];
        
        try {
            // Try to load events index file first (if it exists)
            const indexResponse = await fetch('data/eventos/index.json');
            if (indexResponse.ok) {
                const eventIndex = await indexResponse.json();
                for (const filename of eventIndex.files) {
                    try {
                        const response = await fetch(`data/eventos/${filename}`);
                        if (response.ok) {
                            const eventData = await response.json();
                            // Include events that are approved OR don't have status fields (legacy events)
                            if (eventData.status === 'approved' || !eventData.hasOwnProperty('status')) {
                                events.push(eventData);
                            }
                        }
                    } catch (error) {
                        console.warn(`Error loading ${filename}:`, error);
                    }
                }
            } else {
                // Fallback: try to load known event files
                const eventFiles = [
                    'event-250802.json',
                    'event-250808.json',
                    'event-250809.json',
                    'event-250816.json',
                    'event-250817.json',
                    'event-250823.json',
                    'event-250829.json',
                    'event-250906.json',
                    'event-250919.json',
                    'event-250920.json'
                ];
                
                for (const filename of eventFiles) {
                    try {
                        const response = await fetch(`data/eventos/${filename}`);
                        if (response.ok) {
                            const eventData = await response.json();
                            // Include events that are approved OR don't have status fields (legacy events)
                            if (eventData.status === 'approved' || !eventData.hasOwnProperty('status')) {
                                events.push(eventData);
                            }
                        } else {
                            console.warn(`Could not load ${filename}: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Error loading ${filename}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error accessing eventos directory:', error);
            throw error;
        }
        
        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return events;
    }

    async loadCongresses() {
        try {
            this.congresses = await this.loadCongressesFromDirectory();
        } catch (error) {
            console.error('Error loading congresses:', error);
            this.showError(`Failed to load congresses: ${error.message}`);
            this.congresses = [];
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

    async loadPlaylists() {
        try {
            this.playlists = await this.loadPlaylistsFromDirectory();
        } catch (error) {
            console.error('Error loading playlists:', error);
            this.showError(`Failed to load playlists: ${error.message}`);
            this.playlists = [];
        }
    }

    async loadPlaylistsFromDirectory() {
        const playlists = [];
        
        try {
            const indexResponse = await fetch('data/playlists/index.json');
            if (indexResponse.ok) {
                const index = await indexResponse.json();
                for (const filename of index.playlists) {
                    try {
                        const response = await fetch(`data/playlists/${filename}`);
                        if (response.ok) {
                            const playlist = await response.json();
                            playlists.push(playlist);
                        } else {
                            console.warn(`Could not load ${filename}: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Error loading playlist ${filename}:`, error);
                    }
                }
            } else {
                // If no index.json, try to load individual files
                const knownFiles = ['timba2025.json'];
                for (const filename of knownFiles) {
                    try {
                        const response = await fetch(`data/playlists/${filename}`);
                        if (response.ok) {
                            const playlist = await response.json();
                            playlists.push(playlist);
                        } else {
                            console.warn(`Could not load ${filename}: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`Error loading playlist ${filename}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error accessing playlists directory:', error);
            throw error;
        }
        
        return playlists;
    }

    setupNavigation() {
        // Navigation between sections
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = e.target.getAttribute('href').substring(1);
                this.showSection(targetSection);
                this.setActiveNavLink(targetSection);
                
                // Track navigation
                this.trackEvent('page_view', {
                    page_title: this.getSectionTitle(targetSection),
                    page_location: `${window.location.origin}/#${targetSection}`
                });
            });
        });
        
        // Logo navigation to landing page
        const logoLink = document.querySelector('.logo-link');
        if (logoLink) {
            logoLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('landing');
                this.setActiveNavLink('landing');
                
                // Track logo click
                this.trackEvent('logo_click', {
                    page_title: 'Landing Page',
                    page_location: `${window.location.origin}/#landing`
                });
            });
        }
    }

    getSectionTitle(sectionId) {
        const titles = {
            'landing': 'Cuban Social - Home',
            'events': 'Events',
            'congresses': 'Congresses', 
            'playlists': 'Playlists',
            'submit': 'Submit Event'
        };
        return titles[sectionId] || sectionId;
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
        console.log(`Showing section: ${sectionId}`);
        // Hide all sections
        document.querySelectorAll('.section, .events-section, .landing-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section and render appropriate content
        if (sectionId === 'landing') {
            console.log('Setting up Landing section');
            const landingSection = document.getElementById('landing');
            if (landingSection) {
                landingSection.style.display = 'block';
                console.log('Landing section display set to block');
            }
        } else if (sectionId === 'events') {
            console.log('Setting up Events section');
            const eventsSection = document.getElementById('events');
            const upcomingSection = document.querySelector('.upcoming-section');
            const filtersSection = document.querySelector('.filters-section');
            const calendarContainer = document.getElementById('calendar-container');
            
            if (eventsSection) {
                eventsSection.style.display = 'block';
                console.log('Events section display set to block');
            } else {
                console.error('Events section element not found!');
            }
            
            if (upcomingSection) {
                upcomingSection.style.display = 'block';
                console.log('Upcoming section display set to block');
            } else {
                console.error('Upcoming section element not found!');
            }
            
            if (filtersSection) {
                filtersSection.style.display = 'block';
                console.log('Filters section display set to block');
            } else {
                console.error('Filters section element not found!');
            }
            
            if (calendarContainer) {
                calendarContainer.style.display = this.currentView === 'calendar' ? 'block' : 'none';
                console.log(`Calendar container display set to ${this.currentView === 'calendar' ? 'block' : 'none'}`);
            } else {
                console.error('Calendar container element not found!');
            }
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
        document.getElementById('dance-filter')?.addEventListener('change', (e) => {
            this.trackEvent('filter_used', {
                filter_type: 'dance',
                filter_value: e.target.value
            });
            this.applyFilters();
        });
        document.getElementById('music-filter')?.addEventListener('change', (e) => {
            this.trackEvent('filter_used', {
                filter_type: 'music',
                filter_value: e.target.value
            });
            this.applyFilters();
        });
        document.getElementById('location-filter')?.addEventListener('input', (e) => {
            this.trackEvent('filter_used', {
                filter_type: 'location',
                filter_value: e.target.value ? 'text_entered' : 'cleared'
            });
            this.applyFilters();
        });
        document.getElementById('featured-filter')?.addEventListener('change', (e) => {
            this.trackEvent('filter_used', {
                filter_type: 'featured',
                filter_value: e.target.checked ? 'enabled' : 'disabled'
            });
            this.applyFilters();
        });
        document.getElementById('past-events-filter')?.addEventListener('change', (e) => {
            this.trackEvent('filter_used', {
                filter_type: 'past_events',
                filter_value: e.target.checked ? 'enabled' : 'disabled'
            });
            this.applyFilters();
        });

        // Load more button
        document.getElementById('load-more')?.addEventListener('click', () => this.loadMoreEvents());
        
        // Landing page CTA buttons
        document.querySelectorAll('.cta-primary, .cta-secondary').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = e.target.getAttribute('href').substring(1);
                this.showSection(targetSection);
                this.setActiveNavLink(targetSection);
                
                // Track CTA click
                this.trackEvent('cta_click', {
                    button_type: e.target.classList.contains('cta-primary') ? 'primary' : 'secondary',
                    target_section: targetSection
                });
            });
        });

        // Form submission
        document.getElementById('event-form')?.addEventListener('submit', (e) => this.handleFormSubmission(e));
        
        // Generate Google Maps link from Location
        const generateMapsBtn = document.getElementById('generate-maps-link');
        if (generateMapsBtn) {
            generateMapsBtn.addEventListener('click', () => {
                const locationField = document.getElementById('event-location');
                const mapsLinkField = document.getElementById('maps-link');
                
                if (locationField && mapsLinkField && locationField.value.trim()) {
                    const locationQuery = encodeURIComponent(locationField.value.trim());
                    const mapsUrl = `https://maps.google.com/?q=${locationQuery}`;
                    mapsLinkField.value = mapsUrl;
                } else if (!locationField.value.trim()) {
                    alert('Please enter a location first.');
                }
            });
        }

        // Open Google Maps link
        const openMapsBtn = document.getElementById('open-maps-link');
        if (openMapsBtn) {
            openMapsBtn.addEventListener('click', () => {
                const mapsLinkField = document.getElementById('maps-link');
                
                if (mapsLinkField && mapsLinkField.value.trim()) {
                    window.open(mapsLinkField.value.trim(), '_blank');
                } else {
                    alert('Please generate or enter a Google Maps link first.');
                }
            });
        }
        
        // Recurring event checkbox toggle
        const recurringCheckbox = document.getElementById('recurring-event');
        const recurringOptions = document.getElementById('recurring-options');
        
        if (recurringCheckbox && recurringOptions) {
            recurringCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    recurringOptions.style.display = 'block';
                } else {
                    recurringOptions.style.display = 'none';
                    // Reset the frequency selection when unchecked
                    const frequencySelect = document.getElementById('recurring-frequency');
                    if (frequencySelect) {
                        frequencySelect.value = '';
                    }
                }
            });
        }
        
        // Track external link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const url = link.href;
                
                // Track external links
                if (url.startsWith('http') && !url.includes(window.location.hostname)) {
                    this.trackEvent('external_link_clicked', {
                        link_url: url,
                        link_text: link.textContent || 'No text',
                        link_type: this.getLinkType(url)
                    });
                }
                
                // Track specific internal actions
                if (url.includes('mailto:')) {
                    this.trackEvent('contact_clicked', {
                        contact_type: 'email',
                        contact_value: url.replace('mailto:', '')
                    });
                }
                
                if (url.includes('maps.google.com') || url.includes('maps.app.goo.gl')) {
                    this.trackEvent('maps_link_clicked', {
                        link_url: url
                    });
                }
            }
        });
    }
    
    getLinkType(url) {
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('facebook.com')) return 'facebook';
        if (url.includes('spotify.com')) return 'spotify';
        if (url.includes('youtube.com')) return 'youtube';
        if (url.includes('maps.google.com') || url.includes('maps.app.goo.gl')) return 'maps';
        if (url.includes('mailto:')) return 'email';
        return 'other';
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

        // Get current time in PST/PDT for filtering
        const nowPST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const featuredEvents = this.events
            .filter(event => event.featured || event.recurring)
            .filter(event => {
                const eventDateUTC = new Date(event.date);
                const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                return eventDatePST > nowPST; // Only future events in PST/PDT
            })
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
                    ${event.payment_link ? `<a href="${event.payment_link}" target="_blank" class="payment-btn">
                        <i class="fas fa-credit-card"></i> Buy Tickets
                    </a>` : ''}
                    <a href="${event.maps_link}" target="_blank" class="directions-btn">
                        <i class="fas fa-directions"></i> Directions
                    </a>
                </div>
                ${event.event_url ? `<div class="event-actions-secondary">
                    <a href="${event.event_url}" target="_blank" class="event-url-btn-full">
                        <i class="fas fa-external-link-alt"></i> ${event.event_url_text || 'Official Event Page'}
                    </a>
                </div>` : ''}
            </div>
        `).join('');
    }

    renderUpcomingEvents() {
        console.log('renderUpcomingEvents called');
        const container = document.getElementById('events-list');
        if (!container) {
            console.error('Events list container not found!');
            return;
        }

        const upcomingEvents = this.filteredEvents.slice(0, this.displayedEventCount);
        console.log(`Rendering ${upcomingEvents.length} upcoming events out of ${this.filteredEvents.length} filtered events`);
        
        if (upcomingEvents.length === 0) {
            container.innerHTML = `
                <div class="no-events-message">
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 16px; color: var(--text-light);"></i>
                        <h3 style="margin-bottom: 8px; color: var(--text-color);">No Events Available</h3>
                        <p>No events are currently loaded. Please check back later or contact us if you believe this is an error.</p>
                    </div>
                </div>
            `;
            this.updateLoadMoreButton();
            return;
        }
        
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
                    ${event.payment_link ? `<a href="${event.payment_link}" target="_blank" class="payment-btn">
                        <i class="fas fa-credit-card"></i> Buy Tickets
                    </a>` : ''}
                    <a href="${event.maps_link}" target="_blank" class="directions-btn">
                        <i class="fas fa-directions"></i> Directions
                    </a>
                </div>
                ${event.event_url ? `<div class="event-actions-secondary">
                    <a href="${event.event_url}" target="_blank" class="event-url-btn-full">
                        <i class="fas fa-external-link-alt"></i> ${event.event_url_text || 'Official Event Page'}
                    </a>
                </div>` : ''}
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

            // Check if there are events on this day - convert UTC dates to PST/PDT for comparison
            const dayEvents = this.filteredEvents.filter(event => {
                const eventDateUTC = new Date(event.date);
                const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                return eventDatePST.getDate() === day && 
                       eventDatePST.getMonth() === this.currentMonth && 
                       eventDatePST.getFullYear() === this.currentYear;
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
        const featuredFilter = document.getElementById('featured-filter')?.checked || false;
        const showPastEvents = document.getElementById('past-events-filter')?.checked || false;
        
        const now = new Date();
        
        // Get current PST/PDT time for comparison
        const nowPST = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const todayPST = new Date(nowPST.getFullYear(), nowPST.getMonth(), nowPST.getDate());

        this.filteredEvents = this.events.filter(event => {
            // Parse UTC date from database
            const eventDateUTC = new Date(event.date);
            // Convert to PST/PDT for comparison
            const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            const eventDayPST = new Date(eventDatePST.getFullYear(), eventDatePST.getMonth(), eventDatePST.getDate());
            
            const matchesDance = !danceFilter || event.type.includes(danceFilter);
            const matchesMusic = !musicFilter || event.music === musicFilter;
            const matchesLocation = !locationFilter || (event.location || '').toLowerCase().includes(locationFilter);
            const matchesFeatured = !featuredFilter || event.featured || event.recurring;
            
            // Time filter logic using PST/PDT times:
            // - If showPastEvents is true: show all events
            // - If showPastEvents is false: show future events OR events happening today in PST/PDT
            let matchesTimeFilter;
            if (showPastEvents) {
                matchesTimeFilter = true; // Show all events
            } else {
                // Show events that are:
                // 1. In the future (eventDatePST > nowPST)
                // 2. Happening today (eventDayPST equals todayPST)
                matchesTimeFilter = eventDatePST > nowPST || eventDayPST.getTime() === todayPST.getTime();
            }
            
            return matchesDance && matchesMusic && matchesLocation && matchesFeatured && matchesTimeFilter;
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
        // Get events for the specific day - convert UTC to PST/PDT for comparison
        const dayEvents = this.filteredEvents.filter(event => {
            const eventDateUTC = new Date(event.date);
            const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            return eventDatePST.getDate() === day && 
                   eventDatePST.getMonth() === month && 
                   eventDatePST.getFullYear() === year;
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
                        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                            <button onclick="app.showEventDetails('${event.id}')" class="more-info-btn" style="flex: 1; min-width: 100px;">
                                More Info
                            </button>
                            ${event.payment_link ? `<a href="${event.payment_link}" target="_blank" class="payment-btn" style="flex: 1; min-width: 100px;">
                                <i class="fas fa-credit-card"></i> Buy Tickets
                            </a>` : ''}
                            <a href="${event.maps_link}" target="_blank" class="directions-btn" style="flex: 1; min-width: 100px;">
                                <i class="fas fa-directions"></i> Directions
                            </a>
                        </div>
                        ${event.event_url ? `<div style="margin-top: 8px;">
                            <a href="${event.event_url}" target="_blank" class="event-url-btn-full" style="width: 100%; display: block; text-align: center;">
                                <i class="fas fa-external-link-alt"></i> ${event.event_url_text || 'Official Event Page'}
                            </a>
                        </div>` : ''}
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

    parseFormData(formData) {
        const data = {};
        
        // First, collect all form fields
        for (const [key, value] of formData.entries()) {
            if (key === 'type') {
                if (!data.type) data.type = [];
                data.type.push(value);
            } else if (value.trim() !== '') {  // Skip empty fields
                data[key] = value;
            }
        }
        
        // Format date and time fields - convert PST/PDT to UTC for storage
        if (data.date && data.time) {
            // Create date in PST/PDT timezone and convert to UTC
            const localDateTime = `${data.date}T${data.time}:00`;
            const localDate = new Date(localDateTime);
            
            // Convert to UTC for database storage
            data.date = localDate.toISOString();
        }
        
        if (data.date && data.end_time) {
            // Use the same date for end time, convert to UTC
            const localEndDateTime = `${data.date.split('T')[0]}T${data.end_time}:00`;
            const localEndDate = new Date(localEndDateTime);
            data.end_date = localEndDate.toISOString();
        }
        
        // Handle confirmation email checkbox
        data.send_confirmation = formData.get('send_confirmation') === 'on';
        
        // Handle recurring event checkbox
        data.recurring = formData.get('recurring') === 'on';
        if (data.recurring && data.recurring_frequency) {
            data.recurring = data.recurring_frequency;
        } else if (!data.recurring) {
            // Remove recurring_frequency if recurring is not checked
            delete data.recurring_frequency;
        }
        
        // Store submitter information for database
        data.submitter_name = data.requestor_name;
        data.submitter_email = data.requestor_contact;
        
        // Generate proper date-based ID like existing events (event-YYMMDD format)
        data.id = this.generateEventId(data.date);
        data.created_at = new Date().toISOString();
        data.status = 'pending';  // Mark as pending for admin review
        
        return data;
    }

    // Add this new method to generate proper event IDs
    generateEventId(dateString) {
        try {
            if (!dateString) {
                console.warn('No date provided for ID generation, using timestamp fallback');
                return 'event-' + Date.now();
            }
            
            // Parse UTC date and convert to PST/PDT for ID generation
            const eventDate = new Date(dateString);
            if (isNaN(eventDate.getTime())) {
                console.warn('Invalid date provided for ID generation, using timestamp fallback');
                return 'event-' + Date.now();
            }
            
            // Convert to PST/PDT for consistent ID generation
            const pstDate = new Date(eventDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            
            // Format as YYMMDD (2-digit year, 2-digit month, 2-digit day)
            const year = pstDate.getFullYear().toString().slice(-2);
            const month = (pstDate.getMonth() + 1).toString().padStart(2, '0');
            const day = pstDate.getDate().toString().padStart(2, '0');
            
            const baseId = `event-${year}${month}${day}`;
            
            // Check if this ID already exists in our events array
            // If it does, append a counter to make it unique
            let finalId = baseId;
            let counter = 1;
            
            while (this.events.some(event => event.id === finalId)) {
                finalId = `${baseId}-${counter}`;
                counter++;
            }
            
            console.log(`Generated event ID: ${finalId} for date: ${dateString}`);
            return finalId;
            
        } catch (error) {
            console.error('Error generating event ID:', error);
            return 'event-' + Date.now();
        }
    }

    async createRequest(eventData) {
        // Supabase implementation
        console.log('Submitting event request to Supabase:', eventData);

        // Create loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.style.cssText = `
            text-align: center;
            margin: 20px 0;
        `;
        loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting your event...';

        const form = document.getElementById('event-form');
        if (form) {
            form.appendChild(loadingDiv);
        }

        try {
            // Prepare event data for Supabase
            const supabaseEvent = {
                id: eventData.id,
                name: eventData.name,
                date: eventData.date,
                end_date: eventData.end_date || null,
                location: eventData.location,
                maps_link: eventData.maps_link,
                type: eventData.type,
                music: eventData.music,
                price: eventData.price,
                description: eventData.description,
                contact: eventData.contact,
                submitter_name: eventData.submitter_name,
                submitter_email: eventData.submitter_email,
                status: 'pending',
                featured: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Insert into Supabase
            const { data, error } = await supabase.from('events').insert([supabaseEvent]);
            if (error) {
                // Check if it's a duplicate key error
                if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
                    throw new Error('DUPLICATE_EVENT_DATE');
                }
                throw new Error('Supabase error: ' + error.message);
            }

            // Log the requestor information
            if (eventData.submitter_name && eventData.submitter_email) {
                console.log(`Event submission from: ${eventData.submitter_name} (${eventData.submitter_email})`);
            }

            // Generate request number for confirmation
            const requestNumber = Math.floor(Math.random() * 1000) + 1;
            console.log('Event submitted successfully to Supabase:', requestNumber);

            // Remove loading indicator
            loadingDiv.remove();

            return {
                success: true,
                request_number: requestNumber,
                message: 'Submission received'
            };
        } catch (error) {
            console.error('Submission error:', error);
            // Remove loading indicator in case of error
            loadingDiv.remove();
            
            // Check if it's a duplicate date error
            if (error.message === 'DUPLICATE_EVENT_DATE') {
                const duplicateError = new Error('There is already an event scheduled for this date. Please contact the administrator to resolve this issue.');
                duplicateError.isDuplicateDate = true;
                throw duplicateError;
            }
            
            throw error;
        }
    }

    showSuccessMessage(requestNumber) {
        const eventForm = document.getElementById('event-form');
        const requestorName = eventForm ? new FormData(eventForm).get('requestor_name') : '';
        const greeting = requestorName ? `Thank you, ${requestorName}!` : 'Thank you!';
        
        // Hide the form temporarily to show the success page
        const formContainer = document.querySelector('.submit-section .container');
        const originalContent = formContainer.innerHTML;
        
        // Create a full success page
        formContainer.innerHTML = `
            <div class="success-page" style="
                text-align: center;
                padding: 40px 20px;
                max-width: 600px;
                margin: 0 auto;
            ">
                <div class="success-icon" style="
                    width: 80px;
                    height: 80px;
                    background-color: #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    animation: successPulse 2s ease-in-out;
                ">
                    <i class="fas fa-check" style="
                        color: white;
                        font-size: 40px;
                    "></i>
                </div>
                
                <h2 style="
                    color: #059669;
                    margin-bottom: 16px;
                    font-size: 28px;
                ">Event Submitted Successfully!</h2>
                
                <div class="success-content" style="
                    background: #f0fdf4;
                    border: 2px solid #bbf7d0;
                    border-radius: 12px;
                    padding: 32px;
                    margin: 24px 0;
                    text-align: left;
                ">
                    <h3 style="
                        color: #065f46;
                        margin-bottom: 16px;
                        text-align: center;
                    ">${greeting}</h3>
                    
                    <div style="
                        display: grid;
                        gap: 12px;
                        margin-bottom: 20px;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        ">
                            <i class="fas fa-clipboard-check" style="color: #059669; font-size: 18px;"></i>
                            <span>Your event submission has been received and is under review</span>
                        </div>
                        
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        ">
                            <i class="fas fa-hashtag" style="color: #059669; font-size: 18px;"></i>
                            <span>Reference Number: <strong>#${requestNumber}</strong></span>
                        </div>
                        
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        ">
                            <i class="fas fa-user-check" style="color: #059669; font-size: 18px;"></i>
                            <span>Our administrators will review your submission within 24-48 hours</span>
                        </div>
                        
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        ">
                            <i class="fas fa-bell" style="color: #059669; font-size: 18px;"></i>
                            <span>You'll receive a notification once your event is approved</span>
                        </div>
                    </div>
                    
                    <div style="
                        background: #ecfdf5;
                        border-left: 4px solid #10b981;
                        padding: 16px;
                        margin: 20px 0;
                        border-radius: 4px;
                    ">
                        <h4 style="
                            color: #065f46;
                            margin-bottom: 8px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-info-circle"></i>
                            What happens next?
                        </h4>
                        <ol style="
                            margin: 0;
                            padding-left: 20px;
                            color: #064e3b;
                        ">
                            <li>Our team reviews your event details for accuracy and completeness</li>
                            <li>We verify the event information and location</li>
                            <li>Once approved, your event will be published on the Cuban Social website</li>
                            <li>You'll receive a confirmation email with the live event link</li>
                        </ol>
                    </div>
                </div>
                
                <div style="
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 32px;
                ">
                    <button onclick="app.returnToForm()" style="
                        background-color: #3b82f6;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
                        <i class="fas fa-plus"></i>
                        Submit Another Event
                    </button>
                    
                    <button onclick="app.showSection('events'); app.setActiveNavLink('events')" style="
                        background-color: #6b7280;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    " onmouseover="this.style.backgroundColor='#4b5563'" onmouseout="this.style.backgroundColor='#6b7280'">
                        <i class="fas fa-home"></i>
                        Return to Events
                    </button>
                </div>
                
                <div style="
                    margin-top: 32px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                    text-align: center;
                ">
                    <p style="
                        color: #64748b;
                        margin: 0 0 12px 0;
                        font-size: 14px;
                    ">Questions about your submission?</p>
                    <div style="
                        display: flex;
                        gap: 20px;
                        justify-content: center;
                        flex-wrap: wrap;
                    ">
                        <a href="mailto:cubansocial.sd@gmail.com" style="
                            color: #3b82f6;
                            text-decoration: none;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 14px;
                        ">
                            <i class="fas fa-envelope"></i>
                            cubansocial.sd@gmail.com
                        </a>
                        <a href="https://www.instagram.com/cubansocial.sd/" target="_blank" style="
                            color: #3b82f6;
                            text-decoration: none;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 14px;
                        ">
                            <i class="fab fa-instagram"></i>
                            @CubanSocial.SD
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS animation for the success icon
        const style = document.createElement('style');
        style.textContent = `
            @keyframes successPulse {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Store the original content for restoration
        formContainer.setAttribute('data-original-content', originalContent);
        
        // Scroll to top of the success message
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    returnToForm() {
        const formContainer = document.querySelector('.submit-section .container');
        const originalContent = formContainer.getAttribute('data-original-content');
        
        if (originalContent) {
            // Restore the original form content
            formContainer.innerHTML = originalContent;
            formContainer.removeAttribute('data-original-content');
            
            // Re-setup event listeners for the restored form
            this.setupEventListeners();
            
            // Scroll to the form
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showError(message) {
        console.error(message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background-color: #ef4444;
            color: white;
            padding: 16px;
            border-radius: 8px;
            margin: 16px auto;
            text-align: center;
            max-width: 600px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        errorDiv.innerHTML = `
            <h4><i class="fas fa-exclamation-circle"></i> Error</h4>
            <p>${message}</p>
        `;
        
        // Try to find a good place to show the error
        const form = document.getElementById('event-form');
        const eventsContainer = document.getElementById('events-list');
        const mainContent = document.querySelector('main');
        
        if (form && message.includes('submit')) {
            // Form-related errors
            form.parentNode.insertBefore(errorDiv, form);
            errorDiv.scrollIntoView({ behavior: 'smooth' });
        } else if (eventsContainer && (message.includes('events') || message.includes('loading'))) {
            // Events loading errors
            eventsContainer.appendChild(errorDiv);
        } else if (mainContent) {
            // General errors - show at top of main content
            mainContent.insertBefore(errorDiv, mainContent.firstChild);
            errorDiv.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Remove the error after 10 seconds for loading errors, 5 seconds for form errors
        const timeout = message.includes('submit') ? 5000 : 10000;
        setTimeout(() => errorDiv.remove(), timeout);
    }

    renderCongresses() {
        const container = document.getElementById('congress-list');
        if (!container) return;

        if (this.congresses.length === 0) {
            container.innerHTML = `
                <div class="no-congresses-message">
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-graduation-cap" style="font-size: 48px; margin-bottom: 16px; color: var(--text-light);"></i>
                        <h3 style="margin-bottom: 8px; color: var(--text-color);">No Congresses Available</h3>
                        <p>No congresses are currently loaded. Please check back later or contact us if you believe this is an error.</p>
                    </div>
                </div>
            `;
            return;
        }

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
                </div>
            </div>
        `).join('');
    }

    isValidEmail(email) {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    renderPlaylists() {
        const container = document.getElementById('playlist-grid');
        if (!container) return;

        if (this.playlists.length === 0) {
            container.innerHTML = `
                <div class="no-playlists-message">
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-music" style="font-size: 48px; margin-bottom: 16px; color: var(--text-light);"></i>
                        <h3 style="margin-bottom: 8px; color: var(--text-color);">No Playlists Available</h3>
                        <p>No playlists are currently loaded. Please check back later or contact us if you believe this is an error.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.playlists.map(playlist => {
            // Use provided track count and duration, or defaults
            const trackCount = playlist.track_count || 0;
            const duration = playlist.duration || 'Unknown';
            
            // Get emoji based on tags or use default
            let cover = '🎵';
            if (playlist.tags) {
                if (playlist.tags.includes('timba')) cover = '🔥';
                else if (playlist.tags.includes('bachata')) cover = '💕';
                else if (playlist.tags.includes('rueda')) cover = '💃';
                else if (playlist.tags.includes('salsa')) cover = '🎵';
            }

            // Detect platform from URL and set appropriate icon and label
            let platformIcon = 'fas fa-music';
            let platformName = 'Listen';
            
            if (playlist.playlist_url) {
                if (playlist.playlist_url.includes('spotify.com')) {
                    platformIcon = 'fab fa-spotify';
                    platformName = 'Spotify';
                } else if (playlist.playlist_url.includes('music.youtube.com') || playlist.playlist_url.includes('youtube.com')) {
                    platformIcon = 'fab fa-youtube';
                    platformName = 'YouTube Music';
                } else if (playlist.playlist_url.includes('music.apple.com')) {
                    platformIcon = 'fab fa-apple';
                    platformName = 'Apple Music';
                } else if (playlist.playlist_url.includes('amazon.com') || playlist.playlist_url.includes('music.amazon')) {
                    platformIcon = 'fab fa-amazon';
                    platformName = 'Amazon Music';
                } else if (playlist.playlist_url.includes('deezer.com')) {
                    platformIcon = 'fas fa-music';
                    platformName = 'Deezer';
                } else if (playlist.playlist_url.includes('tidal.com')) {
                    platformIcon = 'fas fa-music';
                    platformName = 'Tidal';
                }
            }

            return `
                <div class="playlist-card">
                    <div class="playlist-cover">
                        <span class="playlist-emoji">${cover}</span>
                    </div>
                    <div class="playlist-info">
                        <h3>${playlist.name}</h3>
                        <div class="event-badges">
                            ${playlist.tags.map(tag => `<div class="event-type-badge ${tag}">${tag}</div>`).join('')}
                        </div>
                        <p>${playlist.description}</p>
                        <div class="playlist-stats">
                            <span><i class="fas fa-music"></i> ${trackCount} tracks</span>
                            <span><i class="fas fa-clock"></i> ${duration}</span>
                        </div>
                        ${playlist.playlist_url ? `<a href="${playlist.playlist_url}" target="_blank" class="playlist-link">
                            <i class="${platformIcon}"></i> Listen on ${platformName}
                        </a>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadMonthlyCards() {
        try {
            // Generate list of available card files based on current date
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // 1-based month
            const currentYear = currentDate.getFullYear();
            
            this.monthlyCards = [];
            
            // Start from current month and add next few months
            for (let i = 0; i < 6; i++) {
                const month = ((currentMonth - 1 + i) % 12) + 1;
                const year = currentYear + Math.floor((currentMonth - 1 + i) / 12);
                const filename = `events-${year}-${month.toString().padStart(2, '0')}.png`;
                const cardPath = `data/cards/${filename}`;
                
                // Check if file exists by attempting to load it
                try {
                    const response = await fetch(cardPath, { method: 'HEAD' });
                    if (response.ok) {
                        const monthNames = [
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        
                        this.monthlyCards.push({
                            path: cardPath,
                            month: monthNames[month - 1],
                            year: year,
                            filename: filename
                        });
                    }
                } catch (error) {
                    console.log(`Card not found: ${filename}`);
                }
            }
            
            console.log(`Loaded ${this.monthlyCards.length} monthly cards`);
        } catch (error) {
            console.error('Error loading monthly cards:', error);
            this.monthlyCards = [];
        }
    }

    setupCarousel() {
        const track = document.getElementById('carousel-track');
        const indicators = document.getElementById('carousel-indicators');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        
        if (!track || this.monthlyCards.length === 0) {
            console.log('No carousel track found or no cards to display');
            return;
        }
        
        this.currentSlide = 0;
        
        // Populate carousel with cards
        track.innerHTML = this.monthlyCards.map(card => `
            <div class="carousel-slide">
                <img src="${card.path}" 
                     alt="${card.month} ${card.year} Events" 
                     onclick="app.downloadCard('${card.path}', '${card.filename}')"
                     title="Click to download ${card.month} ${card.year} events card">
            </div>
        `).join('');
        
        // Populate indicators
        indicators.innerHTML = this.monthlyCards.map((_, index) => `
            <div class="indicator ${index === 0 ? 'active' : ''}" 
                 onclick="app.goToSlide(${index})"></div>
        `).join('');
        
        // Setup navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Auto-play carousel
        this.startAutoPlay();
    }

    goToSlide(index) {
        if (index < 0 || index >= this.monthlyCards.length) return;
        
        this.currentSlide = index;
        const track = document.getElementById('carousel-track');
        const indicators = document.querySelectorAll('.indicator');
        
        if (track) {
            track.style.transform = `translateX(-${index * 100}%)`;
        }
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.monthlyCards.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.monthlyCards.length) % this.monthlyCards.length;
        this.goToSlide(prevIndex);
    }

    startAutoPlay() {
        // Auto-advance every 8 seconds
        setInterval(() => {
            if (this.monthlyCards.length > 1) {
                this.nextSlide();
            }
        }, 8000);
    }

    downloadCard(cardPath, filename) {
        // Track download event
        this.trackEvent('card_download', {
            card_name: filename,
            download_method: 'click'
        });
        
        // Create download link
        const link = document.createElement('a');
        link.href = cardPath;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';
        
        try {
            // Parse as UTC date from database
            const utcDate = new Date(dateString);
            
            // Convert to PST/PDT for display
            return utcDate.toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    }

    formatEventTime(dateString, recurring, endDateString) {
        if (!dateString) return 'No date';
        
        try {
            // Parse UTC dates from database
            const startDateUTC = new Date(dateString);
            const startDatePST = new Date(startDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            
            if (recurring) {
                const dayName = startDatePST.toLocaleDateString('en-US', { 
                    timeZone: 'America/Los_Angeles',
                    weekday: 'long' 
                });
                const startTime = startDatePST.toLocaleTimeString('en-US', { 
                    timeZone: 'America/Los_Angeles',
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                });
                
                if (endDateString) {
                    const endDateUTC = new Date(endDateString);
                    const endDatePST = new Date(endDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                    const endTime = endDatePST.toLocaleTimeString('en-US', { 
                        timeZone: 'America/Los_Angeles',
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                    });
                    return `Every ${dayName}, ${startTime} - ${endTime}`;
                }
                
                return `Every ${dayName}, ${startTime}`;
            }
            
            // For non-recurring events
            if (endDateString) {
                const endDateUTC = new Date(endDateString);
                const endDatePST = new Date(endDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                
                const startTime = startDatePST.toLocaleTimeString('en-US', { 
                    timeZone: 'America/Los_Angeles',
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                });
                const endTime = endDatePST.toLocaleTimeString('en-US', { 
                    timeZone: 'America/Los_Angeles',
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                });
                
                // Check if the event spans multiple days in PST/PDT
                const daysDifference = Math.abs(endDatePST.getTime() - startDatePST.getTime()) / (1000 * 60 * 60 * 24);
                
                // Treat as same day if it's within 24 hours and ends before 6 AM next day
                const isSameEventDay = daysDifference < 1 && (startDatePST.toDateString() === endDatePST.toDateString() || endDatePST.getHours() < 6);
                
                if (!isSameEventDay) {
                    // Multi-day event: show full date range in PST/PDT
                    const startDateStr = startDatePST.toLocaleDateString('en-US', {
                        timeZone: 'America/Los_Angeles',
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                    const endDateStr = endDatePST.toLocaleDateString('en-US', {
                        timeZone: 'America/Los_Angeles',
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                    return `${startDateStr} ${startTime} - ${endDateStr} ${endTime}`;
                } else {
                    // Same evening event: show date once, then time range in PST/PDT
                    const dateStr = startDatePST.toLocaleDateString('en-US', {
                        timeZone: 'America/Los_Angeles',
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    return `${dateStr}, ${startTime} - ${endTime}`;
                }
            }
            
            return this.formatDate(dateString);
        } catch (error) {
            console.error('Error formatting event time:', error);
            return 'Invalid date';
        }
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        console.log('Form submission started');
        
        try {
            const form = e.target;
            const formData = new FormData(form);
            
            // Validate required fields
            const requiredFields = ['name', 'date', 'time', 'location', 'maps_link', 'requestor_name', 'requestor_contact'];
            const missingFields = [];
            
            for (const field of requiredFields) {
                if (!formData.get(field)) {
                    missingFields.push(field);
                }
            }
            
            // Additional validation for requestor name and contact
            const contactInfo = formData.get('requestor_contact');
            if (contactInfo && contactInfo.trim().length < 5) {
                this.showError('Please provide a valid contact method (email, phone number, or social media handle)');
                return;
            }
            
            // Check if contact is an email and if it's valid
            if (contactInfo && contactInfo.includes('@')) {
                if (!this.isValidEmail(contactInfo)) {
                    this.showError('Please provide a valid email address');
                    return;
                }
            }
            
            // Check if at least one dance type is selected
            const danceTypes = formData.getAll('type');
            if (danceTypes.length === 0) {
                missingFields.push('dance type');
            }
            
            if (missingFields.length > 0) {
                this.showError(`Please fill out all required fields: ${missingFields.join(', ')}`);
                return;
            }
            
            const eventData = this.parseFormData(formData);
            console.log('Parsed event data:', eventData);
            
            // Submit the event and get the response
            const response = await this.createRequest(eventData);
            
            // Track successful event submission
            this.trackEvent('event_submitted', {
                event_name: eventData.name || 'Unknown Event',
                event_date: eventData.date || 'Unknown Date',
                event_type: Array.isArray(eventData.type) ? eventData.type.join(', ') : eventData.type || 'Unknown Type',
                request_number: response.request_number
            });
            
            this.showSuccessMessage(response.request_number);
            form.reset();
            
        } catch (error) {
            console.error('Error submitting event:', error);
            
            // Check if it's a duplicate date error
            if (error.isDuplicateDate) {
                this.showError(error.message);
            } else {
                this.showError('Failed to submit event. Please try again.');
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CubanSocialApp();
});

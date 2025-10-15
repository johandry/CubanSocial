import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
const authSection = document.getElementById('auth-section');
const crudSection = document.getElementById('crud-section');
const eventsList = document.getElementById('events-list');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const statusFilter = document.getElementById('status-filter');
const dateFilter = document.getElementById('date-filter');
const eventCount = document.getElementById('event-count');
const cleanupBtn = document.getElementById('cleanup-old-events');

let allEvents = []; // Store all events for filtering

// Filter change events
statusFilter?.addEventListener('change', () => {
    renderFilteredEvents();
});

dateFilter?.addEventListener('change', () => {
    renderFilteredEvents();
});

// Cleanup old events button
cleanupBtn?.addEventListener('click', () => {
    showCleanupConfirmation();
});

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, checking session...');
    console.log('Elements found:', {
        loginForm: !!loginForm,
        authSection: !!authSection,
        crudSection: !!crudSection,
        eventsList: !!eventsList
    });
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check result:', session ? 'Session found' : 'No session');
        
        if (session) {
            console.log('User is already logged in, showing admin interface');
            // User is already logged in
            authSection.style.display = 'none';
            crudSection.style.display = 'block';
            loadEvents();
        } else {
            console.log('No session found, showing login form');
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
    
    if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, showing admin interface');
        authSection.style.display = 'none';
        crudSection.style.display = 'block';
        loadEvents();
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, showing login form');
        crudSection.style.display = 'none';
        authSection.style.display = 'block';
        eventsList.innerHTML = '';
    }
});

// Admin login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginError.style.display = 'none';
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
        return;
    }
    // Auth state change will handle UI updates
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    // Auth state change will handle UI updates
});

// Load all events (approved and non-approved)
async function loadEvents() {
    console.log('loadEvents function called');
    eventsList.innerHTML = '<p>Loading events...</p>';
    
    try {
        // First, test if Supabase connection works
        console.log('Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase.from('events').select('count', { count: 'exact' });
        console.log('Connection test result:', { testData, testError });
        
        console.log('Making Supabase query...');
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
        
        console.log('Supabase response:', { data, error });
        
        if (error) {
            console.error('Supabase error:', error);
            eventsList.innerHTML = `<div class="error-message">Database error: ${error.message}<br><small>Check browser console for details</small></div>`;
            return;
        }
        
        console.log('Number of events returned:', data ? data.length : 0);
        
        if (!data || data.length === 0) {
            console.log('No events found in database');
            eventsList.innerHTML = '<p>No events found in database.</p>';
            updateEventCount(0, 0, 0);
            return;
        }
        
        console.log('Events data:', data);
        
        // Store all events for filtering
        allEvents = data;
        
        // Render filtered events
        renderFilteredEvents();
        
        console.log('Events rendered successfully');
        
    } catch (error) {
        console.error('Error in loadEvents:', error);
        eventsList.innerHTML = `<div class="error-message">Error loading events: ${error.message}</div>`;
    }
}

// Render events based on current filter
function renderFilteredEvents() {
    if (!allEvents || allEvents.length === 0) {
        eventsList.innerHTML = '<p>No events found.</p>';
        updateEventCount(0, 0, 0);
        return;
    }
    
    const statusFilterChecked = statusFilter?.checked || false;
    const dateFilterChecked = dateFilter?.checked || false;
    let filteredEvents = allEvents;
    
    // Apply status filter (checked = show pending only, unchecked = show all)
    if (statusFilterChecked) {
        filteredEvents = filteredEvents.filter(event => event.status !== 'approved');
    }
    
    // Apply date filter (checked = show future only, unchecked = show all)
    if (dateFilterChecked) {
        const nowPST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        filteredEvents = filteredEvents.filter(event => {
            if (!event.date) return false;
            const eventDateUTC = new Date(event.date);
            const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            return eventDatePST > nowPST;
        });
    }
    
    // Sort filtered events by date (newest first, but events without dates go to the end)
    filteredEvents.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
    });
    
    console.log(`Showing ${filteredEvents.length} events (pending only: ${statusFilterChecked}, future only: ${dateFilterChecked})`);
    
    // Update count display
    const pendingCount = allEvents.filter(event => event.status !== 'approved').length;
    const approvedCount = allEvents.filter(event => event.status === 'approved').length;
    updateEventCount(allEvents.length, pendingCount, approvedCount);
    
    if (filteredEvents.length === 0) {
        let filterDescription = '';
        if (statusFilterChecked && dateFilterChecked) {
            filterDescription = 'pending future';
        } else if (statusFilterChecked) {
            filterDescription = 'pending';
        } else if (dateFilterChecked) {
            filterDescription = 'future';
        }
        eventsList.innerHTML = `<p>No ${filterDescription} events found.</p>`;
        return;
    }
    
    // Create table structure
    eventsList.innerHTML = `
        <div class="events-table">
            <div class="table-header">
                <div class="col-name">Event Name</div>
                <div class="col-date">Date</div>
                <div class="col-status">Status</div>
                <div class="col-actions">Actions</div>
            </div>
            <div class="table-body" id="table-body">
            </div>
        </div>
    `;
    
    const tableBody = document.getElementById('table-body');
    
    filteredEvents.forEach((event, index) => {
        renderEventRow(event, index, tableBody);
    });
}

// Render individual event row
function renderEventRow(event, index, container) {
    console.log(`Processing event ${index}:`, event);
    
    // Format date in PST/PDT timezone
    let eventDate = 'No date';
    if (event.date) {
        try {
            const utcDate = new Date(event.date);
            eventDate = utcDate.toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles',
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            }) + ' ' + utcDate.toLocaleTimeString('en-US', {
                timeZone: 'America/Los_Angeles',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            eventDate = 'Invalid date';
        }
    }
    
    const eventRow = document.createElement('div');
    eventRow.className = 'event-row';
    eventRow.innerHTML = `
        <div class="row-summary">
            <div class="col-name">
                <span class="event-name">${event.name || 'Unnamed Event'}</span>
                <span class="event-id">${event.id}</span>
            </div>
            <div class="col-date">${eventDate}</div>
            <div class="col-status">
                <span class="status-badge ${event.status === 'approved' ? 'approved' : 'pending'}">
                    ${event.status === 'approved' ? '✅ Approved' : '⏳ Pending'}
                </span>
            </div>
            <div class="col-actions">
                <button class="btn-open" title="View Details">👁️ Open</button>
                ${event.status !== 'approved' ? '<button class="btn-approve" title="Approve Event">✅</button>' : ''}
                <button class="btn-delete" title="Delete Event">🗑️</button>
            </div>
        </div>
        <div class="row-details" style="display: none;">
            <div class="details-content">
                <!-- Details will be loaded here -->
            </div>
        </div>
    `;
    
    // Add event listeners
    setupRowEventListeners(eventRow, event);
    
    container.appendChild(eventRow);
}

// Load detailed view for an event
function loadEventDetails(event, detailsContainer) {
    const danceTypes = Array.isArray(event.type) ? event.type.join(', ') : (event.type || 'Not specified');
    
    // Format dates in PST/PDT timezone
    const formatEventDate = (dateStr) => {
        if (!dateStr) return 'No date';
        try {
            const utcDate = new Date(dateStr);
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
    };
    
    const eventDate = formatEventDate(event.date);
    const endDate = event.end_date ? formatEventDate(event.end_date) : null;
    
    const detailsContent = detailsContainer.querySelector('.details-content');
    detailsContent.innerHTML = `
        <div class="details-grid">
            <div class="detail-section">
                <h4>Event Information</h4>
                <div class="detail-row">
                    <strong>Event ID:</strong> ${event.id || 'No ID'}
                </div>
                <div class="detail-row">
                    <strong>Start Date & Time:</strong> ${eventDate}
                </div>
                ${endDate ? `<div class="detail-row">
                    <strong>End Date & Time:</strong> ${endDate}
                </div>` : ''}
                <div class="detail-row">
                    <strong>Location:</strong> ${event.location || 'No location'}
                    ${event.maps_link ? `<a href="${event.maps_link}" target="_blank" class="maps-link">📍 View Map</a>` : ''}
                </div>
                <div class="detail-row">
                    <strong>Dance Types:</strong> ${danceTypes}
                </div>
                <div class="detail-row">
                    <strong>Music:</strong> ${event.music || 'Not specified'}
                </div>
                <div class="detail-row">
                    <strong>Price:</strong> ${event.price || 'Not specified'}
                </div>
                <div class="detail-row">
                    <strong>Contact:</strong> ${event.contact || 'Not provided'}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Submitter Information</h4>
                <div class="detail-row">
                    <strong>Name:</strong> ${event.submitter_name || 'Not provided'}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> 
                    ${event.submitter_email ? `
                        <a href="mailto:${event.submitter_email}" class="email-link">
                            ${event.submitter_email}
                        </a>
                    ` : 'Not provided'}
                </div>
                <div class="detail-row">
                    <strong>Submitted:</strong> ${event.created_at ? new Date(event.created_at).toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}) : 'Unknown'}
                </div>
                ${event.updated_at && event.updated_at !== event.created_at ? `
                <div class="detail-row">
                    <strong>Last Updated:</strong> ${new Date(event.updated_at).toLocaleString('en-US', {timeZone: 'America/Los_Angeles'})}
                </div>
                ` : ''}
            </div>
            
            <div class="detail-section">
                <h4>Status & Settings</h4>
                <div class="detail-row">
                    <strong>Status:</strong> 
                    <span class="status-badge ${event.status === 'approved' ? 'approved' : 'pending'}">
                        ${event.status === 'approved' ? '✅ Approved' : '⏳ Pending Approval'}
                    </span>
                </div>
                <div class="detail-row">
                    <strong>Featured:</strong> ${event.featured ? '⭐ Yes' : 'No'}
                </div>
            </div>
        </div>
        
        ${event.description ? `
        <div class="detail-section">
            <h4>Description</h4>
            <div class="description-text">${event.description}</div>
        </div>
        ` : ''}
        
        <div class="detail-actions">
            ${event.status !== 'approved' ? '<button class="approve-btn">✅ Approve Event</button>' : '<button class="unapprove-btn">❌ Unapprove</button>'}
            <button class="feature-btn">${event.featured ? '⭐ Unfeature' : '⭐ Feature Event'}</button>
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">🗑️ Delete</button>
            ${event.submitter_email && event.status === 'approved' ? `
                <button class="notify-btn" title="Send approval notification to submitter">📧 Notify Submitter</button>
            ` : ''}
        </div>
        <div class="edit-section" style="display:none;"></div>
        <div class="notification-section" style="display:none;"></div>
    `;
    
    setupDetailActionButtons(detailsContent, event);
}

// Update event count display
function updateEventCount(total, pending, approved) {
    if (eventCount && allEvents) {
        // Get current time in PST/PDT for comparison
        const nowPST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        
        const futureCount = allEvents.filter(event => {
            if (!event.date) return false;
            const eventDateUTC = new Date(event.date);
            const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            return eventDatePST > nowPST;
        }).length;
        
        const passedCount = allEvents.filter(event => {
            if (!event.date) return false;
            const eventDateUTC = new Date(event.date);
            const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            return eventDatePST <= nowPST;
        }).length;
        
        eventCount.innerHTML = `
            <span class="count-total">Total: ${total}</span>
            <span class="count-pending">Pending: ${pending}</span>
            <span class="count-approved">Approved: ${approved}</span>
            <span class="count-future">Future: ${futureCount}</span>
            <span class="count-passed">Passed: ${passedCount}</span>
        `;
    }
}

// Setup event listeners for a row
function setupRowEventListeners(eventRow, event) {
    const openBtn = eventRow.querySelector('.btn-open');
    const approveBtn = eventRow.querySelector('.btn-approve');
    const deleteBtn = eventRow.querySelector('.btn-delete');
    const detailsRow = eventRow.querySelector('.row-details');
    
    // Open/Close details
    openBtn.onclick = () => {
        const isVisible = detailsRow.style.display !== 'none';
        if (isVisible) {
            detailsRow.style.display = 'none';
            openBtn.textContent = '👁️ Open';
        } else {
            loadEventDetails(event, detailsRow);
            detailsRow.style.display = 'block';
            openBtn.textContent = '👁️ Close';
        }
    };
    
    // Quick approve
    if (approveBtn) {
        approveBtn.onclick = async (e) => {
            e.stopPropagation();
            await supabase.from('events').update({ status: 'approved' }).eq('id', event.id);
            loadEvents();
        };
    }
    
    // Quick delete
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Delete event "${event.name}"?`)) {
            await supabase.from('events').delete().eq('id', event.id);
            loadEvents();
        }
    };
}

// Update setupDetailActionButtons to include notification functionality
function setupDetailActionButtons(container, event) {
    const approveBtn = container.querySelector('.approve-btn');
    const unapproveBtn = container.querySelector('.unapprove-btn');
    const statusBtn = approveBtn || unapproveBtn;
    const notifyBtn = container.querySelector('.notify-btn');
    
    if (statusBtn) {
        statusBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const newStatus = event.status === 'approved' ? 'pending' : 'approved';
                const originalText = statusBtn.textContent;
                
                statusBtn.disabled = true;
                statusBtn.textContent = '⏳ Processing...';
                
                const result = await supabase
                    .from('events')
                    .update({ 
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', event.id)
                    .select();
                
                if (result.error) {
                    console.error('Error in detail update:', result.error);
                    alert(`Error updating event: ${result.error.message}`);
                    statusBtn.disabled = false;
                    statusBtn.textContent = originalText;
                    return;
                }
                
                // If event was just approved and has submitter email, show notification option
                if (newStatus === 'approved' && event.submitter_email) {
                    showApprovalNotification(container, event);
                }
                
                setTimeout(() => {
                    loadEvents();
                }, 1000);
                
            } catch (error) {
                console.error('Exception in detail update:', error);
                alert(`Error updating event: ${error.message}`);
                statusBtn.disabled = false;
            }
        };
    }
    
    // Notification button handler
    if (notifyBtn) {
        notifyBtn.onclick = (e) => {
            e.preventDefault();
            showApprovalNotification(container, event);
        };
    }
    
    const featureBtn = container.querySelector('.feature-btn');
    if (featureBtn) {
        featureBtn.onclick = async (e) => {
            e.preventDefault();
            
            try {
                const newFeaturedStatus = !event.featured;
                const originalText = featureBtn.textContent;
                
                featureBtn.disabled = true;
                featureBtn.textContent = '⏳ Processing...';
                
                const { error } = await supabase
                    .from('events')
                    .update({ 
                        featured: newFeaturedStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', event.id);
                
                if (error) {
                    console.error('Error updating featured status:', error);
                    alert(`Error updating event: ${error.message}`);
                    featureBtn.disabled = false;
                    featureBtn.textContent = originalText;
                    return;
                }
                
                setTimeout(() => {
                    loadEvents();
                }, 500);
                
            } catch (error) {
                console.error('Exception during feature update:', error);
                alert(`Error updating event: ${error.message}`);
                featureBtn.disabled = false;
            }
        };
    }
    
    const deleteBtn = container.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = async (e) => {
            e.preventDefault();
            
            if (confirm('Delete this event?')) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = '⏳ Deleting...';
                    
                    const { error } = await supabase
                        .from('events')
                        .delete()
                        .eq('id', event.id);
                    
                    if (error) {
                        console.error('Error deleting event:', error);
                        alert(`Error deleting event: ${error.message}`);
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = '🗑️ Delete';
                        return;
                    }
                    
                    loadEvents();
                    
                } catch (error) {
                    console.error('Exception during deletion:', error);
                    alert(`Error deleting event: ${error.message}`);
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = '🗑️ Delete';
                }
            }
        };
    }
    
    const editBtn = container.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.onclick = () => {
            showEditForm(container, event);
        };
    }
}

// Show edit form for event
function showEditForm(eventDiv, event) {
    const editSection = eventDiv.querySelector('.edit-section');
    editSection.style.display = 'block';
    
    // Convert UTC date to PST/PDT for form input
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            const utcDate = new Date(dateStr);
            // Convert to PST/PDT and format as YYYY-MM-DD
            const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            const year = pstDate.getFullYear();
            const month = (pstDate.getMonth() + 1).toString().padStart(2, '0');
            const day = pstDate.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return '';
        }
    };
    
    // Convert UTC time to PST/PDT for form input  
    const formatTimeForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            const utcDate = new Date(dateStr);
            // Convert to PST/PDT and format as HH:MM
            const pstDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            const hours = pstDate.getHours().toString().padStart(2, '0');
            const minutes = pstDate.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting time for input:', error);
            return '';
        }
    };
    
    // Get dance type checkboxes HTML
    const getDanceTypeCheckboxes = (eventTypes) => {
        const allDanceTypes = [
            { value: 'salsa', label: 'Salsa' },
            { value: 'timba', label: 'Timba' },
            { value: 'bachata', label: 'Bachata' },
            { value: 'merengue', label: 'Merengue' },
            { value: 'rueda', label: 'Rueda de Casino' },
            { value: 'cumbia', label: 'Cumbia' }
        ];
        
        const eventTypesArray = Array.isArray(eventTypes) ? eventTypes : (eventTypes ? [eventTypes] : []);
        
        return allDanceTypes.map(danceType => {
            const isChecked = eventTypesArray.includes(danceType.value) ? 'checked' : '';
            return `
                <label class="switch-label">
                    <input type="checkbox" name="type" value="${danceType.value}" class="filter-switch" ${isChecked}>
                    <span class="switch-slider"></span>
                    ${danceType.label}
                </label>
            `;
        }).join('');
    };
    
    editSection.innerHTML = `
        <form class="edit-form">
            <div class="edit-grid">
                <div class="edit-section-group">
                    <h4>Event Information</h4>
                    <div class="form-group">
                        <label for="edit-name">Event Name:</label>
                        <input type="text" id="edit-name" name="name" value="${event.name || ''}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-date">Date:</label>
                            <input type="date" id="edit-date" name="date" value="${formatDateForInput(event.date)}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-time">Start Time:</label>
                            <input type="time" id="edit-time" name="time" value="${formatTimeForInput(event.date)}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-end-time">End Time:</label>
                            <input type="time" id="edit-end-time" name="end_time" value="${formatTimeForInput(event.end_date)}">
                            <small>Optional - Leave blank if not specified</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-location">Location:</label>
                        <textarea id="edit-location" name="location" rows="2">${event.location || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-maps-link">Maps Link:</label>
                        <input type="url" id="edit-maps-link" name="maps_link" value="${event.maps_link || ''}" placeholder="https://maps.app.goo.gl/...">
                    </div>
                    
                    <div class="form-group">
                        <label>Dance Style(s): <small>(Select all that apply)</small></label>
                        <div class="switch-group-container">
                            ${getDanceTypeCheckboxes(event.type)}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-music">Music:</label>
                        <select id="edit-music" name="music">
                            <option value="">Select type</option>
                            <option value="Live" ${event.music === 'Live' ? 'selected' : ''}>Live Band</option>
                            <option value="DJ" ${event.music === 'DJ' ? 'selected' : ''}>DJ Set</option>
                            <option value="Mixed" ${event.music === 'Mixed' ? 'selected' : ''}>Live + DJ</option>
                            <option value="Other" ${!['DJ', 'Live', 'Mixed'].includes(event.music) && event.music ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-price">Price:</label>
                        <input type="text" id="edit-price" name="price" value="${event.price || ''}" placeholder="Free, $15, $10-20">
                    </div>
                    <div class="form-group">
                        <label for="edit-contact">Contact:</label>
                        <input type="text" id="edit-contact" name="contact" value="${event.contact || ''}" placeholder="@username, phone, email">
                    </div>
                </div>
                
                <div class="edit-section-group">
                    <h4>Submitter Information</h4>
                    <div class="form-group">
                        <label for="edit-submitter-name">Submitter Name:</label>
                        <input type="text" id="edit-submitter-name" name="submitter_name" value="${event.submitter_name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-submitter-email">Submitter Email:</label>
                        <input type="email" id="edit-submitter-email" name="submitter_email" value="${event.submitter_email || ''}">
                    </div>
                    
                    <h4>Status & Settings</h4>
                    <div class="form-group">
                        <label>Status:</label>
                        <select name="status">
                            <option value="pending" ${event.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="approved" ${event.status === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="rejected" ${event.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="featured" ${event.featured ? 'checked' : ''}> 
                            Featured Event
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="edit-description">Description:</label>
                <textarea id="edit-description" name="description" rows="4">${event.description || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="save-btn">💾 Save Changes</button>
                <button type="button" class="cancel-btn">❌ Cancel</button>
            </div>
        </form>
    `;
    
    const editForm = editSection.querySelector('.edit-form');
    editForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(editForm);
        
        // Get selected dance types from checkboxes
        const selectedDanceTypes = [];
        const danceTypeCheckboxes = editForm.querySelectorAll('input[name="type"]:checked');
        danceTypeCheckboxes.forEach(checkbox => {
            selectedDanceTypes.push(checkbox.value);
        });
        
        // Combine date and time for start datetime - convert PST/PDT to UTC
        const eventDate = formData.get('date');
        const eventTime = formData.get('time');
        let startDateTimeUTC = '';
        if (eventDate && eventTime) {
            const localDateTime = `${eventDate}T${eventTime}:00`;
            const localDate = new Date(localDateTime);
            startDateTimeUTC = localDate.toISOString();
        }
        
        // Combine date and end time for end datetime - convert PST/PDT to UTC
        // Handle case where end time is next day (when end time < start time)
        const endTime = formData.get('end_time');
        let endDateTimeUTC = null;
        if (eventDate && endTime && eventTime) {
            // Parse start and end times to compare (ensure both times exist)
            const startTimeMinutes = parseInt(eventTime.split(':')[0]) * 60 + parseInt(eventTime.split(':')[1]);
            const endTimeMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
            
            // If end time is earlier than start time, assume it's next day
            let endDateToUse = eventDate;
            if (endTimeMinutes < startTimeMinutes) {
                // Parse the date string properly and add one day
                const [year, month, day] = eventDate.split('-').map(Number);
                const baseDate = new Date(year, month - 1, day); // month is 0-based in Date constructor
                console.log(`Base date (${baseDate}) has day (${day})`);
                baseDate.setDate(baseDate.getDate() + 1);
                console.log(`Moving to next day: ${baseDate}`);
                
                // Format back to YYYY-MM-DD
                const newYear = baseDate.getFullYear();
                const newMonth = (baseDate.getMonth() + 1).toString().padStart(2, '0');
                const newDay = baseDate.getDate().toString().padStart(2, '0');
                endDateToUse = `${newYear}-${newMonth}-${newDay}`;
                
                console.log(`End time (${endTime}) is before start time (${eventTime}), moving to next day: ${endDateToUse}`);
            }
            
            const localEndDateTime = `${endDateToUse}T${endTime}:00`;
            const localEndDate = new Date(localEndDateTime);
            endDateTimeUTC = localEndDate.toISOString();
            
            console.log(`End date calculation: ${endDateToUse}T${endTime}:00 -> ${endDateTimeUTC}`);
        }
        
        const updatedEvent = {
            name: formData.get('name'),
            location: formData.get('location'),
            date: startDateTimeUTC,
            end_date: endDateTimeUTC,
            maps_link: formData.get('maps_link'),
            type: selectedDanceTypes,
            music: formData.get('music'),
            price: formData.get('price'),
            contact: formData.get('contact'),
            description: formData.get('description'),
            submitter_name: formData.get('submitter_name'),
            submitter_email: formData.get('submitter_email'),
            status: formData.get('status'),
            featured: formData.has('featured'),
            updated_at: new Date().toISOString()
        };
        
        try {
            const { error } = await supabase.from('events').update(updatedEvent).eq('id', event.id);
            if (error) {
                console.error('Error updating event:', error);
                alert('Error updating event: ' + error.message);
            } else {
                console.log('Event updated successfully');
                editSection.style.display = 'none';
                loadEvents();
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('Error updating event');
        }
    };
    
    editSection.querySelector('.cancel-btn').onclick = () => {
        editSection.style.display = 'none';
    };
}

// New function to show approval notification interface
function showApprovalNotification(container, event) {
    const notificationSection = container.querySelector('.notification-section');
    if (!notificationSection) return;
    
    notificationSection.style.display = 'block';
    
    // Format event date in PST/PDT for notification
    let eventDate = 'Date TBD';
    if (event.date) {
        try {
            const utcDate = new Date(event.date);
            eventDate = utcDate.toLocaleDateString('en-US', {
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
            console.error('Error formatting date for notification:', error);
            eventDate = 'Date TBD';
        }
    }
    
    const subject = `✅ Your Cuban Social event "${event.name}" has been approved!`;
    const body = `Hi ${event.submitter_name || 'there'},

Great news! Your event submission has been approved and is now live on the Cuban Social website.

📅 Event Details:
• Name: ${event.name}
• Date: ${eventDate}
• Location: ${event.location}
• Dance Types: ${Array.isArray(event.type) ? event.type.join(', ') : event.type}

🌐 Your event is now visible at: https://cubansocial.sd
🔗 Direct link: https://cubansocial.sd#events

Thank you for contributing to the San Diego Cuban dance community! We're excited to see your event bring dancers together.

If you need to make any changes to your event details, please reply to this email.

¡Nos vemos en la pista!

The Cuban Social Team
📧 cubansocial.sd@gmail.com
📱 @CubanSocial.SD`;

    notificationSection.innerHTML = `
        <div class="notification-container" style="
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        ">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <i class="fas fa-envelope" style="color: #0ea5e9; font-size: 20px;"></i>
                <h4 style="margin: 0; color: #0c4a6e;">Send Approval Notification</h4>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <strong>To:</strong> 
                    <span style="color: #0ea5e9;">${event.submitter_email}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <strong>Subject:</strong> 
                    <span style="color: #374151;">${subject}</span>
                </div>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                <h5 style="margin: 0 0 12px 0; color: #374151;">Email Preview:</h5>
                <div style="
                    white-space: pre-line; 
                    font-family: monospace; 
                    font-size: 14px; 
                    line-height: 1.5; 
                    color: #6b7280;
                    max-height: 300px;
                    overflow-y: auto;
                    background: #f9fafb;
                    padding: 12px;
                    border-radius: 4px;
                ">${body}</div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="this.closest('.notification-section').style.display='none'" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                ">Cancel</button>
                <button onclick="sendApprovalEmail('${event.submitter_email}', '${encodeURIComponent(subject)}', '${encodeURIComponent(body)}')" style="
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-paper-plane"></i>
                    Send Email
                </button>
            </div>
        </div>
    `;
    
    // Scroll to notification
    notificationSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Global function to send approval email
window.sendApprovalEmail = function(email, subject, body) {
    const decodedSubject = decodeURIComponent(subject);
    const decodedBody = decodeURIComponent(body);
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(decodedSubject)}&body=${encodeURIComponent(decodedBody)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Email client opened with notification message</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.remove();
    }, 4000);
    
    // Hide the notification section
    const notificationSection = document.querySelector('.notification-section[style*="block"]');
    if (notificationSection) {
        notificationSection.style.display = 'none';
    }
};

// New function to show cleanup confirmation and perform cleanup
function showCleanupConfirmation() {
    // Get current time in PST/PDT
    const nowPST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const currentMonth = nowPST.getMonth();
    const currentYear = nowPST.getFullYear();
    
    // Calculate cutoff date (end of two months ago at 23:59:59) in PST/PDT
    const cutoffDatePST = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);
    
    console.log('Current PST date:', nowPST);
    console.log('Current month:', currentMonth, 'Current year:', currentYear);
    console.log('Cutoff PST date:', cutoffDatePST);
    console.log('Cutoff month:', cutoffDatePST.getMonth(), 'Cutoff year:', cutoffDatePST.getFullYear());
    
    // Find events to be deleted (events on or before the end of 2 months ago in PST/PDT)
    const eventsToDelete = allEvents.filter(event => {
        if (!event.date) {
            console.log('Event has no date:', event.id, event.name);
            return false;
        }
        
        // Convert UTC event date to PST/PDT for comparison
        const eventDateUTC = new Date(event.date);
        const eventDatePST = new Date(eventDateUTC.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const shouldDelete = eventDatePST <= cutoffDatePST;
        
        console.log(`Event: ${event.name} (UTC: ${event.date}) - PST date: ${eventDatePST.toLocaleDateString()} ${eventDatePST.toLocaleTimeString()} - Should delete: ${shouldDelete}`);
        
        return shouldDelete;
    });
    
    // Sort events by PST date (oldest first)
    eventsToDelete.sort((a, b) => {
        const dateAPST = new Date(new Date(a.date).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const dateBPST = new Date(new Date(b.date).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        return dateAPST - dateBPST;
    });
    
    console.log('Events to delete:', eventsToDelete.length);
    eventsToDelete.forEach(event => {
        const eventDatePST = new Date(new Date(event.date).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        console.log(`- ${event.name} (PST: ${eventDatePST.toLocaleDateString()} ${eventDatePST.toLocaleTimeString()})`);
    });
    
    if (eventsToDelete.length === 0) {
        alert('No old events found to cleanup. All events are from the current month, previous month, or future (in PST/PDT timezone).');
        return;
    }
    
    // Create detailed confirmation dialog
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const cutoffMonthName = monthNames[cutoffDatePST.getMonth()];
    const cutoffYear = cutoffDatePST.getFullYear();
    const currentMonthName = monthNames[currentMonth];
    const previousMonth = (currentMonth - 1 + 12) % 12;
    const previousMonthName = monthNames[previousMonth];
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const confirmMessage = `This will permanently delete ${eventsToDelete.length} events from ${cutoffMonthName} ${cutoffYear} and earlier (PST/PDT timezone).

Events to KEEP:
• Future events (after ${nowPST.toLocaleDateString()})
• ${currentMonthName} ${currentYear} events
• ${previousMonthName} ${previousMonthYear} events

Events to DELETE (${cutoffMonthName} ${cutoffDatePST.getDate()}, ${cutoffYear} and earlier):
${eventsToDelete.slice(0, 10).map(event => {
        const eventDatePST = new Date(new Date(event.date).toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        return `• ${event.name} (${eventDatePST.toLocaleDateString()} ${eventDatePST.toLocaleTimeString()})`;
    }).join('\n')}${eventsToDelete.length > 10 ? `\n• ... and ${eventsToDelete.length - 10} more` : ''}

⚠️ This action cannot be undone!

Continue with cleanup?`;
    
    if (confirm(confirmMessage)) {
        performCleanup(eventsToDelete);
    }
}

// Perform the actual cleanup
async function performCleanup(eventsToDelete) {
    const cleanupBtn = document.getElementById('cleanup-old-events');
    const originalText = cleanupBtn.textContent;
    
    try {
        cleanupBtn.disabled = true;
        cleanupBtn.textContent = '🔄 Cleaning up...';
        
        let successCount = 0;
        let errorCount = 0;
        
        // Show progress
        const progressDiv = document.createElement('div');
        progressDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #0ea5e9;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 9999;
            min-width: 300px;
            text-align: center;
        `;
        progressDiv.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #0c4a6e;">Cleaning Up Events</h3>
            <div id="cleanup-progress">Starting cleanup...</div>
            <div style="margin-top: 16px;">
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div id="cleanup-progress-bar" style="background: #0ea5e9; height: 100%; width: 0%; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(progressDiv);
        
        const progressText = document.getElementById('cleanup-progress');
        const progressBar = document.getElementById('cleanup-progress-bar');
        
        // Delete events in batches
        for (let i = 0; i < eventsToDelete.length; i++) {
            const event = eventsToDelete[i];
            const progress = Math.round(((i + 1) / eventsToDelete.length) * 100);
            
            progressText.textContent = `Deleting event ${i + 1} of ${eventsToDelete.length}: ${event.name}`;
            progressBar.style.width = `${progress}%`;
            
            try {
                const { error } = await supabase
                    .from('events')
                    .delete()
                    .eq('id', event.id);
                
                if (error) {
                    console.error(`Error deleting event ${event.id}:`, error);
                    errorCount++;
                } else {
                    successCount++;
                }
                
                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Exception deleting event ${event.id}:`, error);
                errorCount++;
            }
        }
        
        // Show completion message
        progressText.textContent = 'Cleanup completed!';
        progressBar.style.width = '100%';
        
        setTimeout(() => {
            document.body.removeChild(progressDiv);
            
            // Show results
            const resultMessage = `Cleanup completed!
            
✅ Successfully deleted: ${successCount} events
${errorCount > 0 ? `❌ Errors: ${errorCount} events` : ''}

The event list will now refresh.`;
            
            alert(resultMessage);
            
            // Refresh events list
            loadEvents();
            
            cleanupBtn.disabled = false;
            cleanupBtn.textContent = originalText;
            
        }, 2000);
        
    } catch (error) {
        console.error('Error during cleanup:', error);
        alert(`Error during cleanup: ${error.message}`);
        
        cleanupBtn.disabled = false;
        cleanupBtn.textContent = originalText;
    }
}

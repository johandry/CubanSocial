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

let allEvents = []; // Store all events for filtering

// Filter change events
statusFilter?.addEventListener('change', () => {
    renderFilteredEvents();
});

dateFilter?.addEventListener('change', () => {
    renderFilteredEvents();
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
        const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        
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
        filteredEvents = filteredEvents.filter(event => !event.approved);
    }
    
    // Apply date filter (checked = show future only, unchecked = show all)
    const now = new Date();
    if (dateFilterChecked) {
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate > now;
        });
    }
    
    console.log(`Showing ${filteredEvents.length} events (pending only: ${statusFilterChecked}, future only: ${dateFilterChecked})`);
    
    // Update count display
    const pendingCount = allEvents.filter(event => !event.approved).length;
    const approvedCount = allEvents.filter(event => event.approved).length;
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
    
    const eventDate = event.date ? new Date(event.date).toLocaleDateString() + ' ' + new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No date';
    
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
                <span class="status-badge ${event.approved ? 'approved' : 'pending'}">
                    ${event.approved ? '✅ Approved' : '⏳ Pending'}
                </span>
            </div>
            <div class="col-actions">
                <button class="btn-open" title="View Details">👁️ Open</button>
                ${!event.approved ? '<button class="btn-approve" title="Approve Event">✅</button>' : ''}
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

// Update event count display
function updateEventCount(total, pending, approved) {
    if (eventCount && allEvents) {
        const now = new Date();
        const futureCount = allEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate > now;
        }).length;
        const passedCount = allEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate <= now;
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
            await supabase.from('events').update({ approved: true }).eq('id', event.id);
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

// Load detailed view for an event
function loadEventDetails(event, detailsContainer) {
    const danceTypes = Array.isArray(event.type) ? event.type.join(', ') : (event.type || 'Not specified');
    const eventDate = event.date ? new Date(event.date).toLocaleString() : 'No date';
    
    const detailsContent = detailsContainer.querySelector('.details-content');
    detailsContent.innerHTML = `
        <div class="details-grid">
            <div class="detail-section">
                <h4>Event Information</h4>
                <div class="detail-row">
                    <strong>Event ID:</strong> ${event.id || 'No ID'}
                </div>
                <div class="detail-row">
                    <strong>Date & Time:</strong> ${eventDate}
                </div>
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
                <h4>Status & Timestamps</h4>
                <div class="detail-row">
                    <strong>Status:</strong> 
                    <span class="status-badge ${event.approved ? 'approved' : 'pending'}">
                        ${event.approved ? '✅ Approved' : '⏳ Pending Approval'}
                    </span>
                </div>
                <div class="detail-row">
                    <strong>Featured:</strong> ${event.featured ? '⭐ Yes' : 'No'}
                </div>
                <div class="detail-row">
                    <strong>Submitted:</strong> ${event.created_at ? new Date(event.created_at).toLocaleString() : 'Unknown'}
                </div>
                ${event.updated_at && event.updated_at !== event.created_at ? `
                <div class="detail-row">
                    <strong>Last Updated:</strong> ${new Date(event.updated_at).toLocaleString()}
                </div>
                ` : ''}
            </div>
        </div>
        
        ${event.description ? `
        <div class="detail-section">
            <h4>Description</h4>
            <div class="description-text">${event.description}</div>
        </div>
        ` : ''}
        
        <div class="detail-actions">
            ${!event.approved ? '<button class="approve-btn">✅ Approve Event</button>' : '<button class="unapprove-btn">❌ Unapprove</button>'}
            <button class="feature-btn">${event.featured ? '⭐ Unfeature' : '⭐ Feature Event'}</button>
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">🗑️ Delete</button>
        </div>
        <div class="edit-section" style="display:none;"></div>
    `;
    
    // Setup detail action buttons
    setupDetailActionButtons(detailsContent, event);
}

// Setup action buttons in detail view
function setupDetailActionButtons(container, event) {
    // Approve/Unapprove button
    const approveBtn = container.querySelector('.approve-btn, .unapprove-btn');
    if (approveBtn) {
        approveBtn.onclick = async () => {
            const newApprovalStatus = !event.approved;
            await supabase.from('events').update({ approved: newApprovalStatus }).eq('id', event.id);
            loadEvents();
        };
    }
    
    // Feature/Unfeature button
    const featureBtn = container.querySelector('.feature-btn');
    featureBtn.onclick = async () => {
        const newFeaturedStatus = !event.featured;
        await supabase.from('events').update({ featured: newFeaturedStatus }).eq('id', event.id);
        loadEvents();
    };
    
    // Delete button
    const deleteBtn = container.querySelector('.delete-btn');
    deleteBtn.onclick = async () => {
        if (confirm('Delete this event?')) {
            await supabase.from('events').delete().eq('id', event.id);
            loadEvents();
        }
    };
    
    // Edit button
    const editBtn = container.querySelector('.edit-btn');
    editBtn.onclick = () => {
        showEditForm(container, event);
    };
}

// Render individual event card
function renderEventCard(event, index) {
    console.log(`Processing event ${index}:`, event);
    const eventDiv = document.createElement('div');
    eventDiv.className = 'admin-event-card';
    
    // Format dance types
    const danceTypes = Array.isArray(event.type) ? event.type.join(', ') : (event.type || 'Not specified');
    
    // Format date
    const eventDate = event.date ? new Date(event.date).toLocaleString() : 'No date';
    
    eventDiv.innerHTML = `
        <div class="event-header">
            <h3>${event.name || 'Unnamed Event'}</h3>
            <div class="approval-status">
                <span class="status-badge ${event.approved ? 'approved' : 'pending'}">
                    ${event.approved ? '✅ Approved' : '⏳ Pending Approval'}
                </span>
                ${event.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
            </div>
        </div>
        
        <div class="event-details">
            <div class="detail-row">
                <strong>Event ID:</strong> ${event.id || 'No ID'}
            </div>
            <div class="detail-row">
                <strong>Date & Time:</strong> ${eventDate}
            </div>
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
            ${event.description ? `
            <div class="detail-row">
                <strong>Description:</strong>
                <div class="description-text">${event.description}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <strong>Contact:</strong> ${event.contact || 'Not provided'}
            </div>
            <div class="detail-row">
                <strong>Submitted:</strong> ${event.created_at ? new Date(event.created_at).toLocaleString() : 'Unknown'}
            </div>
            ${event.updated_at && event.updated_at !== event.created_at ? `
            <div class="detail-row">
                <strong>Last Updated:</strong> ${new Date(event.updated_at).toLocaleString()}
            </div>
            ` : ''}
        </div>
        
        <div class="event-actions">
            ${!event.approved ? '<button class="approve-btn">✅ Approve Event</button>' : '<button class="unapprove-btn">❌ Unapprove</button>'}
            <button class="feature-btn">${event.featured ? '⭐ Unfeature' : '⭐ Feature Event'}</button>
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">🗑️ Delete</button>
        </div>
        <div class="edit-section" style="display:none;"></div>
    `;
    
    // Approve/Unapprove button
    const approveBtn = eventDiv.querySelector('.approve-btn, .unapprove-btn');
    if (approveBtn) {
        approveBtn.onclick = async () => {
            const newApprovalStatus = !event.approved;
            await supabase.from('events').update({ approved: newApprovalStatus }).eq('id', event.id);
            loadEvents(); // Reload to update the data
        };
    }
    
    // Feature/Unfeature button
    const featureBtn = eventDiv.querySelector('.feature-btn');
    featureBtn.onclick = async () => {
        const newFeaturedStatus = !event.featured;
        await supabase.from('events').update({ featured: newFeaturedStatus }).eq('id', event.id);
        loadEvents(); // Reload to update the data
    };
    // Delete button
    const deleteBtn = eventDiv.querySelector('.delete-btn');
    deleteBtn.onclick = async () => {
        if (confirm('Delete this event?')) {
            await supabase.from('events').delete().eq('id', event.id);
            loadEvents(); // Reload to update the data
        }
    };
    
    // Edit button
    const editBtn = eventDiv.querySelector('.edit-btn');
    editBtn.onclick = () => {
        showEditForm(eventDiv, event);
    };
    
    eventsList.appendChild(eventDiv);
}

// Show edit form for event
function showEditForm(eventDiv, event) {
    const editSection = eventDiv.querySelector('.edit-section');
    editSection.style.display = 'block';
    
    // Format date for input field
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16); // Format for datetime-local input
    };
    
    // Format dance types for input
    const formatDanceTypes = (types) => {
        return Array.isArray(types) ? types.join(', ') : (types || '');
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
                    <div class="form-group">
                        <label for="edit-date">Date & Time:</label>
                        <input type="datetime-local" id="edit-date" name="date" value="${formatDateForInput(event.date)}" required>
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
                        <label for="edit-dance-types">Dance Types:</label>
                        <input type="text" id="edit-dance-types" name="type" value="${formatDanceTypes(event.type)}" placeholder="salsa, bachata, timba">
                        <small>Separate multiple types with commas</small>
                    </div>
                    <div class="form-group">
                        <label for="edit-music">Music:</label>
                        <select id="edit-music" name="music">
                            <option value="DJ" ${event.music === 'DJ' ? 'selected' : ''}>DJ</option>
                            <option value="Live" ${event.music === 'Live' ? 'selected' : ''}>Live</option>
                            <option value="Mixed" ${event.music === 'Mixed' ? 'selected' : ''}>Mixed</option>
                            <option value="Other" ${!['DJ', 'Live', 'Mixed'].includes(event.music) ? 'selected' : ''}>Other</option>
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
                    <h4>Status & Settings</h4>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="approved" ${event.approved ? 'checked' : ''}> 
                            Approved
                        </label>
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
        
        // Parse dance types back to array
        const danceTypesStr = formData.get('type') || '';
        const danceTypes = danceTypesStr.split(',').map(type => type.trim()).filter(type => type);
        
        const updatedEvent = {
            name: formData.get('name'),
            location: formData.get('location'),
            date: formData.get('date'),
            maps_link: formData.get('maps_link'),
            type: danceTypes,
            music: formData.get('music'),
            price: formData.get('price'),
            contact: formData.get('contact'),
            description: formData.get('description'),
            approved: formData.has('approved'),
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

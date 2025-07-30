# Analytics Configuration for Cuban Social

## Google Analytics 4 Setup

To enable Google Analytics tracking:

1. **Create a Google Analytics 4 property:**
   - Go to <https://analytics.google.com/>
   - Create a new GA4 property for your website
   - Get your Measurement ID (format: G-XXXXXXXXXX)

2. **Verify tracking:**
   - Use Google Analytics Real-time reports to verify data collection
   - Install Google Analytics Debugger browser extension for debugging

## Privacy-Friendly Alternative: Simple Analytics

If you prefer a privacy-friendly, GDPR-compliant alternative, consider:

### Option 1: Plausible Analytics (Recommended)

```html
<!-- Replace Google Analytics with Plausible -->
<script defer data-domain="cubansocial.com" src="https://plausible.io/js/script.js"></script>
```

### Option 2: Simple Analytics

```html
<!-- Replace Google Analytics with Simple Analytics -->
<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
<noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerpolicy="no-referrer-when-downgrade" /></noscript>
```

## Event Tracking

The Cuban Social app automatically tracks:

- **Page views**: Navigation between sections (Events, Congresses, Playlists, Submit Event)
- **Event submissions**: Successful form submissions with event details
- **Filter usage**: Dance type, music type, location, and featured filters
- **External link clicks**: Social media, Spotify, Maps, etc.
- **Contact interactions**: Email links and phone number clicks
- **Maps interactions**: Google Maps link clicks

## Tracked Events List

### Core Events

- `app_initialized`: When the app loads
- `events_loaded`: When event data is loaded
- `congresses_loaded`: When congress data is loaded
- `page_view`: Navigation between sections
- `event_submitted`: Successful event form submission
- `filter_used`: When users apply filters
- `external_link_clicked`: Clicks on external links
- `contact_clicked`: Email/phone contact interactions
- `maps_link_clicked`: Google Maps link clicks

### Event Properties

Each tracked event includes relevant context:

- **Page views**: `page_title`, `page_location`
- **Event submissions**: `event_name`, `event_date`, `event_type`, `request_number`
- **Filter usage**: `filter_type`, `filter_value`
- **Link clicks**: `link_url`, `link_text`, `link_type`

## GDPR Compliance

If you need GDPR compliance:

1. Add a cookie consent banner
2. Use privacy-friendly analytics (Plausible/Simple Analytics)
3. Update your privacy policy
4. Implement consent management

## Current Implementation

- ✅ Google Analytics 4 script added to index.html
- ✅ Custom event tracking in js/app.js
- ✅ Comprehensive user interaction tracking
- ✅ Replace GA_MEASUREMENT_ID with your actual ID
- ⚠️ Consider privacy implications for EU users

## Analytics Dashboard

Once configured, you can monitor:

- **Real-time visitors** and their locations
- **Popular events** and dance types
- **User engagement** with filters and features
- **Traffic sources** and referrals
- **Mobile vs desktop** usage patterns
- **Event submission success rates**

## Testing Analytics

To test your analytics setup:

1. Open your website with the updated Measurement ID
2. Navigate between sections
3. Use filters
4. Submit a test event
5. Check Google Analytics Real-time reports
6. Verify events appear in the dashboard

## Debugging

- Use browser console to see `Analytics: [event_name]` logs
- Install Google Analytics Debugger extension
- Check Network tab for gtag requests
- Verify Measurement ID is correctly set

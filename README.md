# 🇨🇺 Cuban Social

> Discover the best Cuban dance events in San Diego

Cuban Social is a community-driven platform for discovering salsa, timba, bachata, merengue, and rueda de casino events in San Diego. Built as a modern web application with real-time data storage and a unique pull request-based contribution system.

## 🌟 Features

- **📅 Event Discovery**: Browse upcoming dance events with detailed information
- **⭐ Featured Events**: Highlighted and recurring events get special visibility
- **🎵 Dance Type Filters**: Filter events by salsa, timba, bachata, merengue, or rueda
- **📱 Responsive Design**: Mobile-friendly interface for on-the-go event discovery
- **🔄 Community Contributions**: Submit events via GitHub pull requests
- **🎯 Admin Review System**: Quality control through GitHub-based review process
- **⚡ Real-time Updates**: Live event data with instant updates

## 🚀 Getting Started

### For Users

1. Visit [Cuban Social](https://CubanSocial.com)
2. Browse upcoming events or use filters to find specific dance types
3. Click "Directions" to get Google Maps directions to events
4. Use "Add to Calendar" to save events to your calendar

### For Event Organizers

#### Quick Submit (Recommended)

1. Visit the "Submit Event" section on the website
2. Fill out the event submission form
3. Submit directly to the database for immediate review
4. Admins receive notifications and can approve/reject

### For Contributors/Developers

1. Clone this repository:

   ```bash
   git clone https://github.com/johandry/CubanSocial.git
   cd CubanSocial
   ```

2. Install all dependencies:

   ```bash
   make install
   # or
   make setup
   ```

   This will:
   - Install Node.js dependencies (`npm install`)
   - Create Python virtual environment (`.venv`)
   - Install Python packages (`supabase`)

3. Activate the Python environment (for Python scripts):

   ```bash
   source .venv/bin/activate
   ```

4. Start the local development server:

   ```bash
   make start
   # or
   make server
   ```

   This will serve the application at `http://localhost:8000`

5. See all available commands:

   ```bash
   make help
   ```

## 🛠️ Development Commands

All development tasks are managed through the Makefile. Run `make help` to see all available commands:

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies (Node.js + Python) |
| `make setup` | Alias for install |
| `make clean` | Remove all unnecessary files |
| `make start` | Start local development server on port 8000 |
| `make server` | Alias for start |
| `make export-events` | Export events from Supabase to JSON |
| `make insert-missing-events` | Insert missing events to database |
| `make insert-missing-dry-run` | Dry run of missing events insertion |
| `make insert-missing-force` | Force insert missing events |
| `make generate-cards` | Generate event cards |
| `make list-cards` | List available event cards |
| `make cards` | Generate and list event cards |
| `make json-to-csv` | Convert JSON data to CSV format |
| `make compare-data` | Compare CSV data |
| `make compare-data-verbose` | Compare CSV data with verbose output |
| `make help` | Show this help message |

### Quick Start Workflow

**Complete setup from scratch:**

```bash
git clone https://github.com/johandry/CubanSocial.git
cd CubanSocial
make install          # Install all dependencies
source .venv/bin/activate  # Activate Python environment
make start            # Start development server
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES6+)
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Hosting**: GitHub Pages (static site) + Supabase backend
- **Data Storage**: Supabase tables with JSON fallback in `/data` directory for legacy systems
- **Authentication**: Supabase Auth (for admin functions)
- **Contribution Method**: GitHub Pull Requests + Direct database submissions
- **CI/CD**: GitHub Actions for validation and deployment

### Database Schema

The application uses Supabase to store event data with the following main tables:

#### Events Table

```sql
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  maps_link TEXT,
  type TEXT[] NOT NULL, -- ['salsa', 'bachata', etc.]
  music TEXT CHECK (music IN ('Live', 'DJ', 'Mixed')),
  price TEXT,
  description TEXT,
  contact TEXT,
  featured BOOLEAN DEFAULT false,
  recurring TEXT CHECK (recurring IN ('weekly', 'monthly', 'biweekly')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can read approved events
CREATE POLICY "Public can view approved events" ON events
  FOR SELECT USING (status = 'approved');

-- Authenticated users can submit events
CREATE POLICY "Users can submit events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admins can manage all events
CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### Directory Structure

```tree
/
├── index.html              # Main application
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── app.js             # Main JavaScript application
│   ├── supabaseClient.js  # Supabase integration
│   └── admin.js           # Admin database operations
├── data/                  # JSON fallback data (legacy)
│   ├── events/            # Approved events (fallback)
│   ├── playlists/         # Music playlists
│   └── congresses/        # Dance congress information
├── .github/
│   ├── workflows/         # GitHub Actions
│   └── PULL_REQUEST_TEMPLATE/ # PR templates
└── docs/                  # Documentation
```

## 🗄️ Database Management

### Supabase Setup

1. **Create Supabase Project**: Visit [supabase.com](https://supabase.com) and create a new project

2. **Run Migrations**: Execute the SQL schema provided above in the Supabase SQL editor

3. **Configure Authentication**:
   - Enable email authentication
   - Set up admin roles using Supabase Auth

4. **Set Up Real-time**: Enable real-time subscriptions for the events table

### Data Management Commands

**Export events from Supabase to local JSON files:**

```bash
make export-events
```

**Insert missing events from JSON files to database:**

```bash
make insert-missing-dry-run    # Preview first
make insert-missing-events     # Actual insertion
```

**Compare data between sources:**

```bash
make compare-data              # Basic comparison
make compare-data-verbose      # Detailed analysis
```

### Backup Strategy

- **Primary**: Supabase automatic backups
- **Secondary**: Weekly JSON exports using `make export-events`
- **Tertiary**: GitHub repository history

## 📊 Analytics Setup

Cuban Social includes comprehensive analytics tracking to monitor website usage and user engagement. See `analytics-setup.md` for complete configuration instructions.

### Quick Setup

1. **Privacy-Friendly Alternative**: Consider Plausible or Simple Analytics for GDPR compliance

### Tracked Events

- Page navigation and user flows
- Event submissions and success rates (both database and GitHub)
- Filter usage patterns
- External link interactions
- Contact engagement
- Database query performance

## 📝 Event Submission Process

### Modern Flow (Supabase)

1. **Fill Form**: User completes the event submission form
2. **Direct Submit**: Form saves event to Supabase with `status: 'pending'`
3. **Admin Notification**: Admins receive real-time notifications
4. **Review Process**: Admins use the admin panel to review events
5. **Approval**: Admin updates `status` to 'approved' or 'rejected'
6. **Go Live**: Approved events immediately appear on the website

### Legacy Flow (GitHub PR)

1. **Fill Form**: User completes the advanced submission form
2. **Auto PR Creation**: Form generates a GitHub pull request with event data
3. **Admin Notification**: Admins receive GitHub notifications
4. **Review Process**: Admins use the review checklist to validate events
5. **Approval**: Approved events are moved from `events-pending/` to `events/`
6. **Go Live**: Merged PR makes the event visible on the website

### Event Data Schema

```typescript
interface Event {
  id: string;
  name: string;
  date: string; // ISO 8601 format
  location: string;
  maps_link?: string;
  type: ('salsa' | 'timba' | 'bachata' | 'merengue' | 'rueda')[];
  music: 'Live' | 'DJ' | 'Mixed';
  price: string;
  description: string;
  contact: string;
  featured: boolean;
  recurring?: 'weekly' | 'monthly' | 'biweekly';
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: string;
  created_at: string;
  updated_at: string;
}
```

## 🛠️ Admin Guide

### Admin Panel Features

- **Event Management**: Review, approve, reject, or edit submitted events
- **Real-time Dashboard**: See pending submissions and site analytics
- **Bulk Operations**: Approve/reject multiple events at once
- **Featured Event Management**: Promote events to featured status

### Database Admin Tasks

```sql
-- View pending events
SELECT * FROM events WHERE status = 'pending' ORDER BY created_at DESC;

-- Approve an event
UPDATE events SET status = 'approved', updated_at = NOW() WHERE id = 'event-id';

-- Feature an event
UPDATE events SET featured = true WHERE id = 'event-id';

-- Get submission statistics
SELECT 
  status,
  COUNT(*) as count,
  DATE_TRUNC('week', created_at) as week
FROM events 
GROUP BY status, week 
ORDER BY week DESC;
```

### Data Maintenance Commands

**Keep local data synchronized:**

```bash
make export-events              # Download latest from database
make compare-data               # Check for discrepancies
make insert-missing-events      # Upload missing events
```

**Generate promotional materials:**

```bash
make cards                      # Generate and list all cards
make generate-cards             # Create monthly event cards
make list-cards                 # View generated cards
```

### Review Checklist

When reviewing event submissions, check:

- [ ] Event name is descriptive and relevant
- [ ] Date and time are valid and in the future  
- [ ] Location includes full address
- [ ] Google Maps link is valid (if provided)
- [ ] Dance type is accurate and properly categorized
- [ ] Event appears legitimate (not spam)
- [ ] Contact information is provided
- [ ] No duplicate events exist

## 🔒 Security & Privacy

### Data Protection

- **Row Level Security**: Supabase RLS policies protect sensitive data
- **Input Validation**: Client and server-side validation for all submissions
- **Rate Limiting**: Prevent spam submissions
- **CORS Configuration**: Restrict API access to authorized domains

### Admin Authentication

- **Supabase Auth**: Secure admin authentication
- **Role-based Access**: Different permission levels for different admin roles
- **Session Management**: Secure session handling

## 🎯 Featured Events

Events can be marked as featured or recurring for special visibility through the admin panel or directly in the database:

```sql
UPDATE events 
SET 
  featured = true,
  recurring = 'weekly'
WHERE id = 'event-id';
```

Featured events appear in a special highlighted section at the top of the site.

## 📊 Analytics & Insights

Enhanced analytics with database integration:

- **Real-time Metrics**: Live event submission rates
- **Geographic Analysis**: Event distribution across San Diego
- **Popularity Tracking**: Most viewed and attended events
- **Organizer Insights**: Event submission patterns
- **Performance Monitoring**: Database query performance

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Set up your local development environment:

   ```bash
   npm install
   make start
   ```

4. Make your changes and test with both database and fallback modes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

### Database Contributions

- Help optimize queries and database schema
- Contribute to data migration scripts using `make` commands
- Improve backup and recovery procedures

### Event Contributions

- Use the website form to submit events
- Share the platform with event organizers
- Follow us on social media to stay updated

## 🔄 Deployment

### GitHub Pages + Supabase

The application deploys as a static site with dynamic database connectivity:

1. **Static Assets**: Deployed to GitHub Pages
2. **Database**: Hosted on Supabase cloud
3. **Environment Variables**: Configured in GitHub Actions
4. **Build Process**: Automated via GitHub Actions
5. **Data Sync**: Use `make export-events` to keep JSON fallbacks updated

## 🌍 Expansion Plans

Database-driven expansion capabilities:

- **Multi-city Support**: City-specific database partitioning
- **Scalability**: Supabase's PostgreSQL handles growth
- **Multi-language**: Database-stored translations
- **Regional Admin Teams**: Role-based geographic permissions

## 📞 Contact & Support

- **Website**: [Cuban Social](https://cubansocial.com)
- **Instagram**: [@CubanSocial.sd](https://www.instagram.com/cubansocial.sd)
- **Facebook**: [@CubanSocial](https://facebook.com/cubansocial)
- **TikTok**: [@CubanSocial](https://tiktok.com/@cubansocial)
- **YouTube**: [@CubanSocial](https://www.youtube.com/@CubanSocial)
- **Email**: [cubansocial.sd@gmail.com](mailto:cubansocial.sd@gmail.com)
- **GitHub Issues**: For technical problems or feature requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The San Diego Cuban dance community
- Event organizers who keep the culture alive
- Contributors who help maintain and improve the platform
- GitHub for providing free hosting and collaboration tools
- Supabase for the robust backend infrastructure

---

**¡Vamos a bailar!** 💃🕺🇨🇺

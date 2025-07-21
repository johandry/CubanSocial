# 🇨🇺 Cuban Social

> Discover the best Cuban dance events in San Diego

Cuban Social is a community-driven platform for discovering salsa, timba, bachata, merengue, and rueda de casino events in San Diego. Built as a static GitHub Pages site with a unique pull request-based contribution system.

## 🌟 Features

- **📅 Event Discovery**: Browse upcoming dance events with detailed information
- **⭐ Featured Events**: Highlighted and recurring events get special visibility
- **🎵 Dance Type Filters**: Filter events by salsa, timba, bachata, merengue, or rueda
- **📱 Responsive Design**: Mobile-friendly interface for on-the-go event discovery
- **🔄 Community Contributions**: Submit events via GitHub pull requests
- **🎯 Admin Review System**: Quality control through GitHub-based review process

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript (ES6+)
- **Hosting**: GitHub Pages (static site)
- **Data Storage**: JSON files in `/data` directory
- **Contribution Method**: GitHub Pull Requests
- **CI/CD**: GitHub Actions for validation and deployment

### Directory Structure
```
/
├── index.html              # Main application
├── css/
│   └── styles.css         # Application styles
├── js/
│   └── app.js             # Main JavaScript application
├── data/
│   ├── events/            # Approved events (live)
│   ├── events-pending/    # Submitted events awaiting approval
│   ├── playlists/         # Music playlists
│   └── congresses/        # Dance congress information
├── .github/
│   ├── workflows/         # GitHub Actions
│   └── PULL_REQUEST_TEMPLATE/ # PR templates
└── docs/                  # Documentation
```

## 🚀 Getting Started

### For Users

1. Visit [Cuban Social](https://CubanSocial.com)
2. Browse upcoming events or use filters to find specific dance types
3. Click "Directions" to get Google Maps directions to events
4. Use "Add to Calendar" to save events to your calendar

### For Event Organizers
1. Visit the "Submit Event" section on the website
2. Fill out the event submission form with complete details
3. Submit the form to automatically create a GitHub pull request
4. Admins will be notified and review your submission
5. Once approved, your event appears on the live site

### For Contributors/Developers
1. Clone this repository:
   ```bash
   git clone https://github.com/johandry/CubanSocial.git
   cd CubanSocial
   ```

2. Open `index.html` in your browser or serve locally:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Make your changes and submit a pull request

## 📝 Event Submission Process

### User Flow
1. **Fill Form**: User completes the event submission form
2. **Auto PR Creation**: Form generates a GitHub pull request with event data
3. **Admin Notification**: Admins receive GitHub notifications
4. **Review Process**: Admins use the review checklist to validate events
5. **Approval**: Approved events are moved from `events-pending/` to `events/`
6. **Go Live**: Merged PR makes the event visible on the website

### Event Data Schema
```json
{
  "id": "event-001",
  "name": "Salsa Night at Mango's",
  "date": "2025-07-25T20:00:00",
  "location": "Full address with city, state, zip",
  "maps_link": "https://maps.google.com/?q=...",
  "type": ["salsa", "bachata"],
  "music": "Live|DJ|Mixed",
  "price": "Free|$15|$20-25",
  "description": "Event description",
  "contact": "Contact information",
  "featured": true,
  "recurring": "weekly|monthly|biweekly"
}
```

## 🛠️ Admin Guide

### Review Checklist
When reviewing event submissions, check:
- [ ] Event name is descriptive and relevant
- [ ] Date and time are valid and in the future  
- [ ] Location includes full address and valid Google Maps link
- [ ] Dance type is accurate (salsa, timba, bachata, merengue, rueda)
- [ ] Event appears legitimate (not spam)
- [ ] Contact information is provided
- [ ] JSON is properly formatted

### Approval Process
1. **Review**: Check submission against the checklist
2. **Move File**: Move from `data/events-pending/` to `data/events/`
3. **Label**: Add `approved` label to PR
4. **Merge**: Merge PR to make event live

### Labels
- `event-submission`: Automatically added to event PRs
- `pending-review`: Awaiting admin review
- `approved`: Event approved and ready to merge
- `needs-revision`: Changes requested
- `rejected`: Event rejected
- `spam`: Spam submission

## 🎯 Featured Events

Events can be marked as featured or recurring for special visibility:

```json
{
  "featured": true,        // Shows in featured section
  "recurring": "weekly"    // Shows recurrence pattern
}
```

Featured events appear in a special highlighted section at the top of the site.

## 🎵 Music & Playlists

The platform can also feature curated playlists for different dance styles:

```json
{
  "id": "timba2025",
  "name": "Best Timba Tracks 2025",
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "spotify_url": "...",
      "youtube_url": "..."
    }
  ]
}
```

## 📊 Analytics & Insights

Event organizers and the community can benefit from:
- Event popularity tracking (via GitHub stars/views)
- Community engagement metrics
- Geographic distribution of events
- Dance type preferences

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes locally
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

### Event Contributions
- Use the website form to submit events
- Share the platform with event organizers
- Follow us on social media to stay updated

### Documentation
- Improve this README
- Add code comments
- Create user guides
- Translate content

## 📱 Mobile App Future

While currently a web application, the architecture supports future mobile app development:
- PWA (Progressive Web App) capabilities
- React Native/Flutter app using the same data structure
- Mobile-specific features like push notifications

## 🌍 Expansion Plans

The platform is designed for expansion beyond San Diego:
- Multi-city support with city-specific data directories
- Internationalization (i18n) support
- Regional admin teams
- Location-based event discovery

## 📞 Contact & Support

- **Website**: [Cuban Social](https://cubansocial.com)
- **Instagram**: [@CubanSocial.sd](https://www.instagram.com/cubansocial.sd/.sd)
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

---

**¡Vamos a bailar!** 💃🕺🇨🇺

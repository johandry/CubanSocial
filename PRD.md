

---

## 📝 Product Requirements Document (PRD)

**Product Name:** Cuban Social  
**Version:** MVP v0.3  
**Host Platform:** GitHub Pages (Static Site)  
**Data Contribution Method:** Pull Requests (PRs)

---

### 🧩 Core Updates to Architecture

#### 🔁 Contributor Workflow (Using GitHub PRs)

1. **User fills out a public form** (hosted statically using HTML/JS).
    
2. The form generates a pre-filled **GitHub Pull Request**:
    
    - The PR creates or modifies a file in `/events-pending/` (JSON or Markdown).
        
    - Each file contains full metadata for the event.
        
3. Admins receive notification (via GitHub or optionally via email webhook).
    
4. Admin **reviews**, and if approved:
    
    - Moves the file into `/events/` directory.
        
    - Rebuilds site locally or via GitHub Action.
        
    - Merges the PR → event appears on the live site.
        

---

### 🧑‍⚖️ Admin Review Process

Admins will review and approve event submissions through GitHub using the following method:

#### **Review Checklist:**

- ✅ Is the event name descriptive and relevant?
    
- ✅ Is the date and time valid and in the future?
    
- ✅ Does the location include a full address and valid Google Maps link?
    
- ✅ Is the type of dance accurate (e.g., Timba, Bachata, Merengue)?
    
- ✅ Is the event legitimate (not spam or low-effort)?
    

#### **How Admins Are Notified**

- A message on the form thank-you page will state:
    
    > “Your event has been submitted as a pull request. Admins are notified via GitHub. If you’d like to speed up the process, feel free to tag or message us on Instagram @cubansocial or email [cubansocial@gmail.com](mailto:cubansocial@gmail.com).”
    
- Optionally, you can add a GitHub webhook or use [GitHub Actions with email notifications](https://github.com/marketplace/actions/send-email) to alert admins.
    

---

### 🎯 Featured & Recurring Events

To highlight featured/recurring events at the top of the site:

#### In the Event JSON:

```json
{
  "id": "event-002",
  "name": "Rueda de la Calle",
  "date": "2025-07-26T18:00:00",
  "location": "Balboa Park, San Diego, CA",
  "maps_link": "https://maps.google.com/?q=Balboa+Park+San+Diego",
  "type": ["salsa", "timba"],
  "music": "Live",
  "price": "Free",
  "featured": true,
  "recurring": "weekly"
}
```

#### Behavior in UI:

- Events marked `"featured": true` or with a `"recurring"` value appear in a **sticky banner section** or **pinned card**at the top of list view and calendar.
    
- Recurring values could be `weekly`, `monthly`, etc., and generate automated duplicate entries client-side based on recurrence rules (optional for post-MVP).
    

---

### 🧱 Directory Structure (GitHub Repo)

```
/data
├── events/              # Approved events (live)
│   └── event-001.json
├── events-pending/      # Submitted via PR, pending approval
│   └── event-012.json
├── playlists/
│   └── timba2025.json
├── congresses/
│   └── sandiego2025.md
```

---

### ✅ Final Notes on PR Flow

- PR Template: GitHub will use a PR template that prompts reviewers with the checklist.
    
- Labeling: Admins can label PRs as `approved`, `needs-revision`, or `spam`.
    
- Approvals: Merge after moving content to the correct folder.
    

---

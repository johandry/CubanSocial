---
name: Event Submission
about: Submit a new dance event for review and approval
title: "Add event: [EVENT NAME]"
labels: event-submission, pending-review
assignees: ''
---

## 📅 Event Submission for Review

**Event Name:** 
**Date & Time:** 
**Location:** 
**Dance Type(s):** 
**Price:** 

---

## 🧑‍⚖️ Admin Review Checklist

Please review this event submission using the following criteria:

- [ ] **Event Name**: Is the event name descriptive and relevant?
- [ ] **Date & Time**: Is the date and time valid and in the future?
- [ ] **Location**: Does the location include a full address and valid Google Maps link?
- [ ] **Dance Type**: Is the type of dance accurate (e.g., Timba, Bachata, Merengue, Salsa)?
- [ ] **Legitimacy**: Is the event legitimate (not spam or low-effort)?
- [ ] **Contact Info**: Is contact information provided and appears valid?
- [ ] **Formatting**: Is the JSON file properly formatted?

---

## 📝 Admin Instructions

### To Approve:
1. Review the event details against the checklist above
2. If approved, move the file from `/data/events-pending/` to `/data/events/`
3. Add the `approved` label to this PR
4. Merge the PR to make the event live on the site

### To Request Changes:
1. Add the `needs-revision` label
2. Comment with specific requested changes
3. Request changes in the PR review

### To Reject:
1. Add the `rejected` or `spam` label
2. Close the PR without merging
3. Optionally, provide a reason in the comments

---

## 🔄 Automated Actions

- [ ] Event JSON file added to `/data/events-pending/`
- [ ] File follows proper naming convention (`event-[timestamp].json`)
- [ ] Required fields are present
- [ ] GitHub Actions will automatically validate the JSON structure

---

*This PR was automatically generated via the Cuban Social event submission form.*

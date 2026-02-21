# Lifely Frontend Specifications for Mentors and Members

**Purpose:** Consolidated product requirements and interface specifications for mentors and members. This document describes interfaces, components, and functionality without implementation details.

**Audience:** Mentors, Members, Product team, Design team

**Source:** `/opt/Lifely/docs/ui-design`, `/opt/Lifely/docs/USECASES-FULL`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Management & Profiles](#2-user-management--profiles)
3. [Mentor Matching](#3-mentor-matching)
4. [Reviews](#4-reviews)
5. [Scheduling & Booking](#5-scheduling--booking)
6. [Session Management](#6-session-management)
7. [Payments](#7-payments)
8. [Notifications](#8-notifications)
9. [Health Status Tracking](#9-health-status-tracking)
10. [Educational Content](#10-educational-content)
11. [Journal](#11-journal)
12. [Consent & Privacy](#12-consent--privacy)
13. [Homepage & Navigation](#13-homepage--navigation)
14. [Settings](#14-settings)
15. [Design Principles](#15-design-principles)

---

## Implementation Status Checklist (Route Readiness)

Legend:
- `[x]` route exists in app
- `[ ]` route is not implemented yet
- `partial` route exists but functional scope is incomplete

### Authentication
- [x] Registration
- [x] Login
- [x] Email Verification
- [ ] Forgot Username
- [x] Forgot Password
- [x] Password Reset Confirmation
- [ ] Change Password (dedicated authenticated screen)

### User Management & Profiles
- [x] User Type Selection & Account Creation (Onboarding role selection + account flow)
- [ ] Mentor Profile Creation (partial)
- [ ] Patient Profile Creation (partial)
- [ ] Welcome & Completion (Mentor) (partial)
- [ ] Mentor Profile Edit (partial)
- [ ] Profile View (partial)

### Mentor Matching
- [ ] Mentor Matching Page (partial)
- [ ] Mentor Search Page (partial)
- [ ] Favorites Page (partial)
- [ ] Mentor Profile Modal (partial via profile routes)

### Reviews
- [ ] Reviews (Mentor View) (partial)
- [ ] Post-Session Rating (partial)

### Scheduling & Booking
- [ ] Set Availability (partial)
- [ ] Block Time Slots (partial)
- [ ] Mentor Availability View (partial)
- [ ] Book Session (partial)
- [ ] Booking Confirmation (partial)
- [ ] My Bookings (partial)

### Session Management
- [ ] Session Preparation (partial)
- [ ] Session Join (partial)
- [ ] Session Waiting Room (partial)
- [ ] Session Room (partial)
- [ ] Post-Session Summary (partial)
- [ ] End Session (partial)

### Payments
- [ ] Credit Purchase (partial)
- [ ] Credit Balance Widget (partial)
- [ ] Transaction History (partial)
- [ ] Transaction Detail (partial)
- [ ] Mentor Payout Dashboard (partial)

### Notifications
- [ ] Notification Bell (Header)
- [ ] Notification Center (partial)

### Health Status Tracking
- [ ] Health Metrics Overview (partial)
- [ ] Health Metric Entry (partial)
- [ ] Wellness Dashboard (partial)
- [ ] Mood Entry (partial)
- [ ] Mood History (partial)
- [ ] Medication Adherence (partial)
- [ ] Medication Settings (partial)
- [ ] Sharing Settings (partial)
- [ ] Data Export (partial)

### Educational Content
- [ ] Content Library (partial)
- [ ] Content Detail (partial)
- [ ] Mentor Content Sharing (partial)

### Journal
- [ ] Journal Entry List (partial)
- [ ] Journal Entry Detail (partial)
- [ ] Create/Edit Journal Entry (partial)

### Consent & Privacy
- [ ] Privacy Settings (partial)
- [ ] Consent History (partial)

### Homepage & Navigation
- [ ] Homepage (Mentor Dashboard) (partial)
- [ ] Homepage (Member Dashboard) (partial)

### Settings
- [ ] Settings (partial)
- [ ] Availability (Settings section for Mentor) (partial)

---

## 1. Authentication

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Registration** | Create account: select Member/Mentor, agree to mentor criteria (if Mentor), enter email/password, accept Terms and Privacy | Unauthenticated |
| **Login** | Sign in with email/username and password | Unauthenticated |
| **Email Verification** | Verify email via magic link or 6-digit code | Pending verification |
| **Forgot Username** | Recover username via email | Unauthenticated |
| **Forgot Password** | Initiate password reset via email | Unauthenticated |
| **Password Reset Confirmation** | Set new password with reset token | Unauthenticated |
| **Change Password** | Change password for authenticated user (identity confirmation + new password) | Authenticated |

### Key Functionality

- **Registration:** User type selection (Member/Mentor), mentor criteria agreement (if Mentor), password strength validation, Terms/Privacy acceptance, optional marketing consent.
- **Login:** Email or username + password. CAPTCHA after 5 failed attempts. Account lockout after 5 failures (30 min).
- **Email Verification:** Magic link or 6-digit code. Resend with 30s cooldown.
- **Password:** Strength meter, requirements checklist (8+ chars, uppercase, lowercase, number, special char). Show/hide toggle.
- **Security:** Generic error messages (no email enumeration). CAPTCHA when required.

### Components

- UserTypeSelector, MentorCriteriaCard, EmailInput, PasswordInput, PasswordStrengthMeter, PasswordRequirementsChecklist, CodeInput, CAPTCHAComponent, AccountLockoutMessage.

---

## 2. User Management & Profiles

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **User Type Selection & Account Creation** | Select Member/Mentor, agree mentor criteria, create credentials | Unauthenticated |
| **Mentor Profile Creation** | Multi-step profile: personal info, contact, photo, skills & pitch, availability, payment, legal | Mentor (onboarding) |
| **Patient Profile Creation** | Patient-specific profile creation | Member (onboarding) |
| **Welcome & Completion** | Post-onboarding welcome, next steps, links to training and profile | Mentor |
| **Mentor Profile Edit** | Edit profile: Personal, Payment, Availability (read-only, links to Scheduling) | Mentor |
| **Profile View** | View mentor profile (own or other): photo, name, rating, pitch, about, skills, availability | Mentor, Member |

### Key Functionality

- **Onboarding:** Mentor onboarding is mandatory; Member onboarding is optional with reminders.
- **Profile Creation:** Cards for personal info, contact, photo upload (drag-and-drop, crop), skills (tags), pitch (500 chars), availability, payment info, legal documents.
- **Profile Edit:** Tabs for Personal, Payment, Availability. Availability managed in Scheduling.
- **Profile View:** Rating (5 stars), reviews link, pitch, about (location, languages, diabetes type, gender, ethnicity), skills, availability summary.

### Components

- TextInput, TextArea, Select, MultiSelect, PhoneInput, EmailInput, PasswordInput, FileUpload (photo), TagInput, Checkbox, RadioGroup, DatePicker, TimePicker, Card, Tabs, Stepper, Avatar, Badge, PrimaryButton, SecondaryButton, LinkButton.

---

## 3. Mentor Matching

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Mentor Matching Page** | Personalized mentor suggestions by compatibility score | Member |
| **Mentor Search Page** | Advanced search with filters (skills, languages, location, rating, availability) | Member |
| **Favorites Page** | List of favorited mentors | Member |
| **Mentor Profile Modal** | Detailed mentor info: photo, rating, bio, skills, languages, availability, actions | Member |

### Key Functionality

- **Matching:** System suggests mentors ordered by compatibility score. Top 5 shown first, "view more" for infinite scroll.
- **Search:** Filters: skills, languages, location (max distance), minimum rating. Apply/Clear filters.
- **Favorites:** Add/remove mentors from favorites. Quick access to schedule sessions.
- **Mentor Selection:** Members choose mentors; mentors can only accept or decline match requests. Mentors can hide profile from new members.
- **Changing Mentor (MVP):** Stop booking with one mentor and start with another. Post-MVP: formal "unmatch" with data access revocation.

### Components

- MentorCard, CompatibilityScoreBadge, FilterPanel, FilterChip, SearchInput, PaginationControls, FavoriteButton, VerificationBadge, EmptyState, LoadingSkeleton.

---

## 4. Reviews

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Reviews (Mentor View)** | View member reviews, optionally respond | Mentor |
| **Post-Session Rating** | Rate mentor: stars, comments, one randomized question | Member |

### Key Functionality

- **Mentor Reviews:** Mentors see reviews from members. Option to respond. Screen specification to be finalized.
- **Post-Session Rating:** After session, member sees: 5-star rating, comments field, one randomized question (for diverse feedback in MVP). "Skip for now" option. Format matches other forms in the app.

### Components

- ReviewCard, ReviewList, RatingInput, RatingDisplay, CommentInput, ResponseEditor.

---

## 5. Scheduling & Booking

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Set Availability** | Mentor sets weekly recurring availability, session duration, buffer, calendar sync | Mentor |
| **Block Time Slots** | Mentor blocks specific time periods (unavailable) | Mentor |
| **Mentor Availability View** | Member views mentor availability calendar and selects slot | Member |
| **Book Session** | Confirm session details, preferences, credits, book | Member |
| **Booking Confirmation** | Confirmation, email notification, next steps (prepare for session, schedule another) | Member |
| **My Bookings** | List of upcoming, past, cancelled sessions with filter (status, mentor) | Member, Mentor |

### Key Functionality

- **Availability:** Weekly recurring schedule, session duration (30/60/90 min), buffer time, max sessions/day. Block specific slots when unavailable. Sync with Google/Apple calendar; popup/modal explains connection process. Availability shown in editable mode (no separate Edit button).
- **Booking:** Calendar shows only available slots (no booked slots). Dropdown to switch between connected mentors' availability. Alternative: traditional form with date/time fields. Session details: mentor, date, time, duration. Credits: cost and remaining balance. If insufficient credits: link to purchase.
- **My Bookings:** Single list with dropdown filter (upcoming/past/cancelled, by mentor). Past sessions: links to transcript and summary instead of reschedule/cancel.
- **Rules:** Members book and pay. Mentors cannot book. No pending/confirmed buttons—sessions auto-added to calendar. Reschedule/cancel per cancellation policy.
- **Booking Page:** Links "view profile" and "message mentor" under mentor name. Planning buttons at bottom.

### Components

- AvailabilityScheduleForm, TimeSlotSelector, SlotBlockingDialog, AvailabilityCalendar, TimeSlotGrid, BookingForm, BookingCard, CreditBalanceDisplay, DateRangeSelector, FilterButton, RescheduleForm, CancelSessionForm.

---

## 6. Session Management

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Session Preparation** | Device tests (camera, mic, speaker, network), recording/transcription consent | Mentor, Member |
| **Session Join** | Secure join with validation and device optimization | Mentor, Member |
| **Session Waiting Room** | Wait for other participant, video preview, participant status | Mentor, Member |
| **Session Room** | Video call: participants, controls, AI insights (mentor), shared notes | Mentor, Member |
| **Post-Session Summary** | Summary, key topics, action items, recording, transcript, billing | Mentor, Member |
| **End Session** | Single "End Session" button; different popups for normal/early/emergency termination | Mentor, Member |

### Key Functionality

- **Preparation:** Full-screen with left navigation. Device tests: camera, microphone, speaker, network. Recording/transcription consent (covered by Terms). Join enabled when tests pass.
- **Session Room:** Video grid, controls (mute, video, screen share, end). AI insights panel (mentor only, collapsible, chat-style prompts). Shared notes. Compliance alerts (e.g., sharing contact info) shown inline in AI panel with policy violation notice. Navigation hidden during meeting.
- **End Session:** One "End Session" button. Popups vary: planned end, early end, unscheduled/emergency. AI can emergency-terminate only in extreme cases (e.g., self-harm promotion) with documentation.
- **Crisis Detection:** Alert with "start emergency protocol" button. Mentor must initiate. 911 button only in identified crisis situations. In MVP: no personal info shared even in crisis. Tamata document defines crisis categories.

- **Traffic Light (MVP):** Red/Yellow/Green session scoring is NOT displayed to users. Data collected for analysis; mentors receive prompts about red/yellow events, but overall score is hidden (risk of misinterpretation).
- **Post-Session:** Mentor approves summary first; status "pending" or "delivered". Action items as interactive checkboxes. Key moments with quotes and links to transcript. Health signals section if relevant. Separate journal/history page for past sessions.
- **Pre-Session:** Questionnaire sent 24h before (optional). AI summary uses last 3 sessions + questionnaire + health metrics. Incomplete questionnaire: use last sessions, note in summary.

### Components

- VideoPlayer, SessionControlsBar, AudioControls, VideoControls, ScreenShareButton, EndSessionButton, AIInsightsPanel, SharedNotesEditor, RecordingIndicator, SessionTimer, ConnectionQualityIndicator, ConsentCheckbox, DeviceTestForm, ParticipantStatusCard.

---

## 7. Payments

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Credit Purchase** | Buy credits: select package (5/10/20), payment form, order summary, security indicators | Member |
| **Credit Balance Widget** | Display available/reserved credits, quick buy, low balance warning | Member |
| **Transaction History** | List of purchases, consumption, refunds with filters | Member |
| **Transaction Detail** | Transaction details, receipt download/email | Member |
| **Mentor Payout Dashboard** | Earnings, pending invoice, payout history, payment method | Mentor |

### Key Functionality

- **Purchase:** Package selection, Stripe payment, Terms/Privacy acceptance. 3D Secure when required. Success: receipt preview, redirect to history.
- **Balance Widget:** Available, reserved, total. "Buy Credits" and "View History". Low balance warning (< 3 credits).
- **Transaction History:** Filter by type, date, status. View receipt for purchases.
- **Mentor Payout:** Current period earnings, next payout date, pending invoice (review & approve), payout history, payment method.
- **Mobile:** Google/Apple Wallet options only in native app, not mobile web.

### Components

- CreditPackageCard, CreditBalanceDisplay, StripePaymentForm, OrderSummary, TransactionList, TransactionDetail, PayoutInvoiceCard, EarningsSummary, PaymentStatusBadge, ReceiptViewer.

---

## 8. Notifications

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Notification Bell (Header)** | Bell icon with unread badge, opens Notification Center | All |
| **Notification Center** | List of notifications: "New" and "All" tabs, bulk actions (mark read, delete) | All |
| **Notification Preferences** | Configure channels (email, text) by category; checkboxes | All |

### Key Functionality

- **Categories:** Reminders, Messages (mentor/member), Informational (reviews, profile views), Payments, AI-prompted. Marketing as "beta feedback" (optional).
- **Channels:** Email, text. Push/in-app labels hidden for MVP (no mobile app yet). Channel selection at group level for MVP.
- **Display:** Notification Center (bell click) and full-width reminders on homepage (e.g., session reminder).
- **Preferences:** Grouped by category. Checkboxes (not switches). "Saved successfully" feedback. No Quiet Hours (device-level).
- **Compliance:** All notifications include "unsubscribe" or "manage preferences" (CAN-SPAM).

### Components

- NotificationBell, NotificationBadge, NotificationList, NotificationItem, NotificationFilterTabs, NotificationBulkActions, ChannelPreferenceToggle, UndoSnackbar.

---

## 9. Health Status Tracking

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Health Metrics Overview** | Trends and overview before entry forms | Member |
| **Health Metric Entry** | Bite-size entry: one metric at a time (glucose, sleep, meals, activity, etc.) | Member |
| **Wellness Dashboard** | One graph with toggle for metrics; "Add today's information" button; data table | Member |
| **Mood Entry** | Wong-Baker Faces Scale (0-5), optional notes, symptoms, energy/stress | Member |
| **Mood History** | Mood entries with filters, pagination, trends | Member |
| **Mood Reminders Config** | Reminder times, channels | Member |
| **Medication Settings** | Configure medications, dosages, schedules (separate settings page) | Member |
| **Medication Adherence** | Record taken: on-time, late, early, missed | Member |
| **Sharing Settings** | Share health data with mentor (all vs future entries) | Member |
| **Health Data Export** | Export to PDF/Excel, select categories and date range | Member |

### Key Functionality

- **Entry:** Bite-size (one metric at a time). Multiple entries per day for glucose, sleep, meals, activity. "Add today's information" opens comprehensive form with 5 categories: Diabetes, Food and Water, Lifestyle, Emotional Health, Severe Symptoms.
- **Dashboard:** One graph with toggle (glucose, exercise, medication, mood). AI summary above graph. Data table below. Edit past entries within 48 hours.
- **Medication:** Settings page for name, dosage, frequency, time. Notification-driven logging: select medication, mark on-time/late/early/missed. One line per medication on adherence graph; vertical dashed line for dosage changes.
- **Metrics:** Glucose (Fasting/Random), HbA1c (quarterly, AI prompts every 3 months), sleep, meals, activity, mood, stress, energy, medication adherence, weight, hydration, blood pressure, etc.
- **Notifications:** Medication and glucose—scheduled. Others—combined end-of-day (opt-in).
- **Export:** Select metric categories (all selected by default), date range, PDF or Excel.

### Components

- MetricSelector, GlucoseInput, MealTimingInput, SleepInput, ActivityInput, WellbeingMeter, WongBakerFacesScale, MedicationSettingsForm, MedicationList, AdherenceRecordButton, ToggleableMetricChart, MetricDataTable, CalendarHeatmap, SharingToggle, ExportFormatSelector.

---

## 10. Educational Content

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Content Library** | Browse content by topic, format, filters | Member, Mentor |
| **Content Item Detail** | View article, video, quiz; mark complete | Member, Mentor |
| **Content Search** | Search with filters | Member, Mentor |
| **Share Content** | Mentor shares content with assigned members, adds context | Mentor |

### Key Functionality

- **Library:** Browse by topic, format. Mentor-only training materials. Content cards with thumbnail, title, metadata, progress.
- **Detail:** Full content display. Mark complete with optional feedback. Bookmark.
- **Search:** Text search, filters.
- **Sharing:** Mentor selects member, adds context/annotations. Member receives shared content notification.

### Components

- ContentCard, ContentList, ContentDetailView, ContentThumbnail, ContentProgressIndicator, ContentFilterPanel, SearchInput, BookmarkButton, ShareButton, CompleteButton, ShareContentModal, MemberSelector.

---

## 11. Journal

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Journal Entry List** | Chronological list of entries (mood, manual, session notes) | Member |
| **Entry Detail** | View, edit, delete journal entry | Member |
| **Entry Creation** | Create manual journal entry (text, tags) | Member |

### Key Functionality

- **Entries:** Mood entries from Health Tracking auto-appear. Manual entries. Session notes linked.
- **Filtering:** By type (mood, manual, session), date range, tags.
- **Search:** Full-text search.
- **Integration:** Health Status Tracking, Session Management, Consent & Privacy (PHI).

### Components

- JournalEntryList, MoodEntryCard, ManualEntryCard, EntryDetailModal, EntryFilterPanel, EntrySearchBar.

---

## 12. Consent & Privacy

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Privacy Settings** | Granular consent toggles, consent history, sharing controls | All |
| **Data Export (DSAR)** | Request data export, select categories, track status, download | All |
| **Right to Deletion** | Request account deletion with warning, 10-day cancellation period | All |

### Key Functionality

- **Consent:** Toggle consent by purpose. Consent history with timestamps. Warnings when withdrawing critical consents.
- **Data Export:** Select categories, date range. PDF default. Message: "When ready, link will be sent to email." No separate export history page.
- **Account Deletion:** Modal with confirmation checkbox. 10-day period to cancel. Personal data anonymized; behavioral data kept anonymized.
- **Note:** No separate Privacy Settings page for session recordings/transcripts/AI—accepted via Terms.

### Components

- ConsentToggle, ConsentHistory, ConsentCategoryCard, DataExportRequestForm, DeletionWarningModal, ConsentStatusBadge.

---

## 13. Homepage & Navigation

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Homepage** | Dashboard with Today's Schedule Card, notifications, quick actions | Mentor, Member |
| **Initial Setup Guide** | First-time login guide: profile completion, key features | New users |

### Key Functionality

- **Today's Schedule Card:** Specification to be created. Shows upcoming sessions.
- **Notifications:** Full-width reminders (e.g., session reminder) on homepage.
- **Navigation:** Header, footer, side menu. Hamburger menu on mobile.
- **Layout:** Full-screen content; focused layout for onboarding stages.

### Components

- TodayScheduleCard, NotificationBanner, NavigationHeader, Footer, SideMenu.

---

## 14. Settings

### Screens

| Screen | Purpose | User Role |
|--------|---------|-----------|
| **Settings** | Account Info, Security and Login, Payments, Preferences | All |
| **Account Info** | Personal info, view profile | All |
| **Security and Login** | Change password, session management | All |
| **Payments** | Payment methods, credit management | All |
| **Preferences** | Availability (mentors), notification preferences | All |
| **Availability** | Inline in Settings; editable by default | Mentor |

### Key Functionality

- **Structure:** Cards for Account Info, Security and Login, Payments, Preferences. On mobile: stacked; on desktop: row.
- **Availability:** Section within Settings, not separate screen. Editable by default (no Edit button).
- **Notifications:** Dedicated notification section; config by category.

### Components

- SettingsCard, AccountInfoSection, SecuritySection, PaymentsSection, PreferencesSection, AvailabilityEditor.

---

## 15. Design Principles

### User-Centered Design

- **Clarity:** Clear labels, helpful messages, intuitive navigation.
- **Efficiency:** Minimize steps, smart defaults, autosave where appropriate.
- **Feedback:** Real-time validation, clear errors, success confirmations.
- **Error Recovery:** Graceful handling, retry options, actionable messages.

### Accessibility

- **WCAG 2.1 AA** for all screens.
- **Keyboard navigation** for all interactive elements.
- **Screen reader support** with ARIA labels and announcements.
- **Touch targets** minimum 44×44px.
- **Color contrast** minimum 4.5:1 for text.

### Responsive Design

- **Mobile-first.** Breakpoints: Mobile <768px, Tablet 768–1199px, Desktop ≥1200px.
- **Adaptive layouts:** Single column on mobile, multi-column on desktop.
- **Hamburger menu** on mobile; full nav on desktop.

### Consistency

- **Casey UI** design system: Brand Purple (#a11692), Interaction Blue (#1b73bb), no shadows.
- **Buttons:** Primary (blue), Secondary (outline), Cancel (text link, red).
- **Forms:** One card per form where possible; consistent button placement.

### Security & Trust

- **Payment:** PCI compliance, Stripe, no card storage. Security indicators on purchase screens.
- **Authentication:** CAPTCHA, lockout, generic error messages.
- **Privacy:** Clear consent, data export, deletion with 10-day cancellation.

---

## Appendix: Key Design Decisions (from MEETS)

- **Mentor Matching:** Members choose; mentors accept/decline. Mentors can hide from new members.
- **Reviews:** Mentors view and can respond to member reviews. Post-session rating: stars, comments, one randomized question, "Skip for now."
- **Scheduling:** No pending/confirmed—sessions auto-added. Calendar shows only available slots. Block time slots for mentors. Calendar sync: popup explains Google/Apple connection.
- **Session End:** Single "End Session" button; context-specific popups.
- **Session AI:** Traffic light scoring NOT shown to users in MVP. Compliance alerts inline in AI panel. Crisis detection: mentor initiates emergency protocol; 911 only in identified crisis.
- **Post-Session Summary:** Mentor approval required; action items as checkboxes; quotes link to transcript.
- **Health Dashboard:** One graph with metric toggle; "Add today's information" for comprehensive entry.
- **Notifications:** By category; channel selection at group level; checkboxes.
- **Account Deletion:** Modal, 10-day cancellation, anonymization explained.
- **Data Export:** PDF default; email notification when ready.

---

*Document generated from ui-design and USECASES-FULL. Last updated: 2026-02-18.*

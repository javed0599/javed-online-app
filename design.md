# Labor Result Checker - Mobile App Design

## Screen List

1. **Home Screen** - Main entry point with passport search and list of saved entries
2. **Search/Add Screen** - Input fields for passport number and occupation code
3. **Result Detail Screen** - Display exam result with all details (status, date, center, etc.)
4. **Entry History Screen** - Timeline of check history for a specific passport entry
5. **Settings Screen** - Dark mode toggle, notification preferences, app settings

## Primary Content and Functionality

### Home Screen
- List of saved passport entries with latest result status
- Each entry shows: passport number, exam status (passed/failed), last check time
- Quick action buttons: check now, view details, delete
- Floating action button to add new entry
- Dark mode toggle in header
- Pull-to-refresh to update all entries

### Search/Add Screen
- Input field for passport number (e.g., A21082162)
- Input field for occupation code (e.g., 933301)
- Optional: nationality code selector (default: BGD)
- Submit button to fetch results from API
- Loading state while fetching
- Error handling with retry option

### Result Detail Screen
- Large status indicator (passed/failed) with icon and color
- Card layout displaying:
  - Passport number
  - Exam date (formatted)
  - Test center name
  - Occupation key
  - Nationality code
- Action buttons: Add referral note, Mark for follow-up, Delete, Share
- History section showing last check time and check count
- Edit/update button to re-check status

### Entry History Screen
- Timeline view of all status checks for a passport
- Each entry shows: check timestamp, result status, test center
- Referral notes section with add/edit/delete capability
- Export history option

### Settings Screen
- Dark mode toggle with preview
- Notification preferences (enable/disable, check interval)
- About section

## Key User Flows

### Flow 1: Add and Check New Passport
1. User taps floating action button on Home
2. Navigate to Search/Add Screen
3. User enters passport number and occupation code
4. User taps "Check Status"
5. App calls API and fetches result
6. Display Result Detail Screen with result
7. User taps "Save" to add to home list
8. Return to Home Screen with new entry

### Flow 2: View Saved Entry Details
1. User taps entry on Home Screen
2. Navigate to Result Detail Screen
3. Display latest result and history
4. User can add referral notes or update status
5. User can delete entry with confirmation

### Flow 3: Update Status (Re-check)
1. User on Result Detail Screen
2. User taps "Update Status" button
3. App calls API with same passport/occupation
4. Display new result with timestamp
5. Add entry to history timeline

### Flow 4: Add Referral Note
1. User on Result Detail Screen or History Screen
2. User taps "Add Referral Note"
3. Modal/sheet appears with text input
4. User enters note and taps "Save"
5. Note is saved and displayed in history

## Color Choices

### Light Mode Palette
- **Primary**: #0a7ea4 (Teal) - Main accent, buttons, status indicators
- **Background**: #ffffff (White) - Screen background
- **Surface**: #f5f5f5 (Light Gray) - Cards, elevated surfaces
- **Foreground**: #11181c (Dark Gray) - Primary text
- **Muted**: #687076 (Medium Gray) - Secondary text
- **Success**: #22c55e (Green) - Passed status
- **Error**: #ef4444 (Red) - Failed status
- **Border**: #e5e7eb (Light Gray) - Dividers

### Dark Mode Palette
- **Primary**: #0a7ea4 (Teal) - Unchanged
- **Background**: #151718 (Very Dark Gray) - Screen background
- **Surface**: #1e2022 (Dark Gray) - Cards, elevated surfaces
- **Foreground**: #ecedee (Light Gray) - Primary text
- **Muted**: #9ba1a6 (Medium Gray) - Secondary text
- **Success**: #4ade80 (Light Green) - Passed status
- **Error**: #f87171 (Light Red) - Failed status
- **Border**: #334155 (Dark Gray) - Dividers

## 3D Design Elements

- **Card Elevation**: Use subtle shadows and depth to create layered appearance
- **Status Indicators**: Large, prominent badges with icons (checkmark for passed, X for failed)
- **Transitions**: Smooth animations when navigating between screens
- **Glass Morphism**: Subtle frosted glass effect on overlay modals
- **Micro-interactions**: Haptic feedback on button presses, scale animations on tap

# Travel Designer Tool - Setup Guide

This guide will help you set up and run the Travel Designer Tool feature in your Travel Atlas application.

## Overview

The Travel Designer Tool consists of three main pages:

1. **Dashboard (Page 1)**: View saved itineraries and browse Atlas Files
2. **Create Itinerary (Page 2)**: Set travel preferences and generate AI-powered itineraries
3. **Planner (Page 3)**: AI Assistant + Drag-and-Drop itinerary builder

## Prerequisites

- Node.js >= 18.0.0
- Supabase account with a configured project
- Backend and frontend environments set up

## Database Setup

### 1. Run the Updated Schema

Execute the SQL in [/Users/alixbinard/travel-atlas/supabase/seed.sql](/Users/alixbinard/travel-atlas/supabase/seed.sql) in your Supabase SQL Editor. This creates:

- `itineraries` - User-created trip plans
- `activities` - Daily activities within itineraries
- `accommodations` - Hotel/lodging information
- `atlas_files` - Curated travel inspiration content
- `ai_conversations` - Chat history with AI assistant

### 2. Verify Tables and RLS Policies

Ensure all tables are created with Row Level Security (RLS) enabled and appropriate policies.

## Frontend Dependencies

The following packages have been installed:

```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-datepicker lucide-react
```

- **@dnd-kit**: Drag-and-drop functionality for the planner
- **react-datepicker**: Date selection in the creation form
- **lucide-react**: Icon library

## File Structure

### New Files Created

```
frontend/src/
├── constants/
│   └── travelerProfiles.js          # Traveler profiles, pace, budget configs
├── components/
│   └── planner/
│       ├── AIAssistant.js           # Left panel - AI chat interface
│       └── DragDropPlanner.js       # Right panel - Itinerary builder
└── pages/
    ├── TravelDesignerDashboard.js   # Page 1 - Dashboard
    ├── CreateItineraryPage.js       # Page 2 - Preference form
    └── PlannerPage.js               # Page 3 - Main planner interface

backend/src/
└── server.js                         # Updated with AI endpoints
```

## Routes

Updated routes in [App.js](/Users/alixbinard/travel-atlas/frontend/src/App.js):

- `/designer` - Dashboard with saved itineraries
- `/designer/create` - Create new itinerary form
- `/designer/planner/:id` - Planner interface
- `/designer/edit/:id` - Edit existing itinerary

## Configuration

### Environment Variables

Ensure your `.env` files are configured:

**Frontend (.env)**
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:3001
```

**Backend (.env)**
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

### 1. Start the Backend

```bash
cd backend
npm install  # if not already done
npm run dev
```

The backend will run on `http://localhost:3001`

### 2. Start the Frontend

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

### 3. Test the Flow

1. Navigate to `/designer` to see the dashboard
2. Click "Start Planning" to create a new itinerary
3. Fill out the preference form:
   - Enter destination (e.g., "Tokyo, Japan")
   - Set trip length
   - Select travel pace
   - Choose budget level
   - Select 1-4 traveler profiles
4. Click "Generate My Itinerary"
5. You'll be taken to the planner interface with:
   - AI Assistant on the left (generating suggestions)
   - Drag-and-drop planner on the right

## Key Features

### Dashboard Features
- View all saved itineraries
- Duplicate, edit, or delete itineraries
- Browse curated Atlas Files
- Quick access to create new trips

### Itinerary Creation Features
- Destination input with autosuggest (future)
- Trip length customization (1-365 days)
- Flexible or fixed date selection
- 5 travel pace options (relaxed to packed)
- 4 budget levels ($ to $$$$)
- 11 traveler profile types:
  - Active Globetrotter 🧗🏻‍♂️
  - Eco-Conscious 🦜
  - Van Lifer 🚐
  - Off-the-Grid 🏕
  - Digital Nomad 💻
  - Wellness 🧘‍♂️
  - Backpacker 🎒
  - Cultural Explorer 🗺
  - Beach Bum 🏝
  - Nature Lover 🌳
  - Family Traveler 👨‍👩‍👧

### Planner Features
- **AI Assistant**:
  - Generates initial itinerary based on preferences
  - Chat interface for adjustments
  - Draggable activity suggestions
  - Quick action prompts

- **Drag-and-Drop Planner**:
  - Day-by-day timeline view
  - Drag activities from AI or between days
  - Edit/delete activities
  - Add custom activities
  - Map view (coming soon)

- **Actions**:
  - Auto-save functionality
  - Share itinerary (generates link)
  - Export to PDF/calendar (coming soon)

## AI Integration (Next Steps)

The current implementation uses mock AI responses. To integrate real AI:

### Option 1: OpenAI Integration

```bash
cd backend
npm install openai
```

Update [backend/src/server.js](/Users/alixbinard/travel-atlas/backend/src/server.js):

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/ai/generate-itinerary', async (req, res) => {
  const { destination, tripLength, travelPace, budget, travelerProfiles } = req.body;

  const prompt = `Create a ${tripLength}-day itinerary for ${destination}...`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });

  // Parse response and return
});
```

### Option 2: Anthropic Claude Integration

```bash
cd backend
npm install @anthropic-ai/sdk
```

Similar implementation using Claude API.

## Troubleshooting

### Database Issues
- Ensure RLS policies are correctly set
- Check that auth.users table exists
- Verify Supabase connection strings

### Frontend Issues
- Clear browser cache
- Check browser console for errors
- Verify API_URL points to backend

### Backend Issues
- Check PORT is not already in use
- Verify CORS is configured correctly
- Check Supabase credentials

## Future Enhancements

- [ ] Real AI integration (OpenAI/Anthropic)
- [ ] Map view with geolocation
- [ ] PDF export functionality
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] Collaborative planning (multi-user)
- [ ] Offline mode
- [ ] Mobile responsive design improvements
- [ ] Activity search and filters
- [ ] Budget tracking
- [ ] Weather integration
- [ ] Booking integrations (affiliate links)

## Support

For issues or questions, please check the main [README.md](/Users/alixbinard/travel-atlas/README.md) or create an issue in the repository.

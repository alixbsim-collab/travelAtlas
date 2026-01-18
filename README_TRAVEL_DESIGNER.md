# 🌍 Travel Atlas - Travel Designer Tool

## ⚡ Quick Start

**Deploy in 5 minutes:**

```bash
# 1. Execute SQL in Supabase Dashboard
#    Copy from: supabase/seed.sql

# 2. Deploy to Cloudflare
cd /Users/alixbinard/travel-atlas
./deploy-cloudflare.sh

# 3. Set environment variables in Cloudflare Dashboard
#    See QUICK_START.md for details

# 4. Visit your site
open https://travel-atlas.pages.dev/designer
```

**📖 Full documentation:** See [QUICK_START.md](QUICK_START.md)

---

## 🎨 What's New: Travel Designer Tool

### Three Powerful Pages

#### 🏠 Page 1: Dashboard (`/designer`)
- View all saved itineraries
- Quick edit, duplicate, delete actions
- Browse curated Atlas Files for inspiration
- Beautiful card-based layout

#### ✍️ Page 2: Create Itinerary (`/designer/create`)
- Smart preference form
- 11 traveler profiles to choose from:
  - 🧗🏻‍♂️ Active Globetrotter
  - 🦜 Eco-Conscious
  - 🚐 Van Lifer
  - 🏕 Off-the-Grid
  - 💻 Digital Nomad
  - 🧘‍♂️ Wellness
  - 🎒 Backpacker
  - 🗺 Cultural Explorer
  - 🏝 Beach Bum
  - 🌳 Nature Lover
  - 👨‍👩‍👧 Family Traveler
- 5 travel pace options (Relaxed → Packed)
- 4 budget levels ($ → $$$$)
- Flexible date selection

#### 🤖 Page 3: AI Planner (`/designer/planner/:id`)
**Split-screen interface:**
- **Left**: AI Travel Assistant
  - Natural language chat
  - Generates personalized itineraries
  - Draggable activity suggestions
  - Quick action prompts

- **Right**: Drag-and-Drop Planner
  - Day-by-day timeline view
  - Sortable activities
  - Edit/delete capabilities
  - Map view (coming soon)
  - Custom notes

### Features

✅ AI-powered itinerary generation (mock, ready for real AI)
✅ Intuitive drag-and-drop interface
✅ Multi-day trip planning
✅ Activity categorization (food, culture, nature, etc.)
✅ Budget and time tracking
✅ Save, edit, duplicate itineraries
✅ Share functionality
✅ Export ready (PDF, calendar)

---

## 🏗️ Architecture

```
User → Cloudflare Pages (React) → Supabase (Database)
                ↓
        Render.com (API) → AI Service (Future)
```

**Full architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 📁 Project Structure

```
travel-atlas/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TravelDesignerDashboard.js    # Page 1
│   │   │   ├── CreateItineraryPage.js        # Page 2
│   │   │   └── PlannerPage.js                # Page 3
│   │   ├── components/
│   │   │   └── planner/
│   │   │       ├── AIAssistant.js            # Chat interface
│   │   │       └── DragDropPlanner.js        # Timeline view
│   │   └── constants/
│   │       └── travelerProfiles.js           # Configuration
│   └── build/                   # Production build
│
├── backend/                     # Express API
│   └── src/
│       └── server.js            # AI endpoints
│
├── supabase/                    # Database
│   └── seed.sql                 # Schema + RLS policies
│
└── docs/                        # Documentation
    ├── QUICK_START.md
    ├── DEPLOYMENT_CHECKLIST.md
    ├── CLOUDFLARE_DEPLOYMENT.md
    ├── TRAVEL_DESIGNER_SETUP.md
    └── ARCHITECTURE.md
```

---

## 🗄️ Database Schema

**5 new tables:**
- `itineraries` - Trip data with preferences
- `activities` - Daily activities
- `accommodations` - Lodging information
- `atlas_files` - Curated inspiration
- `ai_conversations` - Chat history

**Features:**
- Row Level Security (RLS)
- User-based access control
- Optimized indexes
- Real-time ready

**Migration:** Execute `supabase/seed.sql` in Supabase SQL Editor

---

## 🚀 Deployment

### Prerequisites
- Supabase account (free tier)
- Cloudflare account (free tier)
- GitHub repository connected

### Option 1: Cloudflare Dashboard

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Create project → Connect Git
3. Build settings:
   ```
   Command: cd frontend && npm install && npm run build
   Output: frontend/build
   ```
4. Add environment variables
5. Deploy!

### Option 2: CLI

```bash
./deploy-cloudflare.sh
```

**Complete guide:** [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)

---

## 🔑 Environment Variables

```env
# Supabase (get from Settings → API)
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...

# Backend API
REACT_APP_API_URL=https://your-backend.onrender.com
```

Set in:
- **Production**: Cloudflare Pages Dashboard
- **Local**: `frontend/.env`

---

## 🧪 Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev        # Runs on :3001

# Terminal 2: Frontend
cd frontend
npm install
npm start          # Runs on :3000

# Visit
open http://localhost:3000/designer
```

---

## 🤖 AI Integration

Current: Mock responses for testing

### To integrate real AI:

**OpenAI:**
```bash
cd backend
npm install openai
```

**Anthropic Claude:**
```bash
cd backend
npm install @anthropic-ai/sdk
```

**Implementation guide:** [TRAVEL_DESIGNER_SETUP.md](TRAVEL_DESIGNER_SETUP.md#ai-integration-next-steps)

---

## 📊 Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, Tailwind CSS |
| Drag-Drop | @dnd-kit |
| Forms | react-datepicker |
| Icons | lucide-react |
| Hosting | Cloudflare Pages (CDN) |
| Backend | Express.js on Render |
| Database | Supabase (PostgreSQL) |
| AI (Future) | OpenAI / Anthropic Claude |

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | 5-minute deployment guide |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Step-by-step checklist |
| [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) | Full deployment guide |
| [TRAVEL_DESIGNER_SETUP.md](TRAVEL_DESIGNER_SETUP.md) | Complete setup & config |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) | Quick reference |

---

## 💰 Cost

**Free tier handles:**
- Unlimited page views (Cloudflare)
- 50,000 monthly users (Supabase)
- 500MB database (Supabase)
- 750 server hours/month (Render)

**Total: $0/month** for small-medium projects

**Upgrade path available** as you scale.

---

## ✅ Features Implemented

- [x] Complete database schema with RLS
- [x] Dashboard with saved itineraries
- [x] Comprehensive creation form
- [x] AI chat interface
- [x] Drag-and-drop planner
- [x] Day-by-day timeline view
- [x] Activity categorization
- [x] Save/edit/duplicate/delete
- [x] Share functionality
- [x] Responsive design
- [x] Production build
- [x] Deployment scripts
- [x] Complete documentation

---

## 🔜 Roadmap

### Next (This Week)
- [ ] Integrate real AI (OpenAI/Claude)
- [ ] Add sample Atlas Files
- [ ] User testing
- [ ] Bug fixes

### Future
- [ ] Map integration (Google Maps)
- [ ] PDF export
- [ ] Calendar sync
- [ ] Collaborative planning
- [ ] Mobile app
- [ ] Booking integrations
- [ ] Weather data
- [ ] Budget tracking
- [ ] Photo uploads

---

## 🧪 Test the Live Demo

Once deployed:

1. Visit `/designer`
2. Click "Start Planning"
3. Create trip: "7 days in Tokyo"
4. Select profiles: Cultural Explorer + Food Lover
5. Generate itinerary
6. Chat with AI: "Add more food experiences"
7. Drag activities to planner
8. Save and return to dashboard

---

## 📝 License

ISC

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/alixbsim-collab/travelAtlas/issues)
- **Docs:** See documentation files
- **Cloudflare:** https://developers.cloudflare.com/pages/
- **Supabase:** https://supabase.com/docs

---

## 🙏 Credits

Built with:
- React
- Tailwind CSS
- Supabase
- Cloudflare Pages
- Express.js

---

**🚀 Ready to deploy? Start with [QUICK_START.md](QUICK_START.md)**

**Live URL:** `https://travel-atlas.pages.dev`

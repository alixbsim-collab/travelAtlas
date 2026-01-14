# Travel Atlas

A full-stack travel application built with React, Node.js/Express, Supabase, and deployed on Cloudflare Pages and Render.

## Project Structure

```
travel-atlas/
├── frontend/           # React application (Cloudflare Pages)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/            # Node.js/Express API (Render)
│   ├── src/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── supabase/           # Database configuration
│   ├── config.toml
│   └── seed.sql
├── render.yaml         # Render deployment config
├── wrangler.toml       # Cloudflare Pages config
└── README.md
```

## Tech Stack

- **Frontend**: React 19, deployed on Cloudflare Pages
- **Backend**: Node.js, Express, deployed on Render
- **Database**: Supabase (PostgreSQL)
- **Version Control**: GitHub

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git
- Supabase account
- Cloudflare account
- Render account

### 1. Clone the Repository

```bash
git clone <your-github-repo-url>
cd travel-atlas
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` and add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:3001
```

Run the frontend:
```bash
npm start
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and add your configuration:
```
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the backend:
```bash
npm run dev
```

### 4. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Run the seed SQL to create initial tables:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/seed.sql` and execute

## Deployment

### Deploy Frontend to Cloudflare Pages

1. Login to Cloudflare Dashboard
2. Go to Pages > Create a project
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/build`
5. Add environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_API_URL` (your Render backend URL)
6. Deploy

### Deploy Backend to Render

1. Login to Render Dashboard
2. Click "New +" > "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` configuration
5. Add environment variables in Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Deploy

Alternatively, use the "New Blueprint Instance" option and select your repository.

## Environment Variables

### Frontend (.env)
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `REACT_APP_API_URL` - Backend API URL

### Backend (.env)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/destinations` - Get all destinations

## Development

### Frontend
```bash
cd frontend
npm start       # Start development server
npm run build   # Build for production
npm test        # Run tests
```

### Backend
```bash
cd backend
npm run dev     # Start with nodemon
npm start       # Start production server
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

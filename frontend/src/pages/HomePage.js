import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ArrowRight, Plane, BookOpen, Map, Play, Sparkles, Calendar, GripVertical } from 'lucide-react';

// Featured destinations with Unsplash images - linked to Atlas Files
const FEATURED_DESTINATIONS = [
  {
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=400&fit=crop',
    slug: 'tokyo',
  },
  {
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop',
    slug: 'paris',
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=400&fit=crop',
    slug: 'bali',
  },
  {
    name: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=400&fit=crop',
    slug: 'rome',
  },
  {
    name: 'New York',
    country: 'USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=400&fit=crop',
    slug: 'new-york',
  },
  {
    name: 'Dubai',
    country: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=400&fit=crop',
    slug: 'dubai',
  },
];

function HomePage() {
  const navigate = useNavigate();

  const handleDestinationClick = (destination) => {
    // Navigate to Atlas Files filtered by this destination
    navigate(`/atlas?destination=${encodeURIComponent(destination.name)}`);
  };

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="text-center py-16 md:py-20">
        <h1 className="text-5xl md:text-6xl font-heading font-bold text-neutral-charcoal mb-6" style={{ fontStyle: 'italic' }}>
          Plan Your Perfect Journey
        </h1>
        <p className="text-xl text-neutral-warm-gray mb-10 max-w-2xl mx-auto leading-relaxed">
          Create personalized travel itineraries with our intelligent planner.
          Discover curated experiences and make every trip unforgettable.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/designer/create">
            <Button size="lg" className="min-w-[200px] gap-2">
              Start Planning
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/atlas">
            <Button variant="outline" size="lg" className="min-w-[200px]">
              Browse Atlas Files
            </Button>
          </Link>
        </div>
      </div>

      {/* Destination Discovery Section */}
      <div className="py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
            Discover Your Next Adventure
          </h2>
          <p className="text-neutral-warm-gray">
            Click a destination to explore curated itineraries
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {FEATURED_DESTINATIONS.map((destination) => (
            <button
              key={destination.name}
              onClick={() => handleDestinationClick(destination)}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
            >
              <img
                src={destination.image}
                alt={destination.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="font-bold text-lg leading-tight">{destination.name}</p>
                <p className="text-sm text-white/80">{destination.country}</p>
              </div>
              <div className="absolute inset-0 bg-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Travel Designer Demo Section */}
      <div className="py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Demo Visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-neutral-100">
              {/* Mock Header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                  <Sparkles size={20} style={{ color: '#F5C846' }} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-charcoal">AI Travel Designer</h4>
                  <p className="text-xs text-neutral-400">Drag & drop to customize</p>
                </div>
              </div>

              {/* Mock Day Cards */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                  <GripVertical size={16} className="text-neutral-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Morning: Visit Eiffel Tower</p>
                    <p className="text-xs text-neutral-400">9:00 AM - 12:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border-l-4 border-amber-400 transform translate-x-2 animate-pulse">
                  <GripVertical size={16} className="text-neutral-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Lunch: Le Petit Cler</p>
                    <p className="text-xs text-neutral-400">12:30 PM - 2:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border-l-4 border-green-400">
                  <GripVertical size={16} className="text-neutral-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Afternoon: Louvre Museum</p>
                    <p className="text-xs text-neutral-400">2:30 PM - 6:00 PM</p>
                  </div>
                </div>
              </div>

              {/* Mock Footer */}
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Calendar size={14} />
                  <span>Day 1 of 5</span>
                </div>
                <div className="text-xs font-medium text-primary-500">+ Add Activity</div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ backgroundColor: '#F5C846' }} />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-20" style={{ backgroundColor: '#2D6A9F' }} />
          </div>

          {/* Demo Description */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
              <Play size={14} />
              See How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-neutral-charcoal mb-4">
              Design Your Trip with AI
            </h2>
            <p className="text-neutral-warm-gray mb-6 leading-relaxed">
              Our intelligent Travel Designer creates personalized day-by-day itineraries based on your preferences.
              Drag and drop activities, adjust timings, and let AI suggest the perfect experiences for you.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowRight size={14} className="text-green-600" />
                </div>
                <span className="text-neutral-charcoal">AI-powered activity suggestions</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowRight size={14} className="text-green-600" />
                </div>
                <span className="text-neutral-charcoal">Drag & drop to reorganize</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowRight size={14} className="text-green-600" />
                </div>
                <span className="text-neutral-charcoal">Interactive map with all locations</span>
              </li>
            </ul>

            <Link to="/designer/create">
              <Button size="lg" className="gap-2">
                Try It Now
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 py-16">
        <Link to="/designer/create" className="block">
          <Card hover className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FEF3C7' }}>
              <Plane size={28} style={{ color: '#F5C846' }} />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3 text-neutral-charcoal">Smart Itinerary Builder</h3>
            <p className="text-neutral-warm-gray mb-4">
              Design day-by-day plans with our intuitive drag-and-drop interface.
            </p>
            <span className="text-primary-500 font-medium flex items-center gap-1">
              Start building <ArrowRight size={16} />
            </span>
          </Card>
        </Link>

        <Link to="/atlas" className="block">
          <Card hover className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#DBEAFE' }}>
              <BookOpen size={28} style={{ color: '#2D6A9F' }} />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3 text-neutral-charcoal">Curated Collections</h3>
            <p className="text-neutral-warm-gray mb-4">
              Browse expertly crafted itineraries from fellow travelers.
            </p>
            <span className="text-primary-500 font-medium flex items-center gap-1">
              Explore collections <ArrowRight size={16} />
            </span>
          </Card>
        </Link>

        <Link to="/designer" className="block">
          <Card hover className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#D1FAE5' }}>
              <Map size={28} style={{ color: '#10B981' }} />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3 text-neutral-charcoal">Personalized Maps</h3>
            <p className="text-neutral-warm-gray mb-4">
              Visualize your journey with interactive maps and location pins.
            </p>
            <span className="text-primary-500 font-medium flex items-center gap-1">
              View your trips <ArrowRight size={16} />
            </span>
          </Card>
        </Link>
      </div>

      {/* CTA Section */}
      <div
        className="rounded-2xl p-12 text-center text-white my-16"
        style={{ background: 'linear-gradient(135deg, #E8A87C 0%, #C38D6D 30%, #2D6A9F 70%, #1E4D73 100%)' }}
      >
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4" style={{ fontStyle: 'italic' }}>
          Ready to Start Your Adventure?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Join thousands of travelers creating amazing journeys
        </p>
        <Link to="/register">
          <button
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: '#F5C846',
              color: '#1E4D73',
              boxShadow: '0 4px 14px rgba(245, 200, 70, 0.4)'
            }}
          >
            Sign Up Free
          </button>
        </Link>
      </div>
    </PageContainer>
  );
}

export default HomePage;

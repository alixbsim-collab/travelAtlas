import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { User, MapPin, Globe, Calendar } from 'lucide-react';

function ProfilePage() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchItineraries();
  }, [user]);

  const fetchItineraries = async () => {
    const { data } = await supabase
      .from('itineraries')
      .select('id, title, destinations, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItineraries(data || []);
    setLoading(false);
  };

  if (!user) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <h1 className="text-2xl font-heading font-bold text-charcoal-500 mb-4">
            Sign in to view your profile
          </h1>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const userName = user.user_metadata?.full_name || 'Travel Enthusiast';
  const userEmail = user.email;
  const memberSince = new Date(user.created_at).getFullYear();
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Compute stats from itineraries
  const totalItineraries = itineraries.length;
  const allDestinations = itineraries.flatMap(it => {
    try {
      const dests = typeof it.destinations === 'string' ? JSON.parse(it.destinations) : it.destinations;
      return Array.isArray(dests) ? dests : [];
    } catch { return []; }
  });
  const uniqueDestinations = new Set(allDestinations.map(d => d.name || d)).size;
  const uniqueCountries = new Set(allDestinations.map(d => d.country || '').filter(Boolean)).size;

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-charcoal-500 mb-8">
          My Profile
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <div className="text-center">
              <div className="w-24 h-24 bg-coral-400 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
                {initials}
              </div>
              <h2 className="text-xl font-heading font-bold mb-1">
                {userName}
              </h2>
              <p className="text-sm text-platinum-600 mb-1">{userEmail}</p>
              <p className="text-platinum-500 text-sm">
                Member since {memberSince}
              </p>
            </div>
          </Card>

          {/* Stats and Itineraries */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="text-xl font-heading font-bold mb-4">
                Travel Stats
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-coral-500">{totalItineraries}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><Calendar size={14} />Itineraries</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-columbia-500">{uniqueDestinations}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><MapPin size={14} />Places</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-naples-500">{uniqueCountries}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><Globe size={14} />Countries</div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-heading font-bold mb-4">
                My Itineraries
              </h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-400"></div>
                </div>
              ) : itineraries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✈️</div>
                  <p className="text-platinum-600 mb-4">
                    You haven't created any itineraries yet
                  </p>
                  <Link to="/designer/create">
                    <Button>Create Your First Itinerary</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {itineraries.map(it => (
                    <Link
                      key={it.id}
                      to={`/designer/planner/${it.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-platinum-50 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-charcoal-500 group-hover:text-coral-500 transition-colors">
                          {it.title || 'Untitled Trip'}
                        </p>
                        <p className="text-sm text-platinum-500">
                          {new Date(it.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-platinum-400 group-hover:text-coral-400 transition-colors">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;

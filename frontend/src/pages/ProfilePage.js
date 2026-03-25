import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MapPin, Globe, Calendar, Send, Clock, EyeOff } from 'lucide-react';
import { TRAVELER_PROFILES } from '../constants/travelerProfiles';

function ProfilePage() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchItineraries();
      fetchProfile();
    }
  }, [user]);

  const fetchItineraries = async () => {
    const { data } = await supabase
      .from('itineraries')
      .select('id, title, destination, trip_length, travel_pace, is_published, thumbnail_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItineraries(data || []);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('bio, country, travel_style')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
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
  const publishedCount = itineraries.filter(it => it.is_published).length;
  const totalDays = itineraries.reduce((sum, it) => sum + (it.trip_length || 0), 0);
  const uniqueDestinations = new Set(itineraries.map(it => it.destination).filter(Boolean)).size;
  const publishedItineraries = itineraries.filter(it => it.is_published);

  // Travel style badges from profile
  const handleUnpublish = async (itineraryId) => {
    const { error } = await supabase
      .from('itineraries')
      .update({ is_published: false })
      .eq('id', itineraryId);

    if (error) {
      console.error('Error unpublishing:', error);
      alert('Failed to unpublish itinerary');
    } else {
      setItineraries(prev =>
        prev.map(it => it.id === itineraryId ? { ...it, is_published: false } : it)
      );
    }
  };

  const travelStyleBadges = (profile?.travel_style || []).map(styleId => {
    return TRAVELER_PROFILES.find(p => p.id === styleId);
  }).filter(Boolean);

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
              {profile?.country && (
                <p className="text-sm text-platinum-600 mb-1">{profile.country}</p>
              )}
              <p className="text-platinum-500 text-sm">
                Member since {memberSince}
              </p>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-platinum-600 mt-3 italic">
                  "{profile.bio}"
                </p>
              )}

              {/* Travel Style Badges */}
              {travelStyleBadges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                  {travelStyleBadges.map(style => (
                    <span
                      key={style.id}
                      className="text-xs px-2 py-1 bg-coral-50 text-coral-600 rounded-full"
                      title={style.description}
                    >
                      {style.emoji} {style.title.replace('The ', '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Stats and Itineraries */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="text-xl font-heading font-bold mb-4">
                Travel Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-coral-500">{totalItineraries}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><Calendar size={14} />Trips</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-columbia-500">{uniqueDestinations}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><MapPin size={14} />Destinations</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-naples-500">{totalDays}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><Clock size={14} />Days Planned</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-500">{publishedCount}</div>
                  <div className="text-sm text-platinum-600 flex items-center justify-center gap-1"><Send size={14} />Published</div>
                </div>
              </div>
            </Card>

            {/* Published Itineraries */}
            {publishedItineraries.length > 0 && (
              <Card>
                <h3 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Globe size={20} className="text-coral-500" />
                  Published to Atlas Network
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {publishedItineraries.map(it => (
                    <div
                      key={it.id}
                      className="rounded-xl overflow-hidden border border-platinum-200 hover:border-coral-300 hover:shadow-md transition-all group"
                    >
                      <Link to={`/itinerary/${it.id}`}>
                        <div className="h-24 bg-columbia-100 relative overflow-hidden">
                          {it.thumbnail_url ? (
                            <img src={it.thumbnail_url} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">✈️</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-bold truncate drop-shadow-lg">{it.title || it.destination}</p>
                          </div>
                        </div>
                      </Link>
                      <div className="p-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-platinum-600"><MapPin size={10} />{it.destination}</span>
                        <button
                          onClick={() => handleUnpublish(it.id)}
                          className="flex items-center gap-1 text-xs text-platinum-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                          title="Unpublish from Atlas Network"
                        >
                          <EyeOff size={12} />
                          Unpublish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-platinum-100 overflow-hidden flex-shrink-0">
                          {it.thumbnail_url ? (
                            <img src={it.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">✈️</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-500 group-hover:text-coral-500 transition-colors">
                            {it.title || 'Untitled Trip'}
                          </p>
                          <p className="text-xs text-platinum-500">
                            {it.destination} · {it.trip_length} days · {new Date(it.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {it.is_published && (
                          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">Published</span>
                        )}
                        <span className="text-platinum-400 group-hover:text-coral-400 transition-colors">→</span>
                      </div>
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

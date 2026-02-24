import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TRAVELER_PROFILES } from '../constants/travelerProfiles';
import { PlusCircle, MapPin, Copy, Trash2, Edit, X, Check, Image, Link as LinkIcon, Search, FileText } from 'lucide-react';

// Profile Edit Modal Component
function ProfileEditModal({ itinerary, onClose, onSave }) {
  const [selectedProfiles, setSelectedProfiles] = useState(itinerary.traveler_profiles || []);
  const [saving, setSaving] = useState(false);

  const handleToggle = (profileId) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : prev.length < 4 ? [...prev, profileId] : prev
    );
  };

  const handleSave = async () => {
    if (selectedProfiles.length === 0) {
      alert('Please select at least one profile');
      return;
    }
    setSaving(true);
    await onSave(itinerary.id, selectedProfiles);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-platinum-200 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold">Edit Traveler Profiles</h2>
          <button onClick={onClose} className="p-2 hover:bg-platinum-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <p className="text-platinum-600 mb-4">Select 1-4 profiles that match your travel style</p>
          <div className="grid md:grid-cols-2 gap-3">
            {TRAVELER_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleToggle(profile.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedProfiles.includes(profile.id)
                    ? 'border-coral-400 bg-coral-50'
                    : 'border-platinum-200 hover:border-coral-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{profile.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{profile.title}</div>
                    <div className="text-xs text-platinum-600">{profile.description}</div>
                  </div>
                  {selectedProfiles.includes(profile.id) && (
                    <div className="w-5 h-5 rounded-full bg-coral-400 text-white flex items-center justify-center">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-platinum-200 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || selectedProfiles.length === 0}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Image Upload Modal Component
function ImageModal({ itinerary, onClose, onSave }) {
  const [imageUrl, setImageUrl] = useState(itinerary.thumbnail_url || '');
  const [searchQuery, setSearchQuery] = useState(itinerary.destination || '');
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // search, url

  // Curated travel photos from Unsplash (images.unsplash.com direct links)
  const TRAVEL_PHOTOS = [
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', // lake + mountains
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // tropical beach
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', // mountain hiking
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80', // travel road
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80', // boats harbor
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', // valley landscape
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80', // lake panorama
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80', // Vietnam boats
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80', // Venice canal
    'https://images.unsplash.com/photo-1504598318550-17eba1008a68?w=800&q=80', // desert camels
    'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80', // pool party
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80', // ocean relaxation
  ];

  const searchUnsplash = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Shuffle and pick 6 photos from the curated set
      const shuffled = [...TRAVEL_PHOTOS].sort(() => Math.random() - 0.5);
      setUnsplashResults(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error searching images:', error);
    }
    setSearching(false);
  };

  useEffect(() => {
    if (activeTab === 'search' && searchQuery) {
      const timer = setTimeout(searchUnsplash, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(itinerary.id, imageUrl);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-platinum-200 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold">Add Cover Image</h2>
          <button onClick={onClose} className="p-2 hover:bg-platinum-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-platinum-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search' ? 'border-b-2 border-coral-400 text-coral-500' : 'text-platinum-600'
            }`}
          >
            <Search size={16} className="inline mr-2" />
            Search Photos
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'url' ? 'border-b-2 border-coral-400 text-coral-500' : 'text-platinum-600'
            }`}
          >
            <LinkIcon size={16} className="inline mr-2" />
            Paste URL
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'search' && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-platinum-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for images..."
                  className="w-full pl-10 pr-4 py-3 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
                />
              </div>

              {searching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-400 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {unsplashResults.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setImageUrl(url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrl === url ? 'border-coral-400 ring-2 ring-coral-200' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {imageUrl === url && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-coral-400 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'url' && (
            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
              />
              {imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-platinum-200">
                  <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-platinum-200 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !imageUrl}>
            {saving ? 'Saving...' : 'Save Image'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Inline Editable Title Component
function TravelDesignerDashboard() {
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [atlasFiles, setAtlasFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingImage, setEditingImage] = useState(null);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await Promise.all([fetchSavedItineraries(user.id), fetchAtlasFiles()]);
    } else {
      await fetchAtlasFiles();
    }

    setLoading(false);
  };

  const fetchSavedItineraries = async (userId) => {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching itineraries:', error);
    } else {
      setSavedItineraries(data || []);
    }
  };

  const fetchAtlasFiles = async () => {
    const { data, error } = await supabase
      .from('atlas_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching atlas files:', error);
    } else {
      setAtlasFiles(data || []);
    }
  };

  const handleDeleteItinerary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }

    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary');
    } else {
      setSavedItineraries(savedItineraries.filter(it => it.id !== id));
    }
  };

  const handleDuplicateItinerary = async (itinerary) => {
    const { data: newItinerary, error } = await supabase
      .from('itineraries')
      .insert({
        ...itinerary,
        id: undefined,
        title: `${itinerary.title} (Copy)`,
        created_at: undefined,
        updated_at: undefined
      })
      .select()
      .single();

    if (error) {
      console.error('Error duplicating itinerary:', error);
      alert('Failed to duplicate itinerary');
    } else {
      setSavedItineraries([newItinerary, ...savedItineraries]);
    }
  };

  const handleUpdateProfiles = async (itineraryId, profiles) => {
    const { error } = await supabase
      .from('itineraries')
      .update({ traveler_profiles: profiles })
      .eq('id', itineraryId);

    if (error) {
      console.error('Error updating profiles:', error);
    } else {
      setSavedItineraries(prev =>
        prev.map(it => it.id === itineraryId ? { ...it, traveler_profiles: profiles } : it)
      );
    }
  };

  const handleUpdateImage = async (itineraryId, imageUrl) => {
    const { error } = await supabase
      .from('itineraries')
      .update({ thumbnail_url: imageUrl })
      .eq('id', itineraryId);

    if (error) {
      console.error('Error updating image:', error);
    } else {
      setSavedItineraries(prev =>
        prev.map(it => it.id === itineraryId ? { ...it, thumbnail_url: imageUrl } : it)
      );
    }
  };

  const getProfileEmoji = (profileId) => {
    const profile = TRAVELER_PROFILES.find(p => p.id === profileId);
    return profile?.emoji || '';
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400 mx-auto mb-4"></div>
            <p className="text-platinum-600">Loading...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Create New Itinerary CTA */}
        <div className="mb-12 rounded-2xl overflow-hidden bg-charcoal-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 text-white">
                Design Your Journey
              </h2>
              <p className="text-lg text-white/70">
                Create a personalized itinerary with our AI-powered travel designer
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/designer/create">
                <button
                  className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg bg-naples-400 text-charcoal-500"
                >
                  <PlusCircle size={22} />
                  Plan
                </button>
              </Link>
              <Link to="/atlas/new">
                <button
                  className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg bg-white/10 text-white border-2 border-white/20 hover:bg-white/20"
                >
                  <FileText size={22} />
                  Atlas File
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Saved Itineraries Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-charcoal-500">
              Saved Itineraries
            </h2>
          </div>

          {savedItineraries.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-heading font-bold mb-2">No itineraries yet</h3>
                <p className="text-platinum-600 mb-6">
                  Create your first itinerary to start planning your dream trip
                </p>
                <Link to="/designer/create">
                  <Button>Create Itinerary</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItineraries.map((itinerary) => {
                const CARD_COLORS = ['bg-coral-400', 'bg-columbia-400', 'bg-naples-400', 'bg-charcoal-500', 'bg-coral-300', 'bg-columbia-300'];
                const colorClass = CARD_COLORS[savedItineraries.indexOf(itinerary) % CARD_COLORS.length];
                const isDark = colorClass.includes('charcoal');

                return (
                  <div key={itinerary.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col bg-white">
                    {/* Large graphic thumbnail */}
                    <div
                      className={`h-52 relative cursor-pointer overflow-hidden ${!itinerary.thumbnail_url ? colorClass : ''}`}
                      onClick={() => setEditingImage(itinerary)}
                    >
                      {itinerary.thumbnail_url ? (
                        <img
                          src={itinerary.thumbnail_url}
                          alt={itinerary.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="text-5xl mb-2">{itinerary.destination?.includes('Japan') ? '🏯' : itinerary.destination?.includes('Italy') || itinerary.destination?.includes('Paris') || itinerary.destination?.includes('France') ? '🏛️' : itinerary.destination?.includes('Beach') || itinerary.destination?.includes('Bali') || itinerary.destination?.includes('Thailand') ? '🏝️' : '✈️'}</span>
                          <span className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-charcoal-500/50'}`}>Click to add cover</span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Destination badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-charcoal-500 text-sm font-semibold shadow-sm">
                          <MapPin size={14} className="text-coral-500" />
                          {itinerary.destination}
                        </span>
                      </div>

                      {/* Days badge */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-naples-400 text-charcoal-500 text-sm font-bold shadow-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                          {itinerary.trip_length}d
                        </span>
                      </div>

                      {/* Hover overlay for image change */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-white/90 text-charcoal-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg">
                          <Image size={18} />
                          {itinerary.thumbnail_url ? 'Change' : 'Add Image'}
                        </button>
                      </div>

                      {/* Title overlaid at bottom */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-heading font-bold text-lg leading-tight drop-shadow-lg">
                          {itinerary.title || 'Untitled Trip'}
                        </h3>
                      </div>
                    </div>

                    {/* Compact content strip */}
                    <div className="p-4 flex-1 flex flex-col">
                      {/* Traveler Profiles */}
                      <div
                        className="flex flex-wrap gap-1.5 mb-3 cursor-pointer group/profiles"
                        onClick={() => setEditingProfile(itinerary)}
                        title="Click to edit profiles"
                      >
                        {itinerary.traveler_profiles?.slice(0, 3).map((profile, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-coral-50 text-coral-600 rounded-full group-hover/profiles:bg-coral-100 transition-colors"
                          >
                            {getProfileEmoji(profile)} {profile.replace('-', ' ')}
                          </span>
                        ))}
                        {itinerary.traveler_profiles?.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-platinum-100 text-platinum-600 rounded-full">
                            +{itinerary.traveler_profiles.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Actions row */}
                      <div className="flex gap-2 mt-auto pt-3 border-t border-platinum-100">
                        <Link to={`/designer/planner/${itinerary.id}`} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-charcoal-500 text-white hover:bg-charcoal-400 transition-colors">
                            <Edit size={15} />
                            Edit Trip
                          </button>
                        </Link>
                        <Link to={`/atlas/new?fromItinerary=${itinerary.id}`}>
                          <button className="px-3 py-2.5 rounded-xl text-sm bg-columbia-100 text-columbia-700 hover:bg-columbia-200 transition-colors" title="Convert to Atlas File">
                            <FileText size={15} />
                          </button>
                        </Link>
                        <button
                          className="px-3 py-2.5 rounded-xl text-sm bg-platinum-100 text-platinum-600 hover:bg-platinum-200 transition-colors"
                          onClick={() => handleDuplicateItinerary(itinerary)}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="px-3 py-2.5 rounded-xl text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          onClick={() => handleDeleteItinerary(itinerary.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Atlas Files Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-heading font-bold text-charcoal-500 mb-2">
                Atlas Files
              </h2>
              <p className="text-platinum-600">
                Curated itineraries and inspiration from expert travelers
              </p>
            </div>
            <Link to="/atlas">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {atlasFiles.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-heading font-bold mb-2">No atlas files available</h3>
                <p className="text-platinum-600">
                  Check back soon for curated travel inspiration
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {atlasFiles.map((file) => (
                <Card key={file.id} hover className="flex flex-col">
                  {/* Thumbnail */}
                  <div className="h-40 bg-coral-100 rounded-t-lg mb-4 flex items-center justify-center relative">
                    {file.thumbnail_url ? (
                      <img
                        src={file.thumbnail_url}
                        alt={file.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <span className="text-6xl">📖</span>
                    )}
                    {file.is_premium && (
                      <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-6 pb-6">
                    <h3 className="text-xl font-heading font-bold mb-2 line-clamp-2">
                      {file.title}
                    </h3>

                    <p className="text-sm text-platinum-600 mb-3 line-clamp-2">
                      {file.description}
                    </p>

                    <div className="text-sm text-platinum-600 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{file.destination}</span>
                      </div>
                    </div>

                    <Link to={`/atlas/${file.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Profile Edit Modal */}
      {editingProfile && (
        <ProfileEditModal
          itinerary={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={handleUpdateProfiles}
        />
      )}

      {/* Image Modal */}
      {editingImage && (
        <ImageModal
          itinerary={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleUpdateImage}
        />
      )}
    </PageContainer>
  );
}

export default TravelDesignerDashboard;

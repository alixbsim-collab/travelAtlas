import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TRAVELER_PROFILES } from '../constants/travelerProfiles';
import { PlusCircle, Calendar, MapPin, Copy, Trash2, Edit, X, Check, Image, Upload, Link as LinkIcon, Search } from 'lucide-react';

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
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold">Edit Traveler Profiles</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <p className="text-neutral-warm-gray mb-4">Select 1-4 profiles that match your travel style</p>
          <div className="grid md:grid-cols-2 gap-3">
            {TRAVELER_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleToggle(profile.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedProfiles.includes(profile.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{profile.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{profile.title}</div>
                    <div className="text-xs text-neutral-warm-gray">{profile.description}</div>
                  </div>
                  {selectedProfiles.includes(profile.id) && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end">
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

  // Search Unsplash for images (using their free API)
  const searchUnsplash = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Using Unsplash Source API for demo (no auth needed)
      // In production, use their API with proper key
      const results = [
        `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)},travel,1`,
        `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)},landmark,2`,
        `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)},city,3`,
        `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)},nature,4`,
        `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)},architecture,5`,
        `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)},destination,6`,
      ];
      setUnsplashResults(results);
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
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold">Add Cover Image</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500'
            }`}
          >
            <Search size={16} className="inline mr-2" />
            Search Photos
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'url' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500'
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for images..."
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {searching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {unsplashResults.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setImageUrl(url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrl === url ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {imageUrl === url && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
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
              <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-neutral-200">
                  <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end">
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
function EditableTitle({ title, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
    } else {
      setValue(title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-xl font-heading font-bold mb-2 w-full border-b-2 border-primary-500 outline-none bg-transparent"
      />
    );
  }

  return (
    <h3
      onClick={() => setIsEditing(true)}
      className="text-xl font-heading font-bold mb-2 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
      title="Click to edit"
    >
      {title}
    </h3>
  );
}

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

  const handleUpdateTitle = async (itineraryId, newTitle) => {
    const { error } = await supabase
      .from('itineraries')
      .update({ title: newTitle })
      .eq('id', itineraryId);

    if (error) {
      console.error('Error updating title:', error);
    } else {
      setSavedItineraries(prev =>
        prev.map(it => it.id === itineraryId ? { ...it, title: newTitle } : it)
      );
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-warm-gray">Loading...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Create New Itinerary CTA */}
        <div className="mb-12 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #E8A87C 0%, #C38D6D 30%, #2D6A9F 70%, #1E4D73 100%)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 text-white">
                Design Your Journey
              </h2>
              <p className="text-lg text-white/90">
                Create a personalized itinerary with our AI-powered travel designer
              </p>
            </div>
            <Link to="/designer/create">
              <button
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: '#F5C846',
                  color: '#1E4D73',
                  boxShadow: '0 4px 14px rgba(245, 200, 70, 0.4)'
                }}
              >
                <PlusCircle size={22} />
                Plan
              </button>
            </Link>
          </div>
        </div>

        {/* Saved Itineraries Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-neutral-charcoal">
              Saved Itineraries
            </h2>
          </div>

          {savedItineraries.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-heading font-bold mb-2">No itineraries yet</h3>
                <p className="text-neutral-warm-gray mb-6">
                  Create your first itinerary to start planning your dream trip
                </p>
                <Link to="/designer/create">
                  <Button>Create Itinerary</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItineraries.map((itinerary) => (
                <Card key={itinerary.id} hover className="flex flex-col">
                  {/* Thumbnail with Add Image button */}
                  <div
                    className="h-40 rounded-t-lg mb-4 flex items-center justify-center relative group cursor-pointer"
                    style={{ background: itinerary.thumbnail_url ? 'none' : 'linear-gradient(135deg, #E8A87C 0%, #C38D6D 40%, #2D6A9F 100%)' }}
                    onClick={() => setEditingImage(itinerary)}
                  >
                    {itinerary.thumbnail_url ? (
                      <img
                        src={itinerary.thumbnail_url}
                        alt={itinerary.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <span className="text-6xl">🗺️</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                      <button className="bg-white/90 text-neutral-charcoal px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                        <Image size={18} />
                        {itinerary.thumbnail_url ? 'Change Image' : 'Add Image'}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-6 pb-6">
                    {/* Editable Title */}
                    <EditableTitle
                      title={itinerary.title}
                      onSave={(newTitle) => handleUpdateTitle(itinerary.id, newTitle)}
                    />

                    <div className="space-y-2 mb-4 text-sm text-neutral-warm-gray">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{itinerary.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{itinerary.trip_length} days</span>
                      </div>
                    </div>

                    {/* Clickable Traveler Profiles */}
                    <div
                      className="flex flex-wrap gap-2 mb-4 cursor-pointer group"
                      onClick={() => setEditingProfile(itinerary)}
                      title="Click to edit profiles"
                    >
                      {itinerary.traveler_profiles?.slice(0, 3).map((profile, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full group-hover:bg-primary-200 transition-colors flex items-center gap-1"
                        >
                          {getProfileEmoji(profile)} {profile.replace('-', ' ')}
                        </span>
                      ))}
                      {itinerary.traveler_profiles?.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-500 rounded-full">
                          +{itinerary.traveler_profiles.length - 3}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 text-primary-500 hover:text-primary-600">
                        <Edit size={12} className="inline" />
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-neutral-100">
                      <Link to={`/designer/planner/${itinerary.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Edit size={16} />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateItinerary(itinerary)}
                        className="gap-2"
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItinerary(itinerary.id)}
                        className="gap-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Atlas Files Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-heading font-bold text-neutral-charcoal mb-2">
                Atlas Files
              </h2>
              <p className="text-neutral-warm-gray">
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
                <p className="text-neutral-warm-gray">
                  Check back soon for curated travel inspiration
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {atlasFiles.map((file) => (
                <Card key={file.id} hover className="flex flex-col">
                  {/* Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-secondary-400 to-primary-500 rounded-t-lg mb-4 flex items-center justify-center relative">
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

                    <p className="text-sm text-neutral-warm-gray mb-3 line-clamp-2">
                      {file.description}
                    </p>

                    <div className="text-sm text-neutral-warm-gray mb-4">
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

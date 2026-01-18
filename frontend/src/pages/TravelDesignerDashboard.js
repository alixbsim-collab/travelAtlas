import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PlusCircle, Calendar, MapPin, Copy, Trash2, Edit } from 'lucide-react';

function TravelDesignerDashboard() {
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [atlasFiles, setAtlasFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-neutral-charcoal mb-2">
            Travel Designer
          </h1>
          <p className="text-lg text-neutral-warm-gray">
            Plan, create, and manage your perfect travel itineraries
          </p>
        </div>

        {/* Create New Itinerary CTA */}
        <Card className="mb-12 bg-gradient-to-r from-primary-500 to-secondary-600 text-white border-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
            <div className="flex-1">
              <h2 className="text-3xl font-heading font-bold mb-3">
                Create a New Itinerary
              </h2>
              <p className="text-lg opacity-90">
                Start planning your next adventure with our AI-powered travel designer
              </p>
            </div>
            <Link to="/designer/create">
              <Button size="lg" variant="accent" className="gap-2">
                <PlusCircle size={20} />
                Start Planning
              </Button>
            </Link>
          </div>
        </Card>

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
                  {/* Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-t-lg mb-4 flex items-center justify-center">
                    {itinerary.thumbnail_url ? (
                      <img
                        src={itinerary.thumbnail_url}
                        alt={itinerary.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <span className="text-6xl">🗺️</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-6 pb-6">
                    <h3 className="text-xl font-heading font-bold mb-2 line-clamp-2">
                      {itinerary.title}
                    </h3>

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

                    {/* Traveler Profiles */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {itinerary.traveler_profiles?.slice(0, 3).map((profile, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full"
                        >
                          {profile.replace('-', ' ')}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-neutral-100">
                      <Link to={`/designer/edit/${itinerary.id}`} className="flex-1">
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
    </PageContainer>
  );
}

export default TravelDesignerDashboard;

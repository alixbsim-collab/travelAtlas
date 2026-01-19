import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AIAssistant from '../components/planner/AIAssistant';
import DragDropPlanner from '../components/planner/DragDropPlanner';
import MapViewEnhanced from '../components/planner/MapViewEnhanced';
import Button from '../components/ui/Button';
import { Save, Share2, Download, ArrowLeft } from 'lucide-react';

function PlannerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [itinerary, setItinerary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingActivities, setGeneratingActivities] = useState(false);

  // Check if we came from create page with generating flag
  const isGenerating = location.state?.generating;

  useEffect(() => {
    fetchItineraryData();
  }, [id]);

  // Poll for activities if they're being generated
  useEffect(() => {
    if (isGenerating && activities.length === 0) {
      setGeneratingActivities(true);
      const pollInterval = setInterval(async () => {
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('*')
          .eq('itinerary_id', id)
          .order('day_number', { ascending: true })
          .order('position', { ascending: true });

        if (activitiesData && activitiesData.length > 0) {
          setActivities(activitiesData);
          setGeneratingActivities(false);
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 60 seconds
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setGeneratingActivities(false);
      }, 60000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [id, isGenerating, activities.length]);

  const fetchItineraryData = async () => {
    try {
      // Fetch itinerary
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();

      if (itineraryError) throw itineraryError;

      setItinerary(itineraryData);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('itinerary_id', id)
        .order('day_number', { ascending: true })
        .order('position', { ascending: true });

      if (activitiesError) throw activitiesError;

      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      alert('Failed to load itinerary');
      navigate('/designer');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      alert('Itinerary saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadItinerary = async (suggestedActivities) => {
    try {
      // Clear existing activities
      if (activities.length > 0) {
        const { error: deleteError } = await supabase
          .from('activities')
          .delete()
          .eq('itinerary_id', id);

        if (deleteError) throw deleteError;
      }

      // Insert new activities
      const activitiesToInsert = suggestedActivities.map((activity, index) => ({
        ...activity,
        itinerary_id: id,
        position: index,
        id: undefined,
        created_at: undefined
      }));

      const { data, error } = await supabase
        .from('activities')
        .insert(activitiesToInsert)
        .select();

      if (error) throw error;

      setActivities(data);
      alert('Itinerary preloaded successfully!');
    } catch (error) {
      console.error('Error loading itinerary:', error);
      alert('Failed to load suggested itinerary');
    }
  };

  const handleShare = async () => {
    try {
      // Update itinerary to be published
      const { error } = await supabase
        .from('itineraries')
        .update({ is_published: true })
        .eq('id', id);

      if (error) throw error;

      // Generate shareable link
      const shareUrl = `${window.location.origin}/itinerary/${id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Shareable link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      alert('Failed to create shareable link');
    }
  };

  const handleExport = () => {
    alert('Export functionality coming soon! You will be able to export to PDF, add to calendar, and more.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-warm-gray">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/designer')}
              className="flex items-center gap-2 text-neutral-warm-gray hover:text-neutral-charcoal transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div>
              <h1 className="text-xl font-heading font-bold text-neutral-charcoal">
                {itinerary.title}
              </h1>
              <p className="text-sm text-neutral-warm-gray">
                {itinerary.destination} • {itinerary.trip_length} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 size={16} />
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto flex gap-6 p-6">
          {/* Left: AI Assistant - Fixed width, scrollable */}
          <div className="w-1/2 flex flex-col min-w-0">
            <AIAssistant
              itinerary={itinerary}
              onActivityDrag={(activity) => console.log('Activity dragged:', activity)}
              onLoadItinerary={handleLoadItinerary}
            />
          </div>

          {/* Right: Map View + Timeline - Fixed width, scrollable */}
          <div className="w-1/2 flex flex-col min-w-0 gap-4">
            {/* Generating indicator */}
            {generatingActivities && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                <p className="text-sm text-primary-700">Generating your personalized itinerary...</p>
              </div>
            )}

            {/* Map View - Always visible at top */}
            <div className="h-[350px] flex-shrink-0">
              <MapViewEnhanced
                activities={activities}
                itinerary={itinerary}
              />
            </div>

            {/* Timeline below map */}
            <div className="flex-1 overflow-hidden">
              <DragDropPlanner
                itinerary={itinerary}
                activities={activities}
                setActivities={setActivities}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlannerPage;

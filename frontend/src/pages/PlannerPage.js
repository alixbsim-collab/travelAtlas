import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AIAssistant from '../components/planner/AIAssistant';
import Button from '../components/ui/Button';
import { Save, Share2, Download, ArrowLeft, LayoutGrid, List, Map as MapIcon, Plus, Trash2, Edit, GripVertical, Navigation, ExternalLink, Globe } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../constants/travelerProfiles';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Activity Component for Overview
function SortableActivity({ activity, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES.find(c => c.value === category) || ACTIVITY_CATEGORIES[9];
  };

  const categoryInfo = getCategoryInfo(activity.category);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: categoryInfo.color }}
      className="bg-white border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-3"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1"
        >
          <GripVertical size={20} className="text-neutral-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{categoryInfo.emoji}</span>
              <h4 className="font-heading font-bold">{activity.title}</h4>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(activity)}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <Edit size={16} className="text-neutral-500" />
              </button>
              <button
                onClick={() => onDelete(activity.id)}
                className="p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          </div>

          {activity.description && (
            <p className="text-sm text-neutral-warm-gray mb-2">{activity.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-neutral-warm-gray">
            {activity.location && (
              <span className="flex items-center gap-1">
                📍 {activity.location}
              </span>
            )}
            {activity.duration_minutes && (
              <span className="flex items-center gap-1">
                ⏱️ {Math.floor(activity.duration_minutes / 60)}h {activity.duration_minutes % 60}m
              </span>
            )}
            {activity.time_of_day && (
              <span className="px-2 py-0.5 bg-neutral-100 rounded">
                {activity.time_of_day}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlannerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [itinerary, setItinerary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingActivities, setGeneratingActivities] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'timeline', 'map'
  const [activeId, setActiveId] = useState(null);
  const [selectedDay, setSelectedDay] = useState('all');

  const isGenerating = location.state?.generating;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchItineraryData();
  }, [id]);

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
      }, 2000);

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
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();

      if (itineraryError) throw itineraryError;
      setItinerary(itineraryData);

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
      if (activities.length > 0) {
        const { error: deleteError } = await supabase
          .from('activities')
          .delete()
          .eq('itinerary_id', id);
        if (deleteError) throw deleteError;
      }

      const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

      const activitiesToInsert = suggestedActivities.map((activity, index) => ({
        itinerary_id: id,
        day_number: activity.day_number,
        position: index,
        title: activity.title,
        description: activity.description,
        location: activity.location,
        category: validCategories.includes(activity.category) ? activity.category : 'other',
        duration_minutes: activity.duration_minutes,
        estimated_cost_min: activity.estimated_cost_min,
        estimated_cost_max: activity.estimated_cost_max,
        latitude: activity.latitude,
        longitude: activity.longitude,
        time_of_day: activity.time_of_day
      }));

      const { data, error } = await supabase
        .from('activities')
        .insert(activitiesToInsert)
        .select();

      if (error) throw error;
      setActivities(data);
      alert('Itinerary loaded successfully!');
    } catch (error) {
      console.error('Error loading itinerary:', error);
      alert('Failed to load suggested itinerary');
    }
  };

  // Handle adding activity from AI chat drag
  const handleAddActivityFromDrag = async (activityData, dayNumber) => {
    const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

    const newActivity = {
      itinerary_id: id,
      day_number: dayNumber,
      position: activities.filter(a => a.day_number === dayNumber).length,
      title: activityData.title,
      description: activityData.description || '',
      location: activityData.location || '',
      category: validCategories.includes(activityData.category) ? activityData.category : 'other',
      duration_minutes: activityData.duration_minutes || 60,
      estimated_cost_min: activityData.estimated_cost_min || null,
      estimated_cost_max: activityData.estimated_cost_max || null,
      latitude: activityData.latitude || null,
      longitude: activityData.longitude || null,
      time_of_day: activityData.time_of_day || null
    };

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(newActivity)
        .select()
        .single();

      if (error) throw error;
      setActivities([...activities, data]);
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity');
    }
  };

  const handleShare = async () => {
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_published: true })
        .eq('id', id);
      if (error) throw error;
      const shareUrl = `${window.location.origin}/itinerary/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Shareable link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      alert('Failed to create shareable link');
    }
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex(a => a.id === active.id);
      const newIndex = activities.findIndex(a => a.id === over.id);

      const newActivities = arrayMove(activities, oldIndex, newIndex);
      setActivities(newActivities);

      // Update positions in database
      try {
        for (let i = 0; i < newActivities.length; i++) {
          await supabase
            .from('activities')
            .update({ position: i })
            .eq('id', newActivities[i].id);
        }
      } catch (error) {
        console.error('Error updating positions:', error);
      }
    }

    setActiveId(null);
  };

  const handleAddActivity = async (dayNumber) => {
    const newActivity = {
      itinerary_id: id,
      day_number: dayNumber,
      position: activities.filter(a => a.day_number === dayNumber).length,
      title: 'New Activity',
      description: '',
      location: '',
      category: 'other',
      duration_minutes: 60
    };

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(newActivity)
        .select()
        .single();

      if (error) throw error;
      setActivities([...activities, data]);
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleEditActivity = (activity) => {
    console.log('Edit activity:', activity);
  };

  // Handle drop from AI chat
  const handleDrop = (e, dayNumber) => {
    e.preventDefault();
    const activityData = e.dataTransfer.getData('application/json');
    if (activityData) {
      const activity = JSON.parse(activityData);
      handleAddActivityFromDrag(activity, dayNumber);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Get category info helper
  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES.find(c => c.value === category) || { emoji: '📍', color: '#71717A' };
  };

  // Open in Google Maps
  const openInGoogleMaps = (activity) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
    window.open(url, '_blank');
  };

  const openAllInGoogleMaps = () => {
    const filtered = selectedDay === 'all'
      ? activities.filter(a => a.latitude && a.longitude)
      : activities.filter(a => a.day_number === parseInt(selectedDay) && a.latitude && a.longitude);

    if (filtered.length === 0) return;
    const waypoints = filtered.map(a => `${a.latitude},${a.longitude}`).join('/');
    const url = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(url, '_blank');
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

  if (!itinerary) return null;

  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);
  const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude);
  const filteredActivities = selectedDay === 'all'
    ? activitiesWithCoords
    : activitiesWithCoords.filter(a => a.day_number === parseInt(selectedDay));

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
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 size={16} />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto flex gap-6 p-6">
          {/* Left: AI Assistant */}
          <div className="w-1/2 flex flex-col min-w-0">
            <AIAssistant
              itinerary={itinerary}
              onActivityDrag={(activity) => console.log('Activity dragged:', activity)}
              onLoadItinerary={handleLoadItinerary}
            />
          </div>

          {/* Right: Unified Panel with 3 views */}
          <div className="w-1/2 flex flex-col min-w-0">
            <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header with view buttons */}
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-neutral-charcoal">
                      Your Itinerary
                    </h2>
                    <p className="text-sm text-neutral-warm-gray">
                      {itinerary.destination} • {itinerary.trip_length} days
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant={activeView === 'overview' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('overview')}
                      className="gap-1"
                    >
                      <LayoutGrid size={16} />
                      Overview
                    </Button>
                    <Button
                      variant={activeView === 'timeline' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('timeline')}
                      className="gap-1"
                    >
                      <List size={16} />
                      Timeline
                    </Button>
                    <Button
                      variant={activeView === 'map' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('map')}
                      className="gap-1"
                    >
                      <MapIcon size={16} />
                      Map
                    </Button>
                  </div>
                </div>

                {/* Generating indicator */}
                {generatingActivities && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    <p className="text-sm text-primary-700">Generating your personalized itinerary...</p>
                  </div>
                )}
              </div>

              {/* Content based on active view */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* OVERVIEW VIEW - Editable day blocks with drag & drop */}
                {activeView === 'overview' && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-6">
                      {days.map(day => {
                        const dayActivities = activities.filter(a => a.day_number === day);
                        return (
                          <div
                            key={day}
                            className="bg-neutral-50 rounded-lg p-4 min-h-[150px]"
                            onDrop={(e) => handleDrop(e, day)}
                            onDragOver={handleDragOver}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-heading font-bold text-neutral-charcoal">
                                Day {day}
                              </h3>
                              <button
                                onClick={() => handleAddActivity(day)}
                                className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                              >
                                <Plus size={16} />
                                Add Activity
                              </button>
                            </div>

                            {dayActivities.length === 0 ? (
                              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center text-neutral-400">
                                <p className="text-sm">Drop activities here or click "Add Activity"</p>
                              </div>
                            ) : (
                              <SortableContext
                                items={dayActivities.map(a => a.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {dayActivities.map(activity => (
                                  <SortableActivity
                                    key={activity.id}
                                    activity={activity}
                                    onEdit={handleEditActivity}
                                    onDelete={handleDeleteActivity}
                                  />
                                ))}
                              </SortableContext>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <DragOverlay>
                      {activeId ? (
                        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-primary-500">
                          <p className="font-bold">
                            {activities.find(a => a.id === activeId)?.title}
                          </p>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}

                {/* TIMELINE VIEW - Journey Overview list */}
                {activeView === 'timeline' && (
                  <div className="h-full flex flex-col">
                    {/* Day selector */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Navigation className="text-primary-500" size={18} />
                        <h3 className="font-heading font-bold text-neutral-charcoal text-sm">
                          Journey Overview
                        </h3>
                      </div>
                      <button
                        onClick={openAllInGoogleMaps}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <ExternalLink size={12} />
                        Open in Maps
                      </button>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4">
                      <button
                        onClick={() => setSelectedDay('all')}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                          selectedDay === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                        }`}
                      >
                        All ({activitiesWithCoords.length})
                      </button>
                      {days.map(day => {
                        const count = activitiesWithCoords.filter(a => a.day_number === day).length;
                        return (
                          <button
                            key={day}
                            onClick={() => setSelectedDay(day.toString())}
                            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                              selectedDay === day.toString()
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                            }`}
                          >
                            Day {day} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Activity list */}
                    {filteredActivities.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                          <Globe size={24} className="text-primary-500" />
                        </div>
                        <h3 className="text-base font-heading font-bold text-neutral-charcoal mb-1">
                          No locations yet
                        </h3>
                        <p className="text-sm text-neutral-warm-gray">
                          Activities will appear here once generated
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 flex-1 overflow-y-auto">
                        {filteredActivities.map((activity, index) => {
                          const categoryInfo = getCategoryInfo(activity.category);
                          const isFirst = index === 0;
                          const isLast = index === filteredActivities.length - 1;

                          return (
                            <div
                              key={activity.id}
                              onClick={() => openInGoogleMaps(activity)}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isFirst ? 'bg-green-500 text-white' :
                                isLast ? 'bg-red-500 text-white' :
                                'bg-neutral-200 text-neutral-700'
                              }`}>
                                {selectedDay === 'all' ? `D${activity.day_number}` : index + 1}
                              </div>

                              <span className="text-lg flex-shrink-0">{categoryInfo.emoji}</span>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-charcoal truncate">
                                  {activity.title}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">
                                  {activity.location}
                                </p>
                              </div>

                              {activity.time_of_day && (
                                <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded flex-shrink-0">
                                  {activity.time_of_day}
                                </span>
                              )}

                              <ExternalLink size={14} className="text-neutral-400 flex-shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Legend */}
                    <div className="pt-3 border-t border-neutral-200 mt-4">
                      <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Start
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          End
                        </span>
                        <span className="flex items-center gap-1">
                          <ExternalLink size={10} />
                          Click to view
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MAP VIEW - Placeholder for Google Maps */}
                {activeView === 'map' && (
                  <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
                    <div className="text-center p-8">
                      <MapIcon size={48} className="mx-auto mb-4 text-neutral-400" />
                      <h3 className="text-lg font-heading font-bold text-neutral-charcoal mb-2">
                        Map View Coming Soon
                      </h3>
                      <p className="text-sm text-neutral-warm-gray mb-4">
                        Visualize your entire trip on an interactive map
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openAllInGoogleMaps}
                        className="gap-2"
                      >
                        <ExternalLink size={16} />
                        Open Route in Google Maps
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlannerPage;

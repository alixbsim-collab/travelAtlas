import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LeftPanel from '../components/planner/LeftPanel';
import OverviewView from '../components/planner/OverviewView';
import TimelineView from '../components/planner/TimelineView';
import MapPanel from '../components/planner/MapPanel';
import Button from '../components/ui/Button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Save, Share2, Download, ArrowLeft, LayoutGrid, List, Map as MapIcon, X, PanelLeftClose, PanelLeftOpen, Link2, MessageCircle, Check, Hotel as HotelIcon } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../constants/travelerProfiles';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import {
  isRecentlyCreated,
  getDateForDay,
  getDayLocationLabels,
} from '../components/planner/plannerHelpers';

// Fix Leaflet default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Notes Modal Component
function NotesModal({ activity, onClose, onSave }) {
  const [notes, setNotes] = useState(activity?.custom_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(activity.id, notes);
    setSaving(false);
    onClose();
  };

  if (!activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-platinum-200">
          <h3 className="text-lg font-semibold text-charcoal-500">
            Notes for {activity.title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-platinum-200 rounded">
            <X size={20} className="text-platinum-600" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your personal notes here... (e.g., reservation codes, tips, reminders)"
            className="w-full h-32 px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400 resize-none"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-platinum-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add Activity Modal Component
function AddActivityModal({ dayLabel, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'other',
    duration_hours: 1,
    duration_minutes: 0,
    time_of_day: 'morning',
    estimated_cost_min: '',
    estimated_cost_max: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter an activity title');
      return;
    }
    setSaving(true);
    const duration = (parseInt(formData.duration_hours) || 0) * 60 + (parseInt(formData.duration_minutes) || 0);
    await onSave({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      duration_minutes: duration || 60,
      time_of_day: formData.time_of_day,
      estimated_cost_min: formData.estimated_cost_min ? parseFloat(formData.estimated_cost_min) : null,
      estimated_cost_max: formData.estimated_cost_max ? parseFloat(formData.estimated_cost_max) : null
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-platinum-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-charcoal-500">
            Add Activity to {dayLabel}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-platinum-200 rounded">
            <X size={20} className="text-platinum-600" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Visit the Eiffel Tower"
              className="w-full px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the activity..."
              className="w-full h-20 px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400 resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Champ de Mars, Paris"
              className="w-full px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
            >
              {ACTIVITY_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Time of Day
            </label>
            <select
              value={formData.time_of_day}
              onChange={(e) => handleChange('time_of_day', e.target.value)}
              className="w-full px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="all-day">All Day</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Duration
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={formData.duration_hours}
                  onChange={(e) => handleChange('duration_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
                >
                  {[0,1,2,3,4,5,6,7,8].map(h => (
                    <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => handleChange('duration_minutes', e.target.value)}
                  className="w-full px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-charcoal-500 mb-1">
              Estimated Cost (optional)
            </label>
            <div className="flex gap-2 items-center">
              <span className="text-platinum-600">$</span>
              <input
                type="number"
                value={formData.estimated_cost_min}
                onChange={(e) => handleChange('estimated_cost_min', e.target.value)}
                placeholder="Min"
                className="flex-1 px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
              />
              <span className="text-platinum-600">to $</span>
              <input
                type="number"
                value={formData.estimated_cost_max}
                onChange={(e) => handleChange('estimated_cost_max', e.target.value)}
                placeholder="Max"
                className="flex-1 px-3 py-2 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-platinum-200 sticky bottom-0 bg-white">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !formData.title.trim()}>
            {saving ? 'Adding...' : 'Add Activity'}
          </Button>
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
  const [notesActivity, setNotesActivity] = useState(null); // For notes modal
  const [dragOverDay, setDragOverDay] = useState(null); // For visual drop feedback
  const [addActivityDay, setAddActivityDay] = useState(null); // For add activity modal
  const [showAssistant, setShowAssistant] = useState(true); // Toggle AI panel
  const [progressMessage, setProgressMessage] = useState('');
  const [generationTimedOut, setGenerationTimedOut] = useState(false);
  const [accommodations, setAccommodations] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [hotelDropPrompt, setHotelDropPrompt] = useState(null); // { hotel, dayNumber }
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [dayNotes, setDayNotes] = useState({}); // { [dayNumber]: noteText }
  const [highlightedDays, setHighlightedDays] = useState(new Set());
  const [feedbackBanner, setFeedbackBanner] = useState(null); // 'regenerating' | 'done' | null
  const previousActivitiesRef = useRef([]);

  // Augment accommodations from DB with day numbers computed from dates
  const augmentAccommodations = (accs, startDate) => {
    if (!accs) return [];
    return accs.map(acc => {
      if (acc.check_in_day && acc.check_out_day) return acc;
      if (!startDate || !acc.check_in_date || !acc.check_out_date) return acc;
      const start = new Date(startDate);
      const checkIn = new Date(acc.check_in_date);
      const checkOut = new Date(acc.check_out_date);
      const checkInDay = Math.round((checkIn - start) / (1000 * 60 * 60 * 24)) + 1;
      const checkOutDay = Math.round((checkOut - start) / (1000 * 60 * 60 * 24)) + 1;
      return { ...acc, check_in_day: checkInDay, check_out_day: checkOutDay };
    });
  };

  const isGenerating = location.state?.generating;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Shared polling logic — used by initial generation AND re-check
  const startPolling = (timeoutMs = 180000) => {
    setGeneratingActivities(true);
    setGenerationTimedOut(false);
    let msgIndex = 0;

    const progressMessages = [
      'Connecting...',
      'Planning your days...',
      'Finding the best spots...',
      'Adding activities...',
      'Almost done...',
    ];

    setProgressMessage(progressMessages[0]);
    const messageInterval = setInterval(() => {
      msgIndex++;
      const idx = Math.min(msgIndex, progressMessages.length - 1);
      setProgressMessage(progressMessages[idx]);
    }, 5000);

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
        setGenerationTimedOut(false);
        setProgressMessage('');
        clearInterval(pollInterval);
        clearInterval(messageInterval);

        // Compute highlighted days if we had previous activities (regeneration)
        const prev = previousActivitiesRef.current;
        if (prev.length > 0) {
          const changed = new Set();
          activitiesData.forEach(a => {
            const old = prev.find(o => o.day_number === a.day_number && o.position === a.position);
            if (!old || old.title !== a.title) changed.add(a.day_number);
          });
          setHighlightedDays(changed);
          setIsRegenerating(false);
          setFeedbackBanner('done');
          previousActivitiesRef.current = [];
          // Auto-dismiss highlight + banner after 5 seconds
          setTimeout(() => {
            setHighlightedDays(new Set());
            setFeedbackBanner(null);
          }, 5000);
        }

        const [updatedItineraryResult, accResult] = await Promise.all([
          supabase.from('itineraries').select('*').eq('id', id).single(),
          supabase.from('accommodations').select('*').eq('itinerary_id', id)
        ]);

        if (updatedItineraryResult.data) {
          setItinerary(updatedItineraryResult.data);
        }
        if (accResult.data) {
          setAccommodations(augmentAccommodations(accResult.data, updatedItineraryResult.data?.start_date));
        }
      }
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      clearInterval(messageInterval);
      setGeneratingActivities(false);
      setProgressMessage('');
      setGenerationTimedOut(true);
    }, timeoutMs);

    return () => {
      clearInterval(pollInterval);
      clearInterval(messageInterval);
      clearTimeout(timeout);
    };
  };

  // Retry: re-trigger the backend API call AND restart polling
  const handleRetryGeneration = async () => {
    if (!itinerary) return;
    setGenerationTimedOut(false);

    // Re-fire the backend API call
    const apiUrl = process.env.REACT_APP_API_URL || 'https://travelatlas.onrender.com';
    fetch(`${apiUrl}/api/ai/generate-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itineraryId: id,
        destination: itinerary.destination,
        tripLength: itinerary.trip_length,
        travelPace: itinerary.travel_pace,
        budget: itinerary.budget,
        travelerProfiles: itinerary.traveler_profiles || [],
        region: null,
        tripOrigin: itinerary.trip_origin || null,
        travelMode: itinerary.travel_mode || null,
      }),
    }).catch((err) => console.error('Retry generation error:', err));

    startPolling(180000);
  };

  // Handle trip parameter changes from TripParametersPanel — update DB, delete activities, regenerate
  const handleParametersChanged = async (updatedFields) => {
    setIsRegenerating(true);
    setFeedbackBanner('regenerating');
    previousActivitiesRef.current = [...activities];
    try {
      // 1. Update itinerary in Supabase
      const { error: updateError } = await supabase
        .from('itineraries')
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateError) throw updateError;

      // 2. Update local state
      setItinerary(prev => ({ ...prev, ...updatedFields }));

      // 3. Delete existing activities so generation can replace them
      await supabase.from('activities').delete().eq('itinerary_id', id);
      setActivities([]);

      // 4. Fire background generation with new params
      const apiUrl = process.env.REACT_APP_API_URL || 'https://travelatlas.onrender.com';
      fetch(`${apiUrl}/api/ai/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: id,
          destination: updatedFields.destination || itinerary.destination,
          tripLength: itinerary.trip_length,
          travelPace: updatedFields.travel_pace || itinerary.travel_pace,
          budget: updatedFields.budget || itinerary.budget,
          travelerProfiles: updatedFields.traveler_profiles || itinerary.traveler_profiles || [],
          region: null,
          tripOrigin: updatedFields.trip_origin || itinerary.trip_origin || null,
          travelMode: updatedFields.travel_mode || itinerary.travel_mode || null,
        }),
      }).catch((err) => console.error('Regeneration error:', err));

      // 5. Start polling for new activities
      startPolling(180000);
    } catch (error) {
      console.error('Error updating parameters:', error);
      alert('Failed to update trip settings');
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    fetchItineraryData();
  }, [id]);

  // Start polling when navigated with generating=true OR when itinerary loads with 0 activities
  // and was created recently (within 5 min) — covers page refresh / re-visit scenarios
  useEffect(() => {
    if (loading) return; // Wait for initial fetch

    const shouldPoll =
      (isGenerating && activities.length === 0) ||
      (!isGenerating && activities.length === 0 && itinerary && isRecentlyCreated(itinerary.created_at));

    if (shouldPoll) {
      const cleanup = startPolling(180000);
      return cleanup;
    }
  }, [id, isGenerating, activities.length, loading]);

  const fetchItineraryData = async () => {
    try {
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();

      if (itineraryError) throw itineraryError;
      setItinerary(itineraryData);
      setIsPublished(itineraryData.is_published || false);

      const [activitiesResult, accommodationsResult, dayNotesResult] = await Promise.all([
        supabase
          .from('activities')
          .select('*')
          .eq('itinerary_id', id)
          .order('day_number', { ascending: true })
          .order('position', { ascending: true }),
        supabase
          .from('accommodations')
          .select('*')
          .eq('itinerary_id', id),
        supabase
          .from('day_notes')
          .select('*')
          .eq('itinerary_id', id)
      ]);

      if (activitiesResult.error) throw activitiesResult.error;
      setActivities(activitiesResult.data || []);
      setAccommodations(augmentAccommodations(accommodationsResult.data || [], itineraryData.start_date));

      // Build day notes map { dayNumber: notes }
      if (dayNotesResult.data) {
        const notesMap = {};
        dayNotesResult.data.forEach(n => { notesMap[n.day_number] = n.notes; });
        setDayNotes(notesMap);
      }
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
        .update({ updated_at: new Date().toISOString(), is_published: true, moderation_status: 'pending' })
        .eq('id', id);
      if (error) throw error;
      setIsPublished(true);
      alert('Itinerary saved! It will be visible to the community once approved by an admin.');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary');
    } finally {
      setSaving(false);
    }
  };

  // Handle adding accommodation with date range (check-in / check-out)
  const handleAddAccommodationRange = async (hotel, checkInDay, checkOutDay) => {
    const checkInDate = itinerary.start_date
      ? (() => { const d = new Date(itinerary.start_date); d.setDate(d.getDate() + (checkInDay - 1)); return d.toISOString().split('T')[0]; })()
      : null;
    const checkOutDate = itinerary.start_date
      ? (() => { const d = new Date(itinerary.start_date); d.setDate(d.getDate() + (checkOutDay - 1)); return d.toISOString().split('T')[0]; })()
      : null;

    const newAcc = {
      itinerary_id: id,
      name: hotel.name,
      type: hotel.type || 'hotel',
      location: hotel.location || itinerary.destination,
      price_per_night: hotel.price_per_night || null,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      latitude: hotel.latitude || null,
      longitude: hotel.longitude || null,
    };

    try {
      // Try with day number columns first, fall back without
      let result = await supabase.from('accommodations').insert({ ...newAcc, check_in_day: checkInDay, check_out_day: checkOutDay }).select().single();
      if (result.error) {
        result = await supabase.from('accommodations').insert(newAcc).select().single();
        if (result.error) throw result.error;
      }
      const data = result.data;
      // Always augment with day numbers locally for matching
      setAccommodations(prev => [...prev, { ...data, check_in_day: checkInDay, check_out_day: checkOutDay }]);
    } catch (error) {
      console.error('Error adding accommodation:', error);
      alert('Failed to add accommodation');
    }
  };

  const handleDeleteAccommodation = async (accId) => {
    try {
      const { error } = await supabase.from('accommodations').delete().eq('id', accId);
      if (error) throw error;
      setAccommodations(prev => prev.filter(a => a.id !== accId));
    } catch (error) {
      console.error('Error deleting accommodation:', error);
    }
  };

  // Handle AI structural action (add/delete/replace day) — refetch data from DB
  const handleAIAction = async () => {
    try {
      // Refetch itinerary (trip_length may have changed) + activities
      const [itineraryResult, activitiesResult, accommodationsResult] = await Promise.all([
        supabase.from('itineraries').select('*').eq('id', id).single(),
        supabase.from('activities').select('*').eq('itinerary_id', id)
          .order('day_number', { ascending: true })
          .order('position', { ascending: true }),
        supabase.from('accommodations').select('*').eq('itinerary_id', id)
      ]);

      if (itineraryResult.data) setItinerary(itineraryResult.data);
      if (activitiesResult.data) setActivities(activitiesResult.data);
      if (accommodationsResult.data) setAccommodations(augmentAccommodations(accommodationsResult.data, itineraryResult.data?.start_date));
    } catch (error) {
      console.error('Error refetching after AI action:', error);
    }
  };

  // Handle adding activity from AI chat drag
  const handleAddActivityFromDrag = async (activityData, dayNumber) => {
    const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];
    const validTimeOfDay = ['morning', 'afternoon', 'evening', 'night', 'all-day'];

    // Validate and sanitize data to match DB constraints
    const duration = parseInt(activityData.duration_minutes) || 60;
    const costMin = activityData.estimated_cost_min ? parseFloat(activityData.estimated_cost_min) : null;
    const costMax = activityData.estimated_cost_max ? parseFloat(activityData.estimated_cost_max) : null;

    const newActivity = {
      itinerary_id: id,
      day_number: dayNumber,
      position: activities.filter(a => a.day_number === dayNumber).length,
      title: activityData.title || 'Untitled Activity',
      description: activityData.description || '',
      location: activityData.location || '',
      category: validCategories.includes(activityData.category) ? activityData.category : 'other',
      duration_minutes: duration > 0 ? duration : 60,
      estimated_cost_min: costMin !== null && costMin >= 0 ? costMin : null,
      estimated_cost_max: costMax !== null && costMin !== null && costMax >= costMin ? costMax : costMin,
      latitude: activityData.latitude && parseFloat(activityData.latitude) !== 0 ? parseFloat(activityData.latitude) : null,
      longitude: activityData.longitude && parseFloat(activityData.longitude) !== 0 ? parseFloat(activityData.longitude) : null,
      time_of_day: validTimeOfDay.includes(activityData.time_of_day) ? activityData.time_of_day : null
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
      console.error('Activity data:', newActivity);
      alert('Failed to add activity: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCopyLink = async () => {
    // Auto-publish when sharing
    if (!isPublished) {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_published: true, moderation_status: 'pending' })
        .eq('id', id);
      if (!error) setIsPublished(true);
    }
    const shareUrl = `${window.location.origin}/itinerary/${id}`;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    if (!isPublished) {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_published: true, moderation_status: 'pending' })
        .eq('id', id);
      if (!error) setIsPublished(true);
    }
    const shareUrl = `${window.location.origin}/itinerary/${id}`;
    const text = `${itinerary.title} — ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (!isPublished) {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_published: true, moderation_status: 'pending' })
        .eq('id', id);
      if (!error) setIsPublished(true);
    }
    if (navigator.share) {
      const shareUrl = `${window.location.origin}/itinerary/${id}`;
      await navigator.share({ title: itinerary.title, url: shareUrl });
      setShareOpen(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setShareOpen(false);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.innerHTML = buildPrintableHTML(itinerary, activities, accommodations);
      document.body.appendChild(container);

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${itinerary.title || 'itinerary'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
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

  const handleAddActivity = (dayNumber) => {
    setAddActivityDay(dayNumber);
  };

  const handleSaveNewActivity = async (activityData) => {
    const dayNumber = addActivityDay;
    const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

    // Get activities for this day to put new one at position 0 (top)
    const dayActivities = activities.filter(a => a.day_number === dayNumber);

    const newActivity = {
      itinerary_id: id,
      day_number: dayNumber,
      position: 0, // Add at top
      title: activityData.title,
      description: activityData.description || '',
      location: activityData.location || '',
      category: validCategories.includes(activityData.category) ? activityData.category : 'other',
      duration_minutes: activityData.duration_minutes || 60,
      time_of_day: activityData.time_of_day || null,
      estimated_cost_min: activityData.estimated_cost_min || null,
      estimated_cost_max: activityData.estimated_cost_max || null
    };

    try {
      // First, increment positions of existing activities for this day
      if (dayActivities.length > 0) {
        for (const activity of dayActivities) {
          await supabase
            .from('activities')
            .update({ position: activity.position + 1 })
            .eq('id', activity.id);
        }
      }

      const { data, error } = await supabase
        .from('activities')
        .insert(newActivity)
        .select()
        .single();

      if (error) throw error;

      // Update local state - add new activity and update positions
      const updatedActivities = activities.map(a =>
        a.day_number === dayNumber ? { ...a, position: a.position + 1 } : a
      );
      setActivities([data, ...updatedActivities]);
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
    setNotesActivity(activity);
  };

  const handleSaveNotes = async (activityId, notes) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ custom_notes: notes })
        .eq('id', activityId);

      if (error) throw error;

      setActivities(activities.map(a =>
        a.id === activityId ? { ...a, custom_notes: notes } : a
      ));
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  // Save day-level notes (auto-save on blur)
  const handleSaveDayNote = async (dayNumber, text) => {
    setDayNotes(prev => ({ ...prev, [dayNumber]: text }));
    try {
      await supabase
        .from('day_notes')
        .upsert({ itinerary_id: id, day_number: dayNumber, notes: text, updated_at: new Date().toISOString() }, { onConflict: 'itinerary_id,day_number' });
    } catch (error) {
      console.error('Error saving day note:', error);
    }
  };

  // Handle drop from AI chat
  const handleDrop = (e, dayNumber) => {
    e.preventDefault();
    setDragOverDay(null);
    const rawData = e.dataTransfer.getData('application/json');
    if (rawData) {
      const data = JSON.parse(rawData);
      if (data.__type === 'hotel') {
        // Show "How many nights?" prompt
        setHotelDropPrompt({ hotel: data, dayNumber });
      } else {
        handleAddActivityFromDrag(data, dayNumber);
      }
    }
  };

  const handleConfirmHotelNights = (nights) => {
    if (!hotelDropPrompt) return;
    const { hotel, dayNumber } = hotelDropPrompt;
    const checkOutDay = Math.min(dayNumber + nights, itinerary.trip_length + 1);
    handleAddAccommodationRange(hotel, dayNumber, checkOutDay);
    setHotelDropPrompt(null);
  };

  const handleDragOver = (e, dayNumber) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dayNumber !== dragOverDay) {
      setDragOverDay(dayNumber);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the day block entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDay(null);
    }
  };

  // Open in Google Maps
  const openInGoogleMaps = (activity) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
    window.open(url, '_blank');
  };

  const openAllInGoogleMaps = () => {
    const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude);
    const filtered = selectedDay === 'all'
      ? activitiesWithCoords
      : activitiesWithCoords.filter(a => a.day_number === parseInt(selectedDay));

    if (filtered.length === 0) return;
    const waypoints = filtered.map(a => `${a.latitude},${a.longitude}`).join('/');
    const url = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-naples-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400 mx-auto mb-4"></div>
          <p className="text-platinum-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  // Full-screen generating page — shown when activities are being generated
  if (generatingActivities && activities.length === 0) {
    return (
      <div className="min-h-screen bg-naples-100 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-coral-400 mb-6">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>

          <h1 className="text-2xl font-semibold text-charcoal-500 mb-1">
            {itinerary.destination}
          </h1>
          <p className="text-sm text-platinum-500 mb-6">
            {itinerary.trip_length} days
          </p>

          <p className="text-sm text-charcoal-400">
            {progressMessage || 'Getting everything ready...'}
          </p>

          <button
            onClick={() => navigate('/designer')}
            className="mt-10 text-xs text-platinum-400 hover:text-charcoal-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Timed-out generating page — shown when polling expired without activities
  if (generationTimedOut && activities.length === 0) {
    return (
      <div className="min-h-screen bg-naples-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-3xl">&#x23F3;</span>
          </div>

          <h1 className="text-3xl font-semibold text-charcoal-500 mb-3">
            Taking Longer Than Usual
          </h1>
          <p className="text-charcoal-400 mb-6 max-w-sm mx-auto">
            The server is still working on your {itinerary.destination} itinerary. This sometimes happens on the first request.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetryGeneration}
              className="px-8 py-3 bg-coral-400 text-white rounded-xl font-bold hover:bg-coral-500 transition-colors"
            >
              Retry Generation
            </button>
            <button
              onClick={() => {
                const cleanup = startPolling(120000);
                return cleanup;
              }}
              className="px-8 py-3 bg-white border border-platinum-200 text-charcoal-500 rounded-xl font-medium hover:bg-platinum-50 transition-colors"
            >
              Keep Waiting
            </button>
            <button
              onClick={() => navigate('/designer')}
              className="text-sm text-platinum-500 hover:text-charcoal-500 underline mt-2"
            >
              Go back to dashboard
            </button>
          </div>

          <p className="text-xs text-platinum-500 mt-6">
            Tip: If you come back to this trip later, your activities will be here once the server finishes.
          </p>
        </div>
      </div>
    );
  }

  // Render notes modal if active
  const renderNotesModal = notesActivity && (
    <NotesModal
      activity={notesActivity}
      onClose={() => setNotesActivity(null)}
      onSave={handleSaveNotes}
    />
  );

  // Render add activity modal if active
  const addActivityDayLabel = addActivityDay
    ? (itinerary.start_date
        ? getDateForDay(itinerary.start_date, addActivityDay)
        : `Day ${addActivityDay}`)
    : '';

  const renderAddActivityModal = addActivityDay && (
    <AddActivityModal
      dayNumber={addActivityDay}
      dayLabel={addActivityDayLabel}
      onClose={() => setAddActivityDay(null)}
      onSave={handleSaveNewActivity}
    />
  );

  // Find accommodation for a specific day number
  const getAccommodationForDay = (dayNumber) => {
    return accommodations.find(acc => {
      // Use day numbers if available
      if (acc.check_in_day && acc.check_out_day) {
        return dayNumber >= acc.check_in_day && dayNumber < acc.check_out_day;
      }
      // Fall back to dates
      if (!itinerary.start_date || !acc.check_in_date || !acc.check_out_date) return false;
      const dayDate = new Date(itinerary.start_date);
      dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
      const dayStr = dayDate.toISOString().split('T')[0];
      return dayStr >= acc.check_in_date && dayStr < acc.check_out_date;
    });
  };

  // Hotel nights prompt modal
  const renderHotelNightsModal = hotelDropPrompt && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setHotelDropPrompt(null)}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-columbia-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <HotelIcon size={24} className="text-columbia-600" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal-500 mb-1">
            {hotelDropPrompt.hotel.name}
          </h3>
          <p className="text-sm text-platinum-600 mb-4">
            Starting {itinerary.start_date ? getDateForDay(itinerary.start_date, hotelDropPrompt.dayNumber) : `Day ${hotelDropPrompt.dayNumber}`} — How many nights?
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[1, 2, 3].map(n => {
              const maxNights = itinerary.trip_length - hotelDropPrompt.dayNumber + 1;
              if (n > maxNights) return null;
              return (
                <button
                  key={n}
                  onClick={() => handleConfirmHotelNights(n)}
                  className="py-3 rounded-xl bg-columbia-50 hover:bg-columbia-100 border border-columbia-200 text-columbia-700 font-bold text-sm transition-colors"
                >
                  {n} night{n > 1 ? 's' : ''}
                </button>
              );
            })}
            <button
              onClick={() => {
                const input = prompt(`How many nights? (max ${itinerary.trip_length - hotelDropPrompt.dayNumber + 1})`);
                if (input) {
                  const n = parseInt(input);
                  const maxNights = itinerary.trip_length - hotelDropPrompt.dayNumber + 1;
                  if (n > 0 && n <= maxNights) {
                    handleConfirmHotelNights(n);
                  } else {
                    alert(`Please enter a number between 1 and ${maxNights}`);
                  }
                }
              }}
              className="py-3 rounded-xl bg-platinum-50 hover:bg-platinum-100 border border-platinum-200 text-charcoal-500 font-medium text-sm transition-colors"
            >
              Custom
            </button>
          </div>
        </div>
        <button
          onClick={() => setHotelDropPrompt(null)}
          className="w-full py-3 text-sm text-platinum-500 hover:text-charcoal-500 border-t border-platinum-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);
  const dayLocationLabels = getDayLocationLabels(activities, days);

  return (
    <div className="h-screen flex flex-col bg-naples-100">
      {renderNotesModal}
      {renderAddActivityModal}
      {renderHotelNightsModal}
      {/* Top Navigation */}
      <div className="bg-white/80 backdrop-blur-lg px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/designer')}
              className="flex items-center gap-2 text-platinum-600 hover:text-charcoal-500 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div>
              <h1 className="text-xl font-semibold text-charcoal-500">
                {itinerary.title}
              </h1>
              <p className="text-sm text-platinum-600">
                {itinerary.destination} • {itinerary.trip_length} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssistant(!showAssistant)}
              className="gap-2"
              title={showAssistant ? 'Hide AI assistant' : 'Show AI assistant'}
            >
              {showAssistant ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              AI Assistant
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(!shareOpen)} className="gap-2">
                <Share2 size={16} />
                Share
              </Button>
              {shareOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-platinum-200 py-1 w-52">
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                    {typeof navigator.share === 'function' && (
                      <button
                        onClick={handleNativeShare}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                      >
                        <Share2 size={16} />
                        Messages
                      </button>
                    )}
                    <button
                      onClick={() => { handleCopyLink(); setShareOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                    >
                      {linkCopied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
                      {linkCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <div className="border-t border-platinum-200 my-1" />
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full disabled:opacity-50"
                    >
                      <Download size={16} />
                      {exporting ? 'Exporting...' : 'Export as PDF'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Layout - Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto h-full p-6">
          <PanelGroup orientation="horizontal" id="planner-layout">
          {/* Left: AI Assistant */}
          {showAssistant && (
            <>
              <Panel defaultSize="40%" minSize="20%" maxSize="65%" id="ai-panel">
                <div className="h-full flex flex-col min-w-0">
                  <LeftPanel
                    itinerary={itinerary}
                    activities={activities}
                    accommodations={accommodations}
                    onActionExecuted={handleAIAction}
                    onAddAccommodation={handleAddAccommodationRange}
                    onParametersChanged={handleParametersChanged}
                    isRegenerating={isRegenerating}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="w-3 flex items-center justify-center hover:bg-platinum-100 rounded transition-colors">
                <div className="w-1 h-8 bg-platinum-300 hover:bg-charcoal-300 rounded-full transition-colors" />
              </PanelResizeHandle>
            </>
          )}

          {/* Right: Unified Panel with 3 views */}
          <Panel defaultSize={showAssistant ? "60%" : "100%"} minSize="35%" id="itinerary-panel">
          <div className="h-full flex flex-col min-w-0">
            <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
              {/* View toggle buttons */}
              <div className="px-4 py-3 flex items-center justify-end gap-1">
                <Button
                  variant={activeView === 'overview' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('overview')}
                  className="gap-1"
                >
                  <LayoutGrid size={16} />
                  Overview
                </Button>
                <Button
                  variant={activeView === 'timeline' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('timeline')}
                  className="gap-1"
                >
                  <List size={16} />
                  Timeline
                </Button>
                <Button
                  variant={activeView === 'map' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('map')}
                  className="gap-1"
                >
                  <MapIcon size={16} />
                  Map
                </Button>
              </div>

              {/* Feedback banner */}
              {feedbackBanner === 'regenerating' && (
                <div className="mx-4 mb-2 px-4 py-2 bg-naples-100 border border-naples-300 rounded-lg flex items-center gap-2 text-sm text-naples-800">
                  <div className="w-4 h-4 border-2 border-naples-600 border-t-transparent rounded-full animate-spin" />
                  Updating itinerary...
                </div>
              )}
              {feedbackBanner === 'done' && (
                <div className="mx-4 mb-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                  <Check size={14} />
                  Itinerary updated! Changed days are highlighted.
                </div>
              )}

              {/* Content based on active view */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeView === 'overview' && (
                  <OverviewView
                    days={days}
                    activities={activities}
                    itinerary={itinerary}
                    sensors={sensors}
                    activeId={activeId}
                    dragOverDay={dragOverDay}
                    dayLocationLabels={dayLocationLabels}
                    generatingActivities={generatingActivities}
                    highlightedDays={highlightedDays}
                    getAccommodationForDay={getAccommodationForDay}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onAddActivity={handleAddActivity}
                    onEditActivity={handleEditActivity}
                    onDeleteActivity={handleDeleteActivity}
                    onSaveNotes={handleSaveNotes}
                    onAddAccommodationRange={handleAddAccommodationRange}
                    onDeleteAccommodation={handleDeleteAccommodation}
                    onSetHotelDropPrompt={setHotelDropPrompt}
                  />
                )}

                {activeView === 'timeline' && (
                  <TimelineView
                    days={days}
                    activities={activities}
                    itinerary={itinerary}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    dayLocationLabels={dayLocationLabels}
                    dayNotes={dayNotes}
                    onSaveDayNote={handleSaveDayNote}
                    onAddActivity={handleAddActivity}
                    onEditActivity={handleEditActivity}
                    openInGoogleMaps={openInGoogleMaps}
                    openAllInGoogleMaps={openAllInGoogleMaps}
                  />
                )}

                {activeView === 'map' && (
                  <MapPanel
                    days={days}
                    activities={activities}
                    itinerary={itinerary}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                  />
                )}
              </div>
            </div>
          </div>
          </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}

// Build printable HTML for PDF export
function buildPrintableHTML(itinerary, activities, accommodations) {
  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);
  const pdfLocationLabels = getDayLocationLabels(activities, days);
  const DAY_COLORS_PDF = [
    '#EF8557', '#4A7B91', '#FFDB70', '#2C4251', '#BBD3DD',
    '#C85A2E', '#7DADC1', '#F0C84D', '#386074', '#DEE3E1'
  ];

  const fmtDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const dayDate = (startDate, dayNumber) => {
    if (!startDate) return `Day ${dayNumber}`;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (dayNumber - 1));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  let html = `
    <div style="font-family: 'Inter', 'Helvetica', sans-serif; color: #2C4251; max-width: 700px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #EF8557;">
        <h1 style="font-size: 28px; margin: 0 0 8px 0; color: #2C4251;">${itinerary.title || 'Trip Itinerary'}</h1>
        <p style="font-size: 14px; color: #71717A; margin: 0;">
          ${itinerary.destination} &bull; ${itinerary.trip_length} days
          ${itinerary.start_date ? ` &bull; ${fmtDate(itinerary.start_date)} — ${fmtDate(itinerary.end_date)}` : ''}
        </p>
      </div>
  `;

  days.forEach(day => {
    const dayActivities = activities.filter(a => a.day_number === day);
    const label = dayDate(itinerary.start_date, day);
    const locationLabel = pdfLocationLabels[day];

    html += `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <div style="background: #F5F3F0; padding: 10px 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${DAY_COLORS_PDF[(day - 1) % DAY_COLORS_PDF.length]};">
          <strong style="font-size: 16px;">Day ${day} — ${label}</strong>
          ${locationLabel ? `<span style="color: #71717A; font-size: 13px; margin-left: 8px;">${locationLabel}</span>` : ''}
        </div>
    `;

    if (dayActivities.length === 0) {
      html += `<p style="color: #71717A; font-size: 13px; font-style: italic; padding-left: 20px;">No activities planned</p>`;
    } else {
      dayActivities.forEach(activity => {
        html += `
          <div style="padding: 8px 0 8px 20px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${activity.title}</div>
            ${activity.description ? `<div style="font-size: 12px; color: #71717A; margin-bottom: 2px;">${activity.description}</div>` : ''}
            <div style="font-size: 11px; color: #9CA3AF;">
              ${activity.location ? `${activity.location}` : ''}
              ${activity.duration_minutes ? ` &bull; ${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ''}` : ''}
              ${activity.time_of_day ? ` &bull; ${activity.time_of_day}` : ''}
              ${activity.estimated_cost_min != null ? ` &bull; $${activity.estimated_cost_min}${activity.estimated_cost_max && activity.estimated_cost_max !== activity.estimated_cost_min ? `–$${activity.estimated_cost_max}` : ''}` : ''}
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  });

  if (accommodations.length > 0) {
    html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #4A7B91;">
        <h2 style="font-size: 18px; margin: 0 0 12px 0;">Accommodations</h2>
    `;
    accommodations.forEach(acc => {
      html += `
        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <strong style="font-size: 14px;">${acc.name}</strong>
          <div style="font-size: 12px; color: #71717A;">
            ${acc.location || ''}
            ${acc.price_per_night ? ` &bull; $${acc.price_per_night}/night` : ''}
            ${acc.check_in_date ? ` &bull; ${fmtDate(acc.check_in_date)} — ${fmtDate(acc.check_out_date)}` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
      <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 11px; color: #9CA3AF;">Created with Travel Atlas</p>
      </div>
    </div>
  `;

  return html;
}

export default PlannerPage;

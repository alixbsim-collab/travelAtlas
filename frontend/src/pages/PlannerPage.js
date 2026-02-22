import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AIAssistant from '../components/planner/AIAssistant';
import SkeletonActivityCard from '../components/planner/SkeletonActivityCard';
import Button from '../components/ui/Button';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Save, Share2, Download, ArrowLeft, LayoutGrid, List, Map as MapIcon, Plus, Trash2, Edit, GripVertical, Navigation, ExternalLink, Globe, X, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

// Helper to format date
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Helper to get date for a specific day number
const getDateForDay = (startDate, dayNumber) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1));
  return formatDate(date);
};

// Fix Leaflet default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Day colors for map markers and route lines
const DAY_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
];

// Create colored marker icon
const createDayIcon = (dayNumber) => {
  const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">${dayNumber}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Sortable Activity Component for Overview
function SortableActivity({ activity, onEdit, onDelete, onSaveNotes }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(activity.custom_notes || '');
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
      style={{
        ...style,
        borderLeftColor: categoryInfo.color,
        backgroundColor: activity.category === 'transport' ? '#F5F3FF' : activity.category === 'accommodation' ? '#EFF6FF' : 'white'
      }}
      className="border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-3"
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setEditingNotes(true);
                }}
                className="text-xl hover:scale-125 transition-transform cursor-pointer p-1 hover:bg-yellow-100 rounded"
                title="Click to add/edit notes"
                type="button"
              >
                {categoryInfo.emoji}
              </button>
              <h4 className="font-heading font-bold">{activity.title}</h4>
              {activity.custom_notes && (
                <MessageSquare size={14} className="text-yellow-500" title="Has notes" />
              )}
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

          {editingNotes ? (
            <div className="mb-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={() => {
                  setEditingNotes(false);
                  if (notesValue !== (activity.custom_notes || '')) {
                    onSaveNotes(activity.id, notesValue);
                  }
                }}
                placeholder="Add your notes here..."
                className="w-full h-20 px-2 py-1.5 text-xs border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none bg-yellow-50"
                autoFocus
              />
            </div>
          ) : activity.custom_notes ? (
            <div
              className="mb-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800 border border-yellow-200 cursor-pointer hover:bg-yellow-100"
              onClick={(e) => { e.stopPropagation(); setEditingNotes(true); }}
            >
              📝 {activity.custom_notes}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs text-neutral-warm-gray">
            {activity.location && (
              <a
                href={activity.latitude && activity.longitude
                  ? `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                📍 {activity.location}
                <ExternalLink size={10} />
              </a>
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
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-lg font-heading font-bold text-neutral-charcoal">
            Notes for {activity.title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your personal notes here... (e.g., reservation codes, tips, reminders)"
            className="w-full h-32 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200">
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
function AddActivityModal({ dayNumber, dayLabel, onClose, onSave }) {
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
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 sticky top-0 bg-white">
          <h3 className="text-lg font-heading font-bold text-neutral-charcoal">
            Add Activity to {dayLabel}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Visit the Eiffel Tower"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the activity..."
              className="w-full h-20 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Champ de Mars, Paris"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Time of Day
            </label>
            <select
              value={formData.time_of_day}
              onChange={(e) => handleChange('time_of_day', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Duration
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={formData.duration_hours}
                  onChange={(e) => handleChange('duration_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium text-neutral-charcoal mb-1">
              Estimated Cost (optional)
            </label>
            <div className="flex gap-2 items-center">
              <span className="text-neutral-500">$</span>
              <input
                type="number"
                value={formData.estimated_cost_min}
                onChange={(e) => handleChange('estimated_cost_min', e.target.value)}
                placeholder="Min"
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-neutral-500">to $</span>
              <input
                type="number"
                value={formData.estimated_cost_max}
                onChange={(e) => handleChange('estimated_cost_max', e.target.value)}
                placeholder="Max"
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200 sticky bottom-0 bg-white">
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
      let msgIndex = 0;

      const progressMessages = [
        'Waking up the server...',
        'Server is warming up...',
        'Connecting to AI...',
        `Designing your ${itinerary?.trip_length || ''}-day adventure...`,
        'Generating activities for your trip...',
        'Adding local recommendations...',
        'Finalizing your personalized itinerary...',
        'Almost there, adding the finishing touches...',
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
          setProgressMessage('');
          clearInterval(pollInterval);
          clearInterval(messageInterval);

          const { data: updatedItinerary } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', id)
            .single();

          if (updatedItinerary) {
            setItinerary(updatedItinerary);
          }
        }
      }, 3000);

      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        clearInterval(messageInterval);
        setGeneratingActivities(false);
        setProgressMessage('');
      }, 120000);

      return () => {
        clearInterval(pollInterval);
        clearInterval(messageInterval);
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
    const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];
    const validTimeOfDay = ['morning', 'afternoon', 'evening', 'night', 'all-day'];

    const sanitizeActivity = (activity, index) => {
      const duration = parseInt(activity.duration_minutes) || 60;
      const costMin = activity.estimated_cost_min ? parseFloat(activity.estimated_cost_min) : null;
      const costMax = activity.estimated_cost_max ? parseFloat(activity.estimated_cost_max) : null;
      return {
        itinerary_id: id,
        day_number: activity.day_number || 1,
        position: index,
        title: activity.title || 'Untitled Activity',
        description: activity.description || '',
        location: activity.location || '',
        category: validCategories.includes(activity.category) ? activity.category : 'other',
        duration_minutes: duration > 0 ? duration : 60,
        estimated_cost_min: costMin !== null && costMin >= 0 ? costMin : null,
        estimated_cost_max: costMax !== null && costMin !== null && costMax >= costMin ? costMax : costMin,
        latitude: activity.latitude && parseFloat(activity.latitude) !== 0 ? parseFloat(activity.latitude) : null,
        longitude: activity.longitude && parseFloat(activity.longitude) !== 0 ? parseFloat(activity.longitude) : null,
        time_of_day: validTimeOfDay.includes(activity.time_of_day) ? activity.time_of_day : null
      };
    };

    try {
      let mode = 'replace';
      if (activities.length > 0) {
        const choice = window.confirm(
          'You already have activities in your itinerary.\n\nClick OK to REPLACE all activities with the suggested ones.\nClick Cancel to ADD the suggestions to your existing itinerary.'
        );
        mode = choice ? 'replace' : 'merge';
      }

      if (mode === 'replace' && activities.length > 0) {
        const { error: deleteError } = await supabase
          .from('activities')
          .delete()
          .eq('itinerary_id', id);
        if (deleteError) throw deleteError;
      }

      let activitiesToInsert;
      if (mode === 'merge') {
        // Add new activities after existing ones in each day
        activitiesToInsert = suggestedActivities.map((activity, index) => {
          const existingCount = activities.filter(a => a.day_number === (activity.day_number || 1)).length;
          return sanitizeActivity(activity, existingCount + index);
        });
      } else {
        activitiesToInsert = suggestedActivities.map((activity, index) => sanitizeActivity(activity, index));
      }

      const { data, error } = await supabase
        .from('activities')
        .insert(activitiesToInsert)
        .select();

      if (error) throw error;

      if (mode === 'merge') {
        setActivities([...activities, ...data]);
      } else {
        setActivities(data);
      }
      alert('Itinerary loaded successfully!');
    } catch (error) {
      console.error('Error loading itinerary:', error);
      alert('Failed to load suggested itinerary');
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

  // Handle drop from AI chat
  const handleDrop = (e, dayNumber) => {
    e.preventDefault();
    setDragOverDay(null);
    const activityData = e.dataTransfer.getData('application/json');
    if (activityData) {
      const activity = JSON.parse(activityData);
      handleAddActivityFromDrag(activity, dayNumber);
    }
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

  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);
  const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude);
  const filteredActivities = selectedDay === 'all'
    ? activitiesWithCoords
    : activitiesWithCoords.filter(a => a.day_number === parseInt(selectedDay));

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {renderNotesModal}
      {renderAddActivityModal}
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
              onClick={() => setShowAssistant(!showAssistant)}
              className="gap-2"
              title={showAssistant ? 'Hide AI Assistant' : 'Show AI Assistant'}
            >
              {showAssistant ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              {showAssistant ? 'Hide AI' : 'Show AI'}
            </Button>
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

      {/* Split Screen Layout - Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto h-full p-6">
          <PanelGroup orientation="horizontal" id="planner-layout">
          {/* Left: AI Assistant */}
          {showAssistant && (
            <>
              <Panel defaultSize="40%" minSize="20%" maxSize="65%" id="ai-panel">
                <div className="h-full flex flex-col min-w-0">
                  <AIAssistant
                    itinerary={itinerary}
                    onActivityDrag={(activity) => console.log('Activity dragged:', activity)}
                    onLoadItinerary={handleLoadItinerary}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="w-3 flex items-center justify-center hover:bg-primary-100 rounded transition-colors">
                <div className="w-1 h-8 bg-neutral-300 hover:bg-primary-400 rounded-full transition-colors" />
              </PanelResizeHandle>
            </>
          )}

          {/* Right: Unified Panel with 3 views */}
          <Panel defaultSize={showAssistant ? "60%" : "100%"} minSize="35%" id="itinerary-panel">
          <div className="h-full flex flex-col min-w-0">
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
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    <div>
                      <p className="text-sm font-medium text-primary-700">
                        {progressMessage || 'Generating your personalized itinerary...'}
                      </p>
                      <p className="text-xs text-primary-500 mt-1">
                        This may take up to 2 minutes on first request.
                      </p>
                    </div>
                  </div>
                )}
                {/* Retry button when generation timed out */}
                {!generatingActivities && activities.length === 0 && !loading && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-amber-800 mb-3">No activities found. The server may still be generating your itinerary.</p>
                    <button
                      onClick={() => {
                        setGeneratingActivities(true);
                        const pollRetry = setInterval(async () => {
                          const { data } = await supabase
                            .from('activities')
                            .select('*')
                            .eq('itinerary_id', id)
                            .order('day_number', { ascending: true })
                            .order('position', { ascending: true });
                          if (data && data.length > 0) {
                            setActivities(data);
                            setGeneratingActivities(false);
                            clearInterval(pollRetry);
                            // Refetch itinerary for updated destination
                            const { data: updated } = await supabase.from('itineraries').select('*').eq('id', id).single();
                            if (updated) setItinerary(updated);
                          }
                        }, 3000);
                        setTimeout(() => { clearInterval(pollRetry); setGeneratingActivities(false); }, 120000);
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                    >
                      Check Again
                    </button>
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
                        const isDragOver = dragOverDay === day;
                        const cityName = dayActivities[0]?.city_name || null;
                        const dayLabel = itinerary.start_date
                          ? `${getDateForDay(itinerary.start_date, day)}`
                          : `Day ${day}`;
                        const dayHeader = cityName ? `${dayLabel} — ${cityName}` : dayLabel;
                        const skeletonCount = itinerary.travel_pace === 'relaxed' ? 2 : itinerary.travel_pace === 'packed' ? 4 : 3;
                        return (
                          <div
                            key={day}
                            className={`rounded-lg p-4 min-h-[150px] transition-all ${
                              isDragOver
                                ? 'bg-primary-50 border-2 border-dashed border-primary-400 shadow-lg'
                                : 'bg-neutral-50 border-2 border-transparent'
                            }`}
                            onDrop={(e) => handleDrop(e, day)}
                            onDragOver={(e) => handleDragOver(e, day)}
                            onDragLeave={handleDragLeave}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-heading font-bold text-neutral-charcoal">
                                {dayHeader}
                              </h3>
                              <button
                                onClick={() => handleAddActivity(day)}
                                className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                              >
                                <Plus size={16} />
                                Add Activity
                              </button>
                            </div>

                            {isDragOver && (
                              <div className="mb-3 p-2 bg-primary-100 rounded-lg text-center">
                                <p className="text-sm text-primary-700 font-medium">Drop here to add to {dayLabel}</p>
                              </div>
                            )}

                            {dayActivities.length === 0 && !isDragOver ? (
                              generatingActivities ? (
                                <div>
                                  {Array.from({ length: skeletonCount }).map((_, i) => (
                                    <SkeletonActivityCard key={i} />
                                  ))}
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center text-neutral-400">
                                  <p className="text-sm">Drop activities here or click "Add Activity"</p>
                                </div>
                              )
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
                                    onSaveNotes={handleSaveNotes}
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
                        const dayCity = activities.find(a => a.day_number === day)?.city_name;
                        const dateLabel = itinerary.start_date
                          ? getDateForDay(itinerary.start_date, day)
                          : `Day ${day}`;
                        const buttonLabel = dayCity ? `${dateLabel} — ${dayCity}` : dateLabel;
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
                            {buttonLabel} ({count})
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

                          return (
                            <div
                              key={activity.id}
                              onClick={() => openInGoogleMaps(activity)}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
                            >
                              <div className="w-auto min-w-[2.5rem] h-6 px-2 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-primary-100 text-primary-700">
                                {selectedDay === 'all'
                                  ? (itinerary.start_date
                                      ? getDateForDay(itinerary.start_date, activity.day_number)?.split(', ')[0] || `D${activity.day_number}`
                                      : `D${activity.day_number}`)
                                  : index + 1}
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
                          <ExternalLink size={10} />
                          Click activity to view in Maps
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MAP VIEW - Placeholder for Google Maps */}
                {activeView === 'map' && (
                  <div className="h-full flex flex-col rounded-lg overflow-hidden">
                    {/* Day filter for map */}
                    <div className="flex gap-2 p-3 bg-white border-b border-neutral-200 overflow-x-auto">
                      <button
                        onClick={() => setSelectedDay('all')}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                          selectedDay === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        All Days
                      </button>
                      {days.map(day => {
                        const dayColor = DAY_COLORS[(day - 1) % DAY_COLORS.length];
                        return (
                          <button
                            key={day}
                            onClick={() => setSelectedDay(day.toString())}
                            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                              selectedDay === day.toString()
                                ? 'text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                            style={selectedDay === day.toString() ? { backgroundColor: dayColor } : {}}
                          >
                            {itinerary.start_date ? getDateForDay(itinerary.start_date, day) : `Day ${day}`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Map */}
                    {activitiesWithCoords.length > 0 ? (
                      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
                        <MapContainer
                          center={[
                            filteredActivities.length > 0
                              ? filteredActivities.reduce((sum, a) => sum + a.latitude, 0) / filteredActivities.length
                              : activitiesWithCoords[0].latitude,
                            filteredActivities.length > 0
                              ? filteredActivities.reduce((sum, a) => sum + a.longitude, 0) / filteredActivities.length
                              : activitiesWithCoords[0].longitude
                          ]}
                          zoom={13}
                          style={{ height: '100%', width: '100%' }}
                          key={`${selectedDay}-${filteredActivities.length}`}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />

                          {/* Markers for each activity */}
                          {filteredActivities.map((activity) => (
                            <Marker
                              key={activity.id}
                              position={[activity.latitude, activity.longitude]}
                              icon={createDayIcon(activity.day_number)}
                            >
                              <Popup>
                                <div className="text-sm">
                                  <p className="font-bold">{activity.title}</p>
                                  <p className="text-neutral-500">{activity.location}</p>
                                  {activity.duration_minutes && (
                                    <p className="text-xs text-neutral-400 mt-1">
                                      {Math.floor(activity.duration_minutes / 60)}h {activity.duration_minutes % 60}m
                                    </p>
                                  )}
                                </div>
                              </Popup>
                            </Marker>
                          ))}

                          {/* Dotted route lines connecting activities by day */}
                          {(selectedDay === 'all' ? days : [parseInt(selectedDay)]).map(day => {
                            const dayActs = filteredActivities
                              .filter(a => a.day_number === day)
                              .sort((a, b) => (a.position || 0) - (b.position || 0));
                            if (dayActs.length < 2) return null;
                            const positions = dayActs.map(a => [a.latitude, a.longitude]);
                            return (
                              <Polyline
                                key={`route-day-${day}`}
                                positions={positions}
                                pathOptions={{
                                  color: DAY_COLORS[(day - 1) % DAY_COLORS.length],
                                  weight: 3,
                                  dashArray: '8, 12',
                                  opacity: 0.7
                                }}
                              />
                            );
                          })}
                        </MapContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-neutral-50">
                        <div className="text-center p-8">
                          <MapIcon size={48} className="mx-auto mb-4 text-neutral-400" />
                          <h3 className="text-lg font-heading font-bold text-neutral-charcoal mb-2">
                            No locations to show yet
                          </h3>
                          <p className="text-sm text-neutral-warm-gray">
                            Activities with coordinates will appear on the map
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="p-3 bg-white border-t border-neutral-200">
                      <div className="flex flex-wrap gap-3 justify-center">
                        {(selectedDay === 'all' ? days : [parseInt(selectedDay)]).map(day => {
                          const count = filteredActivities.filter(a => a.day_number === day).length;
                          if (count === 0) return null;
                          return (
                            <span key={day} className="flex items-center gap-1 text-xs text-neutral-600">
                              <span
                                className="w-3 h-3 rounded-full inline-block"
                                style={{ backgroundColor: DAY_COLORS[(day - 1) % DAY_COLORS.length] }}
                              />
                              {itinerary.start_date ? getDateForDay(itinerary.start_date, day) : `Day ${day}`} ({count})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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

export default PlannerPage;

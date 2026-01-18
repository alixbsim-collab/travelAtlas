import React, { useState, useEffect } from 'react';
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
import { MapPin, Clock, DollarSign, Plus, Trash2, Edit, GripVertical, Map as MapIcon } from 'lucide-react';
import Button from '../ui/Button';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';
import { supabase } from '../../supabaseClient';

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
                <MapPin size={14} />
                {activity.location}
              </span>
            )}
            {activity.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {Math.floor(activity.duration_minutes / 60)}h {activity.duration_minutes % 60}m
              </span>
            )}
            {activity.estimated_cost_min && (
              <span className="flex items-center gap-1">
                <DollarSign size={14} />
                ${activity.estimated_cost_min}
                {activity.estimated_cost_max && `-$${activity.estimated_cost_max}`}
              </span>
            )}
          </div>

          {activity.custom_notes && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
              📝 {activity.custom_notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayBlock({ day, activities, onAddActivity, onEditActivity, onDeleteActivity }) {
  const dayActivities = activities.filter(a => a.day_number === day);

  const handleDrop = (e) => {
    e.preventDefault();
    const activityData = e.dataTransfer.getData('application/json');
    if (activityData) {
      const activity = JSON.parse(activityData);
      onAddActivity({ ...activity, day_number: day });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="bg-neutral-50 rounded-lg p-4 min-h-[200px]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-bold text-neutral-charcoal">
          Day {day}
        </h3>
        <button
          onClick={() => onAddActivity({ day_number: day })}
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
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

function DragDropPlanner({ itinerary, activities, setActivities }) {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'map'
  const [activeId, setActiveId] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      await updateActivityPositions(newActivities);
    }

    setActiveId(null);
  };

  const updateActivityPositions = async (newActivities) => {
    try {
      const updates = newActivities.map((activity, index) => ({
        id: activity.id,
        position: index
      }));

      for (const update of updates) {
        await supabase
          .from('activities')
          .update({ position: update.position })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating activity positions:', error);
    }
  };

  const handleAddActivity = async (template) => {
    const newActivity = {
      itinerary_id: itinerary.id,
      day_number: template.day_number || 1,
      position: activities.filter(a => a.day_number === template.day_number).length,
      title: template.title || 'New Activity',
      description: template.description || '',
      location: template.location || '',
      category: template.category || 'other',
      duration_minutes: template.duration_minutes || 60,
      estimated_cost_min: template.estimated_cost_min || null,
      estimated_cost_max: template.estimated_cost_max || null,
      booking_url: template.booking_url || null,
      booking_required: template.booking_required || false,
      custom_notes: template.custom_notes || ''
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

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

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

  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-heading font-bold text-neutral-charcoal">
            Your Itinerary
          </h2>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-2"
            >
              <MapIcon size={16} />
              Map
            </Button>
          </div>
        </div>

        <p className="text-sm text-neutral-warm-gray">
          {itinerary.destination} • {itinerary.trip_length} days
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'timeline' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              {days.map(day => (
                <DayBlock
                  key={day}
                  day={day}
                  activities={activities}
                  onAddActivity={handleAddActivity}
                  onEditActivity={handleEditActivity}
                  onDeleteActivity={handleDeleteActivity}
                />
              ))}
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
        ) : (
          <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
            <div className="text-center">
              <MapIcon size={48} className="mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-warm-gray">Map view coming soon</p>
              <p className="text-sm text-neutral-400 mt-2">
                Visualize your activities on an interactive map
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DragDropPlanner;

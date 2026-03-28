import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit, MessageSquare, ExternalLink } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';

export default function SortableActivity({ activity, onEdit, onDelete, onSaveNotes }) {
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
          <GripVertical size={20} className="text-platinum-500" />
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
                className="text-xl hover:scale-125 transition-transform cursor-pointer p-1 hover:bg-naples-100 rounded"
                title="Click to add/edit notes"
                type="button"
              >
                {categoryInfo.emoji}
              </button>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(activity.title + (activity.location ? ' ' + activity.location : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold hover:text-coral-500 transition-colors"
              >
                {activity.title}
              </a>
              {activity.custom_notes && (
                <MessageSquare size={14} className="text-naples-600" title="Has notes" />
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(activity)}
                className="p-1 hover:bg-platinum-200 rounded transition-colors"
              >
                <Edit size={16} className="text-platinum-600" />
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
            <p className="text-sm text-platinum-600 mb-2">{activity.description}</p>
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
                className="w-full h-20 px-2 py-1.5 text-xs border border-naples-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-naples-400 resize-none bg-naples-50"
                autoFocus
              />
            </div>
          ) : activity.custom_notes ? (
            <div
              className="mb-2 p-2 bg-naples-50 rounded text-xs text-naples-800 border border-naples-200 cursor-pointer hover:bg-naples-100"
              onClick={(e) => { e.stopPropagation(); setEditingNotes(true); }}
            >
              {activity.custom_notes}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs text-platinum-600">
            {activity.location && (
              <a
                href={activity.latitude && activity.longitude
                  ? `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-coral-500 hover:text-coral-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {activity.location}
                <ExternalLink size={10} />
              </a>
            )}
            {activity.duration_minutes && (
              <span className="flex items-center gap-1">
                {Math.floor(activity.duration_minutes / 60)}h {activity.duration_minutes % 60}m
              </span>
            )}
            {activity.time_of_day && (
              <span className="px-2 py-0.5 bg-platinum-200 rounded">
                {activity.time_of_day}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

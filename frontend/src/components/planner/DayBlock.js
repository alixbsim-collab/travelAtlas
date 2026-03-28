import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableActivity from './SortableActivity';
import SkeletonActivityCard from './SkeletonActivityCard';
import { Plus, X, Hotel as HotelIcon } from 'lucide-react';

export default function DayBlock({
  day,
  dayActivities,
  isDragOver,
  dayHeader,
  dayLabel,
  dayAccommodation,
  skeletonCount,
  generatingActivities,
  isHighlighted,
  itinerary,
  onDrop,
  onDragOver,
  onDragLeave,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onSaveNotes,
  onDeleteAccommodation,
  onAddAccommodation,
  onHotelDrop,
}) {
  return (
    <div
      className={`rounded-lg p-4 min-h-[150px] transition-all ${
        isDragOver
          ? 'bg-coral-50 border-2 border-dashed border-coral-400 shadow-lg'
          : isHighlighted
            ? 'bg-coral-50/30 border-2 border-coral-300 ring-2 ring-coral-400/50 animate-pulse'
            : 'bg-platinum-50 border-2 border-transparent'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-charcoal-500">
          {dayHeader}
        </h3>
        <button
          onClick={() => onAddActivity(day)}
          className="text-sm text-coral-500 hover:text-coral-500 flex items-center gap-1"
        >
          <Plus size={16} />
          Add Activity
        </button>
      </div>
      {dayAccommodation ? (
        <div className="flex items-center gap-2 text-xs text-columbia-700 bg-columbia-50 px-3 py-1.5 rounded-lg mb-3 border border-columbia-200 group/acc">
          <HotelIcon size={12} />
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(dayAccommodation.name + ' ' + (dayAccommodation.location || itinerary.destination))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-coral-500 transition-colors"
          >
            {dayAccommodation.name}
          </a>
          {dayAccommodation.price_per_night && (
            <span className="text-columbia-500">${dayAccommodation.price_per_night}/night</span>
          )}
          <button
            onClick={() => onDeleteAccommodation(dayAccommodation.id)}
            className="ml-auto opacity-0 group-hover/acc:opacity-100 text-platinum-400 hover:text-red-500 transition-all"
            title="Remove accommodation"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            const name = window.prompt('Enter hotel/accommodation name:');
            if (name && name.trim()) {
              onAddAccommodation({ name: name.trim(), type: 'hotel' }, day, day + 1);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const rawData = e.dataTransfer.getData('application/json');
            if (rawData) {
              const data = JSON.parse(rawData);
              if (data.__type === 'hotel') {
                onHotelDrop({ hotel: data, dayNumber: day });
              }
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add('border-columbia-400', 'bg-columbia-50', 'text-columbia-600');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-columbia-400', 'bg-columbia-50', 'text-columbia-600');
          }}
          className="flex items-center gap-2 text-xs text-platinum-400 px-3 py-1.5 rounded-lg mb-3 border border-dashed border-platinum-200 w-full hover:border-columbia-300 hover:text-columbia-500 hover:bg-columbia-50/50 transition-all cursor-pointer"
        >
          <HotelIcon size={12} />
          <span className="italic">Accommodation to be defined</span>
          <span className="ml-auto text-[10px] opacity-0 group-hover:opacity-60">drag hotel here</span>
        </button>
      )}

      {isDragOver && (
        <div className="mb-3 p-2 bg-coral-100 rounded-lg text-center">
          <p className="text-sm text-coral-700 font-medium">Drop here to add to {dayLabel}</p>
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
          <div className="border-2 border-dashed border-platinum-300 rounded-lg p-8 text-center text-platinum-500">
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
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
              onSaveNotes={onSaveNotes}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

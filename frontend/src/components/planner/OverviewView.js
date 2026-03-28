import React from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import DayBlock from './DayBlock';
import { getDateForDay } from './plannerHelpers';

export default function OverviewView({
  days,
  activities,
  itinerary,
  sensors,
  activeId,
  dragOverDay,
  dayLocationLabels,
  generatingActivities,
  highlightedDays,
  getAccommodationForDay,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onDragLeave,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onSaveNotes,
  onAddAccommodationRange,
  onDeleteAccommodation,
  onSetHotelDropPrompt,
}) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="space-y-6">
        {days.map(day => {
          const dayActivities = activities.filter(a => a.day_number === day);
          const isDragOver = dragOverDay === day;
          const locationLabel = dayLocationLabels[day];
          const dayLabel = itinerary.start_date
            ? `${getDateForDay(itinerary.start_date, day)}`
            : `Day ${day}`;
          const dayHeader = locationLabel ? `${dayLabel} — ${locationLabel}` : dayLabel;
          const skeletonCount = itinerary.travel_pace === 'relaxed' ? 2 : itinerary.travel_pace === 'packed' ? 4 : 3;
          const dayAccommodation = getAccommodationForDay(day);

          return (
            <DayBlock
              key={day}
              day={day}
              dayActivities={dayActivities}
              isDragOver={isDragOver}
              dayHeader={dayHeader}
              dayLabel={dayLabel}
              dayAccommodation={dayAccommodation}
              skeletonCount={skeletonCount}
              generatingActivities={generatingActivities}
              isHighlighted={highlightedDays && highlightedDays.has(day)}
              itinerary={itinerary}
              onDrop={(e) => onDrop(e, day)}
              onDragOver={(e) => onDragOver(e, day)}
              onDragLeave={onDragLeave}
              onAddActivity={onAddActivity}
              onEditActivity={onEditActivity}
              onDeleteActivity={onDeleteActivity}
              onSaveNotes={onSaveNotes}
              onDeleteAccommodation={onDeleteAccommodation}
              onAddAccommodation={onAddAccommodationRange}
              onHotelDrop={onSetHotelDropPrompt}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-coral-400">
            <p className="font-bold">
              {activities.find(a => a.id === activeId)?.title}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

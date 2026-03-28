import { useState } from 'react';
import { Navigation, ExternalLink, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { getDateForDay, getCategoryInfo } from './plannerHelpers';

export default function TimelineView({
  days,
  activities,
  itinerary,
  selectedDay,
  setSelectedDay,
  dayLocationLabels,
  dayNotes,
  onSaveDayNote,
  onAddActivity,
  onEditActivity,
  openInGoogleMaps,
  openAllInGoogleMaps,
}) {
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [editingNoteDay, setEditingNoteDay] = useState(null);
  const [noteText, setNoteText] = useState('');

  const toggleDay = (day) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const startEditingNote = (day) => {
    setEditingNoteDay(day);
    setNoteText(dayNotes[day] || '');
  };

  const saveNote = (day) => {
    onSaveDayNote(day, noteText);
    setEditingNoteDay(null);
  };

  const filteredDays = selectedDay === 'all' ? days : days.filter(d => d === parseInt(selectedDay));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="text-coral-500" size={18} />
          <h3 className="font-semibold text-charcoal-500 text-sm">Timeline</h3>
        </div>
        <button
          onClick={openAllInGoogleMaps}
          className="flex items-center gap-1 text-xs text-coral-500 hover:text-coral-600 font-medium"
        >
          <ExternalLink size={12} />
          Open All in Maps
        </button>
      </div>

      {/* Day filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            selectedDay === 'all'
              ? 'bg-coral-500 text-white'
              : 'bg-white text-charcoal-400 hover:bg-platinum-200 border border-platinum-200'
          }`}
        >
          All Days
        </button>
        {days.map(day => {
          const dateLabel = itinerary.start_date
            ? getDateForDay(itinerary.start_date, day)
            : `Day ${day}`;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day.toString())}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                selectedDay === day.toString()
                  ? 'bg-coral-500 text-white'
                  : 'bg-white text-charcoal-400 hover:bg-platinum-200 border border-platinum-200'
              }`}
            >
              {dateLabel}
            </button>
          );
        })}
      </div>

      {/* Day-by-day timeline */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredDays.map((day, dayIndex) => {
          const dayActivities = activities
            .filter(a => a.day_number === day)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          const locationLabel = dayLocationLabels[day];
          const dateLabel = itinerary.start_date
            ? getDateForDay(itinerary.start_date, day)
            : `Day ${day}`;
          const isCollapsed = collapsedDays.has(day);
          const note = dayNotes[day] || '';
          const isEditingNote = editingNoteDay === day;
          const isLastDay = dayIndex === filteredDays.length - 1;

          return (
            <div key={day} className="relative">
              {/* Vertical connector line */}
              {!isLastDay && (
                <div className="absolute left-5 top-full w-0.5 h-4 bg-platinum-200 z-0" />
              )}

              <div className="bg-white rounded-xl border border-platinum-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Day header */}
                <button
                  onClick={() => toggleDay(day)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-platinum-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-coral-400 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-charcoal-500">
                      {dateLabel}
                    </div>
                    {locationLabel && (
                      <div className="text-xs text-platinum-500 truncate">
                        {locationLabel}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-platinum-400 mr-1">
                    {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown size={16} className="text-platinum-400" />
                  ) : (
                    <ChevronUp size={16} className="text-platinum-400" />
                  )}
                </button>

                {/* Expanded content */}
                {!isCollapsed && (
                  <div className="border-t border-platinum-100">
                    {/* Activities list */}
                    {dayActivities.length === 0 ? (
                      <div className="px-4 py-3 text-center text-xs text-platinum-400 italic">
                        No activities yet
                      </div>
                    ) : (
                      <div className="divide-y divide-platinum-100">
                        {dayActivities.map((activity) => {
                          const catInfo = getCategoryInfo(activity.category);
                          const hasCoords = activity.latitude && activity.longitude;
                          return (
                            <div
                              key={activity.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-platinum-50 transition-colors group"
                            >
                              <span className="text-base flex-shrink-0">{catInfo.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => onEditActivity(activity)}
                                  className="text-sm font-medium text-charcoal-500 truncate block text-left hover:text-coral-500 transition-colors"
                                >
                                  {activity.title}
                                </button>
                                {activity.location && (
                                  <p className="text-xs text-platinum-500 truncate">
                                    {activity.location}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {activity.duration_minutes && (
                                  <span className="text-[10px] text-platinum-400">
                                    {Math.floor(activity.duration_minutes / 60)}h{activity.duration_minutes % 60 > 0 ? `${activity.duration_minutes % 60}m` : ''}
                                  </span>
                                )}
                                {activity.time_of_day && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-platinum-100 text-platinum-500 rounded">
                                    {activity.time_of_day}
                                  </span>
                                )}
                                {hasCoords && (
                                  <button
                                    onClick={() => openInGoogleMaps(activity)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="View in Maps"
                                  >
                                    <ExternalLink size={12} className="text-platinum-400 hover:text-coral-500" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Day notes */}
                    <div className="px-4 py-2.5 bg-naples-50/50 border-t border-platinum-100">
                      {isEditingNote ? (
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onBlur={() => saveNote(day)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveNote(day);
                            }
                          }}
                          placeholder="Add notes for this day..."
                          className="w-full text-xs px-2 py-1.5 border border-naples-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-naples-400 resize-none bg-white"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditingNote(day)}
                          className="w-full text-left text-xs text-platinum-400 hover:text-charcoal-500 transition-colors"
                        >
                          {note ? (
                            <span className="text-naples-700">{note}</span>
                          ) : (
                            <span className="italic">+ Add notes for this day...</span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Add activity button */}
                    <div className="px-4 py-2 border-t border-platinum-100">
                      <button
                        onClick={() => onAddActivity(day)}
                        className="flex items-center gap-1.5 text-xs text-coral-500 hover:text-coral-600 font-medium transition-colors"
                      >
                        <Plus size={12} />
                        Add Activity
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { getDateForDay } from './plannerHelpers';

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
  const [editingNoteDay, setEditingNoteDay] = useState(null);
  const [noteText, setNoteText] = useState('');

  const startEditingNote = (day) => {
    setEditingNoteDay(day);
    setNoteText(dayNotes[day] || '');
  };

  const saveNote = (day) => {
    onSaveDayNote(day, noteText);
    setEditingNoteDay(null);
  };

  const filteredDays = selectedDay === 'all' ? days : days.filter(d => d === parseInt(selectedDay));

  const formatDuration = (mins) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}min`;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-charcoal-500 text-sm">Timeline</h3>
        <button
          onClick={openAllInGoogleMaps}
          className="flex items-center gap-1 text-xs text-coral-500 hover:text-coral-600 font-medium"
        >
          <ExternalLink size={12} />
          Open All in Maps
        </button>
      </div>

      {/* Day filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2">
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

      {/* Journal-style timeline */}
      <div className="flex-1 overflow-y-auto">
        {filteredDays.map((day) => {
          const dayActivities = activities
            .filter(a => a.day_number === day)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          const locationLabel = dayLocationLabels[day];
          const dateLabel = itinerary.start_date
            ? getDateForDay(itinerary.start_date, day)
            : `Day ${day}`;
          const note = dayNotes[day] || '';
          const isEditingNote = editingNoteDay === day;

          return (
            <div key={day} className="mb-6">
              {/* Day heading — simple text */}
              <div className="flex items-baseline gap-2 mb-2 pb-1.5 border-b border-platinum-200">
                <span className="text-base font-bold text-charcoal-500">
                  Day {day}
                </span>
                {locationLabel && (
                  <span className="text-base font-bold text-coral-500">
                    — {locationLabel}
                  </span>
                )}
                <span className="text-xs text-platinum-400 ml-auto">
                  {dateLabel}
                </span>
              </div>

              {/* Activities */}
              {dayActivities.length === 0 ? (
                <p className="text-xs text-platinum-400 italic pl-5 mb-2">No activities yet</p>
              ) : (
                <ul className="mb-2">
                  {dayActivities.map((activity) => {
                    const hasCoords = activity.latitude && activity.longitude;
                    const duration = formatDuration(activity.duration_minutes);

                    return (
                      <li key={activity.id} className="flex items-baseline gap-2 py-0.5 pl-2 group">
                        <span className="text-platinum-300 text-xs select-none">-</span>
                        <button
                          onClick={() => onEditActivity(activity)}
                          className="text-sm text-charcoal-500 hover:text-coral-500 transition-colors text-left"
                        >
                          {activity.title}
                        </button>
                        {duration && (
                          <span className="text-[11px] text-platinum-400">{duration}</span>
                        )}
                        {activity.time_of_day && (
                          <span className="text-[11px] text-platinum-300">{activity.time_of_day}</span>
                        )}
                        {hasCoords && (
                          <button
                            onClick={() => openInGoogleMaps(activity)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View in Maps"
                          >
                            <ExternalLink size={10} className="text-platinum-300 hover:text-coral-500" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Notes — inline */}
              <div className="pl-1 mb-1">
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
                    placeholder="Add notes..."
                    className="w-full text-xs px-2 py-1.5 border border-naples-300 rounded focus:outline-none focus:ring-1 focus:ring-naples-400 resize-none bg-naples-50/50"
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => startEditingNote(day)}
                    className="text-xs text-left hover:text-charcoal-500 transition-colors"
                  >
                    {note ? (
                      <span className="text-naples-700 italic">{note}</span>
                    ) : (
                      <span className="text-platinum-300 italic">+ notes...</span>
                    )}
                  </button>
                )}
              </div>

              {/* Add activity — minimal */}
              <button
                onClick={() => onAddActivity(day)}
                className="flex items-center gap-1 text-xs text-coral-400 hover:text-coral-500 pl-1 transition-colors"
              >
                <Plus size={11} />
                <span>add activity</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

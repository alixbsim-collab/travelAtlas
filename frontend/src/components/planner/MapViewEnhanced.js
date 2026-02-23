import React, { useMemo, useState } from 'react';
import { MapPin, Clock, DollarSign, Navigation, Calendar, Globe, ExternalLink } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';

function MapViewEnhanced({ activities, itinerary }) {
  const [selectedDay, setSelectedDay] = useState('all');

  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const grouped = {};
    activities.filter(a => a.latitude && a.longitude).forEach(activity => {
      const day = activity.day_number;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(activity);
    });
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [activities]);

  const days = Object.keys(activitiesByDay).sort((a, b) => parseInt(a) - parseInt(b));

  // Filter activities by selected day
  const filteredActivities = useMemo(() => {
    if (selectedDay === 'all') {
      return activities.filter(a => a.latitude && a.longitude);
    }
    return activitiesByDay[selectedDay] || [];
  }, [selectedDay, activities, activitiesByDay]);

  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES.find(c => c.value === category) || { emoji: '📍', color: '#71717A' };
  };

  const openInGoogleMaps = (activity) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
    window.open(url, '_blank');
  };

  const openAllInGoogleMaps = () => {
    if (filteredActivities.length === 0) return;

    // Create a directions URL with all waypoints
    const waypoints = filteredActivities.map(a => `${a.latitude},${a.longitude}`).join('/');
    const url = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(url, '_blank');
  };

  if (activities.filter(a => a.latitude && a.longitude).length === 0) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border border-platinum-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
          <Globe size={24} className="text-primary-500" />
        </div>
        <h3 className="text-base font-heading font-bold text-charcoal-500 mb-1">
          No locations yet
        </h3>
        <p className="text-sm text-platinum-600">
          Activities will appear here once generated
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-platinum-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-platinum-200 bg-neutral-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="text-primary-500" size={18} />
            <h3 className="font-heading font-bold text-charcoal-500 text-sm">
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

        {/* Day Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              selectedDay === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-neutral-600 hover:bg-platinum-200 border border-platinum-200'
            }`}
          >
            All ({filteredActivities.length})
          </button>
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 hover:bg-platinum-200 border border-platinum-200'
              }`}
            >
              Day {day} ({activitiesByDay[day]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Location List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1.5">
          {filteredActivities.map((activity, index) => {
            const categoryInfo = getCategoryInfo(activity.category);
            const isFirst = index === 0;
            const isLast = index === filteredActivities.length - 1;

            return (
              <div
                key={activity.id}
                onClick={() => openInGoogleMaps(activity)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors border border-transparent hover:border-platinum-200"
              >
                {/* Position indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isFirst ? 'bg-green-500 text-white' :
                  isLast ? 'bg-red-500 text-white' :
                  'bg-neutral-200 text-neutral-700'
                }`}>
                  {selectedDay === 'all' ? `D${activity.day_number}` : index + 1}
                </div>

                {/* Category emoji */}
                <span className="text-lg flex-shrink-0">{categoryInfo.emoji}</span>

                {/* Activity info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-500 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-platinum-600 truncate">
                    {activity.location}
                  </p>
                </div>

                {/* Time badge */}
                {activity.time_of_day && (
                  <span className="text-xs px-1.5 py-0.5 bg-platinum-200 text-neutral-600 rounded flex-shrink-0">
                    {activity.time_of_day}
                  </span>
                )}

                <ExternalLink size={14} className="text-platinum-500 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with legend */}
      <div className="p-2 border-t border-platinum-200 bg-neutral-50">
        <div className="flex items-center justify-center gap-4 text-xs text-platinum-600">
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
  );
}

export default MapViewEnhanced;

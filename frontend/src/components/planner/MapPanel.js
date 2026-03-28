import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Map as MapIcon } from 'lucide-react';
import { DAY_COLORS, createDayIcon, getDateForDay } from './plannerHelpers';

export default function MapPanel({
  days,
  activities,
  itinerary,
  selectedDay,
  setSelectedDay,
}) {
  const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude);
  const filteredActivities = selectedDay === 'all'
    ? activitiesWithCoords
    : activitiesWithCoords.filter(a => a.day_number === parseInt(selectedDay));

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden">
      {/* Day filter for map */}
      <div className="flex gap-2 p-3 bg-white border-b border-platinum-200 overflow-x-auto">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
            selectedDay === 'all'
              ? 'bg-coral-500 text-white'
              : 'bg-platinum-200 text-charcoal-400 hover:bg-platinum-200'
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
                  : 'bg-platinum-200 text-charcoal-400 hover:bg-platinum-200'
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
                    <p className="text-platinum-600">{activity.location}</p>
                    {activity.duration_minutes && (
                      <p className="text-xs text-platinum-500 mt-1">
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
        <div className="flex-1 flex items-center justify-center bg-platinum-50">
          <div className="text-center p-8">
            <MapIcon size={48} className="mx-auto mb-4 text-platinum-500" />
            <h3 className="text-lg font-semibold text-charcoal-500 mb-2">
              No locations to show yet
            </h3>
            <p className="text-sm text-platinum-600">
              Activities with coordinates will appear on the map
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 bg-white border-t border-platinum-200">
        <div className="flex flex-wrap gap-3 justify-center">
          {(selectedDay === 'all' ? days : [parseInt(selectedDay)]).map(day => {
            const count = filteredActivities.filter(a => a.day_number === day).length;
            if (count === 0) return null;
            return (
              <span key={day} className="flex items-center gap-1 text-xs text-charcoal-400">
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
  );
}

import React, { useMemo, useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Clock, DollarSign, Navigation, Calendar } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBF8TqnWbMKqN7Cl8poBe4OgCbYvw7Rk5I';

function MapViewEnhanced({ activities, itinerary }) {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' or day number
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const grouped = {};
    activities.filter(a => a.latitude && a.longitude).forEach(activity => {
      const day = activity.day_number;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(activity);
    });
    // Sort activities within each day by position
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

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (filteredActivities.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const avgLat = filteredActivities.reduce((sum, a) => sum + parseFloat(a.latitude), 0) / filteredActivities.length;
    const avgLng = filteredActivities.reduce((sum, a) => sum + parseFloat(a.longitude), 0) / filteredActivities.length;

    return { lat: avgLat, lng: avgLng };
  }, [filteredActivities]);

  // Draw route for selected day
  useEffect(() => {
    if (!map || selectedDay === 'all' || typeof window === 'undefined' || !window.google) return;

    const dayActivities = activitiesByDay[selectedDay] || [];
    if (dayActivities.length < 2) {
      // Clear any existing route
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      return;
    }

    // Create waypoints
    const waypoints = dayActivities.slice(1, -1).map(activity => ({
      location: { lat: parseFloat(activity.latitude), lng: parseFloat(activity.longitude) },
      stopover: true
    }));

    const directionsService = new window.google.maps.DirectionsService();
    const renderer = new window.google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // We're using our own markers
      polylineOptions: {
        strokeColor: '#E76F51',
        strokeWeight: 4,
        strokeOpacity: 0.7
      }
    });

    const request = {
      origin: { lat: parseFloat(dayActivities[0].latitude), lng: parseFloat(dayActivities[0].longitude) },
      destination: { lat: parseFloat(dayActivities[dayActivities.length - 1].latitude), lng: parseFloat(dayActivities[dayActivities.length - 1].longitude) },
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.WALKING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        renderer.setDirections(result);
        setDirectionsRenderer(renderer);
      }
    });

    return () => {
      if (renderer) {
        renderer.setMap(null);
      }
    };
  }, [map, selectedDay, activitiesByDay]);

  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES.find(c => c.value === category) || ACTIVITY_CATEGORIES[9];
  };

  if (activities.filter(a => a.latitude && a.longitude).length === 0) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
          <MapPin size={32} className="text-primary-500" />
        </div>
        <h3 className="text-lg font-heading font-bold text-neutral-charcoal mb-2">
          No locations yet
        </h3>
        <p className="text-neutral-warm-gray max-w-sm">
          Activities with coordinates will appear on the map. The AI will generate these automatically when you create an itinerary!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      {/* Day Filter Header */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-primary-500" size={20} />
            <h3 className="font-heading font-bold text-neutral-charcoal">
              Journey Map
            </h3>
          </div>
          <span className="text-sm text-neutral-warm-gray">
            {filteredActivities.length} stop{filteredActivities.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedDay === 'all'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Calendar size={14} className="inline mr-1" />
            All Days
          </button>
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              Day {day} ({activitiesByDay[day]?.length || 0})
            </button>
          ))}
        </div>

        {selectedDay !== 'all' && activitiesByDay[selectedDay]?.length >= 2 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
            <div className="w-4 h-0.5 bg-primary-500"></div>
            <span>Route shown between activities</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={13}
            mapId="travel-atlas-journey-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="h-full w-full"
            onLoad={(mapInstance) => setMap(mapInstance)}
          >
            {filteredActivities.map((activity, index) => {
              const categoryInfo = getCategoryInfo(activity.category);
              const isFirst = selectedDay !== 'all' && index === 0;
              const isLast = selectedDay !== 'all' && index === filteredActivities.length - 1;

              return (
                <AdvancedMarker
                  key={activity.id}
                  position={{ lat: parseFloat(activity.latitude), lng: parseFloat(activity.longitude) }}
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="relative">
                    {/* Day number badge or position badge */}
                    <div className={`absolute -top-7 left-1/2 -translate-x-1/2 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg z-10 ${
                      isFirst ? 'bg-green-500 text-white border-2 border-white' :
                      isLast ? 'bg-red-500 text-white border-2 border-white' :
                      'bg-white text-primary-500 border-2 border-primary-500'
                    }`}>
                      {selectedDay === 'all' ? `D${activity.day_number}` : index + 1}
                    </div>

                    {/* Special markers for start/end */}
                    {isFirst && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-green-600 font-bold text-xs whitespace-nowrap">
                        START
                      </div>
                    )}
                    {isLast && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-red-600 font-bold text-xs whitespace-nowrap">
                        END
                      </div>
                    )}

                    {/* Pin with category emoji */}
                    <Pin
                      background={categoryInfo.color}
                      borderColor="#fff"
                      glyphColor="#fff"
                    >
                      <span className="text-lg">{categoryInfo.emoji}</span>
                    </Pin>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Info Window for selected activity */}
            {selectedActivity && (
              <InfoWindow
                position={{
                  lat: parseFloat(selectedActivity.latitude),
                  lng: parseFloat(selectedActivity.longitude)
                }}
                onCloseClick={() => setSelectedActivity(null)}
              >
                <div className="p-3 max-w-sm">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-2xl">{getCategoryInfo(selectedActivity.category).emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-neutral-charcoal mb-1">
                        {selectedActivity.title}
                      </h3>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                          Day {selectedActivity.day_number}
                        </span>
                        {selectedActivity.time_of_day && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full">
                            {selectedActivity.time_of_day}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedActivity.description && (
                    <p className="text-sm text-neutral-700 mb-3 leading-relaxed">
                      {selectedActivity.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                    {selectedActivity.location && (
                      <div className="flex items-center gap-1 col-span-2">
                        <MapPin size={14} className="text-primary-500 flex-shrink-0" />
                        <span>{selectedActivity.location}</span>
                      </div>
                    )}
                    {selectedActivity.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-neutral-400 flex-shrink-0" />
                        <span>{Math.floor(selectedActivity.duration_minutes / 60)}h {selectedActivity.duration_minutes % 60}m</span>
                      </div>
                    )}
                    {(selectedActivity.estimated_cost_min || selectedActivity.estimated_cost_max) && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-neutral-400 flex-shrink-0" />
                        <span>${selectedActivity.estimated_cost_min || 0}-${selectedActivity.estimated_cost_max || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

export default MapViewEnhanced;

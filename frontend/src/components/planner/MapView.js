import React, { useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBF8TqnWbMKqN7Cl8poBe4OgCbYvw7Rk5I'; // Temporary demo key

function MapView({ activities, itinerary }) {
  const [selectedActivity, setSelectedActivity] = React.useState(null);

  // Calculate center of all activities
  const mapCenter = useMemo(() => {
    const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude);

    if (activitiesWithCoords.length === 0) {
      // Default to destination search or generic coordinates
      return { lat: 0, lng: 0 };
    }

    const avgLat = activitiesWithCoords.reduce((sum, a) => sum + parseFloat(a.latitude), 0) / activitiesWithCoords.length;
    const avgLng = activitiesWithCoords.reduce((sum, a) => sum + parseFloat(a.longitude), 0) / activitiesWithCoords.length;

    return { lat: avgLat, lng: avgLng };
  }, [activities]);

  const activitiesWithLocations = activities.filter(a => a.latitude && a.longitude);

  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES.find(c => c.value === category) || ACTIVITY_CATEGORIES[9];
  };

  if (activitiesWithLocations.length === 0) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
          <MapPin size={32} className="text-primary-500" />
        </div>
        <h3 className="text-lg font-heading font-bold text-neutral-charcoal mb-2">
          No locations yet
        </h3>
        <p className="text-neutral-warm-gray max-w-sm">
          Activities with coordinates will appear on the map. Add locations to your activities to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg overflow-hidden shadow-sm border border-neutral-200">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={12}
          mapId="travel-atlas-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-full w-full"
        >
          {activitiesWithLocations.map((activity, index) => {
            const categoryInfo = getCategoryInfo(activity.category);

            return (
              <AdvancedMarker
                key={activity.id}
                position={{ lat: parseFloat(activity.latitude), lng: parseFloat(activity.longitude) }}
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="relative">
                  {/* Day number badge */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md border-2 border-primary-500 z-10">
                    {activity.day_number}
                  </div>

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
              <div className="p-2 max-w-xs">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl">{getCategoryInfo(selectedActivity.category).emoji}</span>
                  <div>
                    <h3 className="font-heading font-bold text-neutral-charcoal mb-1">
                      {selectedActivity.title}
                    </h3>
                    <span className="text-xs text-neutral-500 font-medium">
                      Day {selectedActivity.day_number}
                    </span>
                  </div>
                </div>

                {selectedActivity.description && (
                  <p className="text-sm text-neutral-warm-gray mb-2">
                    {selectedActivity.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-neutral-warm-gray">
                  {selectedActivity.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedActivity.location}
                    </span>
                  )}
                  {selectedActivity.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {Math.floor(selectedActivity.duration_minutes / 60)}h {selectedActivity.duration_minutes % 60}m
                    </span>
                  )}
                  {(selectedActivity.estimated_cost_min || selectedActivity.estimated_cost_max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      ${selectedActivity.estimated_cost_min || 0} - ${selectedActivity.estimated_cost_max || 0}
                    </span>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

export default MapView;

import { useState, useEffect, useRef } from 'react';
import { Search, Plane, Train, Car, Shuffle, RefreshCw, MapPin } from 'lucide-react';
import { TRAVEL_PACE_OPTIONS, BUDGET_OPTIONS, TRAVELER_PROFILES } from '../../constants/travelerProfiles';
import Button from '../ui/Button';

const TRAVEL_MODE_OPTIONS = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'mixed', label: 'Mixed', icon: Shuffle },
];

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

function useMapboxSearch(query, debounceRef) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length < 2 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,country,region,locality&limit=5&language=en&autocomplete=true`
        );
        const data = await res.json();
        setSuggestions(
          (data.features || []).map(f => ({
            name: f.place_type[0] === 'country' ? f.text : f.place_name,
          }))
        );
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, debounceRef]);

  return [suggestions, setSuggestions];
}

export default function TripParametersPanel({ itinerary, onParametersChanged, isRegenerating }) {
  const [destination, setDestination] = useState(itinerary.destination || '');
  const [tripOrigin, setTripOrigin] = useState(itinerary.trip_origin || '');
  const [travelMode, setTravelMode] = useState(itinerary.travel_mode || '');
  const [travelPace, setTravelPace] = useState(itinerary.travel_pace || 'balanced');
  const [budget, setBudget] = useState(itinerary.budget || 'medium');
  const [travelerProfiles, setTravelerProfiles] = useState(itinerary.traveler_profiles || []);

  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const destDebounceRef = useRef(null);
  const originDebounceRef = useRef(null);

  const [destSuggestions, setDestSuggestions] = useMapboxSearch(destination, destDebounceRef);
  const [originSuggestions, setOriginSuggestions] = useMapboxSearch(tripOrigin, originDebounceRef);

  // Track changes vs current itinerary
  useEffect(() => {
    const changed =
      destination !== (itinerary.destination || '') ||
      tripOrigin !== (itinerary.trip_origin || '') ||
      travelMode !== (itinerary.travel_mode || '') ||
      travelPace !== (itinerary.travel_pace || 'balanced') ||
      budget !== (itinerary.budget || 'medium') ||
      JSON.stringify(travelerProfiles) !== JSON.stringify(itinerary.traveler_profiles || []);
    setHasChanges(changed);
  }, [destination, tripOrigin, travelMode, travelPace, budget, travelerProfiles, itinerary]);

  // Sync from parent when itinerary changes (e.g., after regeneration)
  useEffect(() => {
    setDestination(itinerary.destination || '');
    setTripOrigin(itinerary.trip_origin || '');
    setTravelMode(itinerary.travel_mode || '');
    setTravelPace(itinerary.travel_pace || 'balanced');
    setBudget(itinerary.budget || 'medium');
    setTravelerProfiles(itinerary.traveler_profiles || []);
  }, [itinerary.id]);

  const handleRegenerate = () => {
    onParametersChanged({
      destination: destination || itinerary.destination,
      title: `${destination || itinerary.destination} - ${itinerary.trip_length} days`,
      trip_origin: tripOrigin || null,
      travel_mode: travelMode || null,
      travel_pace: travelPace,
      budget,
      traveler_profiles: travelerProfiles,
    });
  };

  const toggleProfile = (profileId) => {
    setTravelerProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(p => p !== profileId)
        : [...prev, profileId]
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-platinum-200">
        <h3 className="text-sm font-semibold text-charcoal-500">Trip Settings</h3>
        <p className="text-xs text-platinum-500 mt-0.5">
          {itinerary.trip_length} days
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-coral-400" size={14} />
            <input
              type="text"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setShowDestSuggestions(true); }}
              onFocus={() => setShowDestSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              placeholder="e.g., Norway, Lofoten"
              className="w-full pl-9 pr-3 py-2 text-sm border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
            />
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-platinum-200 z-20 max-h-40 overflow-y-auto">
                {destSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => { setDestination(s.name); setShowDestSuggestions(false); }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-coral-50 transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trip Origin */}
        <div>
          <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Departure City</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-platinum-400" size={14} />
            <input
              type="text"
              value={tripOrigin}
              onChange={(e) => { setTripOrigin(e.target.value); setShowOriginSuggestions(true); }}
              onFocus={() => setShowOriginSuggestions(true)}
              onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
              placeholder="e.g., London, UK"
              className="w-full pl-9 pr-3 py-2 text-sm border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
            />
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-platinum-200 z-20 max-h-40 overflow-y-auto">
                {originSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => { setTripOrigin(s.name); setShowOriginSuggestions(false); }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-coral-50 transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Travel Mode */}
        <div>
          <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Travel Mode</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TRAVEL_MODE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const active = travelMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTravelMode(active ? '' : opt.value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-coral-50 border-2 border-coral-400 text-coral-600'
                      : 'bg-platinum-50 border-2 border-transparent text-platinum-600 hover:bg-platinum-100'
                  }`}
                >
                  <Icon size={16} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel Pace */}
        <div>
          <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Travel Pace</label>
          <div className="flex gap-1">
            {TRAVEL_PACE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTravelPace(opt.value)}
                title={`${opt.label}: ${opt.description}`}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                  travelPace === opt.value
                    ? 'bg-coral-50 border-2 border-coral-400 text-coral-600'
                    : 'bg-platinum-50 border-2 border-transparent text-platinum-600 hover:bg-platinum-100'
                }`}
              >
                <div>{opt.emoji}</div>
                <div className="text-[10px] mt-0.5">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Budget</label>
          <div className="grid grid-cols-4 gap-1.5">
            {BUDGET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setBudget(opt.value)}
                title={opt.description}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                  budget === opt.value
                    ? 'bg-coral-50 border-2 border-coral-400 text-coral-600'
                    : 'bg-platinum-50 border-2 border-transparent text-platinum-600 hover:bg-platinum-100'
                }`}
              >
                <div>{opt.emoji}</div>
                <div className="text-[10px] mt-0.5">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Traveler Profiles */}
        <div>
          <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Traveler Style</label>
          <div className="flex flex-wrap gap-1.5">
            {TRAVELER_PROFILES.map(p => (
              <button
                key={p.id}
                onClick={() => toggleProfile(p.id)}
                title={p.description}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  travelerProfiles.includes(p.id)
                    ? 'bg-coral-50 border border-coral-400 text-coral-600'
                    : 'bg-platinum-50 border border-platinum-200 text-platinum-600 hover:bg-platinum-100'
                }`}
              >
                {p.emoji} {p.title.replace('The ', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Regenerate button */}
      <div className="p-4 border-t border-platinum-200">
        <Button
          onClick={handleRegenerate}
          disabled={!hasChanges || isRegenerating}
          className="w-full gap-2"
          size="sm"
        >
          <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate Itinerary'}
        </Button>
        {hasChanges && !isRegenerating && (
          <p className="text-[10px] text-center text-platinum-500 mt-1.5">
            Settings changed — regenerate to apply
          </p>
        )}
      </div>
    </div>
  );
}

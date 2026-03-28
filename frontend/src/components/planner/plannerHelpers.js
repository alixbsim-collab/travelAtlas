import L from 'leaflet';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';

// Helper to check if itinerary was created within the last 5 minutes
export const isRecentlyCreated = (createdAt) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  return (now - created) < 5 * 60 * 1000;
};

// Helper to format date
export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Helper to get date for a specific day number
export const getDateForDay = (startDate, dayNumber) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1));
  return formatDate(date);
};

// Day colors for map markers and route lines
export const DAY_COLORS = [
  '#EF8557', '#4A7B91', '#FFDB70', '#2C4251', '#BBD3DD',
  '#C85A2E', '#7DADC1', '#F0C84D', '#386074', '#DEE3E1'
];

// Create colored marker icon
export const createDayIcon = (dayNumber) => {
  const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">${dayNumber}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

/**
 * Compute a location label for each day based on activity locations.
 * - If activities span multiple cities → show city per day
 * - If all in the same city → show area/neighborhood per day (when available)
 */
export const getDayLocationLabels = (activities, days) => {
  const parseLocation = (loc) => {
    if (!loc) return [];
    return loc.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Collect all "city-level" locations (last segment) across all days
  const allCities = new Set();
  activities.forEach(a => {
    const parts = parseLocation(a.location);
    if (parts.length > 0) allCities.add(parts[parts.length - 1]);
  });

  const labels = {};
  const singleCity = allCities.size <= 1;

  days.forEach(day => {
    const dayActivities = activities.filter(a => a.day_number === day);
    const dayLocations = dayActivities
      .map(a => parseLocation(a.location))
      .filter(parts => parts.length > 0);

    if (dayLocations.length === 0) {
      labels[day] = null;
      return;
    }

    if (singleCity) {
      // Same city → show areas/neighborhoods (second-to-last segment)
      const areas = [...new Set(
        dayLocations
          .filter(parts => parts.length >= 3)
          .map(parts => parts[parts.length - 2])
      )];
      labels[day] = areas.length > 0 ? areas.join(', ') : null;
    } else {
      // Different cities → show city names (last segment)
      const cities = [...new Set(dayLocations.map(parts => parts[parts.length - 1]))];
      labels[day] = cities.join(', ');
    }
  });

  return labels;
};

// Get category info helper
export const getCategoryInfo = (category) => {
  return ACTIVITY_CATEGORIES.find(c => c.value === category) || { emoji: '📍', color: '#71717A' };
};

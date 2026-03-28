import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Calendar, MapPin, Clock, Share2, Download, Link2, MessageCircle, Check, Compass } from 'lucide-react';
import { ACTIVITY_CATEGORIES, TRAVEL_PACE_OPTIONS, BUDGET_OPTIONS } from '../constants/travelerProfiles';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DAY_COLORS = [
  '#EF8557', '#4A7B91', '#FFDB70', '#2C4251', '#BBD3DD',
  '#C85A2E', '#7DADC1', '#F0C84D', '#386074', '#DEE3E1'
];

const createDayIcon = (dayNumber) => {
  const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      width: 28px; height: 28px; border-radius: 50%;
      border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 12px;
    ">${dayNumber}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getDateForDay = (startDate, dayNumber) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1));
  return formatDate(date);
};

const getDayLocationLabels = (activities, days) => {
  const parseLocation = (loc) => {
    if (!loc) return [];
    return loc.split(',').map(s => s.trim()).filter(Boolean);
  };

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
      const areas = [...new Set(
        dayLocations
          .filter(parts => parts.length >= 3)
          .map(parts => parts[parts.length - 2])
      )];
      labels[day] = areas.length > 0 ? areas.join(', ') : null;
    } else {
      const cities = [...new Set(dayLocations.map(parts => parts[parts.length - 1]))];
      labels[day] = cities.join(', ');
    }
  });

  return labels;
};

function ItineraryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const { data: itineraryData, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !itineraryData) {
        navigate('/designer');
        return;
      }

      // Allow owner to view even if not published
      const isOwner = user && itineraryData.user_id === user.id;
      if (!itineraryData.is_published && !isOwner) {
        navigate('/designer');
        return;
      }

      setItinerary(itineraryData);

      const [activitiesResult, accommodationsResult] = await Promise.all([
        supabase
          .from('activities')
          .select('*')
          .eq('itinerary_id', id)
          .order('day_number', { ascending: true })
          .order('position', { ascending: true }),
        supabase
          .from('accommodations')
          .select('*')
          .eq('itinerary_id', id)
      ]);

      setActivities(activitiesResult.data || []);
      setAccommodations(accommodationsResult.data || []);
    } catch (err) {
      console.error('Error fetching itinerary:', err);
      navigate('/designer');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `${itinerary?.title} — ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: itinerary?.title, url: window.location.href });
      setShareOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    setShareOpen(false);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.innerHTML = buildPrintableHTML(itinerary, activities, accommodations);
      document.body.appendChild(container);

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${itinerary?.title || 'itinerary'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400"></div>
        </div>
      </PageContainer>
    );
  }

  if (!itinerary) return null;

  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);
  const dayLocationLabels = getDayLocationLabels(activities, days);
  const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude);
  const paceInfo = TRAVEL_PACE_OPTIONS.find(p => p.value === itinerary.travel_pace);
  const budgetInfo = BUDGET_OPTIONS.find(b => b.value === itinerary.budget);
  const isOwner = user && itinerary.user_id === user.id;

  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES.find(c => c.value === category) || { emoji: '📍', color: '#71717A', label: 'Other' };
  };

  // Find accommodation for a specific day
  const getAccommodationForDay = (dayNumber) => {
    if (!itinerary.start_date) return null;
    const dayDate = new Date(itinerary.start_date);
    dayDate.setDate(dayDate.getDate() + (dayNumber - 1));

    return accommodations.find(acc => {
      if (!acc.check_in_date || !acc.check_out_date) return false;
      const checkIn = new Date(acc.check_in_date);
      const checkOut = new Date(acc.check_out_date);
      return dayDate >= checkIn && dayDate < checkOut;
    });
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-platinum-600 hover:text-charcoal-500 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center gap-2">
            {/* Share dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareOpen(!shareOpen)}
                className="gap-2"
              >
                <Share2 size={16} /> Share
              </Button>

              {shareOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-platinum-200 py-1 w-52">
                    <button
                      onClick={() => { handleCopyLink(); setShareOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                    >
                      {linkCopied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
                      {linkCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                    >
                      <MessageCircle size={16} />
                      Share on WhatsApp
                    </button>
                    {typeof navigator.share === 'function' && (
                      <button
                        onClick={handleNativeShare}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full"
                      >
                        <Share2 size={16} />
                        More options...
                      </button>
                    )}
                    <div className="border-t border-platinum-200 my-1" />
                    <button
                      onClick={handleExportPDF}
                      disabled={exporting}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-500 hover:bg-platinum-50 transition-colors w-full disabled:opacity-50"
                    >
                      <Download size={16} />
                      {exporting ? 'Exporting...' : 'Export as PDF'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {isOwner && (
              <Link to={`/designer/planner/${id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  Edit Trip
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-charcoal-500 mb-3">
            {itinerary.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-platinum-600">
            <span className="flex items-center gap-1.5">
              <MapPin size={16} className="text-coral-500" />
              {itinerary.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={16} />
              {itinerary.trip_length} days
            </span>
            {paceInfo && (
              <span className="flex items-center gap-1.5">
                <span>{paceInfo.emoji}</span>
                {paceInfo.label}
              </span>
            )}
            {budgetInfo && (
              <span className="flex items-center gap-1.5">
                <span>{budgetInfo.emoji}</span>
                {budgetInfo.label}
              </span>
            )}
          </div>
          {itinerary.start_date && (
            <p className="text-sm text-platinum-500 mt-2">
              {formatDate(itinerary.start_date)} — {formatDate(itinerary.end_date)}
            </p>
          )}
        </div>

        {/* Summary (if available) */}
        {itinerary.notes && (
          <div className="mb-8 p-5 bg-naples-50 rounded-2xl border border-naples-200">
            <p className="text-charcoal-500 leading-relaxed">{itinerary.notes}</p>
          </div>
        )}

        {/* Map Toggle */}
        {activitiesWithCoords.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 text-sm font-medium text-columbia-600 hover:text-columbia-700 transition-colors"
            >
              <Compass size={16} />
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>

            {showMap && (
              <div className="mt-3 rounded-xl overflow-hidden border border-platinum-200" style={{ height: '400px' }}>
                <MapContainer
                  center={[
                    activitiesWithCoords.reduce((sum, a) => sum + a.latitude, 0) / activitiesWithCoords.length,
                    activitiesWithCoords.reduce((sum, a) => sum + a.longitude, 0) / activitiesWithCoords.length
                  ]}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {activitiesWithCoords.map((activity) => (
                    <Marker
                      key={activity.id}
                      position={[activity.latitude, activity.longitude]}
                      icon={createDayIcon(activity.day_number)}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-bold">{activity.title}</p>
                          <p className="text-gray-600">{activity.location}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {days.map(day => {
                    const dayActs = activitiesWithCoords
                      .filter(a => a.day_number === day)
                      .sort((a, b) => (a.position || 0) - (b.position || 0));
                    if (dayActs.length < 2) return null;
                    return (
                      <Polyline
                        key={`route-${day}`}
                        positions={dayActs.map(a => [a.latitude, a.longitude])}
                        pathOptions={{
                          color: DAY_COLORS[(day - 1) % DAY_COLORS.length],
                          weight: 3, dashArray: '8, 12', opacity: 0.7
                        }}
                      />
                    );
                  })}
                </MapContainer>
              </div>
            )}
          </div>
        )}

        {/* Day-by-Day Itinerary */}
        <div className="space-y-8">
          {days.map(day => {
            const dayActivities = activities.filter(a => a.day_number === day);
            const dayLabel = itinerary.start_date
              ? getDateForDay(itinerary.start_date, day)
              : `Day ${day}`;
            const locationLabel = dayLocationLabels[day];
            const accommodation = getAccommodationForDay(day);

            return (
              <div key={day} className="bg-white rounded-xl border border-platinum-200 overflow-hidden">
                {/* Day Header */}
                <div className="px-6 py-4 border-b border-platinum-100 bg-platinum-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: DAY_COLORS[(day - 1) % DAY_COLORS.length] }}
                    >
                      {day}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal-500">
                        {dayLabel}
                      </h3>
                      {locationLabel && (
                        <p className="text-sm text-platinum-600">{locationLabel}</p>
                      )}
                    </div>
                  </div>

                  {/* Accommodation badge */}
                  {accommodation && (
                    <div className="mt-2 ml-13 flex items-center gap-2 text-xs text-columbia-700 bg-columbia-50 px-3 py-1.5 rounded-lg w-fit">
                      <span>🏨</span>
                      <span className="font-medium">{accommodation.name}</span>
                      {accommodation.price_per_night && (
                        <span className="text-columbia-500">${accommodation.price_per_night}/night</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Activities */}
                <div className="px-6 py-4 space-y-4">
                  {dayActivities.length === 0 ? (
                    <p className="text-sm text-platinum-500 italic">No activities planned for this day</p>
                  ) : (
                    dayActivities.map((activity) => {
                      const catInfo = getCategoryInfo(activity.category);
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">{catInfo.emoji}</span>
                          <div className="flex-1">
                            <h4 className="font-bold text-charcoal-500">{activity.title}</h4>
                            {activity.description && (
                              <p className="text-sm text-platinum-600 mt-0.5">{activity.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-platinum-500">
                              {activity.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  {activity.location}
                                </span>
                              )}
                              {activity.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {Math.floor(activity.duration_minutes / 60)}h{activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ''}
                                </span>
                              )}
                              {activity.time_of_day && (
                                <span className="px-2 py-0.5 bg-platinum-100 rounded text-platinum-600">
                                  {activity.time_of_day}
                                </span>
                              )}
                              {activity.estimated_cost_min != null && (
                                <span>
                                  ${activity.estimated_cost_min}
                                  {activity.estimated_cost_max && activity.estimated_cost_max !== activity.estimated_cost_min
                                    ? `–$${activity.estimated_cost_max}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-platinum-500 pb-8">
          <p>Created with Travel Atlas</p>
        </div>
      </div>
    </PageContainer>
  );
}

// Build printable HTML for PDF export
function buildPrintableHTML(itinerary, activities, accommodations) {
  const days = Array.from({ length: itinerary.trip_length }, (_, i) => i + 1);

  const formatDateStr = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDateForDayStr = (startDate, dayNumber) => {
    if (!startDate) return `Day ${dayNumber}`;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (dayNumber - 1));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  let html = `
    <div style="font-family: 'Inter', 'Helvetica', sans-serif; color: #2C4251; max-width: 700px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #EF8557;">
        <h1 style="font-size: 28px; margin: 0 0 8px 0; color: #2C4251;">${itinerary.title || 'Trip Itinerary'}</h1>
        <p style="font-size: 14px; color: #71717A; margin: 0;">
          ${itinerary.destination} &bull; ${itinerary.trip_length} days
          ${itinerary.start_date ? ` &bull; ${formatDateStr(itinerary.start_date)} — ${formatDateStr(itinerary.end_date)}` : ''}
        </p>
      </div>
  `;

  days.forEach(day => {
    const dayActivities = activities.filter(a => a.day_number === day);
    const dayLabel = getDateForDayStr(itinerary.start_date, day);
    const cityName = dayActivities[0]?.city_name;

    html += `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <div style="background: #F5F3F0; padding: 10px 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${DAY_COLORS[(day - 1) % DAY_COLORS.length]};">
          <strong style="font-size: 16px;">Day ${day} — ${dayLabel}</strong>
          ${cityName ? `<span style="color: #71717A; font-size: 13px; margin-left: 8px;">${cityName}</span>` : ''}
        </div>
    `;

    if (dayActivities.length === 0) {
      html += `<p style="color: #71717A; font-size: 13px; font-style: italic; padding-left: 20px;">No activities planned</p>`;
    } else {
      dayActivities.forEach(activity => {
        html += `
          <div style="padding: 8px 0 8px 20px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${activity.title}</div>
            ${activity.description ? `<div style="font-size: 12px; color: #71717A; margin-bottom: 2px;">${activity.description}</div>` : ''}
            <div style="font-size: 11px; color: #9CA3AF;">
              ${activity.location ? `📍 ${activity.location}` : ''}
              ${activity.duration_minutes ? ` &bull; ${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ''}` : ''}
              ${activity.time_of_day ? ` &bull; ${activity.time_of_day}` : ''}
              ${activity.estimated_cost_min != null ? ` &bull; $${activity.estimated_cost_min}${activity.estimated_cost_max && activity.estimated_cost_max !== activity.estimated_cost_min ? `–$${activity.estimated_cost_max}` : ''}` : ''}
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  });

  // Accommodations section
  if (accommodations.length > 0) {
    html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #4A7B91;">
        <h2 style="font-size: 18px; margin: 0 0 12px 0;">Accommodations</h2>
    `;
    accommodations.forEach(acc => {
      html += `
        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <strong style="font-size: 14px;">🏨 ${acc.name}</strong>
          <div style="font-size: 12px; color: #71717A;">
            ${acc.location || ''}
            ${acc.price_per_night ? ` &bull; $${acc.price_per_night}/night` : ''}
            ${acc.check_in_date ? ` &bull; ${formatDateStr(acc.check_in_date)} — ${formatDateStr(acc.check_out_date)}` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
      <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 11px; color: #9CA3AF;">Created with Travel Atlas</p>
      </div>
    </div>
  `;

  return html;
}

export default ItineraryViewPage;

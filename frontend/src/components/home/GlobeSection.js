import React, { useEffect, useState, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ScrollReveal from '../ui/ScrollReveal';

// City coordinates for common destinations
const CITY_COORDS = {
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'bali': { lat: -8.3405, lng: 115.092 },
  'new york': { lat: 40.7128, lng: -74.006 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'barcelona': { lat: 41.3874, lng: 2.1686 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'marrakech': { lat: 31.6295, lng: -7.9811 },
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'japan': { lat: 36.2048, lng: 138.2529 },
  'italy': { lat: 41.8719, lng: 12.5674 },
  'france': { lat: 46.2276, lng: 2.2137 },
  'spain': { lat: 40.4637, lng: -3.7492 },
  'greece': { lat: 39.0742, lng: 21.8243 },
  'thailand': { lat: 15.8700, lng: 100.9925 },
  'portugal': { lat: 39.3999, lng: -8.2245 },
  'morocco': { lat: 31.7917, lng: -7.0926 },
  'mexico': { lat: 23.6345, lng: -102.5528 },
  'peru': { lat: -9.1900, lng: -75.0152 },
};

function getCoords(destination) {
  if (!destination) return null;
  const lower = destination.toLowerCase().trim();
  // Try exact match
  if (CITY_COORDS[lower]) return CITY_COORDS[lower];
  // Try partial match
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

function GlobeSection() {
  const navigate = useNavigate();
  const globeRef = useRef();
  const [markers, setMarkers] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const containerRef = useRef(null);

  useEffect(() => {
    // Fetch atlas files for markers
    const fetchAtlasFiles = async () => {
      const { data } = await supabase
        .from('atlas_files')
        .select('id, title, destination')
        .not('published_at', 'is', null);

      if (data) {
        const points = data
          .map(file => {
            const coords = getCoords(file.destination);
            if (!coords) return null;
            return { ...coords, id: file.id, title: file.title, destination: file.destination };
          })
          .filter(Boolean);
        setMarkers(points);
      }
    };

    fetchAtlasFiles();
  }, []);

  useEffect(() => {
    // Auto-rotate
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false;
    }
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const size = Math.min(w, 600);
        setDimensions({ width: size, height: size });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const markerHtml = useMemo(() => {
    return (d) => `
      <div style="
        width: 12px; height: 12px;
        border-radius: 50%;
        background: #EF8557;
        box-shadow: 0 0 12px rgba(239,133,87,0.6), 0 0 24px rgba(239,133,87,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.8)'" onmouseout="this.style.transform='scale(1)'" />
    `;
  }, []);

  return (
    <section className="py-20 bg-charcoal-700 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              Explore the World
            </h2>
            <p className="text-columbia-300 text-lg max-w-xl mx-auto">
              Discover travel stories from around the globe. Click a marker to read an Atlas File.
            </p>
          </div>
        </ScrollReveal>

        <div className="flex justify-center" ref={containerRef}>
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor="#BBD3DD"
            atmosphereAltitude={0.2}
            htmlElementsData={markers}
            htmlLat={d => d.lat}
            htmlLng={d => d.lng}
            htmlElement={markerHtml}
            onHtmlElementClick={(d) => navigate(`/atlas/${d.id}`)}
            htmlAltitude={0.01}
          />
        </div>

        {markers.length > 0 && (
          <ScrollReveal delay={0.2}>
            <p className="text-center text-columbia-400 text-sm mt-6">
              {markers.length} Atlas {markers.length === 1 ? 'File' : 'Files'} from around the world
            </p>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

export default GlobeSection;

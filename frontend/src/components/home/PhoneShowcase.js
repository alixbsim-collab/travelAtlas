import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Calendar, Sparkles, GripVertical, Search, BookOpen, Map, Star } from 'lucide-react';

const SCREENS = [
  {
    id: 'discover',
    title: 'Discover Destinations',
    description: 'Search any destination and get inspired by curated travel stories from the community.',
  },
  {
    id: 'plan',
    title: 'AI-Powered Planning',
    description: 'Get a structured, day-by-day itinerary generated in seconds — then make it your own.',
  },
  {
    id: 'map',
    title: 'See It on the Map',
    description: 'Every activity, restaurant, and landmark pinned to an interactive map you can explore.',
  },
  {
    id: 'share',
    title: 'Share Your Journey',
    description: 'Publish your travel stories as Atlas Files for the community to discover and fork.',
  },
];

// Screen 1: Discover / Search
function DiscoverScreen() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-naples-50 to-white p-5">
      <div className="text-center mt-6 mb-5">
        <p className="text-[10px] text-platinum-500 uppercase tracking-widest mb-1">The Travel Atlas</p>
        <h3 className="text-sm font-semibold text-charcoal-500">Where to next?</h3>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-platinum-400" size={12} />
        <div className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-platinum-200 text-[10px] text-platinum-400">
          Search destinations...
        </div>
      </div>
      <p className="text-[9px] text-platinum-500 uppercase tracking-wider font-medium mb-2">Trending</p>
      <div className="space-y-2">
        {[
          { city: 'Tokyo, Japan', emoji: '🗼', days: '7d' },
          { city: 'Rome, Italy', emoji: '🏛️', days: '5d' },
          { city: 'Bali, Indonesia', emoji: '🌺', days: '10d' },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-white rounded-xl p-2.5 border border-platinum-100 shadow-sm">
            <span className="text-base">{d.emoji}</span>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-charcoal-500">{d.city}</p>
              <p className="text-[8px] text-platinum-500">{d.days} avg trip</p>
            </div>
            <MapPin size={10} className="text-coral-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Screen 2: Itinerary Plan
function PlanScreen() {
  return (
    <div className="h-full flex flex-col bg-white p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-platinum-100">
        <div>
          <p className="text-[10px] text-platinum-500">Day 2 of 5</p>
          <h3 className="text-xs font-semibold text-charcoal-500">Rome, Italy</h3>
        </div>
        <div className="flex gap-1">
          <span className="px-2 py-0.5 bg-coral-100 text-coral-700 rounded-md text-[8px] font-medium">Plan</span>
          <span className="px-2 py-0.5 bg-platinum-100 text-platinum-600 rounded-md text-[8px] font-medium">Map</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {[
          { time: '9:00 AM', title: 'Colosseum Tour', color: 'border-columbia-400 bg-columbia-50', icon: '🏟️' },
          { time: '12:30 PM', title: 'Trastevere Food Walk', color: 'border-naples-400 bg-naples-50', icon: '🍕' },
          { time: '3:00 PM', title: 'Vatican Museums', color: 'border-coral-400 bg-coral-50', icon: '🎨' },
          { time: '7:30 PM', title: 'Terrazza Borromini', color: 'border-naples-400 bg-naples-50', icon: '🍷' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border-l-[3px] ${item.color}`}>
            <GripVertical size={8} className="text-platinum-300" />
            <span className="text-xs">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-charcoal-500 truncate">{item.title}</p>
              <p className="text-[8px] text-platinum-500">{item.time}</p>
            </div>
            <Sparkles size={8} className="text-coral-400" />
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-platinum-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[8px] text-platinum-500">
          <Calendar size={8} /> 5 activities planned
        </div>
        <span className="text-[8px] font-medium text-coral-500">+ Add</span>
      </div>
    </div>
  );
}

// Screen 3: Map View
function MapScreen() {
  return (
    <div className="h-full flex flex-col bg-columbia-50 relative overflow-hidden">
      {/* Fake map background */}
      <div className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 200 400" className="w-full h-full">
          <rect fill="#e8f0f2" width="200" height="400" />
          {/* Roads */}
          <line x1="30" y1="0" x2="30" y2="400" stroke="#cbd5e0" strokeWidth="1.5" />
          <line x1="80" y1="0" x2="80" y2="400" stroke="#cbd5e0" strokeWidth="1" />
          <line x1="140" y1="0" x2="140" y2="400" stroke="#cbd5e0" strokeWidth="1.5" />
          <line x1="0" y1="80" x2="200" y2="80" stroke="#cbd5e0" strokeWidth="1" />
          <line x1="0" y1="160" x2="200" y2="160" stroke="#cbd5e0" strokeWidth="1.5" />
          <line x1="0" y1="260" x2="200" y2="260" stroke="#cbd5e0" strokeWidth="1" />
          <line x1="0" y1="340" x2="200" y2="340" stroke="#cbd5e0" strokeWidth="1" />
          {/* Route line */}
          <polyline points="50,60 80,120 120,160 90,220 140,300" fill="none" stroke="#EF8557" strokeWidth="2" strokeDasharray="4" />
        </svg>
      </div>
      {/* Map pins */}
      <div className="relative flex-1">
        {[
          { top: '12%', left: '22%', label: 'Colosseum', color: 'bg-columbia-500' },
          { top: '28%', left: '36%', label: 'Trastevere', color: 'bg-naples-500' },
          { top: '38%', left: '56%', label: 'Vatican', color: 'bg-coral-400' },
          { top: '52%', left: '42%', label: 'Terrazza', color: 'bg-naples-500' },
          { top: '72%', left: '65%', label: 'Piazza Navona', color: 'bg-columbia-500' },
        ].map((pin, i) => (
          <div key={i} className="absolute flex flex-col items-center" style={{ top: pin.top, left: pin.left }}>
            <div className={`w-5 h-5 rounded-full ${pin.color} border-2 border-white shadow-md flex items-center justify-center`}>
              <MapPin size={8} className="text-white" />
            </div>
            <span className="text-[7px] font-medium text-charcoal-500 bg-white/90 px-1.5 py-0.5 rounded mt-0.5 shadow-sm whitespace-nowrap">{pin.label}</span>
          </div>
        ))}
      </div>
      {/* Bottom card */}
      <div className="relative m-3 bg-white rounded-xl p-2.5 shadow-md border border-platinum-100">
        <div className="flex items-center gap-2">
          <Map size={12} className="text-coral-400" />
          <div>
            <p className="text-[10px] font-semibold text-charcoal-500">Rome — Day 2</p>
            <p className="text-[8px] text-platinum-500">5 locations · 3.2 km route</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Screen 4: Atlas / Share
function ShareScreen() {
  return (
    <div className="h-full flex flex-col bg-white p-4">
      <div className="text-center mb-3">
        <p className="text-[9px] text-platinum-500 uppercase tracking-wider font-medium">Atlas Files</p>
        <h3 className="text-xs font-semibold text-charcoal-500">Community Stories</h3>
      </div>
      <div className="space-y-2.5 flex-1">
        {[
          { title: '5 Days in Tokyo', dest: 'Japan', img: '🗼', stars: 4.8 },
          { title: 'Bali on a Budget', dest: 'Indonesia', img: '🌺', stars: 4.6 },
          { title: 'Rome Like a Local', dest: 'Italy', img: '🏛️', stars: 4.9 },
        ].map((story, i) => (
          <div key={i} className="flex gap-2.5 bg-platinum-50 rounded-xl p-2 border border-platinum-100">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-coral-200 to-columbia-200 flex items-center justify-center text-lg flex-shrink-0">
              {story.img}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-charcoal-500 truncate">{story.title}</p>
              <p className="text-[8px] text-platinum-500">{story.dest}</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                <Star size={7} className="text-naples-500 fill-naples-500" />
                <span className="text-[8px] text-charcoal-400 font-medium">{story.stars}</span>
              </div>
            </div>
            <BookOpen size={10} className="text-platinum-400 mt-1 flex-shrink-0" />
          </div>
        ))}
      </div>
      <div className="mt-2 bg-coral-50 rounded-xl p-2.5 text-center border border-coral-100">
        <p className="text-[9px] font-semibold text-coral-600">Share Your Story</p>
        <p className="text-[7px] text-coral-400">Publish your travel experience</p>
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS = [DiscoverScreen, PlanScreen, MapScreen, ShareScreen];

function PhoneShowcase() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Phone entrance: scale up from 0.8 to 1 in first 10%
  const phoneScale = useTransform(scrollYProgress, [0, 0.08, 0.85, 1], [0.85, 1, 1, 0.6]);
  const phoneOpacity = useTransform(scrollYProgress, [0, 0.05, 0.88, 1], [0, 1, 1, 0]);

  // Screen opacities — each screen gets ~25% of scroll space
  const screen0Opacity = useTransform(scrollYProgress, [0.02, 0.08, 0.2, 0.25], [0, 1, 1, 0]);
  const screen1Opacity = useTransform(scrollYProgress, [0.22, 0.28, 0.45, 0.5], [0, 1, 1, 0]);
  const screen2Opacity = useTransform(scrollYProgress, [0.47, 0.53, 0.7, 0.75], [0, 1, 1, 0]);
  const screen3Opacity = useTransform(scrollYProgress, [0.72, 0.78, 0.92, 1], [0, 1, 1, 0]);
  const screenOpacities = [screen0Opacity, screen1Opacity, screen2Opacity, screen3Opacity];

  // Feature text opacities and Y transforms
  const text0Opacity = useTransform(scrollYProgress, [0.04, 0.1, 0.2, 0.24], [0, 1, 1, 0]);
  const text1Opacity = useTransform(scrollYProgress, [0.24, 0.3, 0.45, 0.49], [0, 1, 1, 0]);
  const text2Opacity = useTransform(scrollYProgress, [0.49, 0.55, 0.7, 0.74], [0, 1, 1, 0]);
  const text3Opacity = useTransform(scrollYProgress, [0.74, 0.8, 0.92, 0.96], [0, 1, 1, 0]);
  const textOpacities = [text0Opacity, text1Opacity, text2Opacity, text3Opacity];

  const text0Y = useTransform(scrollYProgress, [0.04, 0.1, 0.2, 0.24], [30, 0, 0, -30]);
  const text1Y = useTransform(scrollYProgress, [0.24, 0.3, 0.45, 0.49], [30, 0, 0, -30]);
  const text2Y = useTransform(scrollYProgress, [0.49, 0.55, 0.7, 0.74], [30, 0, 0, -30]);
  const text3Y = useTransform(scrollYProgress, [0.74, 0.8, 0.92, 0.96], [30, 0, 0, -30]);
  const textYs = [text0Y, text1Y, text2Y, text3Y];

  // Progress dots
  const activeDot = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 3]);

  return (
    <section ref={containerRef} className="relative" style={{ height: '350vh' }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

            {/* Feature Text (left side on desktop) */}
            <div className="relative w-full lg:w-80 h-32 lg:h-48">
              {SCREENS.map((screen, i) => (
                <motion.div
                  key={screen.id}
                  className="absolute inset-0 flex flex-col justify-center text-center lg:text-left"
                  style={{ opacity: textOpacities[i], y: textYs[i] }}
                >
                  <span className="inline-flex items-center gap-1.5 text-coral-400 text-xs font-medium tracking-wider uppercase mb-3">
                    <span className="w-5 h-5 rounded-md bg-coral-50 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                    of {SCREENS.length}
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-semibold text-charcoal-500 mb-3">
                    {screen.title}
                  </h3>
                  <p className="text-charcoal-400 leading-relaxed">
                    {screen.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Phone */}
            <motion.div
              className="relative flex-shrink-0"
              style={{ scale: phoneScale, opacity: phoneOpacity }}
            >
              {/* Phone frame */}
              <div className="relative w-[240px] h-[490px] rounded-[2.5rem] bg-charcoal-500 p-[6px] shadow-[0_20px_80px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />

                {/* Screen */}
                <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-white relative">
                  {/* Status bar */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/5 to-transparent z-10 flex items-end justify-between px-6 pb-0.5">
                    <span className="text-[8px] font-semibold text-charcoal-400">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-1.5 rounded-sm border border-charcoal-400">
                        <div className="w-2 h-full bg-charcoal-400 rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Screen content layers */}
                  {SCREEN_COMPONENTS.map((ScreenComp, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 pt-10"
                      style={{ opacity: screenOpacities[i] }}
                    >
                      <ScreenComp />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Glow effect behind phone */}
              <div className="absolute -inset-16 -z-10 rounded-full bg-gradient-to-br from-naples-200/40 via-coral-200/20 to-columbia-200/30 blur-3xl" />
            </motion.div>

            {/* Progress dots (right side on desktop, below on mobile) */}
            <div className="flex lg:flex-col gap-2.5">
              {SCREENS.map((_, i) => (
                <ProgressDot key={i} index={i} activeDot={activeDot} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressDot({ index, activeDot }) {
  const isActive = useTransform(activeDot, (v) => Math.round(v) === index);
  const scale = useTransform(isActive, (active) => active ? 1.4 : 1);
  const bgOpacity = useTransform(isActive, (active) => active ? 1 : 0.3);

  return (
    <motion.div
      className="w-2.5 h-2.5 rounded-full bg-coral-400"
      style={{ scale, opacity: bgOpacity }}
    />
  );
}

export default PhoneShowcase;

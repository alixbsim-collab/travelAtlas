import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ScrollReveal from '../components/ui/ScrollReveal';
import { ArrowRight, Plane, BookOpen, Map, Sparkles, Calendar, GripVertical, Check, MessageSquare, Compass } from 'lucide-react';

const GlobeSection = React.lazy(() => import('../components/home/GlobeSection'));

// Photo collage animation variants
const imageVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, delay: 0.3 + i * 0.15, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// Stagger animation for designer steps
const designerStepVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
};
const stepItemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function HomePage() {
  return (
    <div>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-naples-100 via-naples-50 to-white">
        {/* Decorative blobs */}
        <div className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full bg-naples-200/30 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] rounded-full bg-coral-200/20 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-naples-400/20 text-charcoal-500 text-sm font-medium mb-8"
              >
                <Compass size={14} className="text-coral-400" /> Your journey starts here
              </motion.span>

              <h1 className="text-5xl md:text-6xl lg:text-7xl text-charcoal-500 mb-8 leading-[1.08]">
                Shape Your{' '}
                <span className="text-coral-400">
                  Dream
                </span>{' '}
                Journey
              </h1>

              <p className="text-lg text-charcoal-400 mb-10 max-w-lg leading-relaxed">
                Turn your travel ideas into structured, day-by-day itineraries.
                Explore destinations, build plans, and share your adventures.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/designer/create">
                  <Button size="lg" className="min-w-[200px]">
                    Start Planning <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/atlas">
                  <Button variant="outline" size="lg" className="min-w-[200px]">
                    Browse Atlas Files
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Travel Photo Collage */}
            <div className="relative hidden md:block">
              <div className="grid grid-cols-5 grid-rows-4 gap-3 h-[480px]">
                {/* Main large image — spans 3 cols, 4 rows */}
                <motion.div
                  custom={0}
                  variants={imageVariants}
                  initial="hidden"
                  animate="show"
                  className="col-span-3 row-span-4 rounded-3xl overflow-hidden shadow-elevated"
                >
                  <img
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80"
                    alt="Travel adventure"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Top-right image — spans 2 cols, 2 rows */}
                <motion.div
                  custom={1}
                  variants={imageVariants}
                  initial="hidden"
                  animate="show"
                  className="col-span-2 row-span-2 rounded-3xl overflow-hidden shadow-elevated"
                >
                  <img
                    src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80"
                    alt="Mountain hiking"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Bottom-right image — spans 2 cols, 2 rows */}
                <motion.div
                  custom={2}
                  variants={imageVariants}
                  initial="hidden"
                  animate="show"
                  className="col-span-2 row-span-2 rounded-3xl overflow-hidden shadow-elevated"
                >
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80"
                    alt="Tropical beach sunset"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>

              {/* Decorative blurs */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-naples-300/25 blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-columbia-300/25 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── GLOBE SECTION ── */}
      <Suspense
        fallback={
          <div className="py-24 bg-charcoal-700 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400" />
          </div>
        }
      >
        <GlobeSection />
      </Suspense>

      {/* ── TRAVEL DESIGNER SHOWCASE ── */}
      <section className="py-24 bg-gradient-to-b from-naples-200 to-naples-100 overflow-hidden">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-naples-400/20 text-charcoal-500 text-sm font-medium mb-5">
                <Compass size={14} className="text-coral-400" /> How It Works
              </span>
              <h2 className="text-3xl md:text-4xl text-charcoal-500 mb-5">
                Your Trip, Designed in Minutes
              </h2>
              <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
                Tell us where you want to go, and we'll help you structure a complete day-by-day itinerary you can customize and share.
              </p>
            </div>
          </ScrollReveal>

          {/* 3-Step Visual Walkthrough */}
          <div className="grid md:grid-cols-3 gap-10 mb-20">
            <ScrollReveal delay={0}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-naples-400 text-charcoal-500 flex items-center justify-center shadow-md">
                  <span className="text-2xl font-semibold" style={{ fontFamily: "'Fredoka', sans-serif" }}>1</span>
                </div>
                <h3 className="text-xl mb-3 text-charcoal-500">Describe Your Vision</h3>
                <p className="text-charcoal-400 max-w-xs mx-auto leading-relaxed">
                  Choose your destination, dates, pace, and travel style. Or let us surprise you.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-coral-400 text-white flex items-center justify-center shadow-md">
                  <span className="text-2xl font-semibold" style={{ fontFamily: "'Fredoka', sans-serif" }}>2</span>
                </div>
                <h3 className="text-xl mb-3 text-charcoal-500">Get a Structured Plan</h3>
                <p className="text-charcoal-400 max-w-xs mx-auto leading-relaxed">
                  Receive a complete day-by-day itinerary with activities, restaurants, and real locations.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-columbia-700 text-white flex items-center justify-center shadow-md">
                  <span className="text-2xl font-semibold" style={{ fontFamily: "'Fredoka', sans-serif" }}>3</span>
                </div>
                <h3 className="text-xl mb-3 text-charcoal-500">Customize & Explore</h3>
                <p className="text-charcoal-400 max-w-xs mx-auto leading-relaxed">
                  Drag, drop, and refine your plan. View everything on an interactive map.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Animated Designer Preview */}
          <ScrollReveal>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-elevated border border-platinum-200/60 overflow-hidden">
                {/* Mock toolbar */}
                <div className="bg-charcoal-500 px-6 py-3.5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-coral-400" />
                    <div className="w-3 h-3 rounded-full bg-naples-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-white/50 text-xs tracking-wide">thetravelatlas.com/designer/planner</span>
                  </div>
                </div>

                {/* Mock planner layout */}
                <div className="grid md:grid-cols-5 min-h-[340px]">
                  {/* Left: AI Chat */}
                  <div className="md:col-span-2 border-r border-platinum-200/60 p-5">
                    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-platinum-100">
                      <div className="w-8 h-8 rounded-xl bg-naples-400/20 flex items-center justify-center">
                        <MessageSquare size={15} className="text-charcoal-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal-500">Travel Assistant</p>
                        <p className="text-xs text-charcoal-300">Refine your plan</p>
                      </div>
                    </div>

                    <motion.div
                      variants={designerStepVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: '-50px' }}
                      className="space-y-3"
                    >
                      <motion.div variants={stepItemVariants} className="bg-columbia-50 rounded-xl p-3 text-sm text-charcoal-500 max-w-[90%]">
                        I've found 3 amazing restaurants near the Colosseum for your evening!
                      </motion.div>
                      <motion.div variants={stepItemVariants} className="bg-platinum-50 rounded-xl p-3 text-sm text-charcoal-500 ml-auto max-w-[80%]">
                        Add the rooftop one to Day 2
                      </motion.div>
                      <motion.div variants={stepItemVariants} className="bg-columbia-50 rounded-xl p-3 text-sm text-charcoal-500 max-w-[90%]">
                        Done! I've added "Terrazza Borromini" to your evening on Day 2.
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Right: Itinerary */}
                  <div className="md:col-span-3 p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="font-semibold text-charcoal-500">Rome, Italy — Day 2</h4>
                      <div className="flex gap-1.5">
                        <span className="px-2.5 py-1 bg-coral-100 text-coral-700 rounded-lg text-xs font-medium">Overview</span>
                        <span className="px-2.5 py-1 bg-platinum-100 text-platinum-600 rounded-lg text-xs font-medium">Map</span>
                      </div>
                    </div>

                    <motion.div
                      variants={designerStepVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: '-50px' }}
                      className="space-y-2.5"
                    >
                      <motion.div variants={stepItemVariants} className="flex items-center gap-3 p-3.5 bg-columbia-50 rounded-xl border-l-4 border-columbia-400">
                        <GripVertical size={14} className="text-platinum-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-charcoal-500">Morning: Colosseum Tour</p>
                          <p className="text-xs text-platinum-600">9:00 AM — Via del Colosseo</p>
                        </div>
                        <Check size={14} className="text-columbia-500" />
                      </motion.div>
                      <motion.div variants={stepItemVariants} className="flex items-center gap-3 p-3.5 bg-naples-50 rounded-xl border-l-4 border-naples-400">
                        <GripVertical size={14} className="text-platinum-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-charcoal-500">Lunch: Trastevere Food Walk</p>
                          <p className="text-xs text-platinum-600">12:30 PM — Piazza Trilussa</p>
                        </div>
                        <Check size={14} className="text-naples-500" />
                      </motion.div>
                      <motion.div variants={stepItemVariants} className="flex items-center gap-3 p-3.5 bg-coral-50 rounded-xl border-l-4 border-coral-400">
                        <GripVertical size={14} className="text-platinum-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-charcoal-500">Evening: Terrazza Borromini</p>
                          <p className="text-xs text-platinum-600">7:30 PM — Piazza Navona</p>
                        </div>
                        <Sparkles size={14} className="text-coral-400" />
                      </motion.div>
                    </motion.div>

                    <div className="mt-5 pt-3.5 border-t border-platinum-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-platinum-600">
                        <Calendar size={12} />
                        <span>Day 2 of 5 — Rome, Italy</span>
                      </div>
                      <span className="text-xs font-medium text-coral-500 cursor-pointer hover:text-coral-600 transition-colors">+ Add Activity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* CTA under showcase */}
          <div className="text-center mt-12">
            <Link to="/designer/create">
              <Button size="lg">
                <Compass size={18} />
                Start Planning
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl text-charcoal-500 mb-5">
                Everything You Need
              </h2>
              <p className="text-charcoal-400 text-lg max-w-xl mx-auto">
                Tools and inspiration for every kind of traveler
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <Link to="/designer/create" className="block h-full">
                <Card hover className="h-full">
                  <div className="w-14 h-14 rounded-2xl bg-naples-100 flex items-center justify-center mb-6">
                    <Plane size={26} className="text-naples-600" />
                  </div>
                  <h3 className="text-xl mb-3 text-charcoal-500">Smart Itinerary Builder</h3>
                  <p className="text-charcoal-400 mb-5 leading-relaxed">
                    Design day-by-day plans with our intuitive drag-and-drop interface.
                  </p>
                  <span className="text-coral-500 font-medium flex items-center gap-1.5 text-sm">
                    Start building <ArrowRight size={15} />
                  </span>
                </Card>
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <Link to="/atlas" className="block h-full">
                <Card hover className="h-full">
                  <div className="w-14 h-14 rounded-2xl bg-columbia-100 flex items-center justify-center mb-6">
                    <BookOpen size={26} className="text-columbia-700" />
                  </div>
                  <h3 className="text-xl mb-3 text-charcoal-500">Curated Collections</h3>
                  <p className="text-charcoal-400 mb-5 leading-relaxed">
                    Browse expertly crafted itineraries from fellow travelers.
                  </p>
                  <span className="text-coral-500 font-medium flex items-center gap-1.5 text-sm">
                    Explore collections <ArrowRight size={15} />
                  </span>
                </Card>
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <Link to="/designer" className="block h-full">
                <Card hover className="h-full">
                  <div className="w-14 h-14 rounded-2xl bg-coral-50 flex items-center justify-center mb-6">
                    <Map size={26} className="text-coral-500" />
                  </div>
                  <h3 className="text-xl mb-3 text-charcoal-500">Personalized Maps</h3>
                  <p className="text-charcoal-400 mb-5 leading-relaxed">
                    Visualize your journey with interactive maps and location pins.
                  </p>
                  <span className="text-coral-500 font-medium flex items-center gap-1.5 text-sm">
                    View your trips <ArrowRight size={15} />
                  </span>
                </Card>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-24 bg-platinum-50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="rounded-3xl p-12 md:p-20 text-center bg-charcoal-500 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-coral-400/10 blur-[60px] pointer-events-none" />
              <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full bg-naples-400/10 blur-[60px] pointer-events-none" />

              <h2 className="text-3xl md:text-4xl mb-5 text-white relative">
                Ready to Start Your Adventure?
              </h2>
              <p className="text-lg mb-10 text-white/60 max-w-lg mx-auto relative">
                Join thousands of travelers creating amazing journeys
              </p>
              <Link to="/register" className="relative">
                <Button variant="accent" size="lg">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ScrollReveal from '../components/ui/ScrollReveal';
import { ArrowRight, Plane, BookOpen, Map, Sparkles, Calendar, GripVertical, Check } from 'lucide-react';

const GlobeSection = React.lazy(() => import('../components/home/GlobeSection'));

// Stagger animation for itinerary steps
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.3, delayChildren: 0.8 },
  },
};
const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function HomePage() {
  return (
    <div>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-platinum-50">
        {/* Decorative blobs */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-naples-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-coral-200/30 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-naples-100 text-naples-800 text-sm font-medium mb-6"
              >
                <Sparkles size={14} /> AI-Powered Travel Planning
              </motion.span>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading text-charcoal-500 mb-6 leading-[1.1]">
                Plan Your{' '}
                <span className="bg-gradient-to-r from-coral-400 to-coral-600 bg-clip-text text-transparent">
                  Perfect
                </span>{' '}
                Journey
              </h1>

              <p className="text-lg text-platinum-700 mb-10 max-w-lg leading-relaxed">
                Create personalized travel itineraries with our intelligent planner.
                Discover curated experiences and make every trip unforgettable.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/designer/create">
                  <Button size="lg" className="min-w-[200px] gap-2">
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

            {/* Right: Animated Itinerary Demo */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative hidden md:block"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-platinum-200">
                {/* Mock header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-platinum-200">
                  <div className="w-10 h-10 rounded-full bg-naples-100 flex items-center justify-center">
                    <Sparkles size={20} className="text-naples-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal-500 text-sm">AI Travel Designer</h4>
                    <p className="text-xs text-platinum-600">Drag & drop to customize</p>
                  </div>
                </div>

                {/* Animated activity cards */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  <motion.div variants={stepVariants} className="flex items-center gap-3 p-3 bg-columbia-50 rounded-xl border-l-4 border-columbia-400">
                    <GripVertical size={16} className="text-platinum-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-charcoal-500">Morning: Visit Eiffel Tower</p>
                      <p className="text-xs text-platinum-600">9:00 AM - 12:00 PM</p>
                    </div>
                    <Check size={16} className="text-columbia-500" />
                  </motion.div>
                  <motion.div variants={stepVariants} className="flex items-center gap-3 p-3 bg-naples-50 rounded-xl border-l-4 border-naples-400">
                    <GripVertical size={16} className="text-platinum-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-charcoal-500">Lunch: Le Petit Cler</p>
                      <p className="text-xs text-platinum-600">12:30 PM - 2:00 PM</p>
                    </div>
                    <Check size={16} className="text-naples-500" />
                  </motion.div>
                  <motion.div variants={stepVariants} className="flex items-center gap-3 p-3 bg-coral-50 rounded-xl border-l-4 border-coral-400">
                    <GripVertical size={16} className="text-platinum-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-charcoal-500">Afternoon: Louvre Museum</p>
                      <p className="text-xs text-platinum-600">2:30 PM - 6:00 PM</p>
                    </div>
                    <Check size={16} className="text-coral-400" />
                  </motion.div>
                </motion.div>

                {/* Mock footer */}
                <div className="mt-4 pt-4 border-t border-platinum-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-platinum-600">
                    <Calendar size={14} />
                    <span>Day 1 of 5 — Paris, France</span>
                  </div>
                  <span className="text-xs font-medium text-coral-500">+ Add Activity</span>
                </div>
              </div>

              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-naples-300/30 blur-md" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-columbia-300/30 blur-md" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GLOBE SECTION ── */}
      <Suspense
        fallback={
          <div className="py-20 bg-charcoal-700 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400" />
          </div>
        }
      >
        <GlobeSection />
      </Suspense>

      {/* ── FEATURES / HOW IT WORKS ── */}
      <section className="py-20 bg-platinum-50">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal-500 mb-4">
                How It Works
              </h2>
              <p className="text-platinum-700 text-lg max-w-xl mx-auto">
                Three simple steps to your dream itinerary
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <Link to="/designer/create" className="block h-full">
                <Card hover className="h-full">
                  <div className="w-14 h-14 rounded-xl bg-naples-100 flex items-center justify-center mb-5">
                    <Plane size={28} className="text-naples-600" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3 text-charcoal-500">Smart Itinerary Builder</h3>
                  <p className="text-platinum-700 mb-4">
                    Design day-by-day plans with our intuitive drag-and-drop interface.
                  </p>
                  <span className="text-coral-500 font-medium flex items-center gap-1 text-sm">
                    Start building <ArrowRight size={16} />
                  </span>
                </Card>
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <Link to="/atlas" className="block h-full">
                <Card hover className="h-full">
                  <div className="w-14 h-14 rounded-xl bg-columbia-100 flex items-center justify-center mb-5">
                    <BookOpen size={28} className="text-columbia-700" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3 text-charcoal-500">Curated Collections</h3>
                  <p className="text-platinum-700 mb-4">
                    Browse expertly crafted itineraries from fellow travelers.
                  </p>
                  <span className="text-coral-500 font-medium flex items-center gap-1 text-sm">
                    Explore collections <ArrowRight size={16} />
                  </span>
                </Card>
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <Link to="/designer" className="block h-full">
                <Card hover className="h-full">
                  <div className="w-14 h-14 rounded-xl bg-coral-50 flex items-center justify-center mb-5">
                    <Map size={28} className="text-coral-500" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3 text-charcoal-500">Personalized Maps</h3>
                  <p className="text-platinum-700 mb-4">
                    Visualize your journey with interactive maps and location pins.
                  </p>
                  <span className="text-coral-500 font-medium flex items-center gap-1 text-sm">
                    View your trips <ArrowRight size={16} />
                  </span>
                </Card>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div
              className="rounded-3xl p-12 md:p-16 text-center text-white"
              style={{ background: 'linear-gradient(135deg, #EF8557 0%, #C85A2E 35%, #4A7B91 70%, #2C4251 100%)' }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Ready to Start Your Adventure?
              </h2>
              <p className="text-lg mb-8 text-white/85 max-w-lg mx-auto">
                Join thousands of travelers creating amazing journeys
              </p>
              <Link to="/register">
                <Button variant="accent" size="lg" className="shadow-lg">
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

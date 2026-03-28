import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ScrollReveal from '../components/ui/ScrollReveal';
import PhoneShowcase from '../components/home/PhoneShowcase';
import { ArrowRight, Plane, BookOpen, Map, Compass } from 'lucide-react';

const GlobeSection = React.lazy(() => import('../components/home/GlobeSection'));

function HomePage() {
  return (
    <div>
      {/* ── HERO SECTION (Compact, text-only) ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-naples-100 via-naples-50 to-white">
        {/* Decorative blobs */}
        <div className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full bg-naples-200/30 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] rounded-full bg-coral-200/20 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 py-28 md:py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center max-w-3xl mx-auto"
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
              <span className="text-coral-400">Dream</span>{' '}
              Journey
            </h1>

            <p className="text-lg md:text-xl text-charcoal-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Turn your travel ideas into structured, day-by-day itineraries.
              Explore destinations, build plans, and share your adventures.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-charcoal-300/30 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-charcoal-300/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── PHONE SHOWCASE (Apple-style scroll animation) ── */}
      <PhoneShowcase />

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

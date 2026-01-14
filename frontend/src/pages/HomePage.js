import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function HomePage() {
  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl md:text-6xl font-heading font-bold text-neutral-charcoal mb-6">
          Plan Your Perfect Journey
        </h1>
        <p className="text-xl text-neutral-warm-gray mb-8 max-w-2xl mx-auto">
          Create personalized travel itineraries with our intelligent planner.
          Discover curated experiences and make every trip unforgettable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/designer">
            <Button size="lg">
              Start Planning
            </Button>
          </Link>
          <Link to="/atlas">
            <Button variant="outline" size="lg">
              Browse Atlas Files
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 py-16">
        <Card hover>
          <div className="text-4xl mb-4">✈️</div>
          <h3 className="text-xl font-heading font-bold mb-3">Smart Itinerary Builder</h3>
          <p className="text-neutral-warm-gray">
            Design day-by-day plans with our intuitive drag-and-drop interface.
          </p>
        </Card>

        <Card hover>
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-heading font-bold mb-3">Curated Collections</h3>
          <p className="text-neutral-warm-gray">
            Browse expertly crafted itineraries from fellow travelers.
          </p>
        </Card>

        <Card hover>
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-xl font-heading font-bold mb-3">Personalized Maps</h3>
          <p className="text-neutral-warm-gray">
            Visualize your journey with interactive maps and location pins.
          </p>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-600 rounded-2xl p-12 text-center text-white my-16">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
          Ready to Start Your Adventure?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Join thousands of travelers creating amazing journeys
        </p>
        <Link to="/register">
          <Button variant="accent" size="lg">
            Sign Up Free
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}

export default HomePage;

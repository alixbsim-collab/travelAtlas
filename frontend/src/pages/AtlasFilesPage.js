import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';

function AtlasFilesPage() {
  // Placeholder data
  const placeholderItineraries = [
    { id: 1, title: '7 Days in Tokyo', author: 'TravelExpert', destinations: 'Tokyo, Kyoto', days: 7 },
    { id: 2, title: 'European Adventure', author: 'Wanderlust', destinations: 'Paris, Rome, Barcelona', days: 14 },
    { id: 3, title: 'Bali Relaxation', author: 'BeachLover', destinations: 'Bali, Ubud', days: 10 },
  ];

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-neutral-charcoal mb-4">
          Atlas Files
        </h1>
        <p className="text-lg text-neutral-warm-gray mb-8">
          Browse curated travel itineraries from our community
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderItineraries.map((itinerary) => (
            <Card key={itinerary.id} hover>
              <h3 className="text-xl font-heading font-bold mb-2">
                {itinerary.title}
              </h3>
              <p className="text-sm text-neutral-warm-gray mb-3">
                By {itinerary.author}
              </p>
              <div className="flex items-center justify-between text-sm text-neutral-warm-gray">
                <span>📍 {itinerary.destinations}</span>
                <span>📅 {itinerary.days} days</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-heading font-bold mb-3">
                More Itineraries Coming Soon
              </h2>
              <p className="text-neutral-warm-gray max-w-md mx-auto">
                We're building a library of amazing travel itineraries.
                Create an account to save and share your own!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default AtlasFilesPage;

import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';

function TravelDesignerPage() {
  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-charcoal-500 mb-4">
          Travel Designer
        </h1>
        <p className="text-lg text-platinum-600 mb-8">
          Create your perfect itinerary with our interactive planner
        </p>

        <Card>
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-heading font-bold mb-4">
              Itinerary Builder Coming Soon
            </h2>
            <p className="text-platinum-600 max-w-md mx-auto">
              We're working on an amazing drag-and-drop interface to help you
              plan your perfect trip day by day.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default TravelDesignerPage;

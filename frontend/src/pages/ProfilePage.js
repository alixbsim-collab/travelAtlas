import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function ProfilePage() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-neutral-charcoal mb-8">
          My Profile
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white">
                👤
              </div>
              <h2 className="text-xl font-heading font-bold mb-2">
                Travel Enthusiast
              </h2>
              <p className="text-neutral-warm-gray text-sm">
                Member since 2024
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Edit Profile
              </Button>
            </div>
          </Card>

          {/* Stats and Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="text-xl font-heading font-bold mb-4">
                Travel Stats
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-500">0</div>
                  <div className="text-sm text-neutral-warm-gray">Itineraries</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary-600">0</div>
                  <div className="text-sm text-neutral-warm-gray">Places Visited</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-400">0</div>
                  <div className="text-sm text-neutral-warm-gray">Countries</div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-heading font-bold mb-4">
                My Itineraries
              </h3>
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✈️</div>
                <p className="text-neutral-warm-gray mb-4">
                  You haven't created any itineraries yet
                </p>
                <Button>Create Your First Itinerary</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TRAVELER_PROFILES, TRAVEL_PACE_OPTIONS, BUDGET_OPTIONS } from '../constants/travelerProfiles';
import { MapPin, Calendar, Users, DollarSign, Gauge, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

function CreateItineraryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    tripLength: 7,
    startDate: null,
    endDate: null,
    flexibleDates: false,
    travelPace: 'balanced',
    budget: 'medium',
    travelerProfiles: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileToggle = (profileId) => {
    setFormData(prev => {
      const profiles = prev.travelerProfiles.includes(profileId)
        ? prev.travelerProfiles.filter(id => id !== profileId)
        : [...prev.travelerProfiles, profileId];
      return { ...prev, travelerProfiles: profiles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }

    if (formData.travelerProfiles.length === 0) {
      alert('Please select at least one traveler profile');
      return;
    }

    if (formData.travelerProfiles.length > 4) {
      alert('Please select up to 4 traveler profiles');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in to create an itinerary');
        navigate('/login');
        return;
      }

      // Create the itinerary
      const { data: itinerary, error } = await supabase
        .from('itineraries')
        .insert({
          user_id: user.id,
          title: `${formData.destination} - ${formData.tripLength} days`,
          destination: formData.destination,
          trip_length: formData.tripLength,
          start_date: formData.startDate,
          end_date: formData.endDate,
          travel_pace: formData.travelPace,
          budget: formData.budget,
          traveler_profiles: formData.travelerProfiles
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to the planner immediately - don't wait for AI generation
      const itineraryId = itinerary.id;

      // Start AI generation in background (don't block navigation)
      const apiUrl = process.env.REACT_APP_API_URL || 'https://travelatlas.onrender.com';

      fetch(`${apiUrl}/api/ai/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: itineraryId,
          destination: formData.destination,
          tripLength: formData.tripLength,
          travelPace: formData.travelPace,
          budget: formData.budget,
          travelerProfiles: formData.travelerProfiles
        })
      })
        .then(response => response.json())
        .then(async (aiData) => {
          if (aiData.success && aiData.itinerary.activities) {
            const activitiesToInsert = aiData.itinerary.activities.map((activity, index) => ({
              itinerary_id: itineraryId,
              day_number: activity.day_number,
              position: index,
              title: activity.title,
              description: activity.description,
              location: activity.location,
              category: activity.category,
              duration_minutes: activity.duration_minutes,
              estimated_cost_min: activity.estimated_cost_min,
              estimated_cost_max: activity.estimated_cost_max,
              latitude: activity.latitude,
              longitude: activity.longitude,
              time_of_day: activity.time_of_day
            }));

            await supabase.from('activities').insert(activitiesToInsert);

            if (aiData.itinerary.accommodations?.length > 0) {
              const accommodationsToInsert = aiData.itinerary.accommodations.map(acc => ({
                itinerary_id: itineraryId,
                name: acc.name,
                type: acc.type,
                location: acc.location,
                price_per_night: acc.price_per_night,
                latitude: acc.latitude,
                longitude: acc.longitude
              }));
              await supabase.from('accommodations').insert(accommodationsToInsert);
            }
          }
        })
        .catch(err => console.error('Background AI generation error:', err));

      // Navigate immediately to planner
      navigate(`/designer/planner/${itineraryId}`, {
        state: { preferences: formData, generating: true }
      });

    } catch (error) {
      console.error('Error creating itinerary:', error);
      alert('Failed to create itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-heading font-bold text-neutral-charcoal mb-3">
            Create Your Itinerary
          </h1>
          <p className="text-lg text-neutral-warm-gray">
            Tell us about your travel preferences and we'll generate a personalized plan
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Destination */}
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="text-primary-500" size={24} />
              <h2 className="text-2xl font-heading font-bold">Destination</h2>
            </div>

            <div>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="Where do you want to go? (e.g., Tokyo, Japan)"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-sm text-neutral-warm-gray mt-2">
                Enter a city, region, or country. Leave as "Undecided" for inspiration.
              </p>
            </div>
          </Card>

          {/* Trip Length & Dates */}
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-primary-500" size={24} />
              <h2 className="text-2xl font-heading font-bold">Trip Length & Dates</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.tripLength}
                  onChange={(e) => handleInputChange('tripLength', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                  Flexible Dates?
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.flexibleDates}
                    onChange={(e) => handleInputChange('flexibleDates', e.target.checked)}
                    className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-neutral-warm-gray">My dates are flexible</span>
                </label>
              </div>
            </div>

            {!formData.flexibleDates && (
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                    Start Date (Optional)
                  </label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholderText="Select start date"
                    minDate={new Date()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                    End Date (Optional)
                  </label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholderText="Select end date"
                    minDate={formData.startDate || new Date()}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Travel Pace */}
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Gauge className="text-primary-500" size={24} />
              <h2 className="text-2xl font-heading font-bold">Travel Pace</h2>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {TRAVEL_PACE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('travelPace', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    formData.travelPace === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-900">
                <strong>{TRAVEL_PACE_OPTIONS.find(o => o.value === formData.travelPace)?.label}:</strong>{' '}
                {TRAVEL_PACE_OPTIONS.find(o => o.value === formData.travelPace)?.description}
              </p>
            </div>
          </Card>

          {/* Budget */}
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="text-primary-500" size={24} />
              <h2 className="text-2xl font-heading font-bold">Budget</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('budget', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    formData.budget === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="text-lg font-bold mb-1">{option.symbol}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-900">
                <strong>{BUDGET_OPTIONS.find(o => o.value === formData.budget)?.label}:</strong>{' '}
                {BUDGET_OPTIONS.find(o => o.value === formData.budget)?.description}
              </p>
            </div>
          </Card>

          {/* Traveler Profiles */}
          <Card className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-primary-500" size={24} />
              <h2 className="text-2xl font-heading font-bold">Traveler Profile</h2>
            </div>

            <p className="text-neutral-warm-gray mb-4">
              Choose 1-4 profiles that best describe your travel style
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              {TRAVELER_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleProfileToggle(profile.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.travelerProfiles.includes(profile.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{profile.emoji}</div>
                    <div className="flex-1">
                      <div className="font-heading font-bold mb-1">{profile.title}</div>
                      <div className="text-sm text-neutral-warm-gray">{profile.description}</div>
                    </div>
                    {formData.travelerProfiles.includes(profile.id) && (
                      <div className="text-primary-500 text-xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {formData.travelerProfiles.length > 0 && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-900">
                  <strong>Selected:</strong> {formData.travelerProfiles.length} profile{formData.travelerProfiles.length > 1 ? 's' : ''}
                  {formData.travelerProfiles.length > 4 && (
                    <span className="text-red-600 ml-2">
                      (Please select up to 4 profiles)
                    </span>
                  )}
                </p>
              </div>
            )}
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              disabled={loading || formData.travelerProfiles.length === 0 || formData.travelerProfiles.length > 4}
              className="gap-2 min-w-[250px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate My Itinerary
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default CreateItineraryPage;

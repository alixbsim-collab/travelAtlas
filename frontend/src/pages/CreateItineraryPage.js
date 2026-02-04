import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TRAVELER_PROFILES, TRAVEL_PACE_OPTIONS, BUDGET_OPTIONS } from '../constants/travelerProfiles';
import { MapPin, Calendar, Users, DollarSign, Gauge, Sparkles, ArrowRight, ArrowLeft, Check, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Popular destinations for autocomplete suggestions
const POPULAR_DESTINATIONS = [
  { name: 'Tokyo, Japan', country: 'Japan' },
  { name: 'Paris, France', country: 'France' },
  { name: 'New York, USA', country: 'USA' },
  { name: 'London, UK', country: 'UK' },
  { name: 'Rome, Italy', country: 'Italy' },
  { name: 'Barcelona, Spain', country: 'Spain' },
  { name: 'Dubai, UAE', country: 'UAE' },
  { name: 'Bali, Indonesia', country: 'Indonesia' },
  { name: 'Sydney, Australia', country: 'Australia' },
  { name: 'Bangkok, Thailand', country: 'Thailand' },
  { name: 'Amsterdam, Netherlands', country: 'Netherlands' },
  { name: 'Singapore', country: 'Singapore' },
  { name: 'Lisbon, Portugal', country: 'Portugal' },
  { name: 'Istanbul, Turkey', country: 'Turkey' },
  { name: 'Prague, Czech Republic', country: 'Czech Republic' },
  { name: 'Vienna, Austria', country: 'Austria' },
  { name: 'Berlin, Germany', country: 'Germany' },
  { name: 'Athens, Greece', country: 'Greece' },
  { name: 'Marrakech, Morocco', country: 'Morocco' },
  { name: 'Cape Town, South Africa', country: 'South Africa' },
  { name: 'Reykjavik, Iceland', country: 'Iceland' },
  { name: 'Buenos Aires, Argentina', country: 'Argentina' },
  { name: 'Mexico City, Mexico', country: 'Mexico' },
  { name: 'Kyoto, Japan', country: 'Japan' },
  { name: 'Florence, Italy', country: 'Italy' },
  { name: 'Santorini, Greece', country: 'Greece' },
  { name: 'Machu Picchu, Peru', country: 'Peru' },
  { name: 'Cairo, Egypt', country: 'Egypt' },
  { name: 'Seoul, South Korea', country: 'South Korea' },
  { name: 'Hong Kong', country: 'China' },
];

const STEPS = [
  { id: 1, title: 'Destination', icon: MapPin },
  { id: 2, title: 'Dates', icon: Calendar },
  { id: 3, title: 'Pace', icon: Gauge },
  { id: 4, title: 'Profile', icon: Users },
  { id: 5, title: 'Budget', icon: DollarSign },
  { id: 6, title: 'Generate', icon: Sparkles },
];

function CreateItineraryPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const destinationRef = useRef(null);

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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (destinationRef.current && !destinationRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter destinations based on input
  useEffect(() => {
    if (formData.destination.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.name.toLowerCase().includes(formData.destination.toLowerCase()) ||
        dest.country.toLowerCase().includes(formData.destination.toLowerCase())
      ).slice(0, 6);
      setFilteredDestinations(filtered);
    } else {
      setFilteredDestinations(POPULAR_DESTINATIONS.slice(0, 6));
    }
  }, [formData.destination]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDestinationSelect = (destination) => {
    setFormData(prev => ({ ...prev, destination: destination.name }));
    setShowSuggestions(false);
  };

  const handleProfileToggle = (profileId) => {
    setFormData(prev => {
      const profiles = prev.travelerProfiles.includes(profileId)
        ? prev.travelerProfiles.filter(id => id !== profileId)
        : [...prev.travelerProfiles, profileId];
      return { ...prev, travelerProfiles: profiles };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.destination.trim().length > 0;
      case 2:
        return formData.tripLength > 0;
      case 3:
        return formData.travelPace !== '';
      case 4:
        return formData.travelerProfiles.length > 0 && formData.travelerProfiles.length <= 4;
      case 5:
        return formData.budget !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }

    if (formData.travelerProfiles.length === 0) {
      alert('Please select at least one traveler profile');
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

      const itineraryId = itinerary.id;
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
      }).catch(err => console.error('Background AI generation error:', err));

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

  // Progress bar component
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                  style={isCurrent ? { backgroundColor: '#F5C846', color: '#1E4D73' } : {}}
                >
                  {isCompleted ? <Check size={20} /> : <StepIcon size={20} />}
                </div>
                <span className={`text-xs mt-2 hidden md:block ${isCurrent ? 'font-bold text-neutral-charcoal' : 'text-neutral-400'}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-neutral-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-center text-sm text-neutral-warm-gray">
        Step {currentStep} of {STEPS.length}
      </p>
    </div>
  );

  // Step content renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <MapPin size={40} style={{ color: '#F5C846' }} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
              Where do you want to go?
            </h2>
            <p className="text-neutral-warm-gray mb-8 max-w-md mx-auto">
              Enter a city, region, or country. Type "Undecided" if you want us to inspire you.
            </p>

            <div className="max-w-lg mx-auto relative" ref={destinationRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search destination..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                  autoFocus
                />
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50">
                  <button
                    onClick={() => handleDestinationSelect({ name: 'Undecided' })}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-neutral-100 flex items-center gap-3"
                  >
                    <Sparkles size={18} className="text-primary-500" />
                    <div>
                      <span className="font-medium">Undecided</span>
                      <span className="text-sm text-neutral-400 ml-2">- Let us inspire you</span>
                    </div>
                  </button>
                  {filteredDestinations.map((dest, index) => (
                    <button
                      key={index}
                      onClick={() => handleDestinationSelect(dest)}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex items-center gap-3"
                    >
                      <MapPin size={18} className="text-neutral-400" />
                      <span>{dest.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
              <Calendar size={40} style={{ color: '#2D6A9F' }} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
              When are you traveling?
            </h2>
            <p className="text-neutral-warm-gray mb-8 max-w-md mx-auto">
              Set your trip length and dates. Flexible dates give us more room to optimize.
            </p>

            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-white rounded-xl p-6 border border-neutral-200">
                <label className="block text-sm font-medium text-neutral-charcoal mb-3">
                  How many days?
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('tripLength', Math.max(1, formData.tripLength - 1))}
                    className="w-12 h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-2xl transition-colors"
                  >
                    -
                  </button>
                  <div className="text-5xl font-bold" style={{ color: '#2D6A9F' }}>
                    {formData.tripLength}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('tripLength', Math.min(30, formData.tripLength + 1))}
                    className="w-12 h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-2xl transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-neutral-400 mt-2">days</p>
              </div>

              <label className="flex items-center justify-center gap-3 cursor-pointer p-4 bg-white rounded-xl border border-neutral-200">
                <input
                  type="checkbox"
                  checked={formData.flexibleDates}
                  onChange={(e) => handleInputChange('flexibleDates', e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-neutral-charcoal">My dates are flexible</span>
              </label>

              {!formData.flexibleDates && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleInputChange('startDate', date)}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholderText="Select date"
                      minDate={new Date()}
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-neutral-200">
                    <label className="block text-sm font-medium text-neutral-charcoal mb-2">
                      End Date
                    </label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleInputChange('endDate', date)}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholderText="Select date"
                      minDate={formData.startDate || new Date()}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <Gauge size={40} style={{ color: '#F5C846' }} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
              What's your travel pace?
            </h2>
            <p className="text-neutral-warm-gray mb-8 max-w-md mx-auto">
              This helps us balance activities with downtime.
            </p>

            <div className="max-w-2xl mx-auto grid grid-cols-5 gap-3">
              {TRAVEL_PACE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('travelPace', option.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.travelPace === option.value
                      ? 'border-primary-500 bg-primary-50 scale-105'
                      : 'border-neutral-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {formData.travelPace && (
              <div className="mt-6 p-4 bg-primary-50 rounded-xl max-w-lg mx-auto">
                <p className="text-sm text-primary-900">
                  <strong>{TRAVEL_PACE_OPTIONS.find(o => o.value === formData.travelPace)?.label}:</strong>{' '}
                  {TRAVEL_PACE_OPTIONS.find(o => o.value === formData.travelPace)?.description}
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
              <Users size={40} style={{ color: '#2D6A9F' }} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
              What kind of traveler are you?
            </h2>
            <p className="text-neutral-warm-gray mb-8 max-w-md mx-auto">
              Select 1-4 profiles that match your travel style.
            </p>

            <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-3">
              {TRAVELER_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleProfileToggle(profile.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.travelerProfiles.includes(profile.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{profile.emoji}</div>
                    <div className="flex-1">
                      <div className="font-heading font-bold mb-1">{profile.title}</div>
                      <div className="text-sm text-neutral-warm-gray">{profile.description}</div>
                    </div>
                    {formData.travelerProfiles.includes(profile.id) && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {formData.travelerProfiles.length > 0 && (
              <div className="mt-6 p-4 bg-primary-50 rounded-xl max-w-lg mx-auto">
                <p className="text-sm text-primary-900">
                  <strong>Selected:</strong> {formData.travelerProfiles.length} profile{formData.travelerProfiles.length > 1 ? 's' : ''}
                  {formData.travelerProfiles.length > 4 && (
                    <span className="text-red-600 ml-2">(Maximum 4 profiles)</span>
                  )}
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <DollarSign size={40} style={{ color: '#F5C846' }} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
              What's your budget?
            </h2>
            <p className="text-neutral-warm-gray mb-8 max-w-md mx-auto">
              This helps us suggest appropriate accommodations and activities.
            </p>

            <div className="max-w-2xl mx-auto grid grid-cols-4 gap-4">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('budget', option.value)}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    formData.budget === option.value
                      ? 'border-primary-500 bg-primary-50 scale-105'
                      : 'border-neutral-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.emoji}</div>
                  <div className="text-2xl font-bold mb-1">{option.symbol}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {formData.budget && (
              <div className="mt-6 p-4 bg-primary-50 rounded-xl max-w-lg mx-auto">
                <p className="text-sm text-primary-900">
                  <strong>{BUDGET_OPTIONS.find(o => o.value === formData.budget)?.label}:</strong>{' '}
                  {BUDGET_OPTIONS.find(o => o.value === formData.budget)?.description}
                </p>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <Sparkles size={48} style={{ color: '#F5C846' }} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-neutral-charcoal mb-3">
              Ready to create your trip?
            </h2>
            <p className="text-neutral-warm-gray mb-8 max-w-md mx-auto">
              Review your preferences and let our AI design your perfect itinerary.
            </p>

            {/* Summary */}
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-neutral-200 p-6 text-left mb-8">
              <h3 className="font-heading font-bold text-lg mb-4 text-neutral-charcoal">Trip Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-neutral-400" />
                  <span className="text-neutral-charcoal font-medium">{formData.destination}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-neutral-400" />
                  <span className="text-neutral-charcoal">{formData.tripLength} days {formData.flexibleDates ? '(flexible)' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Gauge size={18} className="text-neutral-400" />
                  <span className="text-neutral-charcoal capitalize">{formData.travelPace} pace</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign size={18} className="text-neutral-400" />
                  <span className="text-neutral-charcoal capitalize">{formData.budget} budget</span>
                </div>
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-neutral-400 mt-1" />
                  <div className="flex flex-wrap gap-2">
                    {formData.travelerProfiles.map(profileId => {
                      const profile = TRAVELER_PROFILES.find(p => p.id === profileId);
                      return (
                        <span key={profileId} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          {profile?.emoji} {profile?.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg flex items-center gap-3 mx-auto disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: '#F5C846',
                color: '#1E4D73',
                boxShadow: '0 4px 14px rgba(245, 200, 70, 0.4)'
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={22} />
                  Generate My Itinerary
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBEB' }}>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProgressBar />

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-8 md:p-12 min-h-[500px] flex flex-col">
          <div className="flex-1">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <ArrowLeft size={18} />
              Back
            </button>

            {currentStep < 6 && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  backgroundColor: canProceed() ? '#F5C846' : '#E5E5E5',
                  color: canProceed() ? '#1E4D73' : '#9CA3AF'
                }}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateItineraryPage;

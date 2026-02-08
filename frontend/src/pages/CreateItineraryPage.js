import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TRAVELER_PROFILES, TRAVEL_PACE_OPTIONS, BUDGET_OPTIONS } from '../constants/travelerProfiles';
import { MapPin, Calendar, Users, DollarSign, Gauge, Sparkles, ArrowRight, ArrowLeft, Check, Search, X, Globe, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Popular destinations for autocomplete suggestions (cities + countries)
const POPULAR_DESTINATIONS = [
  { name: 'Tokyo, Japan', country: 'Japan', type: 'city' },
  { name: 'Paris, France', country: 'France', type: 'city' },
  { name: 'New York, USA', country: 'USA', type: 'city' },
  { name: 'London, UK', country: 'UK', type: 'city' },
  { name: 'Rome, Italy', country: 'Italy', type: 'city' },
  { name: 'Barcelona, Spain', country: 'Spain', type: 'city' },
  { name: 'Dubai, UAE', country: 'UAE', type: 'city' },
  { name: 'Bali, Indonesia', country: 'Indonesia', type: 'city' },
  { name: 'Sydney, Australia', country: 'Australia', type: 'city' },
  { name: 'Bangkok, Thailand', country: 'Thailand', type: 'city' },
  { name: 'Amsterdam, Netherlands', country: 'Netherlands', type: 'city' },
  { name: 'Singapore', country: 'Singapore', type: 'city' },
  { name: 'Lisbon, Portugal', country: 'Portugal', type: 'city' },
  { name: 'Istanbul, Turkey', country: 'Turkey', type: 'city' },
  { name: 'Prague, Czech Republic', country: 'Czech Republic', type: 'city' },
  { name: 'Vienna, Austria', country: 'Austria', type: 'city' },
  { name: 'Berlin, Germany', country: 'Germany', type: 'city' },
  { name: 'Athens, Greece', country: 'Greece', type: 'city' },
  { name: 'Marrakech, Morocco', country: 'Morocco', type: 'city' },
  { name: 'Cape Town, South Africa', country: 'South Africa', type: 'city' },
  { name: 'Reykjavik, Iceland', country: 'Iceland', type: 'city' },
  { name: 'Buenos Aires, Argentina', country: 'Argentina', type: 'city' },
  { name: 'Mexico City, Mexico', country: 'Mexico', type: 'city' },
  { name: 'Kyoto, Japan', country: 'Japan', type: 'city' },
  { name: 'Florence, Italy', country: 'Italy', type: 'city' },
  { name: 'Santorini, Greece', country: 'Greece', type: 'city' },
  { name: 'Machu Picchu, Peru', country: 'Peru', type: 'city' },
  { name: 'Cairo, Egypt', country: 'Egypt', type: 'city' },
  { name: 'Seoul, South Korea', country: 'South Korea', type: 'city' },
  { name: 'Hong Kong', country: 'China', type: 'city' },
  // Countries
  { name: 'Japan', country: 'Japan', type: 'country' },
  { name: 'Italy', country: 'Italy', type: 'country' },
  { name: 'France', country: 'France', type: 'country' },
  { name: 'Spain', country: 'Spain', type: 'country' },
  { name: 'Greece', country: 'Greece', type: 'country' },
  { name: 'Thailand', country: 'Thailand', type: 'country' },
  { name: 'Portugal', country: 'Portugal', type: 'country' },
  { name: 'Australia', country: 'Australia', type: 'country' },
  { name: 'Mexico', country: 'Mexico', type: 'country' },
  { name: 'Morocco', country: 'Morocco', type: 'country' },
  { name: 'Peru', country: 'Peru', type: 'country' },
  { name: 'Indonesia', country: 'Indonesia', type: 'country' },
  { name: 'South Korea', country: 'South Korea', type: 'country' },
  { name: 'Turkey', country: 'Turkey', type: 'country' },
];

// Regions for "Undecided" flow
const REGIONS = [
  { id: 'europe', name: 'Europe', emoji: '🏰', description: 'France, Italy, Spain, Greece...' },
  { id: 'north-america', name: 'North America', emoji: '🗽', description: 'USA, Canada, Mexico...' },
  { id: 'south-america', name: 'South America', emoji: '🌎', description: 'Brazil, Argentina, Peru...' },
  { id: 'south-east-asia', name: 'South & East Asia', emoji: '🏯', description: 'Japan, Thailand, Bali...' },
  { id: 'central-asia', name: 'Central Asia', emoji: '🐪', description: 'Turkey, UAE, India...' },
  { id: 'oceania', name: 'Oceania', emoji: '🏄', description: 'Australia, New Zealand, Fiji...' },
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
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [isMultiDestination, setIsMultiDestination] = useState(false);
  const [destinations, setDestinations] = useState([]); // For multi-destination mode
  const [destinationInput, setDestinationInput] = useState(''); // Current input for multi-dest
  const [showUndecidedModal, setShowUndecidedModal] = useState(false);
  const destinationRef = useRef(null);

  // Check for prefilled destination from navigation state
  const prefillDestination = location.state?.prefillDestination || '';

  const [formData, setFormData] = useState({
    destination: prefillDestination,
    region: '', // For Undecided flow
    tripLength: 7,
    startDate: null,
    endDate: null,
    flexibleDates: false,
    travelPace: 'balanced',
    budget: 'medium',
    travelerProfiles: []
  });

  // If destination is prefilled, skip to step 2
  useEffect(() => {
    if (prefillDestination && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [prefillDestination]);

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
    const searchTerm = isMultiDestination ? destinationInput : formData.destination;
    if (searchTerm.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.country.toLowerCase().includes(searchTerm.toLowerCase())
      ).filter(dest => !destinations.includes(dest.name)) // Exclude already added
      .slice(0, 6);
      setFilteredDestinations(filtered);
    } else {
      setFilteredDestinations(POPULAR_DESTINATIONS.filter(dest => !destinations.includes(dest.name)).slice(0, 6));
    }
  }, [formData.destination, destinationInput, destinations, isMultiDestination]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDestinationSelect = (destination) => {
    if (destination.name === 'Undecided') {
      setShowUndecidedModal(true);
      setShowSuggestions(false);
      return;
    }
    if (isMultiDestination) {
      if (!destinations.includes(destination.name)) {
        setDestinations(prev => [...prev, destination.name]);
      }
      setDestinationInput('');
      setShowSuggestions(false);
    } else {
      setFormData(prev => ({ ...prev, destination: destination.name }));
      setShowSuggestions(false);
    }
  };

  const handleRemoveDestination = (destName) => {
    setDestinations(prev => prev.filter(d => d !== destName));
  };

  const handleAddCustomDestination = () => {
    const trimmed = destinationInput.trim();
    if (trimmed && !destinations.includes(trimmed)) {
      setDestinations(prev => [...prev, trimmed]);
      setDestinationInput('');
    }
  };

  const handleSelectUndecided = (region) => {
    setFormData(prev => ({ ...prev, destination: 'Undecided', region }));
    setShowUndecidedModal(false);
    setIsMultiDestination(false);
    setDestinations([]);
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
        if (isMultiDestination) return destinations.length > 0;
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
      // Sync multi-dest to formData when leaving step 1
      if (currentStep === 1 && isMultiDestination && destinations.length > 0) {
        setFormData(prev => ({ ...prev, destination: destinations.join(', ') }));
      }
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
          travelerProfiles: formData.travelerProfiles,
          region: formData.region || null
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
              Enter a city, country, or multiple destinations. Select "Undecided" to let us inspire you.
            </p>

            {/* Multi-destination toggle */}
            <div className="max-w-lg mx-auto mb-4">
              <label className="flex items-center justify-center gap-3 cursor-pointer p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isMultiDestination}
                  onChange={(e) => {
                    setIsMultiDestination(e.target.checked);
                    if (!e.target.checked) {
                      // Sync back to single destination
                      if (destinations.length > 0) {
                        setFormData(prev => ({ ...prev, destination: destinations[0] }));
                      }
                      setDestinations([]);
                    } else {
                      // Move single destination to multi array
                      if (formData.destination && formData.destination !== 'Undecided') {
                        setDestinations([formData.destination]);
                        setFormData(prev => ({ ...prev, destination: '' }));
                      }
                    }
                  }}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                />
                <Globe size={18} className="text-neutral-500" />
                <span className="text-neutral-charcoal font-medium">Multi-destination trip</span>
              </label>
            </div>

            {/* Multi-destination tag chips */}
            {isMultiDestination && destinations.length > 0 && (
              <div className="max-w-lg mx-auto mb-4 flex flex-wrap gap-2 justify-center">
                {destinations.map((dest) => (
                  <span
                    key={dest}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ backgroundColor: '#DBEAFE', color: '#1E4D73' }}
                  >
                    <MapPin size={14} />
                    {dest}
                    <button
                      onClick={() => handleRemoveDestination(dest)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-w-lg mx-auto relative" ref={destinationRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  type="text"
                  value={isMultiDestination ? destinationInput : formData.destination}
                  onChange={(e) => {
                    if (isMultiDestination) {
                      setDestinationInput(e.target.value);
                    } else {
                      handleInputChange('destination', e.target.value);
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isMultiDestination && destinationInput.trim()) {
                      e.preventDefault();
                      handleAddCustomDestination();
                    }
                  }}
                  placeholder={isMultiDestination ? 'Add another destination...' : 'Search destination...'}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                  autoFocus
                />
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                  {!isMultiDestination && (
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
                  )}
                  {filteredDestinations.map((dest, index) => (
                    <button
                      key={index}
                      onClick={() => handleDestinationSelect(dest)}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex items-center gap-3"
                    >
                      {dest.type === 'country' ? (
                        <Globe size={18} className="text-neutral-400" />
                      ) : (
                        <MapPin size={18} className="text-neutral-400" />
                      )}
                      <span>{dest.name}</span>
                      {dest.type === 'country' && (
                        <span className="text-xs text-neutral-400 ml-auto">Country</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Undecided Region Selection Modal */}
            {showUndecidedModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUndecidedModal(false)}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-8" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-6">
                    <Sparkles size={32} className="mx-auto mb-3 text-primary-500" />
                    <h3 className="text-2xl font-heading font-bold text-neutral-charcoal mb-2">
                      Let us inspire you!
                    </h3>
                    <p className="text-neutral-warm-gray">
                      Pick a region and we'll suggest the perfect destination based on your preferences.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {REGIONS.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => handleSelectUndecided(region.id)}
                        className="p-4 rounded-xl border-2 border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
                      >
                        <div className="text-3xl mb-2">{region.emoji}</div>
                        <div className="font-bold text-sm text-neutral-charcoal">{region.name}</div>
                        <div className="text-xs text-neutral-400 mt-1">{region.description}</div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center border-t border-neutral-200 pt-4">
                    <p className="text-sm text-neutral-warm-gray mb-3">Or browse curated itineraries for inspiration</p>
                    <Link to="/atlas" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-charcoal font-medium text-sm transition-colors">
                      <BookOpen size={16} />
                      Browse Atlas Files
                    </Link>
                  </div>
                </div>
              </div>
            )}
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
                  <span className="text-neutral-charcoal font-medium">
                    {formData.destination}
                    {formData.destination === 'Undecided' && formData.region && (
                      <span className="text-sm text-neutral-400 ml-2">
                        ({REGIONS.find(r => r.id === formData.region)?.name || formData.region})
                      </span>
                    )}
                  </span>
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

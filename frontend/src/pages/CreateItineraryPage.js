import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TRAVELER_PROFILES, TRAVEL_PACE_OPTIONS, BUDGET_OPTIONS } from '../constants/travelerProfiles';
import { DESTINATIONS } from '../constants/destinations';
import { MapPin, Calendar, Users, DollarSign, Gauge, Sparkles, ArrowRight, ArrowLeft, Check, Search, X, Globe, BookOpen, Plane, Train, Car, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Regions for "Undecided" flow
const REGIONS = [
  { id: 'europe', name: 'Europe', emoji: '🏰', description: 'France, Italy, Spain, Greece...' },
  { id: 'north-america', name: 'North America', emoji: '🗽', description: 'USA, Canada, Mexico...' },
  { id: 'south-america', name: 'South America', emoji: '🌎', description: 'Brazil, Argentina, Peru...' },
  { id: 'africa', name: 'Africa', emoji: '🌍', description: 'Morocco, South Africa, Kenya...' },
  { id: 'south-east-asia', name: 'South & East Asia', emoji: '🏯', description: 'Japan, Thailand, Bali...' },
  { id: 'north-central-asia', name: 'North & Central Asia', emoji: '🐪', description: 'Turkey, UAE, India...' },
  { id: 'oceania', name: 'Oceania', emoji: '🏄', description: 'Australia, New Zealand, Fiji...' },
];

const TRAVEL_MODE_OPTIONS = [
  { value: 'flight', label: 'Flight', emoji: '✈️', icon: Plane, description: 'Flying to your destination' },
  { value: 'train', label: 'Train', emoji: '🚄', icon: Train, description: 'Rail travel' },
  { value: 'car', label: 'Car / Road Trip', emoji: '🚗', icon: Car, description: 'Driving adventure' },
  { value: 'mixed', label: 'Mixed', emoji: '🧭', icon: Shuffle, description: 'Combination of transport' },
];

const STEPS = [
  { id: 1, title: 'Destination', icon: MapPin },
  { id: 2, title: 'Travel From', icon: Plane },
  { id: 3, title: 'Dates', icon: Calendar },
  { id: 4, title: 'Pace', icon: Gauge },
  { id: 5, title: 'Profile', icon: Users },
  { id: 6, title: 'Budget', icon: DollarSign },
  { id: 7, title: 'Generate', icon: Sparkles },
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
  // Origin autocomplete state
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [filteredOrigins, setFilteredOrigins] = useState([]);
  const originRef = useRef(null);

  // Check for prefilled destination from navigation state
  const prefillDestination = location.state?.prefillDestination || '';

  const [formData, setFormData] = useState({
    destination: prefillDestination,
    region: '', // For Undecided flow
    tripOrigin: '',
    travelMode: '',
    tripLength: 7,
    startDate: null,
    endDate: null,
    flexibleDates: false,
    travelPace: 'balanced',
    budget: 'medium',
    travelerProfiles: []
  });

  // Pre-warm the Render backend on mount so it's awake by the time user finishes the wizard
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://travelatlas.onrender.com';
    fetch(`${apiUrl}/health`).catch(() => {});
  }, []);

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
      if (originRef.current && !originRef.current.contains(event.target)) {
        setShowOriginSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter destinations based on input
  useEffect(() => {
    const searchTerm = isMultiDestination ? destinationInput : formData.destination;
    if (searchTerm.length > 0) {
      const lower = searchTerm.toLowerCase();
      const filtered = DESTINATIONS
        .filter(dest =>
          dest.name.toLowerCase().includes(lower) ||
          dest.country.toLowerCase().includes(lower)
        )
        .filter(dest => !destinations.includes(dest.name))
        .sort((a, b) => {
          // Prefix matches first
          const aPrefix = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
          const bPrefix = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
          if (aPrefix !== bPrefix) return aPrefix - bPrefix;
          // Cities before countries
          if (a.type !== b.type) return a.type === 'city' ? -1 : 1;
          return 0;
        })
        .slice(0, 8);
      setFilteredDestinations(filtered);
    } else {
      setFilteredDestinations(DESTINATIONS.filter(dest => dest.type === 'city' && !destinations.includes(dest.name)).slice(0, 8));
    }
  }, [formData.destination, destinationInput, destinations, isMultiDestination]);

  // Filter origins based on input
  useEffect(() => {
    if (formData.tripOrigin.length > 0) {
      const lower = formData.tripOrigin.toLowerCase();
      const filtered = DESTINATIONS
        .filter(dest =>
          dest.name.toLowerCase().includes(lower) ||
          dest.country.toLowerCase().includes(lower)
        )
        .sort((a, b) => {
          const aPrefix = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
          const bPrefix = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
          if (aPrefix !== bPrefix) return aPrefix - bPrefix;
          if (a.type !== b.type) return a.type === 'city' ? -1 : 1;
          return 0;
        })
        .slice(0, 6);
      setFilteredOrigins(filtered);
    } else {
      setFilteredOrigins([]);
    }
  }, [formData.tripOrigin]);

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
        return formData.tripOrigin.trim().length > 0;
      case 3:
        return formData.tripLength > 0;
      case 4:
        return formData.travelPace !== '';
      case 5:
        return formData.travelerProfiles.length > 0 && formData.travelerProfiles.length <= 4;
      case 6:
        return formData.budget !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 7) {
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

      // Build insert object (trip_origin and travel_mode require DB migration)
      const insertData = {
        user_id: user.id,
        title: `${formData.destination} - ${formData.tripLength} days`,
        destination: formData.destination,
        trip_length: formData.tripLength,
        start_date: formData.startDate,
        end_date: formData.endDate,
        travel_pace: formData.travelPace,
        budget: formData.budget,
        traveler_profiles: formData.travelerProfiles,
      };

      // Try with new columns first, fall back without them
      let itinerary, error;
      const resultWithCols = await supabase
        .from('itineraries')
        .insert({
          ...insertData,
          trip_origin: formData.tripOrigin || null,
          travel_mode: formData.travelMode || null
        })
        .select()
        .single();

      if (resultWithCols.error) {
        // Columns may not exist yet — retry without them
        const resultWithout = await supabase
          .from('itineraries')
          .insert(insertData)
          .select()
          .single();
        itinerary = resultWithout.data;
        error = resultWithout.error;
      } else {
        itinerary = resultWithCols.data;
        error = resultWithCols.error;
      }

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
          region: formData.region || null,
          tripOrigin: formData.tripOrigin || null,
          travelMode: formData.travelMode || null
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
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-naples-400 text-charcoal-500'
                      : 'bg-platinum-200 text-platinum-500'
                  }`}
                >
                  {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                </div>
                <span className={`text-xs mt-2 hidden md:block ${isCurrent ? 'font-bold text-charcoal-500' : 'text-platinum-500'}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 md:mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-platinum-300'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-center text-sm text-platinum-600">
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-naples-50">
              <MapPin size={40} className="text-naples-400" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              Where do you want to go?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
              Enter a city, country, or multiple destinations. Select "Undecided" to let us inspire you.
            </p>

            {/* Multi-destination toggle */}
            <div className="max-w-lg mx-auto mb-4">
              <label className="flex items-center justify-center gap-3 cursor-pointer p-3 rounded-xl border border-platinum-200 bg-white hover:bg-platinum-100 transition-colors">
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
                  className="w-5 h-5 text-coral-500 rounded focus:ring-2 focus:ring-coral-400"
                />
                <Globe size={18} className="text-platinum-600" />
                <span className="text-charcoal-500 font-medium">Multi-destination trip</span>
              </label>
            </div>

            {/* Multi-destination tag chips */}
            {isMultiDestination && destinations.length > 0 && (
              <div className="max-w-lg mx-auto mb-4 flex flex-wrap gap-2 justify-center">
                {destinations.map((dest) => (
                  <span
                    key={dest}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-columbia-100 text-charcoal-500"
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-platinum-500" size={20} />
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
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isMultiDestination && destinationInput.trim()) {
                        handleAddCustomDestination();
                      } else {
                        setShowSuggestions(false);
                      }
                    }
                  }}
                  placeholder={isMultiDestination ? 'Add another destination...' : 'Search destination...'}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-platinum-200 rounded-xl focus:outline-none focus:border-coral-400 transition-colors"
                  autoFocus
                />
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-platinum-200 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                  {!isMultiDestination && (
                    <button
                      onClick={() => handleDestinationSelect({ name: 'Undecided' })}
                      className="w-full px-4 py-3 text-left hover:bg-coral-50 transition-colors border-b border-platinum-200 flex items-center gap-3"
                    >
                      <Sparkles size={18} className="text-coral-500" />
                      <div>
                        <span className="font-medium">Undecided</span>
                        <span className="text-sm text-platinum-500 ml-2">- Let us inspire you</span>
                      </div>
                    </button>
                  )}
                  {filteredDestinations.map((dest, index) => (
                    <button
                      key={index}
                      onClick={() => handleDestinationSelect(dest)}
                      className="w-full px-4 py-3 text-left hover:bg-coral-50 transition-colors flex items-center gap-3"
                    >
                      {dest.type === 'country' ? (
                        <Globe size={18} className="text-platinum-500" />
                      ) : (
                        <MapPin size={18} className="text-platinum-500" />
                      )}
                      <span>{dest.name}</span>
                      {dest.type === 'country' && (
                        <span className="text-xs text-platinum-500 ml-auto">Country</span>
                      )}
                    </button>
                  ))}
                  {/* Show hint when no matches found but user typed something */}
                  {filteredDestinations.length === 0 && (isMultiDestination ? destinationInput : formData.destination).trim().length > 1 && (
                    <div className="px-4 py-3 text-sm">
                      <p className="text-green-600 flex items-center gap-1.5">
                        <Check size={14} />
                        <span className="font-medium">"{(isMultiDestination ? destinationInput : formData.destination).trim()}"</span> — custom destination accepted!
                      </p>
                      <p className="text-platinum-500 text-xs mt-1">
                        {isMultiDestination ? 'Press Enter to add it' : 'Click Continue to proceed'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Custom destination confirmation */}
              {!isMultiDestination && formData.destination.trim().length > 1 && !showSuggestions &&
                !DESTINATIONS.some(d => d.name.toLowerCase() === formData.destination.toLowerCase()) &&
                formData.destination !== 'Undecided' && (
                <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                  <Check size={14} />
                  Custom destination accepted — we'll plan your trip!
                </p>
              )}
            </div>

            {/* Undecided Region Selection Modal */}
            {showUndecidedModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUndecidedModal(false)}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-8" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-6">
                    <Sparkles size={32} className="mx-auto mb-3 text-coral-500" />
                    <h3 className="text-2xl font-heading font-bold text-charcoal-500 mb-2">
                      Let us inspire you!
                    </h3>
                    <p className="text-platinum-600">
                      Pick a region and we'll suggest the perfect destination based on your preferences.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {REGIONS.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => handleSelectUndecided(region.id)}
                        className="p-4 rounded-xl border-2 border-platinum-200 hover:border-coral-400 hover:bg-coral-50 transition-all text-center"
                      >
                        <div className="text-3xl mb-2">{region.emoji}</div>
                        <div className="font-bold text-sm text-charcoal-500">{region.name}</div>
                        <div className="text-xs text-platinum-500 mt-1">{region.description}</div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center border-t border-platinum-200 pt-4">
                    <p className="text-sm text-platinum-600 mb-3">Or browse curated itineraries for inspiration</p>
                    <Link to="/atlas" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-platinum-200 hover:bg-platinum-300 text-charcoal-500 font-medium text-sm transition-colors">
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-columbia-100">
              <Plane size={40} className="text-columbia-700" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              Where are you traveling from?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
              This helps us plan transport, arrival logistics, and your first-day schedule.
            </p>

            {/* Origin input with autocomplete */}
            <div className="max-w-lg mx-auto relative mb-8" ref={originRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-platinum-500" size={20} />
                <input
                  type="text"
                  value={formData.tripOrigin}
                  onChange={(e) => handleInputChange('tripOrigin', e.target.value)}
                  onFocus={() => setShowOriginSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setShowOriginSuggestions(false);
                    }
                  }}
                  placeholder="Your home city..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-platinum-200 rounded-xl focus:outline-none focus:border-coral-400 transition-colors"
                  autoFocus
                />
              </div>

              {showOriginSuggestions && filteredOrigins.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-platinum-200 overflow-hidden z-50 max-h-[250px] overflow-y-auto">
                  {filteredOrigins.map((dest, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleInputChange('tripOrigin', dest.name);
                        setShowOriginSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-coral-50 transition-colors flex items-center gap-3"
                    >
                      {dest.type === 'country' ? (
                        <Globe size={18} className="text-platinum-500" />
                      ) : (
                        <MapPin size={18} className="text-platinum-500" />
                      )}
                      <span>{dest.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom origin confirmation */}
              {formData.tripOrigin.trim().length > 1 && !showOriginSuggestions &&
                !DESTINATIONS.some(d => d.name.toLowerCase() === formData.tripOrigin.toLowerCase()) && (
                <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                  <Check size={14} />
                  Custom origin accepted
                </p>
              )}
            </div>

            {/* Travel mode selection */}
            <h3 className="text-lg font-heading font-bold text-charcoal-500 mb-4">
              How do you want to get there?
            </h3>
            <p className="text-platinum-600 mb-6 text-sm">Optional — helps us plan transport segments</p>

            <div className="max-w-2xl mx-auto grid grid-cols-4 gap-3">
              {TRAVEL_MODE_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('travelMode', formData.travelMode === option.value ? '' : option.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.travelMode === option.value
                        ? 'border-coral-400 bg-coral-50 scale-105'
                        : 'border-platinum-200 hover:border-coral-300 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-columbia-100">
              <Calendar size={40} className="text-columbia-700" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              When are you traveling?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
              Set your trip length and dates. Flexible dates give us more room to optimize.
            </p>

            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-white rounded-xl p-6 border border-platinum-200">
                <label className="block text-sm font-medium text-charcoal-500 mb-3">
                  How many days?
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('tripLength', Math.max(1, formData.tripLength - 1))}
                    className="w-12 h-12 rounded-full bg-platinum-200 hover:bg-platinum-300 flex items-center justify-center text-2xl transition-colors"
                  >
                    -
                  </button>
                  <div className="text-5xl font-bold text-columbia-700">
                    {formData.tripLength}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('tripLength', Math.min(30, formData.tripLength + 1))}
                    className="w-12 h-12 rounded-full bg-platinum-200 hover:bg-platinum-300 flex items-center justify-center text-2xl transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-platinum-500 mt-2">days</p>
              </div>

              <label className="flex items-center justify-center gap-3 cursor-pointer p-4 bg-white rounded-xl border border-platinum-200">
                <input
                  type="checkbox"
                  checked={formData.flexibleDates}
                  onChange={(e) => handleInputChange('flexibleDates', e.target.checked)}
                  className="w-5 h-5 text-coral-500 rounded focus:ring-2 focus:ring-coral-400"
                />
                <span className="text-charcoal-500">My dates are flexible</span>
              </label>

              {!formData.flexibleDates && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-platinum-200">
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleInputChange('startDate', date)}
                      className="w-full px-4 py-3 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
                      placeholderText="Select date"
                      minDate={new Date()}
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-platinum-200">
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      End Date
                    </label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleInputChange('endDate', date)}
                      className="w-full px-4 py-3 border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
                      placeholderText="Select date"
                      minDate={formData.startDate || new Date()}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-naples-50">
              <Gauge size={40} className="text-naples-400" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              What's your travel pace?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
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
                      ? 'border-coral-400 bg-coral-50 scale-105'
                      : 'border-platinum-200 hover:border-coral-300 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.emoji}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {formData.travelPace && (
              <div className="mt-6 p-4 bg-coral-50 rounded-xl max-w-lg mx-auto">
                <p className="text-sm text-coral-900">
                  <strong>{TRAVEL_PACE_OPTIONS.find(o => o.value === formData.travelPace)?.label}:</strong>{' '}
                  {TRAVEL_PACE_OPTIONS.find(o => o.value === formData.travelPace)?.description}
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-columbia-100">
              <Users size={40} className="text-columbia-700" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              What kind of traveler are you?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
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
                      ? 'border-coral-400 bg-coral-50'
                      : 'border-platinum-200 hover:border-coral-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{profile.emoji}</div>
                    <div className="flex-1">
                      <div className="font-heading font-bold mb-1">{profile.title}</div>
                      <div className="text-sm text-platinum-600">{profile.description}</div>
                    </div>
                    {formData.travelerProfiles.includes(profile.id) && (
                      <div className="w-6 h-6 rounded-full bg-coral-400 text-white flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {formData.travelerProfiles.length > 0 && (
              <div className="mt-6 p-4 bg-coral-50 rounded-xl max-w-lg mx-auto">
                <p className="text-sm text-coral-900">
                  <strong>Selected:</strong> {formData.travelerProfiles.length} profile{formData.travelerProfiles.length > 1 ? 's' : ''}
                  {formData.travelerProfiles.length > 4 && (
                    <span className="text-red-600 ml-2">(Maximum 4 profiles)</span>
                  )}
                </p>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-naples-50">
              <DollarSign size={40} className="text-naples-400" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              What's your budget?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
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
                      ? 'border-coral-400 bg-coral-50 scale-105'
                      : 'border-platinum-200 hover:border-coral-300 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{option.emoji}</div>
                  <div className="text-2xl font-bold mb-1">{option.symbol}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {formData.budget && (
              <div className="mt-6 p-4 bg-coral-50 rounded-xl max-w-lg mx-auto">
                <p className="text-sm text-coral-900">
                  <strong>{BUDGET_OPTIONS.find(o => o.value === formData.budget)?.label}:</strong>{' '}
                  {BUDGET_OPTIONS.find(o => o.value === formData.budget)?.description}
                </p>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-naples-50">
              <Sparkles size={48} className="text-naples-400" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-charcoal-500 mb-3">
              Ready to create your trip?
            </h2>
            <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
              Review your preferences and we'll build your itinerary.
            </p>

            {/* Summary */}
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-platinum-200 p-6 text-left mb-8">
              <h3 className="font-heading font-bold text-lg mb-4 text-charcoal-500">Trip Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-platinum-500" />
                  <span className="text-charcoal-500 font-medium">
                    {formData.destination}
                    {formData.destination === 'Undecided' && formData.region && (
                      <span className="text-sm text-platinum-500 ml-2">
                        ({REGIONS.find(r => r.id === formData.region)?.name || formData.region})
                      </span>
                    )}
                  </span>
                </div>
                {formData.tripOrigin && (
                  <div className="flex items-center gap-3">
                    <Plane size={18} className="text-platinum-500" />
                    <span className="text-charcoal-500">From: {formData.tripOrigin}</span>
                    {formData.travelMode && (
                      <span className="text-xs px-2 py-1 rounded-full bg-platinum-200 text-charcoal-400 capitalize">
                        {TRAVEL_MODE_OPTIONS.find(o => o.value === formData.travelMode)?.emoji} {formData.travelMode}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-platinum-500" />
                  <span className="text-charcoal-500">{formData.tripLength} days {formData.flexibleDates ? '(flexible)' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Gauge size={18} className="text-platinum-500" />
                  <span className="text-charcoal-500 capitalize">{formData.travelPace} pace</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign size={18} className="text-platinum-500" />
                  <span className="text-charcoal-500 capitalize">{formData.budget} budget</span>
                </div>
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-platinum-500 mt-1" />
                  <div className="flex flex-wrap gap-2">
                    {formData.travelerProfiles.map(profileId => {
                      const profile = TRAVELER_PROFILES.find(p => p.id === profileId);
                      return (
                        <span key={profileId} className="text-xs px-3 py-1 rounded-full bg-naples-50 text-naples-900">
                          {profile?.emoji} {profile?.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.04 }}
              whileTap={loading ? {} : { scale: 0.97 }}
              className="px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto disabled:opacity-50 bg-naples-400 text-charcoal-500 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={22} />
                  Build My Itinerary
                </>
              )}
            </motion.button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-naples-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProgressBar />

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-8 md:p-12 min-h-[500px] flex flex-col border border-platinum-200">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-platinum-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? 'text-platinum-400 cursor-not-allowed'
                  : 'text-charcoal-400 hover:bg-platinum-100'
              }`}
            >
              <ArrowLeft size={18} />
              Back
            </button>

            {currentStep < 7 && (
              <motion.button
                onClick={handleNext}
                disabled={!canProceed()}
                whileHover={canProceed() ? { scale: 1.03 } : {}}
                whileTap={canProceed() ? { scale: 0.97 } : {}}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  canProceed()
                    ? 'bg-naples-400 text-charcoal-500 hover:bg-naples-500'
                    : 'bg-platinum-200 text-platinum-500'
                }`}
              >
                Continue
                <ArrowRight size={18} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateItineraryPage;

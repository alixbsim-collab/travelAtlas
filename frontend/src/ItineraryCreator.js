import React, { useState } from 'react';

const profiles = [
  'The Active Globetrotter',
  'The Nature Lover',
  'The Beach Bum',
  'The Cultural Explorer',
  'The Backpacker',
  'The Wellness Traveler',
  'The Digital Nomad',
  'The Off-the-Grid Traveler',
  'The Van Lifer / Overlander',
  'The Eco-Conscious Traveler',
];

const mockSuggestions = (destination, profile) => {
  if (!destination || !profile) return null;
  return [
    `Day 1: Arrive in ${destination}, settle in as a ${profile}`,
    `Day 2: Explore local highlights tailored for a ${profile}`,
    `Day 3: Unique experience for ${profile} in ${destination}`,
  ];
};

export default function ItineraryCreator() {
  const [destination, setDestination] = useState('');
  const [profile, setProfile] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleGenerate = () => {
    setSuggestions(mockSuggestions(destination, profile));
  };

  return (
    <div>
      <label>
        Destination:
        <input
          type="text"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          placeholder="Enter a destination"
        />
      </label>
      <br />
      <label>
        Profile:
        <select value={profile} onChange={e => setProfile(e.target.value)}>
          <option value="">Select a profile</option>
          {profiles.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <br />
      <button onClick={handleGenerate} disabled={!destination || !profile}>
        Generate Itinerary
      </button>
      <div style={{ marginTop: '1rem' }}>
        {suggestions && suggestions.length > 0 && (
          <ul>
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './Globe.css';

function Globe() {
  const [placeName, setPlaceName] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState([]);

  // Fetch all favorite places on component mount
  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!placeName.trim()) {
      setMessage({ text: 'Please enter a place name', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase
        .from('favorite_places')
        .insert([{ place_name: placeName.trim() }])
        .select();

      if (error) throw error;

      setMessage({ text: `✓ ${placeName} added to your favorites!`, type: 'success' });
      setPlaceName('');

      // Refresh the places list
      fetchPlaces();
    } catch (error) {
      console.error('Error saving place:', error);
      setMessage({
        text: `Error: ${error.message}. Please make sure you've run the SQL in supabase/seed.sql`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="globe-container">
      <div className="globe"></div>

      <div className="content-card">
        <h1>Travel Atlas</h1>
        <p>Share your favorite place in the world</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="placeName">Your Favorite Place</label>
            <input
              id="placeName"
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g., Paris, Tokyo, Bali..."
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Add to Atlas'}
          </button>
        </form>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {places.length > 0 && (
          <div className="places-list">
            <h2>Recent Favorites ({places.length})</h2>
            <ul>
              {places.slice(0, 10).map((place) => (
                <li key={place.id}>{place.place_name}</li>
              ))}
            </ul>
          </div>
        )}

        {places.length === 0 && (
          <div className="places-list">
            <p className="empty">No favorites yet. Be the first to add one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Globe;

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader } from 'lucide-react';
import Button from '../ui/Button';
import { ACTIVITY_CATEGORIES } from '../../constants/travelerProfiles';

function AIAssistant({ itinerary, onActivityDrag, onLoadItinerary }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial greeting only - itinerary is generated on the create page
    const initialMessage = {
      role: 'assistant',
      content: `Welcome! I'm your AI travel assistant. I'm here to help you customize your ${itinerary.trip_length}-day trip to ${itinerary.destination}. You can ask me to adjust activities, add specific experiences, or change the pace of your trip.`,
      timestamp: new Date()
    };

    setMessages([initialMessage]);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateInitialItinerary = async () => {
    setLoading(true);

    try {
      // Call backend API to generate itinerary
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ai/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: itinerary.id,
          destination: itinerary.destination,
          tripLength: itinerary.trip_length,
          travelPace: itinerary.travel_pace,
          budget: itinerary.budget,
          travelerProfiles: itinerary.traveler_profiles
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.itinerary.summary,
          activities: data.itinerary.activities,
          accommodations: data.itinerary.accommodations,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setSuggestedActivities(data.itinerary.activities);
      } else {
        throw new Error(data.error || 'Failed to generate itinerary');
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm having trouble generating your itinerary right now. Please try asking me to adjust specific parts of your trip.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Call backend API for AI response
      const apiUrl = process.env.REACT_APP_API_URL || 'https://travel-atlas-api.onrender.com';
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: itinerary.id,
          message: inputMessage,
          conversationHistory: messages
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          activities: data.updatedActivities,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);

        if (data.updatedActivities) {
          setSuggestedActivities(data.updatedActivities);
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I couldn't process that request. Please try rephrasing your question.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, activity) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(activity));
  };

  const getCategoryColor = (category) => {
    const cat = ACTIVITY_CATEGORIES.find(c => c.value === category);
    return cat?.color || '#71717A';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-secondary-600">
        <div className="flex items-center gap-2 text-white">
          <Sparkles size={24} />
          <h2 className="text-xl font-heading font-bold">AI Travel Assistant</h2>
        </div>
        <p className="text-sm text-white opacity-90 mt-1">
          Ask me to adjust your itinerary or add specific activities
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-charcoal'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Activity Cards */}
              {message.activities && message.activities.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-bold mb-2">Suggested Activities:</p>
                  {message.activities.slice(0, 5).map((activity, actIdx) => (
                    <div
                      key={actIdx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, activity)}
                      className="bg-white text-neutral-charcoal p-3 rounded-lg border-2 border-dashed border-neutral-300 cursor-move hover:border-primary-500 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {ACTIVITY_CATEGORIES.find(c => c.value === activity.category)?.emoji || '📍'}
                          </span>
                          <h4 className="font-bold text-sm">{activity.title}</h4>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full text-white font-medium"
                          style={{ backgroundColor: getCategoryColor(activity.category) }}
                        >
                          Day {activity.day_number}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-warm-gray mb-2">{activity.description}</p>

                      <div className="flex items-center justify-between text-xs text-neutral-warm-gray">
                        <span>📍 {activity.location}</span>
                        <span>⏱️ {activity.duration_minutes} min</span>
                        {activity.estimated_cost_min && (
                          <span>
                            💰 ${activity.estimated_cost_min}
                            {activity.estimated_cost_max && `-$${activity.estimated_cost_max}`}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-primary-600 font-medium">
                        ⬆️ Drag to add to your itinerary
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs opacity-75 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" size={20} />
                <span className="text-sm text-neutral-warm-gray">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preload Button */}
      {suggestedActivities.length > 0 && (
        <div className="p-3 border-t border-neutral-200 bg-neutral-50">
          <Button
            onClick={() => onLoadItinerary(suggestedActivities)}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <Sparkles size={16} />
            Preload Suggested Itinerary
          </Button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything... (e.g., 'Make it more relaxed' or 'Add more beach time')"
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !inputMessage.trim()} className="gap-2">
            <Send size={18} />
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInputMessage('Make it more chill')}
            className="text-xs px-3 py-1 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
          >
            Make it more chill
          </button>
          <button
            type="button"
            onClick={() => setInputMessage('Add more cultural spots')}
            className="text-xs px-3 py-1 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
          >
            Add more cultural spots
          </button>
          <button
            type="button"
            onClick={() => setInputMessage('Replace day 3 with a beach day')}
            className="text-xs px-3 py-1 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
          >
            Replace with beach day
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIAssistant;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Travel Atlas API is running' });
});

// Example API endpoint
app.get('/api/destinations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('*');

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRAVEL DESIGNER API ENDPOINTS
// ============================================

// AI Itinerary Generation
app.post('/api/ai/generate-itinerary', async (req, res) => {
  try {
    const { itineraryId, destination, tripLength, travelPace, budget, travelerProfiles } = req.body;

    // Use OpenAI if API key is configured, otherwise fall back to mock
    if (process.env.OPENAI_API_KEY) {
      const generatedItinerary = await generateOpenAIItinerary({
        destination,
        tripLength,
        travelPace,
        budget,
        travelerProfiles
      });

      res.json({
        success: true,
        itinerary: generatedItinerary
      });
    } else {
      // Fallback to mock for testing without API key
      console.warn('OPENAI_API_KEY not set, using mock responses');
      const generatedItinerary = generateMockItinerary({
        destination,
        tripLength,
        travelPace,
        budget,
        travelerProfiles
      });

      res.json({
        success: true,
        itinerary: generatedItinerary
      });
    }
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { itineraryId, message, conversationHistory, itineraryContext } = req.body;

    // Use OpenAI if API key is configured
    if (process.env.OPENAI_API_KEY) {
      const response = await generateOpenAIChat(message, conversationHistory, itineraryContext);

      res.json({
        success: true,
        response: response.message,
        updatedActivities: response.activities
      });
    } else {
      // Fallback to mock
      console.warn('OPENAI_API_KEY not set, using mock responses');
      const response = generateMockChatResponse(message, conversationHistory);

      res.json({
        success: true,
        response: response.message,
        updatedActivities: response.activities
      });
    }
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// OPENAI INTEGRATION FUNCTIONS
// ============================================

async function generateOpenAIItinerary({ destination, tripLength, travelPace, budget, travelerProfiles }) {
  const activitiesPerDay = {
    'relaxed': 2,
    'moderate': 3,
    'balanced': 4,
    'active': 5,
    'packed': 6
  };

  const dailyActivities = activitiesPerDay[travelPace] || 4;

  const prompt = `You are an expert travel planner. Create a detailed ${tripLength}-day itinerary for ${destination}.

TRAVEL PREFERENCES:
- Travel Pace: ${travelPace} (${dailyActivities} activities per day)
- Budget Level: ${budget}
- Traveler Profiles: ${travelerProfiles.join(', ')}

REQUIREMENTS:
1. Generate ${tripLength} days of activities
2. Each day should have approximately ${dailyActivities} activities
3. Activities must match the traveler profiles (e.g., ${travelerProfiles[0]} would enjoy specific types of activities)
4. Consider the ${budget} budget when suggesting activities and their costs
5. Include diverse categories: food, culture, nature, adventure, relaxation, etc.
6. IMPORTANT: Include real, specific locations with approximate coordinates
7. Assign time_of_day for each activity (morning, afternoon, evening, night, or all-day)

FORMAT YOUR RESPONSE AS JSON:
{
  "summary": "A 2-3 sentence overview of the itinerary highlighting the best experiences",
  "activities": [
    {
      "day_number": 1,
      "position": 0,
      "title": "Activity name (be specific, e.g., 'Visit Senso-ji Temple' not 'Temple visit')",
      "description": "What you'll do, what makes it special, and why it matches the traveler profile",
      "location": "Specific place name and area (e.g., 'Asakusa, Tokyo' or 'Piazza del Duomo, Milan')",
      "category": "food|culture|nature|adventure|relaxation|shopping|nightlife|transport|other",
      "duration_minutes": 120,
      "estimated_cost_min": 20,
      "estimated_cost_max": 50,
      "time_of_day": "morning|afternoon|evening|night|all-day",
      "latitude": 35.7148,
      "longitude": 139.7967
    }
  ],
  "accommodations": [
    {
      "name": "Specific hotel/hostel/airbnb name or area recommendation",
      "type": "hotel|hostel|airbnb|guesthouse|resort|camping|other",
      "location": "Neighborhood name in ${destination}",
      "price_per_night": 80,
      "latitude": 35.6812,
      "longitude": 139.7671
    }
  ]
}

CRITICAL: Use real coordinates for ${destination} landmarks. Research actual latitude/longitude values.
Create an amazing, personalized itinerary!`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert travel planner who creates personalized, detailed itineraries. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 4000
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result;
}

async function generateOpenAIChat(message, conversationHistory, itineraryContext) {
  // Check if user is asking for activity suggestions
  const needsActivities = message.toLowerCase().match(/add|suggest|recommend|more|create|plan|itinerary|activities|day/);

  if (needsActivities) {
    // Generate activity suggestions with structured response
    const messages = [
      {
        role: "system",
        content: `You are a travel planning assistant. The user is planning a trip to ${itineraryContext?.destination || 'their destination'}.
When they ask for activity suggestions, respond with:
1. A friendly message explaining what you're suggesting
2. A JSON array of 2-4 specific activities that match their request

Always respond in this exact format:
{
  "message": "Your friendly response text here",
  "activities": [
    {
      "day_number": 1,
      "position": 0,
      "title": "Specific activity name",
      "description": "Detailed description",
      "location": "Specific place with area",
      "category": "food|culture|nature|adventure|relaxation|shopping|nightlife|other",
      "duration_minutes": 120,
      "estimated_cost_min": 10,
      "estimated_cost_max": 30,
      "time_of_day": "morning|afternoon|evening|night|all-day",
      "latitude": 0.0,
      "longitude": 0.0
    }
  ]
}`
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3);
      messages.push(...recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }

    messages.push({
      role: "user",
      content: `${message}\n\nContext: ${itineraryContext?.tripLength || 7}-day trip, ${itineraryContext?.budget || 'medium'} budget, ${itineraryContext?.travelPace || 'balanced'} pace.`
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1500
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      message: result.message || completion.choices[0].message.content,
      activities: result.activities || []
    };
  } else {
    // Simple conversational response
    const messages = [
      {
        role: "system",
        content: "You are a friendly travel planning assistant. Answer questions about travel, give advice, and help with itinerary planning. Be concise and helpful."
      }
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      messages.push(...recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }

    messages.push({
      role: "user",
      content: message
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      message: completion.choices[0].message.content,
      activities: []
    };
  }
}

// ============================================
// MOCK FUNCTIONS (FALLBACK)
// ============================================

// Helper function to generate mock itinerary
function generateMockItinerary({ destination, tripLength, travelPace, budget, travelerProfiles }) {
  const activitiesPerDay = {
    'relaxed': 2,
    'moderate': 3,
    'balanced': 4,
    'active': 5,
    'packed': 6
  };

  const dailyActivities = activitiesPerDay[travelPace] || 4;

  const summary = `I've created a ${tripLength}-day itinerary for ${destination} tailored to your ${travelPace} pace and ${budget} budget. This plan includes ${dailyActivities} activities per day, focusing on ${travelerProfiles.join(', ')} experiences.`;

  const activities = [];
  const sampleActivities = generateSampleActivities(destination, travelerProfiles, budget);

  for (let day = 1; day <= tripLength; day++) {
    for (let i = 0; i < dailyActivities; i++) {
      const activity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
      activities.push({
        ...activity,
        day_number: day,
        position: i
      });
    }
  }

  const accommodations = [
    {
      name: `${destination} Central Hotel`,
      type: budget === 'low' ? 'hostel' : budget === 'luxury' ? 'resort' : 'hotel',
      location: `${destination} City Center`,
      price_per_night: budget === 'low' ? 30 : budget === 'medium' ? 80 : budget === 'high' ? 150 : 300
    }
  ];

  return {
    summary,
    activities,
    accommodations
  };
}

// Helper function to generate sample activities
function generateSampleActivities(destination, profiles, budget) {
  const baseActivities = [
    {
      title: `Explore ${destination} Old Town`,
      description: 'Wander through historic streets and discover local culture',
      location: `${destination} Old Town`,
      category: 'culture',
      duration_minutes: 180,
      estimated_cost_min: 0,
      estimated_cost_max: 20
    },
    {
      title: 'Local Food Tour',
      description: 'Taste authentic local cuisine and street food',
      location: `${destination} Food District`,
      category: 'food',
      duration_minutes: 120,
      estimated_cost_min: 30,
      estimated_cost_max: 60
    },
    {
      title: 'Visit Main Museum',
      description: 'Discover the history and art of the region',
      location: `${destination} National Museum`,
      category: 'culture',
      duration_minutes: 120,
      estimated_cost_min: 10,
      estimated_cost_max: 25
    },
    {
      title: 'Sunset at Viewpoint',
      description: 'Watch a stunning sunset from the best viewpoint',
      location: `${destination} Scenic Viewpoint`,
      category: 'nature',
      duration_minutes: 90,
      estimated_cost_min: 0,
      estimated_cost_max: 10
    },
    {
      title: 'Local Market Visit',
      description: 'Browse fresh produce, crafts, and local goods',
      location: `${destination} Central Market`,
      category: 'shopping',
      duration_minutes: 90,
      estimated_cost_min: 10,
      estimated_cost_max: 50
    }
  ];

  // Add profile-specific activities
  if (profiles.includes('nature-lover') || profiles.includes('active-globetrotter')) {
    baseActivities.push({
      title: 'Hiking Trail',
      description: 'Scenic hiking with beautiful nature views',
      location: `${destination} National Park`,
      category: 'adventure',
      duration_minutes: 240,
      estimated_cost_min: 0,
      estimated_cost_max: 15
    });
  }

  if (profiles.includes('beach-bum')) {
    baseActivities.push({
      title: 'Beach Day',
      description: 'Relax on the beach and enjoy water activities',
      location: `${destination} Beach`,
      category: 'relaxation',
      duration_minutes: 240,
      estimated_cost_min: 0,
      estimated_cost_max: 30
    });
  }

  if (profiles.includes('wellness')) {
    baseActivities.push({
      title: 'Yoga & Meditation Session',
      description: 'Start your day with wellness activities',
      location: `${destination} Wellness Center`,
      category: 'relaxation',
      duration_minutes: 90,
      estimated_cost_min: 20,
      estimated_cost_max: 50
    });
  }

  return baseActivities;
}

// Helper function for mock chat responses
function generateMockChatResponse(message, history) {
  const lowerMessage = message.toLowerCase();

  let response = "I understand you'd like to adjust your itinerary. ";
  let activities = null;

  if (lowerMessage.includes('chill') || lowerMessage.includes('relax')) {
    response += "I'll make the itinerary more relaxed by reducing activities and adding more downtime.";
  } else if (lowerMessage.includes('cultural') || lowerMessage.includes('culture')) {
    response += "I'll add more cultural spots like museums, historical sites, and local experiences.";
  } else if (lowerMessage.includes('beach')) {
    response += "I'll incorporate more beach time and coastal activities into your plan.";
  } else if (lowerMessage.includes('food')) {
    response += "I'll add more food experiences including restaurants, food tours, and cooking classes.";
  } else {
    response += "I can help you customize your itinerary. Try asking me to add specific types of activities or adjust the pace.";
  }

  return { message: response, activities };
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

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

// Supabase client initialization - use service role key to bypass RLS for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
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

    let generatedItinerary;

    // Use OpenAI if API key is configured, otherwise fall back to mock
    if (process.env.OPENAI_API_KEY) {
      generatedItinerary = await generateOpenAIItinerary({
        destination,
        tripLength,
        travelPace,
        budget,
        travelerProfiles
      });
    } else {
      // Fallback to mock for testing without API key
      console.warn('OPENAI_API_KEY not set, using mock responses');
      generatedItinerary = generateMockItinerary({
        destination,
        tripLength,
        travelPace,
        budget,
        travelerProfiles
      });
    }

    // If itineraryId provided, insert activities directly into Supabase
    if (itineraryId && generatedItinerary.activities && generatedItinerary.activities.length > 0) {
      console.log(`Inserting ${generatedItinerary.activities.length} activities for itinerary ${itineraryId}`);

      // Valid categories for database constraint
      const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

      const activitiesToInsert = generatedItinerary.activities.map((activity, index) => ({
        itinerary_id: itineraryId,
        day_number: activity.day_number,
        position: index,
        title: activity.title,
        description: activity.description,
        location: activity.location,
        // Validate category - default to 'other' if invalid
        category: validCategories.includes(activity.category) ? activity.category : 'other',
        duration_minutes: activity.duration_minutes,
        estimated_cost_min: activity.estimated_cost_min,
        estimated_cost_max: activity.estimated_cost_max,
        latitude: activity.latitude,
        longitude: activity.longitude,
        time_of_day: activity.time_of_day
      }));

      const { error: activitiesError } = await supabase
        .from('activities')
        .insert(activitiesToInsert);

      if (activitiesError) {
        console.error('Error inserting activities:', activitiesError);
      } else {
        console.log('Activities inserted successfully');
      }

      // Insert accommodations if any
      if (generatedItinerary.accommodations && generatedItinerary.accommodations.length > 0) {
        const accommodationsToInsert = generatedItinerary.accommodations.map(acc => ({
          itinerary_id: itineraryId,
          name: acc.name,
          type: acc.type,
          location: acc.location,
          price_per_night: acc.price_per_night,
          latitude: acc.latitude,
          longitude: acc.longitude
        }));

        const { error: accError } = await supabase
          .from('accommodations')
          .insert(accommodationsToInsert);

        if (accError) {
          console.error('Error inserting accommodations:', accError);
        }
      }
    }

    res.json({
      success: true,
      itinerary: generatedItinerary
    });
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
    'balanced': 3,
    'active': 4,
    'packed': 4
  };

  // Limit activities for longer trips to avoid token limits
  const dailyActivities = Math.min(activitiesPerDay[travelPace] || 3, tripLength > 5 ? 2 : 3);
  const limitedTripLength = Math.min(tripLength, 7); // Cap at 7 days for API response

  const totalActivities = dailyActivities * limitedTripLength;

  // Valid categories that match database constraint
  const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'other'];

  const prompt = `Create a ${limitedTripLength}-day trip to ${destination}. Budget: ${budget}. Style: ${travelerProfiles.join(', ')}.

IMPORTANT:
- Generate EXACTLY ${totalActivities} activities total (${dailyActivities} per day for ${limitedTripLength} days).
- Category MUST be one of: ${validCategories.join(', ')}

Return JSON:
{"summary":"1 sentence overview","activities":[${Array.from({length: limitedTripLength}, (_, day) =>
  `{"day_number":${day+1},"position":0,"title":"...","description":"20 words max","location":"Place","category":"food|nature|culture|adventure|relaxation|shopping|nightlife|other","duration_minutes":90,"estimated_cost_min":0,"estimated_cost_max":20,"time_of_day":"morning|afternoon|evening","latitude":0.0,"longitude":0.0}`
).join(',')}],"accommodations":[{"name":"Hotel","type":"hotel","location":"Area","price_per_night":80,"latitude":0.0,"longitude":0.0}]}

Fill in real activities for days 1-${limitedTripLength}. Use real ${destination} coordinates. Keep descriptions under 20 words.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert travel planner who creates personalized, detailed itineraries. Always respond with valid JSON. Keep responses concise to avoid truncation."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 8000
  });

  const content = completion.choices[0].message.content;

  if (!content || content.trim() === '') {
    throw new Error('OpenAI returned empty response');
  }

  try {
    const result = JSON.parse(content);
    return result;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('OpenAI returned invalid JSON: ' + parseError.message);
  }
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

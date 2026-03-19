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
    const { itineraryId, destination, tripLength, travelPace, budget, travelerProfiles, region, tripOrigin, travelMode, isMultiDestination } = req.body;

    let generatedItinerary;
    let finalDestination = destination;

    // Handle "Undecided" destination - AI picks based on preferences
    if (destination.toLowerCase() === 'undecided') {
      console.log('User selected Undecided - AI will pick destination based on preferences');
      console.log('Preferences:', { tripLength, travelPace, budget, travelerProfiles });

      if (process.env.OPENAI_API_KEY) {
        try {
          finalDestination = await pickDestinationForUser({ tripLength, travelPace, budget, travelerProfiles, region, isMultiDestination });
          console.log(`AI picked destination: ${finalDestination}`);

          // Validate the destination was picked
          if (!finalDestination || finalDestination.toLowerCase().includes('undecided')) {
            // Fallback destinations based on traveler profile
            const fallbacks = {
              'cultural-explorer': 'Rome, Italy',
              'foodie': 'Tokyo, Japan',
              'adventure-seeker': 'Queenstown, New Zealand',
              'beach-bum': 'Bali, Indonesia',
              'nature-lover': 'Reykjavik, Iceland',
              'nightlife': 'Barcelona, Spain',
              'luxury': 'Dubai, UAE',
              'budget': 'Bangkok, Thailand',
              'wellness': 'Ubud, Bali',
              'family': 'Orlando, USA'
            };
            const primaryProfile = travelerProfiles[0] || 'cultural-explorer';
            finalDestination = fallbacks[primaryProfile] || 'Paris, France';
            console.log(`Used fallback destination: ${finalDestination}`);
          }

          // Update the itinerary with the chosen destination
          if (itineraryId) {
            console.log(`Updating itinerary ${itineraryId} with destination: ${finalDestination}`);
            const { error: updateError } = await supabase
              .from('itineraries')
              .update({
                destination: finalDestination,
                title: `${finalDestination} - ${tripLength} days`
              })
              .eq('id', itineraryId);

            if (updateError) {
              console.error('Error updating itinerary destination:', updateError);
            } else {
              console.log('Itinerary destination updated successfully');
            }
          }
        } catch (pickError) {
          console.error('Error picking destination:', pickError);
          // Use fallback
          finalDestination = 'Paris, France';
          console.log(`Error occurred, using fallback: ${finalDestination}`);
        }
      } else {
        // No OpenAI key, use fallback
        finalDestination = 'Paris, France';
        console.log(`No OpenAI key, using fallback: ${finalDestination}`);
      }
    }

    // Use OpenAI if API key is configured, otherwise fall back to mock
    if (process.env.OPENAI_API_KEY) {
      generatedItinerary = await generateOpenAIItinerary({
        destination: finalDestination,
        tripLength,
        travelPace,
        budget,
        travelerProfiles,
        tripOrigin,
        travelMode
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

      // Delete any existing activities first (handles regeneration/preload)
      await supabase.from('activities').delete().eq('itinerary_id', itineraryId);


      // Valid categories for database constraint
      const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

      const validTimesOfDay = ['morning', 'afternoon', 'evening', 'night', 'all-day'];

      const buildActivityRow = (activity, index, includeCityName) => {
        // Sanitize duration_minutes: must be > 0
        let duration = parseInt(activity.duration_minutes) || 60;
        if (duration <= 0) duration = 60;

        // Sanitize time_of_day: must be a valid enum value
        const timeOfDay = validTimesOfDay.includes(activity.time_of_day)
          ? activity.time_of_day
          : 'morning';

        // Sanitize costs: ensure max >= min, both >= 0
        const costMin = Math.max(0, parseFloat(activity.estimated_cost_min) || 0);
        let costMax = Math.max(0, parseFloat(activity.estimated_cost_max) || 0);
        if (costMax < costMin) costMax = costMin;

        const row = {
          itinerary_id: itineraryId,
          day_number: activity.day_number || 1,
          position: index,
          title: activity.title || 'Untitled Activity',
          description: activity.description || '',
          location: activity.location || '',
          category: validCategories.includes(activity.category) ? activity.category : 'other',
          duration_minutes: duration,
          estimated_cost_min: costMin,
          estimated_cost_max: costMax,
          latitude: activity.latitude || null,
          longitude: activity.longitude || null,
          time_of_day: timeOfDay,
        };
        if (includeCityName) {
          row.city_name = activity.city_name || null;
        }
        return row;
      };

      // Insert activities and accommodations in parallel
      const activitiesToInsert = generatedItinerary.activities.map((a, i) => buildActivityRow(a, i, true));

      const dbInserts = [
        supabase.from('activities').insert(activitiesToInsert).then(({ error }) => {
          if (error) {
            console.error('Error inserting activities (with city_name):', error.message);
            // Retry without city_name in case the column doesn't exist yet
            const fallback = generatedItinerary.activities.map((a, i) => buildActivityRow(a, i, false));
            return supabase.from('activities').insert(fallback).then(({ error: retryErr }) => {
              if (retryErr) console.error('Error inserting activities (retry):', retryErr);
              else console.log('Activities inserted successfully (without city_name)');
            });
          } else {
            console.log('Activities inserted successfully');
          }
        })
      ];

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
        dbInserts.push(
          supabase.from('accommodations').insert(accommodationsToInsert).then(({ error }) => {
            if (error) console.error('Error inserting accommodations:', error);
          })
        );
      }

      await Promise.all(dbInserts);
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
    const { itineraryId, message, conversationHistory, itineraryContext, currentActivities } = req.body;

    // Use OpenAI if API key is configured
    if (process.env.OPENAI_API_KEY) {
      const response = await generateOpenAIChat(message, conversationHistory, itineraryContext, currentActivities);

      // If the AI returned an action, execute it on the database
      if (response.action && itineraryId) {
        await executeAIAction(itineraryId, response.action, itineraryContext);
      }

      res.json({
        success: true,
        response: response.message,
        updatedActivities: response.activities,
        action: response.action || null
      });
    } else {
      // Fallback to mock
      console.warn('OPENAI_API_KEY not set, using mock responses');
      const response = generateMockChatResponse(message, conversationHistory);

      res.json({
        success: true,
        response: response.message,
        updatedActivities: response.activities,
        action: null
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

// Pick a destination for users who selected "Undecided"
async function pickDestinationForUser({ tripLength, travelPace, budget, travelerProfiles, region, isMultiDestination }) {
  const budgetDescriptions = {
    'budget': 'budget-friendly, affordable destinations',
    'medium': 'moderately priced destinations with good value',
    'premium': 'upscale destinations with premium experiences',
    'luxury': 'luxury destinations with high-end experiences'
  };

  const paceDescriptions = {
    'relaxed': 'relaxing, laid-back destinations perfect for unwinding',
    'moderate': 'destinations with a good mix of activities and relaxation',
    'balanced': 'versatile destinations offering diverse experiences',
    'active': 'exciting destinations with plenty to see and do',
    'packed': 'action-packed destinations for adventure seekers'
  };

  const regionConstraint = region ? `\nIMPORTANT: The destination(s) MUST be in the ${region.replace(/-/g, ' ')} region.` : '';

  const regionExamples = {
    'europe': 'Europe (e.g., Paris, Rome, Barcelona, Prague, Lisbon, Athens, Amsterdam)',
    'north-america': 'North America (e.g., New York, Mexico City, Vancouver, San Francisco, Montreal)',
    'south-america': 'South America (e.g., Buenos Aires, Rio de Janeiro, Lima, Bogota, Santiago)',
    'south-east-asia': 'South & East Asia (e.g., Tokyo, Bangkok, Bali, Seoul, Singapore, Kyoto)',
    'north-central-asia': 'North & Central Asia (e.g., Istanbul, Dubai, Marrakech, Jaipur, Tbilisi)',
    'central-asia': 'North & Central Asia (e.g., Istanbul, Dubai, Marrakech, Jaipur, Tbilisi)',
    'africa': 'Africa (e.g., Cape Town, Marrakech, Nairobi, Cairo, Zanzibar, Accra)',
    'oceania': 'Oceania (e.g., Sydney, Auckland, Melbourne, Queenstown, Fiji)'
  };

  // Suggest multiple destinations for multi-dest requests or longer trips (8+ days)
  const isMultiCity = isMultiDestination || tripLength >= 8;
  const numCities = isMultiCity ? Math.max(2, Math.min(Math.floor(tripLength / 3), 4)) : 1;

  const profileDesc = describeProfiles(travelerProfiles);

  let prompt;
  if (isMultiCity) {
    prompt = `Based on these travel preferences, suggest ${numCities} destinations for a ${tripLength}-day multi-city trip:

Traveler: ${profileDesc || travelerProfiles.join(', ')}
Budget: ${budgetDescriptions[budget] || budget}
Pace: ${paceDescriptions[travelPace] || travelPace}
Trip Length: ${tripLength} days
${region ? `Region: ${regionExamples[region] || region}` : ''}
${regionConstraint}

RULES:
- Pick ${numCities} cities that are geographically close enough to travel between reasonably
- Cities should complement each other (don't pick 3 beach towns)
- Order them in a logical travel sequence
- CRITICAL: Match destinations to the traveler style. Van lifers/road trippers need scenic driving routes. Adventure seekers need outdoor hubs. Beach lovers need coastal towns. Cultural explorers need history-rich cities.

Return ONLY the destinations separated by commas in format "City1, City2, City3" (e.g., "Tokyo, Kyoto, Osaka" or "Paris, Barcelona, Rome"). No country names, no other text.`;
  } else {
    prompt = `Based on these travel preferences, suggest ONE perfect destination (city and country):

Traveler: ${profileDesc || travelerProfiles.join(', ')}
Budget: ${budgetDescriptions[budget] || budget}
Pace: ${paceDescriptions[travelPace] || travelPace}
Trip Length: ${tripLength} days
${region ? `Region: ${regionExamples[region] || region}` : ''}
${regionConstraint}

CRITICAL: The destination MUST match the traveler style:
- Van lifers/road trippers → scenic driving regions (e.g., Queenstown NZ, Iceland, Scottish Highlands, California Coast, Tasmania)
- Adventure seekers → outdoor adventure hubs (e.g., Queenstown, Interlaken, Chamonix, Costa Rica)
- Cultural explorers → history-rich cities (e.g., Rome, Kyoto, Istanbul, Cusco)
- Food lovers → culinary capitals (e.g., Tokyo, Bangkok, Barcelona, Lima)
- Beach lovers → coastal paradises (e.g., Bali, Santorini, Zanzibar, Algarve)
- Nature lovers → wilderness regions (e.g., Norway, Patagonia, New Zealand South Island, Canadian Rockies)
- Backpackers → budget-friendly hotspots (e.g., Vietnam, Guatemala, Nepal, Morocco)
- Digital nomads → nomad-friendly cities (e.g., Lisbon, Chiang Mai, Medellín, Tbilisi)

Return ONLY the destination in format "City, Country" (e.g., "Tokyo, Japan"). No other text.`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: isMultiCity
          ? "You are a travel expert. Respond with ONLY the destination names separated by commas. Nothing else."
          : "You are a travel expert. Respond with ONLY the destination name in 'City, Country' format. Nothing else."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.9,
    max_tokens: 100
  });

  const destination = completion.choices[0].message.content.trim();

  // Clean up the response - remove any quotes or extra formatting
  return destination.replace(/['"]/g, '').trim();
}

// Map traveler profile IDs to descriptions the AI can actually use
const PROFILE_DESCRIPTIONS = {
  'active-globetrotter': 'adventure-seeking, loves hiking, climbing, outdoor sports, and physical activities',
  'eco-conscious': 'environmentally responsible, prefers sustainable tourism, eco-friendly lodges, conservation experiences',
  'van-lifer': 'road-trip oriented, loves scenic drives, camping, freedom to explore, stopping at viewpoints and small towns along the way',
  'off-grid': 'seeks remote wilderness, off-the-beaten-path destinations, rugged terrain, minimal tourist crowds',
  'digital-nomad': 'remote worker, needs reliable wifi, cafés, coworking spaces, and urban conveniences',
  'wellness': 'health-focused, enjoys yoga retreats, spas, meditation, thermal baths, and mindful experiences',
  'backpacker': 'budget-conscious, stays in hostels, seeks authentic local street food, walking tours, and free attractions',
  'cultural-explorer': 'history and culture enthusiast, visits museums, temples, historical sites, traditional neighborhoods',
  'beach-bum': 'sun and sea lover, prioritizes beaches, snorkeling, surfing, coastal walks, and seaside restaurants',
  'nature-lover': 'nature enthusiast, loves national parks, wildlife, scenic hikes, waterfalls, and natural wonders',
  'family-traveler': 'traveling with family/kids, needs kid-friendly activities, safe areas, playgrounds, and comfortable transport'
};

function describeProfiles(profileIds) {
  if (!profileIds || profileIds.length === 0) return '';
  return profileIds.map(id => PROFILE_DESCRIPTIONS[id] || id).join('; ');
}

async function generateOpenAIItinerary({ destination, tripLength, travelPace, budget, travelerProfiles, tripOrigin, travelMode }) {
  const activitiesPerDay = {
    'relaxed': 2,
    'moderate': 2,
    'balanced': 3,
    'active': 4,
    'packed': 5
  };

  const paceDescription = {
    'relaxed': '1-2 activities per day, plenty of downtime',
    'moderate': '2 activities per day, balanced schedule',
    'balanced': '3 activities per day, good mix of action and rest',
    'active': '3-4 activities per day, busy but manageable',
    'packed': '4-5 activities per day, maximize every moment'
  };

  const baseDaily = activitiesPerDay[travelPace] || 3;

  const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

  const isMultiDest = destination.includes(',');
  const destinations = isMultiDest
    ? destination.split(',').map(d => d.trim()).filter(Boolean)
    : [destination];

  const cityName = isMultiDest ? destinations[0].split(',')[0].trim() : destination.split(',')[0].trim();

  // Calculate sub-destination count for single-destination long trips
  const needsSubDestinations = !isMultiDest && tripLength > 7;
  let subDestCount = 1;
  if (needsSubDestinations) {
    if (travelPace === 'packed') subDestCount = Math.max(4, Math.min(8, Math.floor(tripLength / 3)));
    else if (travelPace === 'active') subDestCount = Math.max(3, Math.min(6, Math.floor(tripLength / 4)));
    else if (travelPace === 'balanced') subDestCount = Math.max(2, Math.min(5, Math.floor(tripLength / 5)));
    else subDestCount = Math.max(2, Math.min(4, Math.floor(tripLength / 6)));
  }
  const daysPerSubDest = needsSubDestinations ? Math.floor(tripLength / subDestCount) : tripLength;

  // Split into chunks of up to 15 days for long trips
  const CHUNK_SIZE = 15;
  const chunks = [];
  for (let start = 1; start <= tripLength; start += CHUNK_SIZE) {
    chunks.push({ startDay: start, endDay: Math.min(start + CHUNK_SIZE - 1, tripLength) });
  }

  // Build activity prompt for a day range
  const buildActivitiesPrompt = (startDay, endDay) => {
    const chunkDays = endDay - startDay + 1;
    const isFirstChunk = startDay === 1;
    const isLastChunk = endDay === tripLength;
    const dayRange = startDay === 1 && endDay === tripLength
      ? `every day 1-${tripLength}`
      : `ONLY days ${startDay}-${endDay} (${chunkDays} days)`;

    const paceLine = `Pace: ${paceDescription[travelPace] || baseDaily + ' activities/day'}.`;

    // Build chunk-aware origin/departure instructions
    let travelLogistics = '';
    if (tripOrigin) {
      if (isFirstChunk && isLastChunk) {
        travelLogistics = `Traveler arrives from ${tripOrigin}${travelMode ? ` by ${travelMode}` : ''} on Day 1. Departure home ONLY on Day ${tripLength} (last day).`;
      } else if (isFirstChunk) {
        travelLogistics = `Traveler arrives from ${tripOrigin}${travelMode ? ` by ${travelMode}` : ''} on Day 1. Do NOT include any return/departure home — the trip continues after Day ${endDay}.`;
      } else if (isLastChunk) {
        travelLogistics = `CRITICAL: Day ${tripLength} is the FINAL day. Include departure/return to ${tripOrigin} ONLY on Day ${tripLength}. Do NOT include return home on any earlier day.`;
      } else {
        travelLogistics = `Do NOT include any return/departure home activities. The trip continues after Day ${endDay}.`;
      }
    }

    // Build sub-destination routing guidance for single-destination long trips
    let routeGuidance = '';
    if (needsSubDestinations) {
      // Calculate which sub-destinations fall in this chunk's day range
      const subDestsInChunk = [];
      for (let i = 0; i < subDestCount; i++) {
        const subStart = 1 + i * daysPerSubDest;
        const subEnd = i === subDestCount - 1 ? tripLength : subStart + daysPerSubDest - 1;
        if (subStart <= endDay && subEnd >= startDay) {
          subDestsInChunk.push({ index: i + 1, startDay: Math.max(subStart, startDay), endDay: Math.min(subEnd, endDay) });
        }
      }
      const segmentGuide = subDestsInChunk.map(s => `Days ${s.startDay}-${s.endDay}: Region ${s.index}`).join(', ');

      routeGuidance = `\nROUTE PLAN: This ${tripLength}-day trip must visit ${subDestCount} different regions/cities within or near ${destination}. Do NOT stay in one place the entire trip.
Segment plan: ${segmentGuide}.
Each region must be a DIFFERENT area (different city, island, or district). Move progressively — never backtrack to a previous region mid-trip.
Use city_name to indicate which specific region/city the traveler is in each day.`;

      if (travelPace === 'packed') {
        routeGuidance += `\nPACKED DISCOVERY: Maximize variety. Include diverse regions, cultural highlights, nature, unique local experiences, and different landscapes. Each region should feel completely different from the last. For ${destination}, explore multiple islands, provinces, or nearby countries if possible.`;
      } else if (travelPace === 'active') {
        routeGuidance += `\nACTIVE PACE: Include diverse regions with plenty of activities. Balance popular highlights with off-the-beaten-path discoveries.`;
      }
    }

    const profileDesc = describeProfiles(travelerProfiles);
    const qualityRules = `
QUALITY RULES:
- NEVER repeat the same location or attraction across different days. Every activity must be at a UNIQUE place.
- Group each day's activities by geographic area — all activities on the same day should be near each other. Do NOT zigzag across the city.
- Tailor activities to the traveler style: ${profileDesc || travelerProfiles.join(', ')}. Activities should strongly reflect these preferences.`;

    // Multi-destination prompt
    if (isMultiDest) {
      const daysPerDest = Math.floor(tripLength / destinations.length);
      return `${tripLength}-day trip: ${destinations.join(' → ')}. Budget: ${budget}. Traveler: ${profileDesc || travelerProfiles.join(', ')}. ${paceLine}
${travelLogistics}
Generate activities for ${dayRange}. Route: ~${daysPerDest} days per destination, in order.
Include transport between destinations. ${baseDaily} activities/day. Respect travel time.
CRITICAL: Return/departure ONLY on Day ${tripLength}. NEVER include "return home" or departure flights before the last day.
${qualityRules}
Categories: ${validCategories.join(', ')}. time_of_day: morning|afternoon|evening.
JSON: {"activities":[{"day_number":${startDay},"position":0,"title":"...","description":"short","location":"Place","city_name":"City","category":"...","duration_minutes":90,"estimated_cost_min":0,"estimated_cost_max":20,"time_of_day":"morning","latitude":0.00,"longitude":0.00}]}`;
    }

    // Single destination prompt (with sub-destination routing for long trips)
    return `${tripLength}-day trip to ${destination}. Budget: ${budget}. Traveler: ${profileDesc || travelerProfiles.join(', ')}. ${paceLine}
${travelLogistics}${routeGuidance}
Generate activities for ${dayRange}. ${baseDaily} activities/day.
CRITICAL: Return/departure ONLY on Day ${tripLength}. NEVER include "return home" or departure flights before the last day.
${qualityRules}
Categories: ${validCategories.join(', ')}. time_of_day: morning|afternoon|evening. city_name: use the ACTUAL region/city name for each day (not just "${cityName}" for every day).
JSON: {"activities":[{"day_number":${startDay},"position":0,"title":"...","description":"short","location":"Place","city_name":"ActualCityOrRegion","category":"...","duration_minutes":90,"estimated_cost_min":0,"estimated_cost_max":20,"time_of_day":"morning","latitude":0.00,"longitude":0.00}]}`;
  };

  // Structure prompt (summary + accommodations)
  const accCount = needsSubDestinations ? Math.min(subDestCount, 5) : (isMultiDest ? Math.min(destinations.length, 4) : 2);
  const structurePrompt = `${tripLength}-day trip to ${destination}. Budget: ${budget}. Style: ${travelerProfiles.join(', ')}.${needsSubDestinations ? ` The trip visits ${subDestCount} different regions/areas.` : ''}
Suggest ${accCount} accommodation options in different areas/regions of the trip.
JSON: {"summary":"1 sentence overview","accommodations":[{"name":"Hotel Name","type":"hotel","location":"Area/Region","price_per_night":80,"latitude":0.00,"longitude":0.00}]}`;

  // Fire all calls in parallel: structure + activity chunks
  console.log(`Starting parallel OpenAI calls: ${chunks.length} activity chunk(s) + 1 structure...`);

  const calls = [
    // Structure call
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Expert travel planner. Respond with valid JSON. Be concise." },
        { role: "user", content: structurePrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800
    }),
    // Activity chunk calls
    ...chunks.map(chunk => {
      const chunkDays = chunk.endDay - chunk.startDay + 1;
      const chunkTokens = Math.min(16000, 1500 + (baseDaily * chunkDays * 200));
      const isLastChunk = chunk.endDay === tripLength;
      const systemMsg = isLastChunk
        ? `Expert travel planner. Respond with valid JSON. Generate activities for EVERY day in the requested range. CRITICAL: departure/return home ONLY on the very last day (Day ${tripLength}). Never earlier. NEVER repeat the same location across different days. Group each day by geographic area. Be concise.`
        : `Expert travel planner. Respond with valid JSON. Generate activities for EVERY day in the requested range. Do NOT include any return-home or departure activities — the trip continues. NEVER repeat the same location across different days. Group each day by geographic area. Be concise.`;
      return openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: buildActivitiesPrompt(chunk.startDay, chunk.endDay) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: chunkTokens
      });
    })
  ];

  const results = await Promise.all(calls);
  console.log('All OpenAI calls completed');

  const structureContent = results[0].choices[0].message.content;
  const activityChunks = results.slice(1).map(r => r.choices[0].message.content);

  try {
    const structureResult = JSON.parse(structureContent);

    // Merge all activity chunks
    const allActivities = [];
    for (const chunkContent of activityChunks) {
      if (!chunkContent || chunkContent.trim() === '') continue;
      const parsed = JSON.parse(chunkContent);
      if (parsed.activities && Array.isArray(parsed.activities)) {
        allActivities.push(...parsed.activities);
      }
    }

    const result = {
      summary: structureResult.summary || `${tripLength}-day trip to ${destination}`,
      activities: allActivities,
      accommodations: structureResult.accommodations || []
    };

    // Validate all days are covered - fill missing days with placeholders
    if (result.activities.length > 0) {
      const daysWithActivities = new Set(result.activities.map(a => a.day_number));
      for (let day = 1; day <= tripLength; day++) {
        if (!daysWithActivities.has(day)) {
          console.warn(`Day ${day} has no activities, adding placeholder`);
          result.activities.push({
            day_number: day,
            position: 0,
            title: `Explore ${destinations[Math.min(Math.floor((day - 1) / Math.max(1, Math.floor(tripLength / destinations.length))), destinations.length - 1)]}`,
            description: 'Free time to explore at your own pace',
            location: destinations[0],
            city_name: cityName,
            category: 'other',
            duration_minutes: 240,
            estimated_cost_min: 0,
            estimated_cost_max: 50,
            time_of_day: 'morning',
            latitude: 0.0,
            longitude: 0.0
          });
        }
      }
    }

    return result;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', structureContent, activityChunks);
    throw new Error('OpenAI returned invalid JSON: ' + parseError.message);
  }
}

// Execute structural actions returned by the AI (add day, delete day, etc.)
async function executeAIAction(itineraryId, action, itineraryContext) {
  const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];
  const validTimesOfDay = ['morning', 'afternoon', 'evening', 'night', 'all-day'];

  const buildRow = (a, i) => ({
    itinerary_id: itineraryId,
    day_number: a.day_number,
    position: a.position != null ? a.position : i,
    title: a.title || 'New Activity',
    description: a.description || '',
    location: a.location || '',
    category: validCategories.includes(a.category) ? a.category : 'other',
    duration_minutes: parseInt(a.duration_minutes) || 60,
    estimated_cost_min: Math.max(0, parseFloat(a.estimated_cost_min) || 0),
    estimated_cost_max: Math.max(0, parseFloat(a.estimated_cost_max) || 0),
    latitude: a.latitude || null,
    longitude: a.longitude || null,
    time_of_day: validTimesOfDay.includes(a.time_of_day) ? a.time_of_day : 'morning',
    city_name: a.city_name || null,
  });

  try {
    if (action.type === 'add_days') {
      const insertAt = action.insert_at || (itineraryContext?.tripLength || 7) + 1; // default: append at end
      const daysToAdd = action.days_count || 1;

      console.log(`add_days: insertAt=${insertAt}, daysToAdd=${daysToAdd}, new_trip_length=${action.new_trip_length}`);

      // Step 1: Shift existing activities at or after insert_at up by daysToAdd
      const { data: laterActivities } = await supabase
        .from('activities')
        .select('id, day_number')
        .eq('itinerary_id', itineraryId)
        .gte('day_number', insertAt)
        .order('day_number', { ascending: false }); // shift from highest first to avoid conflicts

      if (laterActivities && laterActivities.length > 0) {
        for (const act of laterActivities) {
          await supabase.from('activities').update({ day_number: act.day_number + daysToAdd }).eq('id', act.id);
        }
        console.log(`Shifted ${laterActivities.length} activities from day ${insertAt}+ by +${daysToAdd}`);
      }

      // Step 2: Insert new activities
      const newActivities = (action.activities || []).map((a, i) => buildRow(a, i));

      if (newActivities.length > 0) {
        const { error } = await supabase.from('activities').insert(newActivities);
        if (error) console.error('Error inserting new day activities:', error);
        else console.log(`Inserted ${newActivities.length} activities for new day(s)`);
      } else {
        console.warn('add_days action had 0 activities to insert!');
      }

      // Step 3: Update trip_length and title
      if (action.new_trip_length) {
        const updateFields = { trip_length: action.new_trip_length };
        // Also update the title to reflect new day count
        const { data: currentItinerary } = await supabase.from('itineraries').select('title').eq('id', itineraryId).single();
        if (currentItinerary?.title) {
          updateFields.title = currentItinerary.title.replace(/\d+\s*days?/, `${action.new_trip_length} days`);
        }
        await supabase.from('itineraries').update(updateFields).eq('id', itineraryId);
      }

    } else if (action.type === 'delete_day') {
      const dayToDelete = action.day_number;
      const newTripLength = action.new_trip_length;

      console.log(`delete_day: day=${dayToDelete}, new_trip_length=${newTripLength}`);

      // Delete activities for that day
      await supabase.from('activities').delete().eq('itinerary_id', itineraryId).eq('day_number', dayToDelete);

      // Shift all activities after the deleted day down by 1
      const { data: laterActivities } = await supabase
        .from('activities')
        .select('id, day_number')
        .eq('itinerary_id', itineraryId)
        .gt('day_number', dayToDelete)
        .order('day_number', { ascending: true }); // shift from lowest first

      if (laterActivities && laterActivities.length > 0) {
        for (const act of laterActivities) {
          await supabase.from('activities').update({ day_number: act.day_number - 1 }).eq('id', act.id);
        }
      }

      // Update trip_length and title
      if (newTripLength) {
        const updateFields = { trip_length: newTripLength };
        const { data: currentItinerary } = await supabase.from('itineraries').select('title').eq('id', itineraryId).single();
        if (currentItinerary?.title) {
          updateFields.title = currentItinerary.title.replace(/\d+\s*days?/, `${newTripLength} days`);
        }
        await supabase.from('itineraries').update(updateFields).eq('id', itineraryId);
      }

    } else if (action.type === 'replace_day') {
      const dayToReplace = action.day_number;

      console.log(`replace_day: day=${dayToReplace}, ${(action.activities || []).length} new activities`);

      // Delete existing activities for that day
      await supabase.from('activities').delete().eq('itinerary_id', itineraryId).eq('day_number', dayToReplace);

      // Insert new activities
      const newActivities = (action.activities || []).map((a, i) => buildRow({ ...a, day_number: dayToReplace }, i));

      if (newActivities.length > 0) {
        const { error } = await supabase.from('activities').insert(newActivities);
        if (error) console.error('Error inserting replacement activities:', error);
      }
    }
  } catch (error) {
    console.error('Error executing AI action:', error);
  }
}

async function generateOpenAIChat(message, conversationHistory, itineraryContext, currentActivities) {
  const destination = itineraryContext?.destination || 'the destination';
  const tripLength = itineraryContext?.tripLength || 7;
  const budget = itineraryContext?.budget || 'medium';
  const travelPace = itineraryContext?.travelPace || 'balanced';
  const travelerProfiles = itineraryContext?.travelerProfiles || [];
  const profileDesc = describeProfiles(travelerProfiles);

  const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

  // Build a summary of current itinerary for context
  let currentItinerarySummary = '';
  if (currentActivities && currentActivities.length > 0) {
    const dayGroups = {};
    currentActivities.forEach(a => {
      const day = a.day_number || 1;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(`${a.title} (${a.category}, ${a.location || 'no location'})`);
    });
    const dayLines = Object.keys(dayGroups).sort((a, b) => a - b).map(day =>
      `Day ${day}: ${dayGroups[day].join(', ')}`
    );
    currentItinerarySummary = dayLines.join('\n');
  }

  const activitiesPerDay = { 'relaxed': 2, 'moderate': 2, 'balanced': 3, 'active': 4, 'packed': 5 };
  const baseDaily = activitiesPerDay[travelPace] || 3;

  const systemPrompt = `You are an expert travel planner for ${destination}. You are helping modify a ${tripLength}-day trip.

TRIP CONTEXT:
- Destination: ${destination}
- Trip length: ${tripLength} days
- Budget: ${budget}
- Pace: ${travelPace} (${baseDaily} activities/day)
- Traveler style: ${profileDesc || travelerProfiles.join(', ') || 'general'}

CURRENT ITINERARY:
${currentItinerarySummary || '(empty — no activities yet)'}

YOU CAN DO THESE ACTIONS:

1. **add_days** — Insert new day(s) into the trip. The system will automatically shift existing days after the insertion point.
   Required fields: type, insert_at, days_count, new_trip_length, activities
   - insert_at: the day NUMBER where the new day goes (existing days at this number and after get pushed forward)
   - days_count: how many days to add (usually 1)
   - new_trip_length: ${tripLength} + days_count
   - activities: MUST contain exactly ${baseDaily} activities per new day

2. **delete_day** — Remove a specific day. The system shifts remaining days down automatically.
   Required fields: type, day_number, new_trip_length

3. **replace_day** — Replace all activities on a specific day with new ones.
   Required fields: type, day_number, activities

RESPONSE FORMAT — always respond with this JSON:
{
  "message": "Your helpful response explaining what you did and why",
  "action": {
    "type": "add_days",
    "insert_at": 7,
    "days_count": 1,
    "new_trip_length": ${tripLength + 1},
    "activities": [
      {
        "day_number": 7,
        "position": 0,
        "title": "Specific Real Place Name",
        "description": "Why this is amazing (1-2 sentences)",
        "location": "Exact neighborhood or area",
        "city_name": "City name",
        "category": "one of: ${validCategories.join(', ')}",
        "duration_minutes": 90,
        "estimated_cost_min": 0,
        "estimated_cost_max": 30,
        "time_of_day": "morning|afternoon|evening",
        "latitude": 0.00,
        "longitude": 0.00
      }
    ]
  },
  "activities": []
}

CRITICAL RULES FOR ADDING DAYS:
- The activities array MUST contain exactly ${baseDaily} activities. NEVER return an empty activities array.
- The day_number in activities MUST equal insert_at.
- YOU MUST CHOOSE THE OPTIMAL insert_at POSITION by analyzing the current itinerary:
  1. Look at the geographic flow of the trip (which cities/areas are visited on which days)
  2. Look at the thematic flow (nature days, city days, relaxation days)
  3. Insert the new day where it makes the MOST SENSE geographically and logically
  4. If the last day has departure/airport/travel-home activities, NEVER insert after it — insert before it so departure stays last
  5. If two consecutive days are in different areas, consider inserting between them to smooth the transition
  6. If a city deserves more time based on traveler style, insert next to the existing day in that city
- Example: trip is 7 days, Day 5 is in Bergen city, Day 6 jumps to Fjærland, Day 7 is departure → if adding a nature day, insert_at = 6 (between Bergen and the jump) to explore Fjærland area more, pushing old Day 6-7 to 7-8.
- In your "message", ALWAYS explain WHERE you inserted the day and WHY that position optimizes the trip flow.
- Each activity must be a REAL, SPECIFIC, NAMED place with ACCURATE GPS coordinates for ${destination} area.
- Activities must strongly match the traveler style: ${profileDesc || 'general'}.

CRITICAL RULES FOR ALL ACTIONS:
- NEVER repeat locations that already exist in the itinerary.
- Group activities geographically — same day = same area of the city.
- Category MUST be one of: ${validCategories.join(', ')}.
- time_of_day MUST be one of: morning, afternoon, evening.
- When the user asks to add/delete/modify days, ALWAYS execute the action immediately. Do NOT just suggest — actually include the action object with all required fields. Be decisive and take action.
- When the user asks "where should I add a day" or "where does it make sense", analyze the itinerary and EXECUTE the add_days action at the optimal position. Explain your reasoning in the message.
- For simple recommendations/suggestions/questions (not structural changes), set "action": null and put suggestions in the "activities" array.
- If user asks for blogs/links, include markdown [text](url) links in the message.
- If action is null, set "action": null (not "action": {"type": "null"}).`;

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // Add conversation history (last 6 messages for better context)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6);
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
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);

    // Validate and clean activities (for suggestions)
    let activities = result.activities || [];
    activities = activities.map(activity => ({
      ...activity,
      category: validCategories.includes(activity.category) ? activity.category : 'other',
      day_number: activity.day_number || 1,
      position: activity.position || 0,
      duration_minutes: activity.duration_minutes || 60
    }));

    // Validate action
    let action = result.action || null;
    if (action && action.type === 'null') action = null;
    if (action && action.activities) {
      action.activities = action.activities.map(a => ({
        ...a,
        category: validCategories.includes(a.category) ? a.category : 'other',
        day_number: a.day_number || 1,
        position: a.position || 0,
        duration_minutes: a.duration_minutes || 60
      }));
    }

    return {
      message: result.message || completion.choices[0].message.content,
      activities: activities,
      action: action
    };
  } catch (parseError) {
    console.error('Failed to parse chat response:', completion.choices[0].message.content);
    return {
      message: completion.choices[0].message.content,
      activities: [],
      action: null
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
    'moderate': 2,
    'balanced': 3,
    'active': 4,
    'packed': 5
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

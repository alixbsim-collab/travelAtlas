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

  let prompt;
  if (isMultiCity) {
    prompt = `Based on these travel preferences, suggest ${numCities} destinations for a ${tripLength}-day multi-city trip:

Travel Style: ${travelerProfiles.join(', ')}
Budget: ${budgetDescriptions[budget] || budget}
Pace: ${paceDescriptions[travelPace] || travelPace}
Trip Length: ${tripLength} days
${region ? `Region: ${regionExamples[region] || region}` : ''}
${regionConstraint}

RULES:
- Pick ${numCities} cities that are geographically close enough to travel between reasonably
- Cities should complement each other (don't pick 3 beach towns)
- Order them in a logical travel sequence

Return ONLY the destinations separated by commas in format "City1, City2, City3" (e.g., "Tokyo, Kyoto, Osaka" or "Paris, Barcelona, Rome"). No country names, no other text.`;
  } else {
    prompt = `Based on these travel preferences, suggest ONE perfect destination (city and country):

Travel Style: ${travelerProfiles.join(', ')}
Budget: ${budgetDescriptions[budget] || budget}
Pace: ${paceDescriptions[travelPace] || travelPace}
Trip Length: ${tripLength} days
${region ? `Region: ${regionExamples[region] || region}` : ''}
${regionConstraint}

Consider:
- Cultural explorers love history-rich cities like Rome, Kyoto, Istanbul
- Food lovers enjoy culinary capitals like Tokyo, Bangkok, Barcelona
- Adventure seekers want Queenstown, Costa Rica, Iceland
- Beach lovers prefer Bali, Maldives, Santorini
- Nature enthusiasts love Norway, New Zealand, Patagonia

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

    // Multi-destination prompt
    if (isMultiDest) {
      const daysPerDest = Math.floor(tripLength / destinations.length);
      return `${tripLength}-day trip: ${destinations.join(' → ')}. Budget: ${budget}. Style: ${travelerProfiles.join(', ')}. ${paceLine}
${travelLogistics}
Generate activities for ${dayRange}. Route: ~${daysPerDest} days per destination, in order.
Include transport between destinations. ${baseDaily} activities/day. Respect travel time.
CRITICAL: Return/departure ONLY on Day ${tripLength}. NEVER include "return home" or departure flights before the last day.
Categories: ${validCategories.join(', ')}. time_of_day: morning|afternoon|evening.
JSON: {"activities":[{"day_number":${startDay},"position":0,"title":"...","description":"short","location":"Place","city_name":"City","category":"...","duration_minutes":90,"estimated_cost_min":0,"estimated_cost_max":20,"time_of_day":"morning","latitude":0.00,"longitude":0.00}]}`;
    }

    // Single destination prompt (with sub-destination routing for long trips)
    return `${tripLength}-day trip to ${destination}. Budget: ${budget}. Style: ${travelerProfiles.join(', ')}. ${paceLine}
${travelLogistics}${routeGuidance}
Generate activities for ${dayRange}. ${baseDaily} activities/day. Optimize by geographic proximity. Vary activities across days.
CRITICAL: Return/departure ONLY on Day ${tripLength}. NEVER include "return home" or departure flights before the last day.
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
        ? `Expert travel planner. Respond with valid JSON. Generate activities for EVERY day in the requested range. CRITICAL: departure/return home ONLY on the very last day (Day ${tripLength}). Never earlier. Be concise.`
        : `Expert travel planner. Respond with valid JSON. Generate activities for EVERY day in the requested range. Do NOT include any return-home or departure activities — the trip continues. Be concise.`;
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

async function generateOpenAIChat(message, conversationHistory, itineraryContext) {
  const destination = itineraryContext?.destination || 'the destination';
  const lowerMessage = message.toLowerCase();

  // Check if user is asking for blogs, links, or external resources
  const wantsLinks = lowerMessage.match(/blog|link|article|website|review|read|resource|guide|tip/);

  // Check if user is asking about specific places/activities (should always return cards)
  const wantsRecommendations = lowerMessage.match(/recommend|suggest|best|top|where|what|should|can you|find|show|give|tell me about|looking for|want to|places|things to do|restaurant|hotel|tour|experience|activity|activities/);

  // Valid categories for activities
  const validCategories = ['food', 'nature', 'culture', 'adventure', 'relaxation', 'shopping', 'nightlife', 'transport', 'accommodation', 'other'];

  // Build the system prompt based on what the user wants
  let systemPrompt;

  if (wantsLinks) {
    // User wants blogs/links - search and provide real URLs
    systemPrompt = `You are an expert travel assistant with web search capabilities for ${destination}.

When users ask for blogs, articles, or links, you MUST:
1. Provide REAL, WORKING URLs to actual travel blogs and resources
2. Include 3-5 relevant links with descriptions
3. ALSO suggest 2-3 related activities they can add to their itinerary

For blog/link requests about ${destination}, include links from:
- TripAdvisor: https://www.tripadvisor.com/Tourism-g${destination.replace(/\s/g, '_')}-Vacations.html
- Lonely Planet: https://www.lonelyplanet.com/${destination.toLowerCase().replace(/\s/g, '-')}
- Culture Trip: https://theculturetrip.com/search?q=${encodeURIComponent(destination)}
- Travel blogs: Search for "${destination} travel blog" or "${destination} things to do"
- GetYourGuide: https://www.getyourguide.com/s/?q=${encodeURIComponent(destination)}
- Viator: https://www.viator.com/searchResults/all?text=${encodeURIComponent(destination)}

ALWAYS respond with this JSON format:
{
  "message": "Your helpful response with embedded [link text](URL) markdown links for blogs and resources",
  "activities": [
    {
      "day_number": 1,
      "position": 0,
      "title": "Activity name based on what blogs recommend",
      "description": "Brief description",
      "location": "Specific location in ${destination}",
      "category": "food|culture|nature|adventure|relaxation|shopping|nightlife|other",
      "duration_minutes": 120,
      "estimated_cost_min": 0,
      "estimated_cost_max": 50,
      "time_of_day": "morning|afternoon|evening",
      "latitude": 0.0,
      "longitude": 0.0
    }
  ]
}

Include actual clickable links in the message field using markdown format [text](url).`;

  } else if (wantsRecommendations) {
    // User wants recommendations - ALWAYS provide activity cards
    systemPrompt = `You are an expert travel planner for ${destination}.

IMPORTANT: For ANY recommendation or suggestion, you MUST provide draggable activity cards.

When users ask about places, restaurants, tours, experiences, or anything travel-related:
1. Give a helpful response
2. ALWAYS include 2-4 specific activity cards they can drag to their itinerary

ALWAYS respond with this JSON format:
{
  "message": "Your helpful response here",
  "activities": [
    {
      "day_number": 1,
      "position": 0,
      "title": "Specific place/activity name",
      "description": "Why this is great and what to expect",
      "location": "Exact location in ${destination}",
      "category": "food|culture|nature|adventure|relaxation|shopping|nightlife|other",
      "duration_minutes": 90,
      "estimated_cost_min": 0,
      "estimated_cost_max": 30,
      "time_of_day": "morning|afternoon|evening",
      "latitude": 0.0,
      "longitude": 0.0
    }
  ]
}

Category MUST be one of: ${validCategories.join(', ')}
Use real coordinates for ${destination} locations.
NEVER return an empty activities array for travel-related questions.`;

  } else {
    // General conversation - still try to provide activity cards when relevant
    systemPrompt = `You are a friendly travel assistant helping plan a trip to ${destination}.

For travel-related questions, try to suggest specific activities when possible.
For non-travel questions, just have a helpful conversation.

Respond with JSON format:
{
  "message": "Your response here",
  "activities": []
}

If the question is about places, food, things to do, or experiences in ${destination},
include 1-3 activity suggestions in the activities array with this structure:
{
  "day_number": 1,
  "position": 0,
  "title": "Activity name",
  "description": "Description",
  "location": "Location",
  "category": "food|culture|nature|adventure|relaxation|shopping|nightlife|other",
  "duration_minutes": 60,
  "estimated_cost_min": 0,
  "estimated_cost_max": 20,
  "time_of_day": "morning|afternoon|evening",
  "latitude": 0.0,
  "longitude": 0.0
}`;
  }

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
  }

  messages.push({
    role: "user",
    content: `${message}\n\nTrip context: ${itineraryContext?.tripLength || 7}-day trip to ${destination}, ${itineraryContext?.budget || 'medium'} budget.`
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 2000
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);

    // Validate and clean activities
    let activities = result.activities || [];
    activities = activities.map(activity => ({
      ...activity,
      category: validCategories.includes(activity.category) ? activity.category : 'other',
      day_number: activity.day_number || 1,
      position: activity.position || 0,
      duration_minutes: activity.duration_minutes || 60
    }));

    return {
      message: result.message || completion.choices[0].message.content,
      activities: activities
    };
  } catch (parseError) {
    console.error('Failed to parse chat response:', completion.choices[0].message.content);
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

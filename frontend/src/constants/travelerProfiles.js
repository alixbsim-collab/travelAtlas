export const TRAVELER_PROFILES = [
  {
    id: 'active-globetrotter',
    emoji: '🧗🏻‍♂️',
    title: 'The Active Globetrotter',
    description: 'Adventure-seeking travelers who prioritize physical activities like hiking, climbing, and outdoor sports',
    keywords: ['adventure', 'hiking', 'climbing', 'outdoors', 'sports', 'active']
  },
  {
    id: 'eco-conscious',
    emoji: '🦜',
    title: 'The Eco-Conscious Traveler',
    description: 'Environmentally responsible travelers focused on sustainable tourism and eco-friendly practices',
    keywords: ['sustainable', 'eco-friendly', 'green', 'environment', 'conservation', 'responsible']
  },
  {
    id: 'van-lifer',
    emoji: '🚐',
    title: 'The Van Lifer',
    description: 'Freedom-loving road trippers who enjoy traveling by van and camping',
    keywords: ['van life', 'road trip', 'camping', 'freedom', 'nomadic', 'mobile']
  },
  {
    id: 'off-grid',
    emoji: '🏕',
    title: 'The Off-the-Grid Traveler',
    description: 'Adventurers seeking remote destinations and wilderness experiences',
    keywords: ['remote', 'wilderness', 'off-grid', 'isolation', 'nature', 'rustic']
  },
  {
    id: 'digital-nomad',
    emoji: '💻',
    title: 'The Digital Nomad',
    description: 'Remote workers combining travel with work, seeking good wifi and coworking spaces',
    keywords: ['remote work', 'wifi', 'coworking', 'work-travel', 'flexible', 'connected']
  },
  {
    id: 'wellness',
    emoji: '🧘‍♂️',
    title: 'The Wellness Traveler',
    description: 'Health-focused travelers seeking yoga, meditation, spas, and mindful experiences',
    keywords: ['wellness', 'yoga', 'meditation', 'spa', 'health', 'mindfulness', 'relaxation']
  },
  {
    id: 'backpacker',
    emoji: '🎒',
    title: 'The Backpacker',
    description: 'Budget-conscious travelers staying in hostels and seeking authentic local experiences',
    keywords: ['budget', 'hostels', 'backpacking', 'authentic', 'local', 'frugal']
  },
  {
    id: 'cultural-explorer',
    emoji: '🗺',
    title: 'The Cultural Explorer',
    description: 'History and culture enthusiasts visiting museums, historical sites, and local traditions',
    keywords: ['culture', 'history', 'museums', 'heritage', 'traditions', 'learning']
  },
  {
    id: 'beach-bum',
    emoji: '🏝',
    title: 'The Beach Bum',
    description: 'Sun and sea lovers seeking coastal destinations and water activities',
    keywords: ['beach', 'ocean', 'swimming', 'surfing', 'coastal', 'tropical', 'sun']
  },
  {
    id: 'nature-lover',
    emoji: '🌳',
    title: 'The Nature Lover',
    description: 'Nature enthusiasts exploring national parks, wildlife, and natural wonders',
    keywords: ['nature', 'wildlife', 'national parks', 'forests', 'mountains', 'scenery']
  },
  {
    id: 'family-traveler',
    emoji: '👨‍👩‍👧',
    title: 'The Family Traveler',
    description: 'Families seeking kid-friendly activities and comfortable accommodations',
    keywords: ['family', 'kids', 'children', 'family-friendly', 'safe', 'educational']
  }
];

export const TRAVEL_PACE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed', emoji: '🐌', description: '1-2 activities per day, plenty of downtime and slow mornings' },
  { value: 'moderate', label: 'Moderate', emoji: '🚶', description: '2 activities per day, balanced with free time' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️', description: '3 activities per day, good mix of action and rest' },
  { value: 'active', label: 'Active', emoji: '🏃', description: '3-4 activities per day, busy but manageable' },
  { value: 'packed', label: 'Packed', emoji: '⚡', description: '4+ activities per day, maximize every moment' }
];

export const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget', emoji: '💰', symbol: '$', description: 'Hostels, street food, free activities' },
  { value: 'medium', label: 'Moderate', emoji: '💵', symbol: '$$', description: 'Mid-range hotels, local restaurants, paid attractions' },
  { value: 'high', label: 'Comfortable', emoji: '💎', symbol: '$$$', description: 'Nice hotels, good restaurants, premium experiences' },
  { value: 'luxury', label: 'Luxury', emoji: '👑', symbol: '$$$$', description: 'Luxury hotels, fine dining, exclusive experiences' }
];

export const ACTIVITY_CATEGORIES = [
  { value: 'food', label: 'Food & Dining', emoji: '🍽️', color: '#F59E0B' },
  { value: 'nature', label: 'Nature & Outdoors', emoji: '🌳', color: '#10B981' },
  { value: 'culture', label: 'Culture & History', emoji: '🏛️', color: '#8B5CF6' },
  { value: 'adventure', label: 'Adventure & Sports', emoji: '🏔️', color: '#EF4444' },
  { value: 'relaxation', label: 'Relaxation & Wellness', emoji: '🧘', color: '#06B6D4' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#EC4899' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🌃', color: '#6366F1' },
  { value: 'transport', label: 'Transportation', emoji: '✈️', color: '#8B5CF6' },
  { value: 'accommodation', label: 'Accommodation', emoji: '🏨', color: '#3B82F6' },
  { value: 'other', label: 'Other', emoji: '📍', color: '#71717A' }
];

export const ACCOMMODATION_TYPES = [
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'hostel', label: 'Hostel', emoji: '🛏️' },
  { value: 'airbnb', label: 'Airbnb', emoji: '🏠' },
  { value: 'guesthouse', label: 'Guesthouse', emoji: '🏡' },
  { value: 'resort', label: 'Resort', emoji: '🏖️' },
  { value: 'camping', label: 'Camping', emoji: '⛺' },
  { value: 'other', label: 'Other', emoji: '📍' }
];

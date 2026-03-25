import { Request } from 'express';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userRole?: string;
}

export interface AtlasFileCreateInput {
  title: string;
  description?: string;
  destination: string;
  trip_length: number;
  category?: string;
  cover_image_url?: string;
  traveler_profiles?: string[];
  source_type?: string;
}

export interface AtlasFileUpdateInput {
  title?: string;
  description?: string;
  destination?: string;
  trip_length?: number;
  category?: string;
  cover_image_url?: string;
  traveler_profiles?: string[];
}

export interface VersionContentInput {
  intro?: string;
  tips?: string;
  days: DayInput[];
}

export interface DayInput {
  day_number: number;
  title: string;
  content?: string;
  images?: string[];
  activities?: DayActivityInput[];
}

export interface DayActivityInput {
  position?: number;
  title: string;
  description?: string;
  location?: string;
  category?: string;
  duration_minutes?: number;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  latitude?: number;
  longitude?: number;
  time_of_day?: string;
}

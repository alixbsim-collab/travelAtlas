import { BookOpen, Award } from 'lucide-react';

export const SOURCE_TYPE = {
  TRAVELER: 'traveler',
  CURATED: 'curated',
};

export const sourceTypeConfig = {
  traveler: {
    label: 'Traveler Story',
    icon: BookOpen,
    badge: {
      bg: 'bg-naples-100',
      text: 'text-naples-700',
    },
    cardAccent: 'border-b-4 border-naples-400',
    authorPrefix: 'A story by',
    dayCircle: {
      bg: 'bg-coral-100',
      text: 'text-coral-600',
    },
    tipsSection: {
      bg: 'bg-naples-50',
      border: 'border-naples-200',
    },
    sectionDivider: 'border-coral-200',
    introStyle: 'italic',
  },
  curated: {
    label: 'Atlas Curated',
    icon: Award,
    badge: {
      bg: 'bg-columbia-100',
      text: 'text-columbia-700',
    },
    cardAccent: 'border-b-4 border-columbia-500',
    authorPrefix: 'Curated by',
    dayCircle: {
      bg: 'bg-columbia-100',
      text: 'text-columbia-700',
    },
    tipsSection: {
      bg: 'bg-columbia-50',
      border: 'border-columbia-200',
    },
    sectionDivider: 'border-columbia-200',
    introStyle: '',
  },
};

export function getSourceConfig(sourceType) {
  return sourceTypeConfig[sourceType] || sourceTypeConfig.traveler;
}

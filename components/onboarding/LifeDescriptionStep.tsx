import React from 'react';
import OptionSelector from './OptionSelector';

interface LifeDescriptionStepProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    emoji: '🌪️',
    text: "Chaotic and overwhelming — I feel like I'm just trying to keep up",
    value: 'chaotic',
  },
  {
    emoji: '😐',
    text: "Stuck or unmotivated — I know I can do more but I'm not sure where to start",
    value: 'stuck',
  },
  {
    emoji: '⚖️',
    text: "Balanced but inconsistent — Some days I'm on track, others I lose focus",
    value: 'balanced',
  },
  {
    emoji: '🌿',
    text: "Purposeful and improving — I'm actively working on myself and my habits",
    value: 'purposeful',
  },
  {
    emoji: '🔥',
    text: "Fulfilled and thriving — I'm living with energy, focus, and direction",
    value: 'thriving',
  },
];

export default function LifeDescriptionStep({ value, onChange }: LifeDescriptionStepProps) {
  return (
    <OptionSelector
      question="How would you describe your current life?"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}


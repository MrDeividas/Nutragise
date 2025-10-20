import React from 'react';
import OptionSelector from './OptionSelector';

interface MorningMotivationStepProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    emoji: '🎯',
    text: 'My goals and dreams — I want to build a better future',
    value: 'goals',
  },
  {
    emoji: '💪',
    text: 'The drive to improve and become stronger each day',
    value: 'improvement',
  },
  {
    emoji: '❤️',
    text: 'My family, friends, or people I care about',
    value: 'relationships',
  },
  {
    emoji: '🧠',
    text: 'The chance to learn, grow, and experience something new',
    value: 'growth',
  },
  {
    emoji: '💼',
    text: 'My responsibilities — I get up because I have to',
    value: 'responsibility',
  },
  {
    emoji: '🌅',
    text: "Honestly, I'm still trying to find that reason",
    value: 'searching',
  },
];

export default function MorningMotivationStep({ value, onChange }: MorningMotivationStepProps) {
  return (
    <OptionSelector
      question="What gets you out of bed every morning?"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}


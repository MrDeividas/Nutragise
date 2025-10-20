import React from 'react';
import OptionSelector from './OptionSelector';

interface ProudMomentStepProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    emoji: '🎯',
    text: 'When I stayed consistent with a goal or habit',
    value: 'consistent',
  },
  {
    emoji: '💪',
    text: 'When I pushed through something difficult',
    value: 'persevered',
  },
  {
    emoji: '❤️',
    text: 'When I helped or supported someone else',
    value: 'helped',
  },
  {
    emoji: '🧠',
    text: 'When I learned or accomplished something new',
    value: 'learned',
  },
  {
    emoji: '🌿',
    text: "It's been a while — I want to feel that again",
    value: 'seeking',
  },
  {
    emoji: '🔥',
    text: 'I feel proud of myself regularly and want to keep that energy going',
    value: 'regular',
  },
];

export default function ProudMomentStep({ value, onChange }: ProudMomentStepProps) {
  return (
    <OptionSelector
      question="What's the last time you felt proud of yourself?"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}


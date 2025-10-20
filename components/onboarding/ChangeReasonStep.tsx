import React from 'react';
import OptionSelector from './OptionSelector';

interface ChangeReasonStepProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    emoji: '💪',
    text: 'To feel stronger, healthier, and more confident in myself',
    value: 'confident',
  },
  {
    emoji: '🧠',
    text: 'To overcome procrastination and build discipline',
    value: 'discipline',
  },
  {
    emoji: '❤️',
    text: 'To feel happier and more at peace',
    value: 'happiness',
  },
  {
    emoji: '🎯',
    text: 'To find clarity, purpose, and direction',
    value: 'purpose',
  },
  {
    emoji: '🌿',
    text: 'To grow into the best version of myself',
    value: 'growth',
  },
  {
    emoji: '🤝',
    text: 'To set an example and inspire others around me',
    value: 'inspire',
  },
];

export default function ChangeReasonStep({ value, onChange }: ChangeReasonStepProps) {
  return (
    <OptionSelector
      question="What's the biggest reason why you want to start making a change and improving your life?"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}


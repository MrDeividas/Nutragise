import React from 'react';
import OptionSelector from './OptionSelector';

interface CurrentStateStepProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    emoji: '🔥',
    text: 'Determined — focused and ready to make progress',
    value: 'determined',
  },
  {
    emoji: '🌱',
    text: 'Evolving — growing and learning each day',
    value: 'evolving',
  },
  {
    emoji: '🧠',
    text: 'Curious — open to new ideas and self-improvement',
    value: 'curious',
  },
  {
    emoji: '💪',
    text: 'Disciplined — staying consistent and accountable',
    value: 'disciplined',
  },
  {
    emoji: '😓',
    text: 'Distracted — struggling to stay focused or on track',
    value: 'distracted',
  },
  {
    emoji: '😔',
    text: 'Lacking confidence — doubting myself but wanting change',
    value: 'doubting',
  },
  {
    emoji: '😩',
    text: 'Underachieving — not reaching my potential (yet)',
    value: 'underachieving',
  },
  {
    emoji: '🌅',
    text: 'Hopeful — believing things can get better',
    value: 'hopeful',
  },
];

export default function CurrentStateStep({ value, onChange }: CurrentStateStepProps) {
  return (
    <OptionSelector
      question="Which of these words best describes you right now?"
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}


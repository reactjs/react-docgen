import React from 'react';
import { Select } from '../Select';

interface OptionPanelProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export enum Language {
  FLOW = 'flow',
  JAVASCRIPT = 'js',
  TYPESCRIPT = 'ts',
}

const options = [
  { key: Language.TYPESCRIPT, name: 'TypeScript' },
  { key: Language.JAVASCRIPT, name: 'JavaScript' },
  { key: Language.FLOW, name: 'Flow' },
];

export default function OptionPanel({
  language,
  onLanguageChange,
}: OptionPanelProps) {
  const selectedOption = options.find((option) => option.key === language);

  if (!selectedOption) {
    throw new Error(`Could not find language '${language}'`);
  }

  return (
    <>
      <Select
        selected={{
          key: selectedOption.key,
          name: (
            <div className="nx-flex nx-items-center nx-gap-2 nx-capitalize">
              Language:
              <span>{selectedOption.name}</span>
            </div>
          ),
        }}
        options={options}
        onChange={(option) => onLanguageChange(option.key as Language)}
      />
    </>
  );
}

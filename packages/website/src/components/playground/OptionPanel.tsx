import React from 'react';
import { Select } from 'nextra/components';
import { CheckIcon } from 'nextra/icons';

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
  { id: Language.TYPESCRIPT, name: 'TypeScript' },
  { id: Language.JAVASCRIPT, name: 'JavaScript' },
  { id: Language.FLOW, name: 'Flow' },
];

export default function OptionPanel({
  language,
  onLanguageChange,
}: OptionPanelProps) {
  const selectedOption = options.find((option) => option.id === language);

  if (!selectedOption) {
    throw new Error(`Could not find language '${language}'`);
  }
  //className={cn('x:flex x:items-center x:gap-2', className)}

  return (
    <>
      <Select
        className="x:flex x:items-center x:gap-2"
        value={selectedOption.id}
        title="Change language"
        selectedOption={
          <>
            <CheckIcon height="1em" />
            {selectedOption.name}
          </>
        }
        options={options}
        onChange={(language) => onLanguageChange(language as Language)}
      />
    </>
  );
}

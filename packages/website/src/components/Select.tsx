import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import cn from 'clsx';
import { CheckIcon } from 'nextra/icons';
import type { ReactElement } from 'react';

interface MenuOption {
  key: string;
  name: ReactElement | string;
}

interface MenuProps {
  selected: MenuOption;
  onChange: (option: MenuOption) => void;
  options: MenuOption[];
  title?: string;
  className?: string;
}

export function Select({
  options,
  selected,
  onChange,
  title,
  className,
}: MenuProps): ReactElement {
  return (
    <Listbox value={selected} onChange={onChange}>
      <ListboxButton
        title={title}
        className={({ hover, open, focus }) =>
          cn(
            'h-7 rounded-md px-2 text-xs font-medium transition-colors',
            open
              ? 'bg-gray-200 text-gray-900 dark:bg-primary-100/10 dark:text-gray-50'
              : hover
                ? 'bg-gray-100 text-gray-900 dark:bg-primary-100/5 dark:text-gray-50'
                : 'text-gray-600 dark:text-gray-400',
            focus && 'nextra-focusable',
            className,
          )
        }
      >
        {selected.name}
      </ListboxButton>
      <ListboxOptions
        as="ul"
        transition
        anchor={{ to: 'top start', gap: 10 }}
        className={({ open }) =>
          cn(
            'nextra-focus',
            open ? 'opacity-100' : 'opacity-0',
            'z-20 max-h-64 min-w-[--button-width] rounded-md border border-black/5 bg-[rgb(var(--nextra-bg),.8)] py-1 text-sm shadow-lg backdrop-blur-lg transition-opacity motion-reduce:transition-none dark:border-white/20',
          )
        }
      >
        {options.map((option) => (
          <ListboxOption
            key={option.key}
            value={option}
            as="li"
            className={({ focus }) =>
              cn(
                focus
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10'
                  : 'text-gray-800 dark:text-gray-100',
                'cursor-pointer whitespace-nowrap px-3 py-1.5',
                'transition-colors',
                option.key === selected.key &&
                  'flex items-center justify-between gap-3',
              )
            }
          >
            {option.name}
            {option.key === selected.key && <CheckIcon height="16" />}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

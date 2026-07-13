import React from 'react';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: ComputerDesktopIcon },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex rounded-lg border border-edge bg-surface p-1"
      role="radiogroup"
      aria-label="Theme"
      data-testid="theme-toggle"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            data-testid={`theme-option-${value}`}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-content-muted hover:text-content'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

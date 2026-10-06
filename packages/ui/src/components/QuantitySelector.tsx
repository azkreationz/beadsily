import * as React from 'react';
import { cn } from '../utils/cn';

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unitLabel?: string;
  disabled?: boolean;
  showHelperText?: boolean;
  className?: string;
  id?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  label = 'Quantity',
  unitLabel = 'Items',
  disabled = false,
  showHelperText = true,
  className,
  id = 'quantity-selector',
}) => {
  const isAtMin = value <= min;
  const isAtMax = max !== undefined && value >= max;

  const handleDecrement = () => {
    if (disabled || isAtMin) return;
    const nextVal = Math.max(min, value - step);
    onChange(nextVal);
  };

  const handleIncrement = () => {
    if (disabled || isAtMax) return;
    const nextVal = max !== undefined ? Math.min(max, value + step) : value + step;
    onChange(nextVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (isNaN(raw)) return;
    let clamped = raw;
    if (clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    onChange(clamped);
  };

  // Helper text: special automatic project calculation for party guest counts
  let helperText = '';
  if (showHelperText) {
    if (unitLabel.toLowerCase().includes('guest')) {
      const totalProjects = value * 3;
      helperText = `${value} guests = ${totalProjects} finished keepsakes (1 pen, 1 bracelet, 1 keychain per guest)`;
    } else {
      helperText = `Min: ${min}${max !== undefined ? ` • Max: ${max}` : ''}`;
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-body-sm font-semibold text-charcoal-950 flex items-center justify-between"
      >
        <span>{label}</span>
        {unitLabel && (
          <span className="text-xs font-normal text-charcoal-700 bg-cream-200 px-2 py-0.5 rounded-full">
            {unitLabel}
          </span>
        )}
      </label>

      <div
        className={cn(
          'inline-flex items-center rounded-full border-2 border-cream-300 bg-white shadow-xs transition-colors',
          'focus-within:border-raspberry-600 focus-within:ring-4 focus-within:ring-raspberry-500/20',
          disabled && 'opacity-60 bg-cream-100 cursor-not-allowed'
        )}
      >
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || isAtMin}
          aria-label={`Decrease ${label}`}
          className={cn(
            'inline-flex items-center justify-center h-11 w-11 rounded-full text-charcoal-950 font-bold transition-colors select-none',
            'hover:bg-cream-100 active:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-500',
            (disabled || isAtMin) && 'opacity-35 cursor-not-allowed hover:bg-transparent'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Value Input */}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          aria-live="polite"
          className={cn(
            'w-16 text-center font-accent font-bold text-lg text-charcoal-950 bg-transparent border-none',
            'focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || isAtMax}
          aria-label={`Increase ${label}`}
          className={cn(
            'inline-flex items-center justify-center h-11 w-11 rounded-full text-charcoal-950 font-bold transition-colors select-none',
            'hover:bg-cream-100 active:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-500',
            (disabled || isAtMax) && 'opacity-35 cursor-not-allowed hover:bg-transparent'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {helperText && (
        <p className="text-xs text-charcoal-700 mt-0.5 px-1 leading-normal" role="note">
          {helperText}
        </p>
      )}
    </div>
  );
};

QuantitySelector.displayName = 'QuantitySelector';

export default QuantitySelector;

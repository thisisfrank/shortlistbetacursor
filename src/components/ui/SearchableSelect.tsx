import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  hint,
  required = false,
  disabled = false,
  placeholder = "Search...",
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the selected option label
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionSelect = (selectedValue: string) => {
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: {
        name,
        value: selectedValue,
        type: 'select-one'
      }
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: {
        name,
        value: '',
        type: 'select-one'
      }
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
  };

  const inputId = (label || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="mb-8 relative" ref={dropdownRef}>
      <label 
        htmlFor={inputId} 
        className={`block text-sm font-jakarta font-semibold mb-1 uppercase tracking-wide ${
          disabled ? 'text-guardian/40' : 'text-supernova'
        }`}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {/* Main Input/Display Area */}
      <div 
        className={`
          relative border-0 border-b-2 cursor-pointer transition-colors duration-200
          ${error ? 'border-red-500' : disabled ? 'border-guardian/20' : 'border-guardian/40 hover:border-guardian/60'}
          ${isOpen ? 'border-supernova' : ''}
          ${className}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={`
          flex items-center justify-between py-4 pl-4 pr-0 text-lg bg-transparent font-jakarta min-h-[56px]
          ${disabled ? 'text-guardian/40 cursor-not-allowed' : 'text-white-knight'}
        `}>
          <span className={displayValue ? 'text-white-knight' : 'text-guardian/60'}>
            {displayValue || (disabled ? 'Not Required' : placeholder)}
          </span>
          
          <div className="flex items-center space-x-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-guardian/60 hover:text-white-knight transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown 
              size={20} 
              className={`text-guardian/60 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-shadowforce border border-guardian/30 rounded-lg shadow-xl max-h-64 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-guardian/20">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-white-knight placeholder-guardian/60 focus:outline-none font-jakarta"
              />
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-guardian/60 font-jakarta text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`
                      px-3 py-2 cursor-pointer font-jakarta transition-colors duration-150
                      ${value === option.value 
                        ? 'bg-supernova/20 text-supernova' 
                        : 'text-white-knight hover:bg-guardian/10'
                      }
                    `}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hint and Error Messages */}
      {hint && !error && (
        <p className="mt-2 text-sm text-guardian/80 font-jakarta">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{error}</p>
      )}
    </div>
  );
};

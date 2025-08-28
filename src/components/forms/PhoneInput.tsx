import React, { useState, useEffect, useRef } from 'react';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
  maxLength: number;
  format?: string;
}

const countryCodes: CountryCode[] = [
  { code: '+1', country: 'United States', flag: '🇺🇸', maxLength: 10, format: '(XXX) XXX-XXXX' },
  { code: '+1', country: 'Canada', flag: '🇨🇦', maxLength: 10, format: '(XXX) XXX-XXXX' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', maxLength: 10, format: 'XXXX XXX XXXX' },
  { code: '+33', country: 'France', flag: '🇫🇷', maxLength: 10, format: 'X XX XX XX XX' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', maxLength: 11, format: 'XXX XXXXXXXX' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', maxLength: 10, format: 'XX-XXXX-XXXX' },
  { code: '+86', country: 'China', flag: '🇨🇳', maxLength: 11, format: 'XXX XXXX XXXX' },
  { code: '+91', country: 'India', flag: '🇮🇳', maxLength: 10, format: 'XXXXX XXXXX' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', maxLength: 9, format: 'XXX XXX XXX' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', maxLength: 11, format: '(XX) XXXXX-XXXX' },
];

interface PhoneInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder = "Enter phone number"
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract phone number without country code
  const phoneNumber = value.startsWith(selectedCountry.code) 
    ? value.substring(selectedCountry.code.length).replace(/\s+/g, '')
    : value.replace(/\s+/g, '');

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    
    // Update the full phone number with new country code
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    const newValue = cleanNumber ? `${country.code} ${cleanNumber}` : country.code;
    
    // Create synthetic event
    const syntheticEvent = {
      target: {
        name,
        value: newValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove all non-digit characters
    const digitsOnly = inputValue.replace(/[^\d]/g, '');
    
    // Limit to max length for selected country
    const limitedDigits = digitsOnly.substring(0, selectedCountry.maxLength);
    
    // Format the full phone number
    const fullPhoneNumber = limitedDigits ? `${selectedCountry.code} ${limitedDigits}` : selectedCountry.code;
    
    // Create synthetic event with full phone number
    const syntheticEvent = {
      target: {
        name,
        value: fullPhoneNumber
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  return (
    <div className="mb-8">
      <label className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <div className="flex items-end">
        {/* Country Code Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              flex items-center px-4 py-4 border-0 border-b-2 bg-transparent
              text-white-knight font-jakarta focus:outline-none text-lg
              transition-colors duration-200 h-[60px]
              ${error ? 'border-red-500' : 'border-guardian/40 hover:border-guardian/60 focus:border-supernova'}
              mr-2 min-w-[120px]
            `}
          >
            <span className="mr-2">{selectedCountry.flag}</span>
            <span className="mr-2">{selectedCountry.code}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-64 bg-shadowforce border border-guardian/30 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {countryCodes.map((country, index) => (
                <button
                  key={`${country.code}-${country.country}-${index}`}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-3 text-left hover:bg-guardian/10 focus:bg-guardian/10 focus:outline-none transition-colors flex items-center"
                >
                  <span className="mr-3">{country.flag}</span>
                  <span className="mr-3 text-supernova font-medium">{country.code}</span>
                  <span className="text-white-knight text-sm">{country.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Phone Number Input */}
        <input
          type="tel"
          name={name}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className={`
            flex-1 border-0 border-b-2 px-0 py-4 text-lg h-[60px]
            bg-transparent text-white-knight placeholder-guardian/60 font-jakarta
            focus:ring-0 focus:border-supernova transition-colors duration-200
            ${error ? 'border-red-500' : 'border-guardian/40 hover:border-guardian/60'}
          `}
        />
      </div>
      
      <div className="flex justify-end mt-2">
        <div className="text-xs text-guardian/60 font-jakarta">
          {phoneNumber.length}/{selectedCountry.maxLength}
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{error}</p>
      )}
    </div>
  );
};

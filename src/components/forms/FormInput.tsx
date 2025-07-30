import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  isPasswordMatch?: boolean;
  showPasswordMatch?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  hint,
  id,
  className = '',
  showPasswordToggle = false,
  isPasswordMatch,
  showPasswordMatch = false,
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label || '').toLowerCase().replace(/\s+/g, '-');
  
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-8">
      <label 
        htmlFor={inputId} 
        className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={`
            block w-full border-0 border-b-2 px-0 py-4 text-lg
            bg-transparent text-white-knight placeholder-guardian/60 font-jakarta
            focus:ring-0 focus:border-supernova transition-colors duration-200
            ${error ? 'border-red-500' : 'border-guardian/40 hover:border-guardian/60'}
            ${showPasswordToggle ? 'pr-12' : ''}
            ${className}
          `}
          {...props}
        />
        
        {/* Password Toggle Button */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-guardian hover:text-supernova transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        )}
        

      </div>
      
      {/* Password Match Message */}
      {showPasswordMatch && isPasswordMatch !== undefined && props.value && (
        <p className={`mt-2 text-sm font-jakarta font-medium ${
          isPasswordMatch ? 'text-green-400' : 'text-red-400'
        }`}>
          {isPasswordMatch ? 'Passwords match' : 'Passwords do not match'}
        </p>
      )}
      
      {hint && !error && !showPasswordMatch && (
        <p className="mt-2 text-sm text-guardian/80 font-jakarta">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{error}</p>
      )}
    </div>
  );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="mb-8">
      <label 
        htmlFor={inputId} 
        className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        className={`
          block w-full border-0 border-b-2 px-0 py-4 text-lg
          bg-transparent text-white-knight placeholder-guardian/60 font-jakarta
          focus:ring-0 focus:border-supernova transition-colors duration-200 resize-none
          ${error ? 'border-red-500' : 'border-guardian/40 hover:border-guardian/60'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="mt-2 text-sm text-guardian/80 font-jakarta">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{error}</p>
      )}
    </div>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  hint?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  options,
  error,
  hint,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="mb-8">
      <label 
        htmlFor={inputId} 
        className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide"
      >
        {label}
      </label>
      <select
        id={inputId}
        className={`
          block w-full border-0 border-b-2 px-0 py-4 text-lg
          bg-transparent font-jakarta
          focus:ring-0 focus:border-supernova transition-colors duration-200
          ${props.disabled ? 'text-guardian/60 cursor-not-allowed' : 'text-white-knight'}
          ${error ? 'border-red-500' : 'border-guardian/40 hover:border-guardian/60'}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            className={option.value === '' ? "bg-shadowforce text-guardian/60 font-jakarta" : "bg-shadowforce text-white-knight font-jakarta"}
          >
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="mt-2 text-sm text-guardian/80 font-jakarta">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{error}</p>
      )}
    </div>
  );
};
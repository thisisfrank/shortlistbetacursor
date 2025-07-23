import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
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
      <input
        id={inputId}
        className={`
          block w-full border-0 border-b-2 px-0 py-4 text-lg
          bg-transparent text-white-knight placeholder-guardian/60 font-jakarta
          focus:ring-0 focus:border-supernova transition-colors duration-200
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
          bg-transparent text-white-knight font-jakarta
          focus:ring-0 focus:border-supernova transition-colors duration-200
          ${error ? 'border-red-500' : 'border-guardian/40 hover:border-guardian/60'}
          ${className}
        `}
        {...props}
      >
        <option value="" className="bg-shadowforce text-guardian/60">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-shadowforce text-white-knight">
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
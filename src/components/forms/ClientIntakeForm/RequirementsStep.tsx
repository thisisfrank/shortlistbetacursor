import React, { useState } from 'react';
import { FormInput, FormSelect } from '../FormInput';
import { Button } from '../../ui/Button';
import { useData } from '../../../context/DataContext';
import { X, Plus } from 'lucide-react';

interface RequirementsStepProps {
  formData: {
    title: string;
    city: string;
    state: string;
    isRemote: boolean;
    salaryRangeMin: string;
    salaryRangeMax: string;
    keySellingPoints: string[];
    candidatesRequested: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSellingPointsChange: (points: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}

export const RequirementsStep: React.FC<RequirementsStepProps> = ({
  formData,
  onChange,
  onSellingPointsChange,
  onNext,
  onBack,
  errors
}) => {
  const { tiers } = useData();
  const [newPoint, setNewPoint] = useState('');
  
  // Get free tier for displaying limits
  const freeTier = tiers.find(tier => tier.name === 'Free');
  const maxCandidates = freeTier?.monthlyCandidateAllotment || 20;

  // US States options
  const stateOptions = [
    { value: '', label: 'Select State' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' }
  ];

  // Format number with commas and currency symbol
  const formatCurrency = (value: string): string => {
    // Remove all non-digits
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format with commas
    const numberValue = parseInt(numericValue, 10);
    if (isNaN(numberValue)) return '';
    
    // Add commas for thousands
    const formattedNumber = numberValue.toLocaleString('en-US');
    return `$${formattedNumber}`;
  };

  // Handle salary input changes with formatting
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatCurrency(value);
    
    // Call onChange with a properly constructed event-like object
    onChange({
      target: {
        name,
        value: formattedValue
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const addSellingPoint = () => {
    if (newPoint.trim() && formData.keySellingPoints.length < 5) {
      onSellingPointsChange([...formData.keySellingPoints, newPoint.trim()]);
      setNewPoint('');
    }
  };

  const removeSellingPoint = (index: number) => {
    const updatedPoints = [...formData.keySellingPoints];
    updatedPoints.splice(index, 1);
    onSellingPointsChange(updatedPoints);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSellingPoint();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-anton text-guardian mb-12 uppercase tracking-wide">Job Requirements</h2>
      
      <div>
        <div className="grid grid-cols-2 gap-8 mb-2">
          <FormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={onChange}
            error={errors.city}
            required={!formData.isRemote}
            disabled={formData.isRemote}
            placeholder={formData.isRemote ? "Not required for remote positions" : "Enter city name"}
          />
          
          <FormSelect
            label="State"
            name="state"
            value={formData.state}
            onChange={onChange}
            options={stateOptions}
            error={errors.state}
            required={!formData.isRemote}
            disabled={formData.isRemote}
          />
        </div>
        
        <div className="flex items-center mb-12">
          <input
            type="checkbox"
            id="isRemote"
            name="isRemote"
            checked={formData.isRemote}
            onChange={onChange}
            className="w-5 h-5 text-supernova bg-gray-700 border-gray-600 rounded focus:ring-supernova focus:ring-2"
          />
          <label htmlFor="isRemote" className="ml-3 text-sm font-jakarta font-semibold text-guardian uppercase tracking-wide">
            Remote Position
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <FormInput
          label="Minimum Salary (USD)"
          name="salaryRangeMin"
          type="text"
          value={formData.salaryRangeMin}
          onChange={handleSalaryChange}
          error={errors.salaryRangeMin}
          required
          placeholder="$50,000"
        />
        
        <FormInput
          label="Maximum Salary (USD)"
          name="salaryRangeMax"
          type="text"
          value={formData.salaryRangeMax}
          onChange={handleSalaryChange}
          error={errors.salaryRangeMax}
          required
          placeholder="$80,000"
        />
      </div>
      
      <div className="mb-8">
        <label className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide">
          Key Selling Points / Benefits
        </label>
        
        <div className="flex gap-3">
          <input
            type="text"
            value={newPoint}
            onChange={(e) => setNewPoint(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add up to 5 benefits or reasons candidates should apply"
            className="flex-1 border-0 border-b-2 px-0 py-4 text-lg bg-transparent text-white-knight placeholder-guardian/60 font-jakarta focus:ring-0 focus:border-supernova transition-colors duration-200 border-guardian/40 hover:border-guardian/60"
          />
          <Button
            type="button"
            onClick={addSellingPoint}
            variant="outline"
            size="md"
            disabled={!newPoint.trim() || formData.keySellingPoints.length >= 5}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            ADD
          </Button>
        </div>
        
        {errors.keySellingPoints && (
          <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{errors.keySellingPoints}</p>
        )}

        {formData.keySellingPoints.length > 0 && (
          <div className="mt-6 space-y-3">
            {formData.keySellingPoints.map((point, index) => (
              <div 
                key={index}
                className="flex items-center bg-supernova/10 border border-supernova/30 p-4 rounded-lg hover:bg-supernova/20 transition-colors"
              >
                <span className="flex-1 text-white-knight font-jakarta font-medium">{point}</span>
                <button
                  type="button"
                  onClick={() => removeSellingPoint(index)}
                  className="text-guardian hover:text-red-400 transition-colors ml-3"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex pt-8 gap-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
          size="lg"
        >
          BACK
        </Button>
        <Button 
          type="submit"
          className="flex-1"
          size="lg"
          disabled={formData.keySellingPoints.length === 0}
        >
          CONTINUE
        </Button>
      </div>
    </form>
  );
};
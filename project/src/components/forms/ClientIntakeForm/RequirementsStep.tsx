import React, { useState } from 'react';
import { FormInput } from '../FormInput';
import { Button } from '../../ui/Button';
import { useData } from '../../../context/DataContext';
import { X, Plus } from 'lucide-react';

interface RequirementsStepProps {
  formData: {
    location: string;
    salaryRangeMin: string;
    salaryRangeMax: string;
    keySellingPoints: string[];
    candidatesRequested: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const addSellingPoint = () => {
    if (newPoint.trim() && formData.keySellingPoints.length < 10) {
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
      
      <FormInput
        label="Location"
        name="location"
        value={formData.location}
        onChange={onChange}
        error={errors.location}
        required
        placeholder="Enter job location or 'Remote' for remote positions"
      />
      
      <div className="grid grid-cols-2 gap-8">
        <FormInput
          label="Minimum Salary (USD)"
          name="salaryRangeMin"
          type="number"
          value={formData.salaryRangeMin}
          onChange={onChange}
          error={errors.salaryRangeMin}
          required
          placeholder="50,000"
        />
        
        <FormInput
          label="Maximum Salary (USD)"
          name="salaryRangeMax"
          type="number"
          value={formData.salaryRangeMax}
          onChange={onChange}
          error={errors.salaryRangeMax}
          required
          placeholder="80,000"
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
            placeholder="Add benefits or selling points"
            className="flex-1 border-0 border-b-2 px-0 py-4 text-lg bg-transparent text-white-knight placeholder-guardian/60 font-jakarta focus:ring-0 focus:border-supernova transition-colors duration-200 border-guardian/40 hover:border-guardian/60"
          />
          <Button
            type="button"
            onClick={addSellingPoint}
            variant="outline"
            size="md"
            disabled={!newPoint.trim() || formData.keySellingPoints.length >= 10}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            ADD
          </Button>
        </div>
        
        {errors.keySellingPoints && (
          <p className="mt-2 text-sm text-red-400 font-jakarta font-medium">{errors.keySellingPoints}</p>
        )}
        
        <p className="mt-2 text-sm text-guardian/80 font-jakarta">
          Add up to 10 benefits or reasons candidates should apply
        </p>

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
import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import { Button } from './Button';

interface FeedbackFormData {
  scaleRating: number | null;
  leastFavorite: string;
  favorite: string;
  suggestions: string;
  timeSaved: string;
  mostValuableFeature: string;
  otherFeature: string;
  futureNeeds: string;
}

interface GeneralFeedbackModalProps {
  isOpen: boolean;
  feedback: string;
  isSubmitting: boolean;
  onClose: () => void;
  onFeedbackChange: (feedback: string) => void;
  onSubmit: () => void;
}

export const GeneralFeedbackModal: React.FC<GeneralFeedbackModalProps> = ({
  isOpen,
  feedback,
  isSubmitting,
  onClose,
  onFeedbackChange,
  onSubmit
}) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    scaleRating: null,
    leastFavorite: '',
    favorite: '',
    suggestions: '',
    timeSaved: '',
    mostValuableFeature: '',
    otherFeature: '',
    futureNeeds: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (field: keyof FeedbackFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.scaleRating !== null &&
           formData.leastFavorite.trim() !== '' &&
           formData.favorite.trim() !== '' &&
           formData.suggestions.trim() !== '' &&
           formData.timeSaved !== '' &&
           formData.mostValuableFeature !== '' &&
           formData.futureNeeds.trim() !== '' &&
           (formData.mostValuableFeature !== 'other' || formData.otherFeature.trim() !== '');
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      // Convert form data to feedback string for compatibility
      const feedbackText = `
Scale Rating: ${formData.scaleRating}/10
Least Favorite: ${formData.leastFavorite}
Favorite Part: ${formData.favorite}
Suggestions: ${formData.suggestions}
Time Saved: ${formData.timeSaved} hours per week
Most Valuable Feature: ${formData.mostValuableFeature}${formData.mostValuableFeature === 'other' ? ` - ${formData.otherFeature}` : ''}
Future Needs: ${formData.futureNeeds}
      `.trim();
      
      onFeedbackChange(feedbackText);
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shadowforce border border-guardian/30 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative mb-6">
          <div className="text-center">
            <h3 className="text-3xl font-anton text-white-knight uppercase tracking-wide mb-2">
              We'd love your feedback
            </h3>
            <p className="text-guardian font-jakarta">
              Share your thoughts and get 50 free candidates!
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-guardian hover:text-white-knight transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          {/* 1. Scale Rating */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-4">
              1. On a scale of 1–10, how likely are you to share this app with your friends or colleagues? *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleInputChange('scaleRating', rating)}
                  className={`w-12 h-12 rounded-full border-2 transition-all duration-200 font-jakarta font-bold ${
                    formData.scaleRating === rating
                      ? 'bg-supernova border-supernova text-shadowforce'
                      : 'border-guardian/30 text-guardian hover:border-supernova hover:text-supernova'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Least Favorite Part */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
              2. What's your least favorite part of the app and why? *
            </label>
            <textarea
              value={formData.leastFavorite}
              onChange={(e) => handleInputChange('leastFavorite', e.target.value)}
              placeholder="Please share what you find most challenging or least enjoyable..."
              className="w-full p-4 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta resize-vertical min-h-[100px]"
              rows={4}
            />
          </div>

          {/* 3. Favorite Part */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
              3. What's your favorite part of the app and why? *
            </label>
            <textarea
              value={formData.favorite}
              onChange={(e) => handleInputChange('favorite', e.target.value)}
              placeholder="Tell us what you love most about the platform..."
              className="w-full p-4 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta resize-vertical min-h-[100px]"
              rows={4}
            />
          </div>

          {/* 4. Suggestions */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
              4. Please share your suggestions, feature requests, or other general feedback *
            </label>
            <textarea
              value={formData.suggestions}
              onChange={(e) => handleInputChange('suggestions', e.target.value)}
              placeholder="Share your ideas for improvements, new features, or general thoughts..."
              className="w-full p-4 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta resize-vertical min-h-[100px]"
              rows={4}
            />
          </div>

          {/* 5. Time Saved */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-4">
              5. Per week, how many hours of candidate sourcing time does this save you? *
            </label>
            <div className="flex gap-4 justify-center flex-wrap">
              {['0-2', '3-5', '6-10', '10+'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleInputChange('timeSaved', option)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 font-jakarta font-semibold ${
                    formData.timeSaved === option
                      ? 'bg-supernova border-supernova text-shadowforce'
                      : 'border-guardian/30 text-guardian hover:border-supernova hover:text-supernova'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Feature Relevance */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-4">
              6. Which feature do you find most valuable right now? *
            </label>
            <div className="space-y-3">
              {[
                { value: 'sourcing', label: 'Candidate sourcing automation' },
                { value: 'templates', label: 'Outreach templates' },
                { value: 'scheduling', label: 'Candidate scheduling' },
                { value: 'reporting', label: 'Reporting/metrics' },
                { value: 'other', label: 'Other' }
              ].map((feature) => (
                <label key={feature.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="mostValuableFeature"
                    value={feature.value}
                    checked={formData.mostValuableFeature === feature.value}
                    onChange={(e) => handleInputChange('mostValuableFeature', e.target.value)}
                    className="w-4 h-4 text-supernova bg-shadowforce-light border-guardian/30 focus:ring-supernova"
                  />
                  <span className="text-white-knight font-jakarta">{feature.label}</span>
                </label>
              ))}
            </div>
            {formData.mostValuableFeature === 'other' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={formData.otherFeature}
                  onChange={(e) => handleInputChange('otherFeature', e.target.value)}
                  placeholder="Please specify..."
                  className="w-full p-3 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta"
                />
              </div>
            )}
          </div>

          {/* 7. Future Needs */}
          <div>
            <label className="block text-sm font-jakarta font-semibold text-supernova uppercase tracking-wide mb-3">
              7. If we could build one feature that would save you the most time or get you better candidates, what would it be? *
            </label>
            <textarea
              value={formData.futureNeeds}
              onChange={(e) => handleInputChange('futureNeeds', e.target.value)}
              placeholder="Describe the feature that would make the biggest impact for you..."
              className="w-full p-4 bg-shadowforce-light border border-guardian/30 rounded-lg text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta resize-vertical min-h-[100px]"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-center mt-8 pt-6 border-t border-guardian/20">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            isLoading={isSubmitting}
            className="px-8 glow-supernova flex items-center gap-2"
          >
            <Gift size={20} />
            {isSubmitting ? 'SUBMITTING...' : 'UNLOCK MY CANDIDATE CONVERSION KIT'}
          </Button>
        </div>

        {!isFormValid() && (
          <p className="text-center text-guardian/60 text-sm mt-3 font-jakarta">
            All fields are required to unlock your conversion kit
          </p>
        )}
      </div>
    </div>
  );
};

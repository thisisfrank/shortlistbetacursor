# Landing Page Right Side - Candidate Preview Component

This is the right-side candidate preview code from the LandingPage.tsx component (lines 100-188).

```tsx
{/* Right: Detailed Candidate Preview */}
<div className="flex-1 flex flex-col justify-center max-w-lg mx-auto">
  <div className="space-y-2">

    
    {/* Detailed Candidate Card */}
    <Card className="transform transition-all duration-1000 hover:scale-105 border-l-4 border-l-supernova bg-gradient-to-r from-shadowforce to-shadowforce-light animate-fade-in-up">
      <CardContent className="p-3">
        {/* Header with Match Score and Name */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Target className="text-supernova mr-2" size={14} />
            <div className="text-lg font-anton text-supernova">94%</div>
            <div className="text-xs text-guardian font-jakarta ml-1">MATCH</div>
          </div>
        </div>
        
        <h4 className="text-lg font-anton text-white-knight mb-2 uppercase tracking-wide">
          Sarah Chen
        </h4>
        
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-shadowforce rounded-lg">
          <div>
            <div className="flex items-center mb-1">
              <Briefcase size={10} className="text-supernova mr-1" />
              <span className="text-xs font-jakarta font-semibold text-supernova uppercase tracking-wide">Role</span>
            </div>
            <p className="text-white-knight font-jakarta text-xs font-medium">
              Sr Engineer at Google
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              <MapPin size={10} className="text-supernova mr-1" />
              <span className="text-xs font-jakarta font-semibold text-supernova uppercase tracking-wide">Location</span>
            </div>
            <p className="text-white-knight font-jakarta text-xs font-medium">
              San Francisco, CA
            </p>
          </div>
        </div>
        
        {/* AI Summary */}
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <Zap size={10} className="text-blue-400 mr-1 transition-transform duration-300 hover:scale-110" />
            <p className="text-xs font-jakarta font-semibold text-blue-400 uppercase tracking-wide">AI Summary</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-2 rounded-lg hover:from-blue-500/15 hover:to-blue-500/8 hover:border-blue-500/30 transition-all duration-300 hover:scale-102 cursor-pointer hover:shadow-lg">
            <div className="text-white-knight font-jakarta text-xs leading-relaxed">
              Full-stack engineer with React/Node.js expertise. Led 3 product launches at Google, scaling to 10M+ users.
            </div>
          </div>
        </div>
        
        {/* Recent Experience */}
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <Briefcase size={10} className="text-green-400 mr-1 transition-transform duration-300 hover:scale-110" />
            <p className="text-xs font-jakarta font-semibold text-green-400 uppercase tracking-wide">Experience</p>
          </div>
          <div className="space-y-1">
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-2 rounded-lg hover:from-green-500/15 hover:to-green-500/8 hover:border-green-500/30 transition-all duration-300 hover:scale-102 cursor-pointer hover:shadow-lg">
              <p className="font-jakarta font-medium text-white-knight text-xs">Google • 2021 - Present</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-2 rounded-lg hover:from-green-500/15 hover:to-green-500/8 hover:border-green-500/30 transition-all duration-300 hover:scale-102 cursor-pointer hover:shadow-lg">
              <p className="font-jakarta font-medium text-white-knight text-xs">Facebook • 2019 - 2021</p>
            </div>
          </div>
        </div>
        
        {/* Education */}
        <div>
          <div className="flex items-center mb-1">
            <GraduationCap size={10} className="text-purple-400 mr-1 transition-transform duration-300 hover:scale-110" />
            <p className="text-xs font-jakarta font-semibold text-purple-400 uppercase tracking-wide">Education</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-2 rounded-lg hover:from-purple-500/15 hover:to-purple-500/8 hover:border-purple-500/30 transition-all duration-300 hover:scale-102 cursor-pointer hover:shadow-lg">
            <p className="font-jakarta font-medium text-white-knight text-xs">MS Computer Science, Stanford</p>
          </div>
        </div>
      </CardContent>
    </Card>
    

  </div>
</div>
```

## Required Imports

This component requires the following imports:

```tsx
import { Card, CardContent } from '../components/ui/Card';
import { Target, MapPin, Briefcase, Zap, GraduationCap } from 'lucide-react';
```

## Features

- **Match Score**: Shows 94% match with Target icon
- **Candidate Info**: Name, role, and location in a grid layout
- **AI Summary**: Blue-themed section with hover effects
- **Experience**: Green-themed expandable experience cards
- **Education**: Purple-themed education information
- **Hover Effects**: Scale animations and color transitions
- **Responsive Design**: Works on mobile and desktop

## Styling Notes

- Uses custom color classes: `supernova`, `shadowforce`, `white-knight`, `guardian`
- Font families: `font-anton` for headings, `font-jakarta` for body text
- Gradient backgrounds and hover states throughout
- Border-left accent in `supernova` color

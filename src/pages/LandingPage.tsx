import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import BoltIcon from '../assets/v2.png';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, Check, Target, MapPin, Briefcase, Zap, GraduationCap } from 'lucide-react';
import Image3 from '../assets/image (3).png';
import Image4 from '../assets/image (4).png';
import Image5 from '../assets/image (5).png';
import Illustration18 from '../assets/18 ILLUSTRATION (1) (1).png';

export const LandingPage: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-shadowforce flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supernova mx-auto mb-4"></div>
          <p className="text-guardian font-jakarta">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to their role-specific page
  if (user && userProfile) {
    switch (userProfile.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'sourcer':
        return <Navigate to="/sourcer" replace />;
      case 'client':
        return <Navigate to="/client" replace />;
      default:
        return <Navigate to="/client" replace />;
    }
  }

  // Show public landing page for unauthenticated users
  return (
    <div className="min-h-screen">
      {/* Hero + Choose Role + Testimonial Section (shared gradient) */}
      <div className="bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
        <div className="relative py-8 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-stretch">
            {/* Left: Hero */}
            <div className="flex-1 flex flex-col justify-center items-start text-left">
              <div className="mb-6">
                <img
                  src={BoltIcon}
                  alt="Lightning Bolt"
                  className="animate-pulse"
                  style={{ width: '150px', height: '62px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-anton text-white-knight mb-4 leading-tight">
              GET HIGH-QUALITY
                <span className="block text-supernova">CANDIDATES, FAST!</span>
              </h1>
              <p className="text-lg md:text-xl text-guardian max-w-3xl mb-6 font-jakarta leading-relaxed">
              Hire faster. Hire smarter. Cut costs 
                <span className="text-supernova font-bold"> - all without lifting a finger</span>.
              </p>
              <div className="flex flex-col gap-2 mb-8 max-w-2xl">
                <div className="flex items-center"><Check className="text-supernova mr-3 flex-shrink-0" size={18} /><span className="text-white-knight font-jakarta">Submit job requirements</span></div>
                <div className="flex items-center"><Check className="text-supernova mr-3 flex-shrink-0" size={18} /><span className="text-white-knight font-jakarta">Get detailed candidate profiles </span></div>
                <div className="flex items-center"><Check className="text-supernova mr-3 flex-shrink-0" size={18} /><span className="text-white-knight font-jakarta">Interview candidates not active on job boards</span></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 mb-4">
                <div className="flex flex-col items-center gap-4">
                  <Button 
                    onClick={() => window.location.href = '/signup'}
                    size="lg"
                    className="glow-supernova text-xl px-12 py-6"
                  >
                    Get My First Candidate List Free
                  </Button>
                  
                  {/* Quality Guarantee Badge */}
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-supernova/20 to-supernova/10 border border-supernova/30 rounded-full">
                    <Check className="text-supernova mr-2" size={16} />
                    <span className="text-supernova font-jakarta font-semibold text-sm uppercase tracking-wide">
                      100% Quality Guaranteed
                    </span>
                  </div>
                  
                  <a 
                    href="/login" 
                    className="text-supernova hover:text-supernova/80 font-jakarta text-lg transition-colors duration-200"
                  >
                    Sign In
                  </a>
                </div>
              </div>
            </div>
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
          </div>
        </div>
        {/* Testimonial Section */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-anton text-white-knight mb-10 uppercase tracking-wide">
            TRUSTED BY RECRUITERS, FOUNDERS, AND HIRING MANAGERS            </h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center mb-12">
                <img src={Image3} alt="Testimonial 1" className="max-w-xs object-contain shadow-lg rounded-lg" />
                <img src={Image4} alt="Testimonial 2" className="max-w-xs object-contain shadow-lg rounded-lg" />
                <img src={Image5} alt="Testimonial 3" className="max-w-xs object-contain shadow-lg rounded-lg" />
              </div>
              
              {/* Why You'll Love It Section */}
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-anton text-white-knight mb-8 uppercase tracking-wide">
                Why You’ll Love The Shortlist
                </h3>
                <div className="space-y-6 text-left">
                  <div className="flex items-start">
                    <Check className="text-supernova mr-3 flex-shrink-0 mt-1" size={20} />
                    <p className="text-lg text-white font-jakarta leading-relaxed">
                    Get high-quality candidates delivered straight to your inbox - for any role.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Check className="text-supernova mr-3 flex-shrink-0 mt-1" size={20} />
                    <p className="text-lg text-white font-jakarta leading-relaxed">
                    Skip the hours of research, list building, and endless LinkedIn scrolling.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Check className="text-supernova mr-3 flex-shrink-0 mt-1" size={20} />
                    <p className="text-lg text-white font-jakarta leading-relaxed">
                    Save thousands on tools, job boards, and LinkedIn Recruiter.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Check className="text-supernova mr-3 flex-shrink-0 mt-1" size={20} />
                    <p className="text-lg text-white font-jakarta leading-relaxed">
                    Focus your time on choosing the right candidate, not finding them.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* FAQ Section */}
              <div className="max-w-4xl mx-auto mt-16">
                <h3 className="text-2xl md:text-3xl font-anton text-white-knight mb-8 uppercase tracking-wide text-center">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-6">
                  {/* FAQ Item 1 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                    How does the Shortlist improve my hiring process?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    We source, score, and prioritize candidates your job ads will never reach – then we arm you with proven email and LinkedIn copy to turn those candidates into interviews.
                    </p>
                  </div>
                  
                  {/* FAQ Item 2 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      Can I try it for free?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      Yes, your first 20 candidates are on us.
                    </p>
                  </div>
                  
                  {/* FAQ Item 3 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      Who is the Shorlist best for?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    Hiring managers, recruiters, and founders who want high-quality candidates - without wasting time on job boards or sifting through AI-generated resumes.
                    </p>
                  </div>
                  
                  {/* FAQ Item 4 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      How fast can you start?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    Immediately. Get your first 20 free candidates today and start interviewing talent your competitors can’t reach.
                    </p>
                  </div>
                  
                  {/* FAQ Item 5 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                    Can the Shortlist save me time and lower my cost per hire?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    Absolutely. By helping you identify, engage, and convert the right candidates - without job boards or referrals - we cut both your time-to-hire and recruiting spend.
                    </p>
                  </div>
                  
                  {/* FAQ Item 6 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                    How do you protect candidate data?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    We follow strict security standards. Your data and candidate information is never shared or sold.                    </p>
                  </div>
                  
                  {/* FAQ Item 7 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      How long does it take to receive candidates?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      Most users get a shortlist in under 12 hours. You'll also receive an email the moment your list is ready.
                    </p>
                  </div>
                  
                  {/* FAQ Item 8 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      How many candidates will I receive?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      It depends on how many you request when entering your position - you have complete control over the number of candidates you get.
                    </p>
                  </div>
                  
                  {/* FAQ Item 9 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      What if I'm not seeing the right candidates?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      Provide feedback, adjust your job description, or update keywords. The more details you share, the better your results.
                    </p>
                  </div>
                  
                  {/* FAQ Item 10 */}
                  <div className="pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      How do I know when new candidates are submitted?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      You'll get an email notification right away, and you can always check your dashboard to view the latest profiles and their match scores.
                    </p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
      {/* CTA Section remains unchanged */}
      <div className="py-20 px-4 bg-gradient-to-r from-supernova/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-anton text-white-knight mb-6 uppercase tracking-wide">
            READY TO GET STARTED?
          </h2>
          <p className="text-xl text-guardian mb-8 font-jakarta">
            Start using AI to transform their hiring process
          </p>
          <Button 
            onClick={() => window.location.href = '/signup'}
            size="lg"
            className="glow-supernova text-xl px-12 py-6"
          >
            Get My First Candidate List Free
          </Button>
          
          {/* Quality Guarantee Badge */}
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-supernova/20 to-supernova/10 border border-supernova/30 rounded-full">
              <Check className="text-supernova mr-2" size={16} />
              <span className="text-supernova font-jakarta font-semibold text-sm uppercase tracking-wide">
                100% Quality Guaranteed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
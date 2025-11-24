import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Check, Play } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-stretch">
            {/* Left: Hero */}
            <div className="flex-[1] flex flex-col justify-center items-start text-left">
              <div className="mb-6">
                <img
                  src="/screenshots/v2.png"
                  alt="Lightning Bolt"
                  className="animate-pulse"
                  style={{ width: '150px', height: '62px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
                />
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-anton text-white-knight mb-4 leading-tight">
              GET HIGH-QUALITY
                <span className="block text-supernova">CANDIDATES, FAST!</span>
              </h1>
              <div className="flex flex-col gap-2 mb-8 max-w-2xl">
                <div className="flex items-center"><Check className="text-supernova mr-3 flex-shrink-0" size={18} /><span className="text-white-knight font-jakarta">Get high-quality candidates delivered straight to your inbox</span></div>
                <div className="flex items-center"><Check className="text-supernova mr-3 flex-shrink-0" size={18} /><span className="text-white-knight font-jakarta">Skip hours of candidate list-building and endless scrolling</span></div>
                <div className="flex items-center"><Check className="text-supernova mr-3 flex-shrink-0" size={18} /><span className="text-white-knight font-jakarta">Save thousands on tools, job boards, and LinkedIn Recruiter</span></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 mb-4">
                <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                  <Button 
                    onClick={() => window.location.href = '/signup'}
                    size="lg"
                    className="glow-supernova text-base md:text-xl px-6 py-4 md:px-12 md:py-6 w-full sm:w-auto"
                  >
                     Get My First 50 Candidates Free
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
            {/* Right: Demo Video */}
            <div className="flex-[1.5] flex flex-col justify-center w-full">
              <div className="space-y-4">
                {/* Video Container */}
                <div className="relative bg-gradient-to-r from-shadowforce to-shadowforce-light rounded-lg overflow-hidden border-l-4 border-l-supernova shadow-2xl">
                  {/* Video Player */}
                  <div className="aspect-video relative">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      poster="/screenshots/Candidate Info Display.png"
                      preload="metadata"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => setIsVideoPlaying(false)}
                    >
                      <source src="/screenshots/Shortlist Promo 2 Audio.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Play Icon Overlay */}
                    {!isVideoPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200 cursor-pointer"
                           onClick={(e) => {
                             const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
                             video?.play();
                           }}>
                        <div className="bg-supernova/90 hover:bg-supernova rounded-full p-4 shadow-lg transform hover:scale-110 transition-transform duration-200">
                          <Play className="text-shadowforce" size={48} fill="currentColor" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
                
                {/* Alternative: YouTube/Vimeo Embed (commented out) */}
                {/* 
                <div className="relative bg-gradient-to-r from-shadowforce to-shadowforce-light rounded-lg overflow-hidden border-l-4 border-l-supernova shadow-2xl">
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                      title="The Shortlist Demo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>
        </div>
        {/* Testimonial Section */}
        <div className="py-8 md:py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-anton text-white-knight mb-6 md:mb-10 uppercase tracking-wide">
            TRUSTED BY RECRUITERS, FOUNDERS, AND HIRING MANAGERS            </h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center mb-8 md:mb-12">
                <img src="/screenshots/image (3).png" alt="Testimonial 1" className="w-full max-w-sm md:max-w-xs object-contain shadow-lg rounded-lg" />
                <img src="/screenshots/image (4).png" alt="Testimonial 2" className="w-full max-w-sm md:max-w-xs object-contain shadow-lg rounded-lg" />
                <img src="/screenshots/image (5).png" alt="Testimonial 3" className="w-full max-w-sm md:max-w-xs object-contain shadow-lg rounded-lg" />
              </div>
              
              {/* How it Works Section */}
              <div className="max-w-6xl mx-auto px-4">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-anton text-white-knight mb-12 md:mb-16 uppercase tracking-wide text-center">
                How it Works
                </h3>
                
                {/* Timeline Container */}
                <div className="relative py-8 md:py-20">
                  {/* Horizontal Timeline Line - Desktop Only */}
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-supernova/30 transform -translate-y-1/2"></div>
                  
                  {/* Timeline Points Container */}
                  <div className="relative flex flex-col md:flex-row justify-between items-stretch md:items-center max-w-6xl mx-auto gap-6 md:gap-0">
                    
                    {/* Stage 1 */}
                    <div className="flex md:flex-col items-center md:w-1/3 relative md:pt-20 gap-4">
                      {/* Bubble */}
                      <div className="relative md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-10 flex-shrink-0">
                        <div className="bg-supernova text-shadowforce rounded-full w-10 h-10 md:w-16 md:h-16 flex items-center justify-center font-anton font-bold text-lg md:text-2xl shadow-lg">
                          1
                        </div>
                      </div>
                      
                      {/* Text */}
                      <p className="text-sm md:text-base lg:text-lg text-white font-jakarta leading-relaxed text-left md:text-center px-2 md:px-4 md:mt-16 md:mt-20">
                        Submit job requirements
                      </p>
                    </div>
                    
                    {/* Stage 2 */}
                    <div className="flex md:flex-col items-center md:w-1/3 relative md:pb-20 gap-4">
                      {/* Bubble */}
                      <div className="relative md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-10 flex-shrink-0 md:order-last">
                        <div className="bg-supernova text-shadowforce rounded-full w-10 h-10 md:w-16 md:h-16 flex items-center justify-center font-anton font-bold text-lg md:text-2xl shadow-lg">
                          2
                        </div>
                      </div>
                      
                      {/* Text above on desktop, inline on mobile */}
                      <p className="text-sm md:text-base lg:text-lg text-white font-jakarta leading-relaxed text-left md:text-center px-2 md:px-4 md:mb-16 md:mb-20 md:order-first">
                        Get high-quality candidates sent to you
                      </p>
                    </div>
                    
                    {/* Stage 3 */}
                    <div className="flex md:flex-col items-center md:w-1/3 relative md:pt-20 gap-4">
                      {/* Bubble */}
                      <div className="relative md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-10 flex-shrink-0">
                        <div className="bg-supernova text-shadowforce rounded-full w-10 h-10 md:w-16 md:h-16 flex items-center justify-center font-anton font-bold text-lg md:text-2xl shadow-lg">
                          3
                        </div>
                      </div>
                      
                      {/* Text */}
                      <p className="text-sm md:text-base lg:text-lg text-white font-jakarta leading-relaxed text-left md:text-center px-2 md:px-4 md:mt-16 md:mt-20">
                        Interview quality people not active on job boards
                      </p>
                    </div>
                    
                  </div>
                </div>
              </div>
              
              {/* FAQ Section */}
              <div className="max-w-4xl mx-auto mt-12 md:mt-16">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-anton text-white-knight mb-6 md:mb-8 uppercase tracking-wide text-center">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4 md:space-y-6">
                  {/* FAQ Item 1 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                    How does the Shortlist improve my hiring process?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    You get high-quality candidates sourced, scored, and sent directly to you - so you don’t have to rely on job boards or spend hours building candidate lists yourself.
                    </p>
                  </div>
                  
                  {/* FAQ Item 2 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                      Can I try it for free?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      Yes, your first 50 candidates are on us!
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
                  
                  {/* FAQ Item 6 */}
                  <div className="border-b border-guardian/20 pb-6">
                    <h4 className="text-lg font-anton text-supernova mb-3 uppercase tracking-wide">
                    How do you protect candidate data?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                    We follow strict security standards. Your data and candidate information is never shared or sold.                    </p>
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
                      Can the Shortlist save me time and lower my cost per hire?
                    </h4>
                    <p className="text-white font-jakarta leading-relaxed">
                      Absolutely. By helping you identify, engage, and convert the right candidates - without job boards or referrals - we cut both your time-to-hire and recruiting spend.
                    </p>
                  </div>
                  
                </div>
              </div>
          </div>
        </div>
      </div>
      {/* CTA Section remains unchanged */}
      <div className="py-12 md:py-20 px-4 bg-gradient-to-r from-supernova/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-anton text-white-knight mb-4 md:mb-6 uppercase tracking-wide">
            READY TO GET STARTED?
          </h2>
          <p className="text-lg md:text-xl text-guardian mb-6 md:mb-8 font-jakarta">
          Get your first batch of candidates on us!
          </p>
          <Button 
            onClick={() => window.location.href = '/signup'}
            size="lg"
            className="glow-supernova text-base md:text-xl px-6 py-4 md:px-12 md:py-6"
          >
            Get My First 50 Candidates Free
          </Button>
          
          {/* Quality Guarantee Badge */}
          <div className="mt-4 flex flex-col items-center gap-4">
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
    </div>
  );
};
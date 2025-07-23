import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import BoltIcon from '../assets/v2.png';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Target, Users, ArrowRight } from 'lucide-react';
import Image2 from '../assets/image (2).png';
import Image3 from '../assets/image (3).png';
import Image4 from '../assets/image (4).png';
import Image5 from '../assets/image (5).png';

export const LandingPage: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [role, setRole] = useState<'client' | 'sourcer'>('client');

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
        <div className="relative py-12 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-stretch">
            {/* Left: Hero */}
            <div className="flex-1 flex flex-col justify-center items-start text-left">
              <div className="mb-8">
                <img
                  src={BoltIcon}
                  alt="Lightning Bolt"
                  className="animate-pulse"
                  style={{ width: '180px', height: '74px', filter: 'drop-shadow(0 0 16px #FFD600)', objectFit: 'contain' }}
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-anton text-white-knight mb-6 leading-tight">
                AI-POWERED
                <span className="block text-supernova">RECRUITMENT</span>
              </h1>
              <p className="text-xl md:text-2xl text-guardian max-w-3xl mb-12 font-jakarta leading-relaxed">
                Transform your hiring process with cutting-edge AI technology. 
                Get premium candidates delivered in 
                <span className="text-supernova font-bold"> 24 hours or less</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 mb-4">
                <Button 
                  onClick={() => window.location.href = '/signup'}
                  size="lg"
                  className="glow-supernova text-xl px-12 py-6"
                >
                  GET STARTED FREE
                </Button>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  size="lg"
                  className="text-xl px-12 py-6"
                >
                  SIGN IN
                </Button>
              </div>
            </div>
            {/* Right: Choose Your Role */}
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-anton text-white-knight mb-8 uppercase tracking-wide text-left">
                CHOOSE YOUR ROLE
              </h2>
              <div className="flex gap-4 mb-6">
                <button
                  className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wide transition-all duration-200 ${role === 'client' ? 'bg-supernova text-shadowforce' : 'bg-shadowforce-light text-white-knight hover:bg-supernova/30'}`}
                  onClick={() => setRole('client')}
                >
                  For Clients
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wide transition-all duration-200 ${role === 'sourcer' ? 'bg-blue-400 text-shadowforce' : 'bg-shadowforce-light text-white-knight hover:bg-blue-400/30'}`}
                  onClick={() => setRole('sourcer')}
                >
                  For Sourcers
                </button>
              </div>
              {role === 'client' ? (
                <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30">
                  <CardContent className="p-6 md:p-8">
                    <div className="text-left mb-4">
                      <div className="bg-supernova/20 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                        <Target className="text-supernova" size={32} />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-anton text-white-knight mb-2 uppercase tracking-wide">
                        FOR CLIENTS
                      </h3>
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="flex items-center"><ArrowRight className="text-supernova mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Submit job requirements</span></div>
                        <div className="flex items-center"><ArrowRight className="text-supernova mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Get AI-matched candidates</span></div>
                        <div className="flex items-center"><ArrowRight className="text-supernova mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Receive detailed profiles</span></div>
                        <div className="flex items-center"><ArrowRight className="text-supernova mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">24-hour delivery guarantee</span></div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/signup'}
                      fullWidth
                      size="lg"
                      className="glow-supernova mt-4"
                    >
                      START HIRING
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
                  <CardContent className="p-6 md:p-8">
                    <div className="text-left mb-4">
                      <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                        <Users className="text-blue-400" size={32} />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-anton text-white-knight mb-2 uppercase tracking-wide">
                        FOR SOURCERS
                      </h3>
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="flex items-center"><ArrowRight className="text-blue-400 mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Browse available jobs</span></div>
                        <div className="flex items-center"><ArrowRight className="text-blue-400 mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Use AI-powered tools</span></div>
                        <div className="flex items-center"><ArrowRight className="text-blue-400 mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Submit quality candidates</span></div>
                        <div className="flex items-center"><ArrowRight className="text-blue-400 mr-2 flex-shrink-0" size={16} /><span className="text-white-knight font-jakarta">Earn competitive rates</span></div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/signup?role=sourcer'}
                      fullWidth
                      size="lg"
                      variant="outline"
                      className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-shadowforce mt-4"
                    >
                      START SOURCING
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        {/* Testimonial Section */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-anton text-white-knight mb-10 uppercase tracking-wide">
              Trusted by professionals
            </h2>
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <img src={Image2} alt="Testimonial 1" className="flex-grow max-w-xs object-contain shadow-lg rounded-lg" />
              <img src={Image3} alt="Testimonial 2" className="flex-grow max-w-xs object-contain shadow-lg rounded-lg" />
              <img src={Image4} alt="Testimonial 3" className="flex-grow max-w-xs object-contain shadow-lg rounded-lg" />
              <img src={Image5} alt="Testimonial 4" className="flex-grow max-w-xs object-contain shadow-lg rounded-lg" />
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
            Join thousands of companies and recruiters using AI to transform their hiring process
          </p>
          <Button 
            onClick={() => window.location.href = '/signup'}
            size="lg"
            className="glow-supernova text-xl px-12 py-6"
          >
            CREATE FREE ACCOUNT
          </Button>
        </div>
      </div>
    </div>
  );
};
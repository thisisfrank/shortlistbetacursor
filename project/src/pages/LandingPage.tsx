import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Zap, Target, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce">
      {/* Hero Section */}
      <div className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Zap size={80} className="text-supernova fill-current animate-pulse" />
              <div className="absolute inset-0 bg-supernova/30 blur-2xl rounded-full"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-anton text-white-knight mb-6 leading-tight">
            AI-POWERED
            <span className="block text-supernova">
              RECRUITMENT
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-guardian max-w-3xl mx-auto mb-12 font-jakarta leading-relaxed">
            Transform your hiring process with cutting-edge AI technology. 
            Get premium candidates delivered in 
            <span className="text-supernova font-bold"> 24 hours or less</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
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
      </div>
      
      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-anton text-white-knight mb-16 text-center uppercase tracking-wide">
            CHOOSE YOUR ROLE
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Client Card */}
            <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="bg-supernova/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Target className="text-supernova" size={40} />
                  </div>
                  <h3 className="text-3xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                    FOR CLIENTS
                  </h3>
                  <p className="text-guardian font-jakarta text-lg mb-6">
                    Need to hire top talent? Get AI-curated candidate shortlists delivered fast.
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <ArrowRight className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Submit job requirements</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Get AI-matched candidates</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Receive detailed profiles</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="text-supernova mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">24-hour delivery guarantee</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => window.location.href = '/signup'}
                  fullWidth
                  size="lg"
                  className="glow-supernova"
                >
                  START HIRING
                </Button>
              </CardContent>
            </Card>
            
            {/* Sourcer Card */}
            <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="bg-blue-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Users className="text-blue-400" size={40} />
                  </div>
                  <h3 className="text-3xl font-anton text-white-knight mb-4 uppercase tracking-wide">
                    FOR SOURCERS
                  </h3>
                  <p className="text-guardian font-jakarta text-lg mb-6">
                    Expert recruiter? Earn money by delivering quality candidate shortlists.
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <ArrowRight className="text-blue-400 mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Browse available jobs</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="text-blue-400 mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Use AI-powered tools</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="text-blue-400 mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Submit quality candidates</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="text-blue-400 mr-3 flex-shrink-0" size={16} />
                    <span className="text-white-knight font-jakarta">Earn competitive rates</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => window.location.href = '/signup?role=sourcer'}
                  fullWidth
                  size="lg"
                  variant="outline"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-shadowforce"
                >
                  START SOURCING
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
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
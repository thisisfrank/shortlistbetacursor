import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-shadowforce">
      {/* Simple Header */}
      <header className="bg-shadowforce border-b border-guardian/20 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center text-supernova hover:text-supernova-light transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Super Recruiter
          </Link>
          <div className="sr-logo text-lg">
            <span className="text-supernova">SUPER</span>
            <span className="text-white-knight ml-1">RECRUITER</span>
          </div>
        </div>
      </header>
      
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
        <Card className="border-guardian/20">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white-knight mb-4">Terms of Service</h1>
                <p className="text-guardian text-sm">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="prose prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">1. Acceptance of Terms</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      By accessing and using Super Recruiter's services, you accept and agree to be bound by 
                      the terms and provision of this agreement.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">2. Description of Service</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      Super Recruiter is an AI-powered recruitment platform that connects employers with 
                      qualified candidates through automated sourcing and matching technology.
                    </p>
                    <p>Our services include:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Job posting and management</li>
                      <li>Candidate sourcing and screening</li>
                      <li>AI-powered candidate matching</li>
                      <li>Communication and collaboration tools</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">3. User Accounts</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      To use our services, you must create an account and provide accurate, complete information. 
                      You are responsible for maintaining the security of your account credentials.
                    </p>
                    <p>
                      You agree to notify us immediately of any unauthorized use of your account.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">4. Acceptable Use</h2>
                  <div className="text-guardian space-y-4">
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Use the service for any unlawful purposes</li>
                      <li>Post discriminatory or offensive job content</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Interfere with or disrupt the service</li>
                      <li>Harvest or collect user information without consent</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">5. Payment Terms</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      Subscription fees are billed in advance and are non-refundable. You may cancel your 
                      subscription at any time, and the cancellation will take effect at the end of your 
                      current billing period.
                    </p>
                    <p>
                      We reserve the right to change our pricing with 30 days notice to existing subscribers.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">6. Intellectual Property</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      The Super Recruiter platform, including all content, features, and functionality, 
                      is owned by us and is protected by copyright, trademark, and other laws.
                    </p>
                    <p>
                      You retain ownership of any content you submit, but grant us a license to use, 
                      modify, and display such content as necessary to provide our services.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">7. Disclaimer of Warranties</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      Our services are provided "as is" without any warranties, express or implied. 
                      We do not guarantee the accuracy, completeness, or reliability of any content 
                      or service results.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">8. Limitation of Liability</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      In no event shall Super Recruiter be liable for any indirect, incidental, special, 
                      consequential, or punitive damages arising out of your use of our services.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">9. Termination</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      We may terminate or suspend your account at any time for violation of these terms. 
                      You may terminate your account at any time by contacting us.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">10. Contact Information</h2>
                  <div className="text-guardian">
                    <p>
                      If you have any questions about these Terms of Service, please contact us at:
                    </p>
                    <p className="mt-2">
                      Email: alex@superrecruiter.io
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}; 
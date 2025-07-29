import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
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
                <h1 className="text-4xl font-bold text-white-knight mb-4">Privacy Policy</h1>
                <p className="text-guardian text-sm">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="prose prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">1. Information We Collect</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      We collect information you provide directly to us, such as when you create an account, 
                      submit job postings, or contact us for support.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Personal information (name, email address, phone number)</li>
                      <li>Professional information (job titles, company information)</li>
                      <li>Usage data and analytics</li>
                      <li>Communication preferences</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">2. How We Use Your Information</h2>
                  <div className="text-guardian space-y-4">
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Provide, maintain, and improve our recruitment services</li>
                      <li>Process job postings and candidate matching</li>
                      <li>Send you technical notices and support messages</li>
                      <li>Respond to your comments and questions</li>
                      <li>Analyze usage patterns to improve our platform</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">3. Information Sharing</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      We do not sell, trade, or otherwise transfer your personal information to third parties 
                      without your consent, except as described in this policy.
                    </p>
                    <p>
                      We may share information in certain limited circumstances, such as with service providers 
                      who assist us in operating our platform, or when required by law.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">4. Data Security</h2>
                  <div className="text-guardian space-y-4">
                    <p>
                      We implement appropriate technical and organizational measures to protect your personal 
                      information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">5. Your Rights</h2>
                  <div className="text-guardian space-y-4">
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Access and update your personal information</li>
                      <li>Request deletion of your account and data</li>
                      <li>Opt out of marketing communications</li>
                      <li>Request a copy of your data</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-supernova mb-4">6. Contact Us</h2>
                  <div className="text-guardian">
                    <p>
                      If you have any questions about this Privacy Policy, please contact us at:
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
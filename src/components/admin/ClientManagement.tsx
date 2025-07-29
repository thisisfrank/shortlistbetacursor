import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ClientManagement: React.FC = () => {
  const { jobs, tiers } = useData();
  const [userTiers, setUserTiers] = useState<Record<string, string>>({});
  
  // Get unique companies from jobs
  const companies = [...new Set(jobs.map(job => job.companyName).filter(Boolean))];
  
  // Group jobs by company
  const jobsByCompany = companies.map(companyName => {
    const companyJobs = jobs.filter(job => job.companyName === companyName);
    // Find the earliest job for the company (main contact = first user)
    const sortedByDate = [...companyJobs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const mainContactEmail = sortedByDate[0]?.userEmail || 'N/A';
    return {
      companyName,
      totalJobs: companyJobs.length,
      unclaimedJobs: companyJobs.filter(job => job.status === 'Unclaimed').length,
      claimedJobs: companyJobs.filter(job => job.status === 'Claimed').length,
      completedJobs: companyJobs.filter(job => job.status === 'Completed').length,
      latestJob: companyJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
      mainContactEmail,
    };
  });

  // Load user tier information
  useEffect(() => {
    const loadUserTiers = async () => {
      try {
        const userEmails = [...new Set(jobsByCompany.map(company => company.mainContactEmail).filter(email => email !== 'N/A'))];
        if (userEmails.length === 0) return;

        const { data: userProfiles, error } = await supabase
          .from('user_profiles')
          .select('email, tier_id')
          .in('email', userEmails);

        if (!error && userProfiles) {
          const tierMap: Record<string, string> = {};
          userProfiles.forEach((profile: any) => {
            const tier = tiers.find(t => t.id === profile.tier_id);
            tierMap[profile.email] = tier?.name || 'Unknown';
          });
          setUserTiers(tierMap);
        }
      } catch (error) {
        console.error('Error loading user tiers:', error);
      }
    };

    if (jobsByCompany.length > 0 && tiers.length > 0) {
      loadUserTiers();
    }
  }, [jobsByCompany, tiers]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getTierBadgeVariant = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'premium':
      case 'enterprise':
        return 'success';
      case 'professional':
      case 'pro':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <Building className="text-supernova" size={24} />
          <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">Company Management</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-guardian font-jakarta">
            Manage companies and their job submissions. Companies are automatically created when users submit jobs.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-guardian/20">
            <thead className="bg-shadowforce">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Main Contact
                </th>
                <th scope="col" className="px-4 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Jobs
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Tier
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                  Latest Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-guardian font-jakarta">
                    No companies found. Companies will appear here when users submit jobs.
                  </td>
                </tr>
              ) : (
                jobsByCompany.map(company => (
                  <tr key={company.companyName} className="hover:bg-shadowforce transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-jakarta font-bold text-white-knight">{company.companyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-guardian font-jakarta">
                        {company.mainContactEmail}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="text-sm font-anton text-white-knight">{company.totalJobs}</div>
                          <div className="text-xs text-guardian">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-anton text-orange-400">{company.unclaimedJobs}</div>
                          <div className="text-xs text-guardian">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-anton text-purple-400">{company.claimedJobs}</div>
                          <div className="text-xs text-guardian">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-anton text-green-400">{company.completedJobs}</div>
                          <div className="text-xs text-guardian">Done</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={getTierBadgeVariant(userTiers[company.mainContactEmail] || 'Unknown')}
                      >
                        {userTiers[company.mainContactEmail] || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-guardian font-jakarta">
                        {company.latestJob ? formatDate(company.latestJob.createdAt) : 'No activity'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </CardContent>
    </Card>
  );
};
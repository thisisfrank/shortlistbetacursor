import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Building, Users, CreditCard, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ClientManagement: React.FC = () => {
  const { jobs, tiers } = useData();
  const [userTiers, setUserTiers] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showCompanyJobsModal, setShowCompanyJobsModal] = useState(false);
  
  // Get unique companies from jobs
  const companies = [...new Set(jobs.map(job => job.companyName).filter(Boolean))];
  
  // Group jobs by company and calculate performance metrics
  const jobsByCompany = companies.map(companyName => {
    const companyJobs = jobs.filter(job => job.companyName === companyName);
    const completedJobs = companyJobs.filter(job => job.status === 'Completed');
    
    // Find the earliest job for the company (main contact = first user)
    const sortedByDate = [...companyJobs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const mainContactEmail = sortedByDate[0]?.userEmail || 'N/A';
    
    // Calculate candidates requested (sum of candidatesRequested for all jobs)
    const candidatesRequested = companyJobs.reduce((sum, job) => sum + (job.candidatesRequested || 3), 0);
    
    // Calculate candidates delivered (this would need to be from a candidates table - using placeholder for now)
    const candidatesDelivered = completedJobs.length * 3; // Placeholder: assuming 3 candidates per completed job
    
    // Calculate candidates per job
    const candidatesPerJob = companyJobs.length > 0 ? Math.round(candidatesDelivered / companyJobs.length) : 0;
    
    // Calculate average delivery time for completed jobs
    const deliveryTimes = completedJobs.map(job => {
      const created = new Date(job.createdAt).getTime();
      const completed = new Date(job.updatedAt).getTime();
      return (completed - created) / (1000 * 60 * 60 * 24); // Convert to days
    });
    
    const avgDeliveryTime = deliveryTimes.length > 0 
      ? Math.round(deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length)
      : 0;
    
    return {
      companyName,
      totalJobs: companyJobs.length,
      candidatesRequested,
      candidatesDelivered,
      candidatesPerJob,
      completedJobs: completedJobs.length,
      avgDeliveryTime,
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

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Get jobs for selected company
  const getCompanyJobs = (companyName: string) => {
    return jobs.filter(job => job.companyName === companyName);
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

  // Filter companies based on search
  const filteredJobsByCompany = jobsByCompany.filter(company => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      company.companyName.toLowerCase().includes(searchLower) ||
      company.mainContactEmail.toLowerCase().includes(searchLower)
    );
  });

  // Calculate paid clients (those with tier names that aren't 'Free' or 'Unknown')
  const totalClients = companies.length;
  const paidClients = jobsByCompany.filter(company => {
    const tierName = userTiers[company.mainContactEmail] || 'Unknown';
    return tierName.toLowerCase() !== 'free' && tierName.toLowerCase() !== 'unknown';
  }).length;
  const paidClientPercentage = totalClients > 0 ? Math.round((paidClients / totalClients) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-anton text-white-knight mb-2 uppercase tracking-wide">Client Management</h2>
          <p className="text-guardian font-jakarta">Manage companies and their job submissions</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-guardian" />
          </div>
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 block w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta"
          />
        </div>
      </div>

      {/* Client Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Total Clients</h3>
                <p className="text-3xl font-anton text-white-knight">{totalClients}</p>
              </div>
              <Users className="text-supernova" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">Paid Clients</h3>
                <p className="text-3xl font-anton text-white-knight">{paidClientPercentage}%</p>
              </div>
              <CreditCard className="text-blue-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardContent className="p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-guardian/20">
              <thead className="bg-shadowforce">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-anton text-guardian uppercase tracking-wider">
                    Jobs
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-anton text-guardian uppercase tracking-wider">
                    Candidates Requested
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-anton text-guardian uppercase tracking-wider">
                    Candidates Delivered
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-anton text-guardian uppercase tracking-wider">
                    Candidates Per Job
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-anton text-guardian uppercase tracking-wider">
                    Completed Jobs
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-anton text-guardian uppercase tracking-wider">
                    Avg Delivery Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                {filteredJobsByCompany.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-guardian font-jakarta">
                      {search ? 'No companies found matching your search criteria.' : 'No companies found. Companies will appear here when users submit jobs.'}
                    </td>
                  </tr>
                ) : (
                  filteredJobsByCompany.map(company => (
                    <tr key={company.companyName} className="hover:bg-shadowforce transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            className="text-sm font-jakarta font-bold text-supernova underline hover:text-supernova/80 cursor-pointer bg-transparent border-none p-0 m-0"
                            style={{ background: 'none' }}
                            onClick={() => {
                              setSelectedCompany(company.companyName);
                              setShowCompanyJobsModal(true);
                            }}
                          >
                            {company.companyName}
                          </button>
                          <div className="text-sm text-guardian font-jakarta">{company.mainContactEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-anton text-white-knight">{company.totalJobs}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-anton text-white-knight">{company.candidatesRequested}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-anton text-white-knight">{company.candidatesDelivered}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-anton text-white-knight">{company.candidatesPerJob}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-anton text-white-knight">{company.completedJobs}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-anton text-white-knight">
                          {company.avgDeliveryTime > 0 ? `${company.avgDeliveryTime} days` : 'N/A'}
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

      {/* Company Jobs Modal */}
      {showCompanyJobsModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-guardian/20">
            <div className="flex justify-between items-center border-b border-guardian/20 p-6">
              <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide">
                Jobs for {selectedCompany}
              </h2>
              <button 
                onClick={() => {
                  setShowCompanyJobsModal(false);
                  setSelectedCompany(null);
                }}
                className="text-guardian hover:text-supernova transition-colors"
                aria-label="Close"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {(() => {
                const companyJobs = getCompanyJobs(selectedCompany);
                return (
                  <div className="space-y-4">
                    {companyJobs.length === 0 ? (
                      <p className="text-center text-guardian font-jakarta">No jobs found for this company.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-guardian/20">
                          <thead className="bg-shadowforce">
                            <tr>
                              <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                                Job Title
                              </th>
                              <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                                Date Submitted
                              </th>
                              <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                                Candidates Requested
                              </th>
                              <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                                Location
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                            {companyJobs.map(job => (
                              <tr key={job.id} className="hover:bg-shadowforce transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-jakarta font-bold text-white-knight">{job.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={job.status === 'Completed' ? 'success' : job.status === 'Claimed' ? 'warning' : 'default'}
                                  >
                                    {job.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-guardian font-jakarta">
                                    {formatDateTime(job.createdAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-white-knight font-jakarta">
                                    {job.candidatesRequested || 3}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-guardian font-jakarta">
                                    {job.location || 'Not specified'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
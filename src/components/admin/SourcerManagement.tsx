import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ViewJobDetailsModal } from '../sourcer/ViewJobDetailsModal';
import { Search, Award, Users, Clock, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const SourcerManagement: React.FC = () => {
  const { jobs, getCandidatesByJob } = useData();
  const [search, setSearch] = useState('');
  const [selectedSourcer, setSelectedSourcer] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sourcerNames, setSourcerNames] = useState<Record<string, string>>({});
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | '90days' | 'alltime'>('30days');
  const [matchScores, setMatchScores] = useState<Record<string, { score: number; reasoning: string }>>({});

  const [sortBy, setSortBy] = useState<'performance' | 'speed' | 'rating' | 'completed'>('performance');

  // Load sourcer names from user_profiles
  useEffect(() => {
    const loadSourcerNames = async () => {
      try {
        const sourcerIds = [...new Set(jobs.filter(job => job.sourcerId).map(job => job.sourcerId!))];
        if (sourcerIds.length === 0) return;

        // Query for specific sourcer IDs instead of filtering by role
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('id, name')
          .in('id', sourcerIds);

        if (!error && profiles) {
          const nameMap: Record<string, string> = {};
          profiles.forEach((profile: any) => {
            nameMap[profile.id] = profile.name || 'Unknown Sourcer';
          });
          setSourcerNames(nameMap);
          console.log('Loaded sourcer names:', nameMap); // Debug log
        } else {
          console.error('Error loading sourcer profiles:', error);
        }
      } catch (error) {
        console.error('Error loading sourcer names:', error);
        // Don't throw - just continue with IDs if names fail to load
      }
    };

    if (jobs.length > 0) {
      loadSourcerNames();
    }
  }, [jobs]);

  // Load match scores from local storage or API
  useEffect(() => {
    const loadMatchScores = async () => {
      try {
        // Try to load from localStorage first
        const savedScores = localStorage.getItem('candidateMatchScores');
        if (savedScores) {
          setMatchScores(JSON.parse(savedScores));
        }
      } catch (error) {
        console.error('Error loading match scores:', error);
      }
    };

    loadMatchScores();
  }, []);

  // Get sourcer name by ID
  const getSourcerName = (sourcerId: string): string => {
    return sourcerNames[sourcerId] || `Sourcer ${sourcerId.substring(0, 8)}...`;
  };

  // Filter jobs based on time period
  const getJobsInTimePeriod = (jobs: any[], period: string) => {
    if (period === 'alltime') return jobs;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return jobs;
    }
    
    return jobs.filter(job => new Date(job.updatedAt) >= cutoffDate);
  };

  // Get all unique sourcers
  const sourcers = [...new Set(jobs.filter(job => job.sourcerId).map(job => job.sourcerId!))]
    .map(sourcerId => {
      const sourcerJobs = jobs.filter(job => job.sourcerId === sourcerId);
      const completedJobs = sourcerJobs.filter(job => job.status === 'Completed');
      const claimedJobs = sourcerJobs.filter(job => job.status === 'Claimed');
      
      const totalCandidates = sourcerJobs.reduce((acc, job) => {
        return acc + getCandidatesByJob(job.id).length;
      }, 0);

      const avgCandidatesPerJob = completedJobs.length > 0 
        ? Math.round(totalCandidates / completedJobs.length) 
        : 0;

      // Calculate delivery speed metrics
      const completionTimes = completedJobs.map(job => {
        const created = new Date(job.createdAt).getTime();
        const updated = new Date(job.updatedAt).getTime();
        return (updated - created) / (1000 * 60 * 60); // Convert to hours
      });
      
      const avgCompletionHours = completionTimes.length > 0 
        ? completionTimes.reduce((acc, time) => acc + time, 0) / completionTimes.length
        : 0;
      
      const fastestCompletion = completionTimes.length > 0 
        ? Math.min(...completionTimes)
        : 0;
      
      // Calculate average candidate rating based on match scores
      const sourcerCandidates = sourcerJobs.flatMap(job => getCandidatesByJob(job.id));
      const candidateScores = sourcerCandidates
        .map(candidate => {
          const scoreData = matchScores[candidate.id];
          // Exclude null, undefined, 0, or missing scores (API errors)
          if (!scoreData || !scoreData.score || scoreData.score <= 0) {
            return null;
          }
          return scoreData.score;
        })
        .filter((score): score is number => score !== null && score > 0); // Type guard to ensure number[]
      
      const avgCandidateRating = candidateScores.length > 0 
        ? Math.round(candidateScores.reduce((sum, score) => sum + score, 0) / candidateScores.length)
        : null; // Return null instead of 0 when no valid scores exist
      
      // Calculate speed score (faster = higher score, max 24 hours)
      const speedScore = avgCompletionHours > 0 
        ? Math.max(0, Math.min(100, (24 - avgCompletionHours) * 4.17)) // 24 hours = 0 points, 0 hours = 100 points
        : 0;
      
      // Calculate overall performance score
      const ratingScore = avgCandidateRating !== null ? avgCandidateRating : 0; // Use 0 for performance calc if no ratings
      const performanceScore = Math.round(
        (speedScore * 0.4) + // 40% weight on speed
        (ratingScore * 0.4) + // 40% weight on candidate quality
        (Math.min(completedJobs.length * 2, 20) * 1) // 20% weight on volume (max 20 points)
      );

      return {
        id: sourcerId,
        name: getSourcerName(sourcerId), // Display actual sourcer name
        totalJobs: sourcerJobs.length,
        completedJobs: completedJobs.length,
        claimedJobs: claimedJobs.length,
        totalCandidates,
        avgCandidatesPerJob,
        avgCompletionHours: Math.round(avgCompletionHours * 10) / 10, // Round to 1 decimal
        fastestCompletionHours: Math.round(fastestCompletion * 10) / 10,
        avgCandidateRating,
        speedScore: Math.round(speedScore),
        performanceScore,
        successRate: sourcerJobs.length > 0 ? Math.round((completedJobs.length / sourcerJobs.length) * 100) : 0,
        lastActive: sourcerJobs.length > 0 
          ? new Date(Math.max(...sourcerJobs.map(job => new Date(job.updatedAt).getTime())))
          : new Date()
      };
    });

  // Filter top performers based on selected time period using original sourcers data
  const topPerformersSourcers = timePeriod === 'alltime' 
    ? [...sourcers].sort((a, b) => b.performanceScore - a.performanceScore)
    : sourcers.map(sourcer => {
        // Get jobs for this sourcer in the selected time period
        const periodJobs = getJobsInTimePeriod(jobs.filter(job => job.sourcerId === sourcer.id), timePeriod);
        const completedJobs = periodJobs.filter(job => job.status === 'Completed');
        
        if (completedJobs.length === 0) return null; // Filter out sourcers with no completed jobs in period
        
        const totalCandidates = periodJobs.reduce((acc, job) => {
          return acc + getCandidatesByJob(job.id).length;
        }, 0);

        // Calculate delivery speed metrics for the period
        const completionTimes = completedJobs.map(job => {
          const created = new Date(job.createdAt).getTime();
          const updated = new Date(job.updatedAt).getTime();
          return (updated - created) / (1000 * 60 * 60); // Convert to hours
        });
        
        const avgCompletionHours = completionTimes.length > 0 
          ? completionTimes.reduce((acc, time) => acc + time, 0) / completionTimes.length
          : 0;
        
        // Calculate average candidate rating for period
        const periodCandidates = periodJobs.flatMap(job => getCandidatesByJob(job.id));
        const periodCandidateScores = periodCandidates
          .map(candidate => {
            const scoreData = matchScores[candidate.id];
            // Exclude null, undefined, 0, or missing scores (API errors)
            if (!scoreData || !scoreData.score || scoreData.score <= 0) {
              return null;
            }
            return scoreData.score;
          })
          .filter((score): score is number => score !== null && score > 0); // Type guard to ensure number[]
        
        const avgCandidateRating = periodCandidateScores.length > 0 
          ? Math.round(periodCandidateScores.reduce((sum, score) => sum + score, 0) / periodCandidateScores.length)
          : null; // Return null instead of 0 when no valid scores exist
        
        // Calculate speed score (faster = higher score, max 24 hours)
        const speedScore = avgCompletionHours > 0 
          ? Math.max(0, Math.min(100, (24 - avgCompletionHours) * 4.17))
          : 0;
        
        // Calculate overall performance score for the period
        const ratingScore = avgCandidateRating !== null ? avgCandidateRating : 0; // Use 0 for performance calc if no ratings
        const performanceScore = Math.round(
          (speedScore * 0.4) + // 40% weight on speed
          (ratingScore * 0.4) + // 40% weight on candidate quality
          (Math.min(completedJobs.length * 2, 20) * 1) // 20% weight on volume (max 20 points)
        );

        return {
          ...sourcer, // Keep original sourcer data including proper name
          // Override with period-specific metrics
          completedJobs: completedJobs.length,
          totalCandidates,
          avgCompletionHours: Math.round(avgCompletionHours * 10) / 10,
          avgCandidateRating,
          performanceScore,
          successRate: periodJobs.length > 0 ? Math.round((completedJobs.length / periodJobs.length) * 100) : 0
        };
      })
      .filter(sourcer => sourcer !== null) // Remove sourcers with no completed jobs in period
      .sort((a, b) => b.performanceScore - a.performanceScore);

  // Use time-filtered data for leaderboard (same as topPerformersSourcers but with search filter)
  const leaderboardSourcers = timePeriod === 'alltime' 
    ? sourcers
    : topPerformersSourcers; // This already has the time-filtered and calculated data

  // Filter sourcers based on search
  const filteredSourcers = leaderboardSourcers.filter(sourcer =>
    sourcer.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort sourcers based on selected criteria
  const sortedSourcers = [...filteredSourcers].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b.performanceScore - a.performanceScore;
      case 'speed':
        // Faster completion time = higher ranking (lower hours = better)
        return a.avgCompletionHours - b.avgCompletionHours;
      case 'rating':
        // Handle null values: null ratings go to bottom, then sort by score
        const aRating = a.avgCandidateRating ?? -1; // null becomes -1 for sorting
        const bRating = b.avgCandidateRating ?? -1;
        return bRating - aRating;
      case 'completed':
        return b.completedJobs - a.completedJobs;
      default:
        return b.performanceScore - a.performanceScore;
    }
  });



  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };









  return (
    <div className="space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-anton text-white-knight uppercase tracking-wide mb-2">Sourcer Management</h2>
          <p className="text-guardian font-jakarta">Monitor and manage sourcer performance and assignments</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-guardian" />
          </div>
          <input
            type="text"
            placeholder="Search sourcers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 block w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta"
          />
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-supernova uppercase tracking-wide">Total Sourcers</h3>
                <p className="text-3xl font-anton text-white-knight">{sourcers.length}</p>
              </div>
              <Users className="text-supernova" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">Total Jobs Completed</h3>
                <p className="text-3xl font-anton text-white-knight">
                  {sourcers.reduce((acc, s) => acc + s.completedJobs, 0)}
                </p>
              </div>
              <Award className="text-blue-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-anton text-lg text-purple-400 uppercase tracking-wide">Average Completion Time</h3>
                <p className="text-3xl font-anton text-white-knight">
                  {sourcers.length > 0 
                    ? Math.round(sourcers.reduce((acc, s) => acc + s.avgCompletionHours, 0) / sourcers.length)
                    : 0}h
                </p>
              </div>
              <Clock className="text-purple-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sourcer List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Leaderboard</h3>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-jakarta text-guardian">Time Period:</span>
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as any)}
                  className="rounded-lg border-guardian/30 bg-shadowforce text-white-knight focus:ring-supernova focus:border-supernova font-jakarta text-sm"
                >
                  <option value="7days">Past 7 Days</option>
                  <option value="30days">Past 30 Days</option>
                  <option value="90days">Past 90 Days</option>
                  <option value="alltime">All Time</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-jakarta text-guardian">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border-guardian/30 bg-shadowforce text-white-knight focus:ring-supernova focus:border-supernova font-jakarta text-sm"
                >
                  <option value="performance">Overall Performance</option>
                  <option value="speed">Delivery Speed</option>
                  <option value="rating">Average Rating</option>
                  <option value="completed">Jobs Completed</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedSourcers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-guardian/50 mb-4" />
              <h3 className="text-lg font-anton text-guardian mb-2">No Sourcers Found</h3>
              <p className="text-guardian/70 font-jakarta">Sourcers will appear here once they claim and complete jobs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-guardian/20">
                <thead className="bg-shadowforce">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Sourcer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Speed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Candidates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Avg Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                  {sortedSourcers.slice(0, 3).map((sourcer, index) => {
                    
                    return (
                      <tr key={sourcer.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-jakarta font-bold text-white-knight">
                                {sourcer.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap min-w-[120px]">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {sourcer.performanceScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-white-knight font-jakarta font-semibold">
                              {sourcer.completedJobs} completed
                            </div>
                            <div className="text-guardian">
                              {sourcer.claimedJobs} in progress
                            </div>
                            <div className="text-xs text-guardian/60 mt-1">
                              {sourcer.successRate}% success rate
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="text-sm text-white-knight font-jakarta">
                              Avg: {sourcer.avgCompletionHours}h
                            </div>
                            <div className="text-sm text-guardian font-jakarta">
                              Best: {sourcer.fastestCompletionHours}h
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {sourcer.totalCandidates}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {sourcer.avgCandidateRating !== null ? sourcer.avgCandidateRating : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {formatDate(sourcer.lastActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSourcer(sourcer.id)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Explanation */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Performance Scoring</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-supernova/10 border border-supernova/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Clock className="text-supernova mr-2" size={20} />
                <h4 className="font-anton text-supernova uppercase tracking-wide">Speed (40%)</h4>
              </div>
              <p className="text-guardian font-jakarta text-sm">
                Based on average delivery time. Faster completion = higher score.
              </p>
              <div className="mt-2 text-xs text-guardian/80">
                • Lightning Fast: ≤6 hours
                • Fast: ≤12 hours  
                • Average: ≤18 hours
                • Slow: &gt;18 hours
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Target className="text-green-400 mr-2" size={20} />
                <h4 className="font-anton text-green-400 uppercase tracking-wide">Quality Rating (40%)</h4>
              </div>
              <p className="text-guardian font-jakarta text-sm">
                Average AI-generated match score of submitted candidates (0-100 scale).
              </p>
              <div className="mt-2 text-xs text-guardian/80">
                Higher rating = better candidate-job fit quality. Excludes API errors (null/0 scores).
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Award className="text-blue-400 mr-2" size={20} />
                <h4 className="font-anton text-blue-400 uppercase tracking-wide">Volume (20%)</h4>
              </div>
              <p className="text-guardian font-jakarta text-sm">
                Number of successfully completed jobs.
              </p>
              <div className="mt-2 text-xs text-guardian/80">
                Consistent delivery builds reputation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Sourcers Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">All Sourcers</h3>
        </CardHeader>
        <CardContent>
          {sortedSourcers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-guardian/50 mb-4" />
              <h3 className="text-lg font-anton text-guardian mb-2">No Sourcers Found</h3>
              <p className="text-guardian/70 font-jakarta">Sourcers will appear here once they claim and complete jobs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-guardian/20">
                <thead className="bg-shadowforce">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Sourcer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Speed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Candidates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Avg Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                  {sortedSourcers.map((sourcer, index) => {
                    
                    return (
                      <tr key={sourcer.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-jakarta font-bold text-white-knight">
                                {sourcer.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap min-w-[120px]">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {sourcer.performanceScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-white-knight font-jakarta font-semibold">
                              {sourcer.completedJobs} completed
                            </div>
                            <div className="text-guardian">
                              {sourcer.claimedJobs} in progress
                            </div>
                            <div className="text-xs text-guardian/60 mt-1">
                              {sourcer.successRate}% success rate
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="text-sm text-white-knight font-jakarta">
                              Avg: {sourcer.avgCompletionHours}h
                            </div>
                            <div className="text-sm text-guardian font-jakarta">
                              Best: {sourcer.fastestCompletionHours}h
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {sourcer.totalCandidates}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className="text-lg font-anton text-white-knight">
                              {sourcer.avgCandidateRating !== null ? sourcer.avgCandidateRating : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {formatDate(sourcer.lastActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSourcer(sourcer.id)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sourcer Detail Modal */}
      {selectedSourcer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-anton text-white-knight uppercase tracking-wide">
                  {getSourcerName(selectedSourcer)} - Detailed Performance
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSourcer(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(() => {
                    const sourcer = sortedSourcers.find(s => s.id === selectedSourcer);
                    if (!sourcer) return null;
                    
                    return (
                      <>
                        <div className="bg-supernova/10 border border-supernova/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-anton text-supernova mb-1">{sourcer.performanceScore}</div>
                          <div className="text-xs text-guardian">Overall Score</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-anton text-blue-400 mb-1">{sourcer.avgCompletionHours}h</div>
                          <div className="text-xs text-guardian">Avg Speed</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-anton text-green-400 mb-1">{sourcer.avgCandidateRating !== null ? sourcer.avgCandidateRating : 'N/A'}</div>
                          <div className="text-xs text-guardian">Avg Rating</div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg text-center">
                          <div className="text-2xl font-anton text-purple-400 mb-1">{sourcer.completedJobs}</div>
                          <div className="text-xs text-guardian">Completed</div>
                        </div>
                      </>
                    );
                  })()}
                </div>



                {/* Job History */}
                <div>
                  <h4 className="text-lg font-anton text-white-knight mb-4 uppercase tracking-wide">Job History</h4>
                  <div className="space-y-3">
                    {jobs
                      .filter(job => job.sourcerId === selectedSourcer)
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map(job => {
                        const completionTime = job.status === 'Completed' ? 
                          Math.round((new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60)) : null;
                        
                        return (
                          <div 
                            key={job.id} 
                            className="p-4 bg-shadowforce rounded-lg border border-guardian/20 cursor-pointer hover:border-supernova/30 transition-colors"
                            onClick={() => setSelectedJobId(job.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="text-white-knight font-jakarta font-semibold">{job.title}</h5>
                                <p className="text-guardian font-jakarta text-sm">
                                  {getCandidatesByJob(job.id).length} candidates submitted
                                </p>
                                {completionTime && (
                                  <p className="text-supernova font-jakarta text-sm">
                                    ⚡ Completed in {completionTime} hours
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    job.status === 'Completed' ? 'success' :
                                    job.status === 'Claimed' ? 'default' : 'warning'
                                  }
                                >
                                  {job.status}
                                </Badge>

                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJobId && (
        <ViewJobDetailsModal
          job={jobs.find(job => job.id === selectedJobId)!}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </div>
  );
};
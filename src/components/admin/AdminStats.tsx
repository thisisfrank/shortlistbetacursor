import React from 'react';
import { Job, Client } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Users, TrendingUp, Clock, CheckCircle, Zap } from 'lucide-react';

interface AdminStatsProps {
  jobs: Job[];
  clients: Client[];
}

export const AdminStats: React.FC<AdminStatsProps> = ({ jobs, clients }) => {
  const totalClients = clients.length;
  const totalJobs = jobs.length;
  const unclaimedJobs = jobs.filter(job => job.status === 'Unclaimed').length;
  const claimedJobs = jobs.filter(job => job.status === 'Claimed').length;
  const completedJobs = jobs.filter(job => job.status === 'Completed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
      <Card className="bg-gradient-to-br from-supernova/20 to-supernova/10 border-supernova/30 hover:border-supernova/50">
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
      
      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 hover:border-blue-500/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-anton text-lg text-blue-400 uppercase tracking-wide">Total Jobs</h3>
              <p className="text-3xl font-anton text-white-knight">{totalJobs}</p>
            </div>
            <TrendingUp className="text-blue-400" size={32} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-500/30 hover:border-orange-500/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-anton text-lg text-orange-400 uppercase tracking-wide">Unclaimed</h3>
              <p className="text-3xl font-anton text-white-knight">{unclaimedJobs}</p>
            </div>
            <Clock className="text-orange-400" size={32} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 hover:border-purple-500/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-anton text-lg text-purple-400 uppercase tracking-wide">In Progress</h3>
              <p className="text-3xl font-anton text-white-knight">{claimedJobs}</p>
            </div>
            <Zap className="text-purple-400" size={32} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 hover:border-green-500/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-anton text-lg text-green-400 uppercase tracking-wide">Completed</h3>
              <p className="text-3xl font-anton text-white-knight">{completedJobs}</p>
            </div>
            <CheckCircle className="text-green-400" size={32} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
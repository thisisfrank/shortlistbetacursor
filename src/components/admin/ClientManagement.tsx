import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { Users, Trash2, Edit, X, Save, Crown, CreditCard, Plus } from 'lucide-react';

export const ClientManagement: React.FC = () => {
  const { jobs, tiers, getTierById } = useData();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Debug: Log data
  console.log('🔍 ClientManagement Debug:', {
    totalJobs: jobs?.length || 0,
    totalTiers: tiers?.length || 0
  });
  
  const [editForm, setEditForm] = useState<any>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState<string | null>(null);
  const [upgradeToTier, setUpgradeToTier] = useState<string>('');
  const [creditsToAdd, setCreditsToAdd] = useState<string>('');

  // Since we don't have separate clients anymore, we'll show a message
  // In a real implementation, you'd load user profiles from the database
  const userProfiles: any[] = []; // This would be loaded from user_profiles table

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditForm({
      email: user.email,
      role: user.role,
      tierId: user.tierId,
      availableCredits: user.availableCredits,
      jobsRemaining: user.jobsRemaining
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;
    
    try {
      // In a real implementation, you'd update the user profile in the database
      console.log('Saving user profile:', editForm);
      setEditingUserId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating user profile:', error);
      alert('Error updating user profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-anton text-white-knight uppercase tracking-wide">User Management</h2>
          <p className="text-guardian font-jakarta mt-2">Manage user profiles and subscriptions</p>
        </div>
        
        <Button>
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-supernova" size={24} />
            <h3 className="text-xl font-anton text-white-knight">User Management</h3>
          </div>
          <p className="text-guardian font-jakarta">
            User management has been simplified. User profiles are now managed through the authentication system. 
            Each user can have their own jobs and candidates associated with their account.
          </p>
        </CardContent>
      </Card>

      {/* User Profiles List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">User Profiles</h3>
            <Badge variant="info">{userProfiles.length} Users</Badge>
          </div>
          
          {userProfiles.length === 0 ? (
            <div className="text-center py-8">
              <Users className="text-guardian mx-auto mb-4" size={48} />
              <p className="text-guardian font-jakarta">No user profiles found.</p>
              <p className="text-sm text-guardian/60 mt-2">
                User profiles are managed through the authentication system.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-guardian/20">
                <thead className="bg-shadowforce">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Tier
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Jobs
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Credits
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                  {userProfiles.map(user => {
                    const userJobs = jobs.filter(job => job.userId === user.id);
                    const tier = getTierById(user.tierId);
                    
                    return (
                      <tr key={user.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-jakarta font-bold text-white-knight">{user.email}</div>
                          <div className="text-sm text-guardian">Joined {formatDate(user.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.role === 'admin' ? 'success' : user.role === 'sourcer' ? 'warning' : 'default'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white-knight font-jakarta">{tier?.name || 'Unknown'}</div>
                          <div className="text-xs text-guardian">{user.jobsRemaining} jobs remaining</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          <div className="flex items-center">
                            <Users size={14} className="mr-2" />
                            {userJobs.length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white-knight font-jakarta">{user.availableCredits}</div>
                          <div className="text-xs text-guardian">available</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleEditUser(user)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              onClick={() => setShowUpgradeModal(user.id)}
                              variant="outline"
                              size="sm"
                              className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                            >
                              <Crown size={16} />
                            </Button>
                            <Button
                              onClick={() => setShowCreditsModal(user.id)}
                              variant="outline"
                              size="sm"
                              className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                            >
                              <CreditCard size={16} />
                            </Button>
                          </div>
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

      {/* Edit Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-md border border-guardian/20">
            <div className="flex justify-between items-center border-b border-guardian/20 p-6">
              <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Edit User Profile</h3>
              <button 
                onClick={handleCancelEdit}
                className="text-guardian hover:text-supernova transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <FormInput
                label="Email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                disabled
              />
              <FormInput
                label="Available Credits"
                type="number"
                value={editForm.availableCredits || ''}
                onChange={(e) => setEditForm({...editForm, availableCredits: parseInt(e.target.value)})}
              />
              <FormInput
                label="Jobs Remaining"
                type="number"
                value={editForm.jobsRemaining || ''}
                onChange={(e) => setEditForm({...editForm, jobsRemaining: parseInt(e.target.value)})}
              />
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save size={16} className="mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormInput } from '../forms/FormInput';
import { Users, Trash2, Edit, X, Save, Crown, CreditCard, Plus } from 'lucide-react';

export const ClientManagement: React.FC = () => {
  const { clients, jobs, tiers, getTierById, deleteClient, updateClient } = useData();
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  
  // Debug: Log client data
  console.log('🔍 ClientManagement Debug:', {
    totalClients: clients?.length || 0,
    clients: clients,
    totalJobs: jobs?.length || 0,
    totalTiers: tiers?.length || 0
  });
  const [editForm, setEditForm] = useState<any>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState<string | null>(null);
  const [upgradeToTier, setUpgradeToTier] = useState<string>('');
  const [creditsToAdd, setCreditsToAdd] = useState<string>('');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client and all associated jobs? This action cannot be undone.')) {
      deleteClient(clientId);
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClientId(client.id);
    setEditForm({
      companyName: client.companyName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      availableCredits: client.availableCredits.toString(),
      jobsRemaining: client.jobsRemaining.toString(),
      hasReceivedFreeShortlist: client.hasReceivedFreeShortlist
    });
  };

  const handleSaveClient = () => {
    if (!editingClientId) return;
    
    const updates = {
      companyName: editForm.companyName,
      contactName: editForm.contactName,
      email: editForm.email,
      phone: editForm.phone,
      availableCredits: parseInt(editForm.availableCredits),
      jobsRemaining: parseInt(editForm.jobsRemaining),
      hasReceivedFreeShortlist: editForm.hasReceivedFreeShortlist
    };
    
    updateClient(editingClientId, updates);
    setEditingClientId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setEditForm({});
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpgradeClient = (clientId: string) => {
    if (!upgradeToTier) {
      alert('Please select a tier to upgrade to');
      return;
    }

    const selectedTier = getTierById(upgradeToTier);
    if (!selectedTier) {
      alert('Invalid tier selected');
      return;
    }

    if (window.confirm(`Upgrade client to ${selectedTier.name} tier?`)) {
      updateClient(clientId, {
        tierId: upgradeToTier,
        availableCredits: selectedTier.monthlyCandidateAllotment,
        jobsRemaining: selectedTier.monthlyJobAllotment,
        creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Reset to 30 days from now
      });
      setShowUpgradeModal(null);
      setUpgradeToTier('');
      alert(`Client successfully upgraded to ${selectedTier.name} tier!`);
    }
  };

  const handleGrantCredits = (clientId: string) => {
    const credits = parseInt(creditsToAdd);
    if (!credits || credits <= 0) {
      alert('Please enter a valid number of credits');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      alert('Client not found');
      return;
    }

    if (window.confirm(`Grant ${credits} additional credits to this client?`)) {
      updateClient(clientId, {
        availableCredits: client.availableCredits + credits
      });
      setShowCreditsModal(null);
      setCreditsToAdd('');
      alert(`Successfully granted ${credits} credits!`);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-anton text-white-knight mb-8 uppercase tracking-wide">Clients</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-guardian/20">
              <thead className="bg-shadowforce">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Credits & Jobs
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-anton text-guardian uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-shadowforce-light divide-y divide-guardian/20">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-guardian font-jakarta">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  clients.map(client => {
                    const clientJobs = jobs.filter(job => job.clientId === client.id);
                    const isEditing = editingClientId === client.id;
                    
                    return (
                      <tr key={client.id} className="hover:bg-shadowforce transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.companyName}
                              onChange={(e) => handleFormChange('companyName', e.target.value)}
                              className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                            />
                          ) : (
                            <div>
                              <div className="text-sm font-jakarta font-bold text-white-knight">{client.companyName}</div>
                              <div className="text-sm text-guardian">
                                {getTierById(client.tierId)?.name || 'Unknown Tier'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.contactName}
                                onChange={(e) => handleFormChange('contactName', e.target.value)}
                                placeholder="Contact Name"
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                              <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => handleFormChange('phone', e.target.value)}
                                placeholder="Phone"
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm text-white-knight font-jakarta font-semibold">{client.contactName}</div>
                              <div className="text-sm text-guardian">{client.phone}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => handleFormChange('email', e.target.value)}
                              className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                            />
                          ) : (
                            <div className="text-sm text-white-knight font-jakarta">{client.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                value={editForm.availableCredits}
                                onChange={(e) => handleFormChange('availableCredits', e.target.value)}
                                placeholder="Credits"
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                              <input
                                type="number"
                                value={editForm.jobsRemaining}
                                onChange={(e) => handleFormChange('jobsRemaining', e.target.value)}
                                placeholder="Jobs"
                                className="w-full text-sm bg-shadowforce border border-guardian/30 rounded px-2 py-1 text-white-knight"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center">
                                <Users size={14} className="mr-2" />
                                {clientJobs.length} jobs
                              </div>
                              <div className="text-xs text-guardian/60">
                                Credits: {client.availableCredits} | Jobs: {client.jobsRemaining}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-guardian font-jakarta">
                          {formatDate(client.createdAt)}
                          <div className="text-xs text-guardian/60">
                            Reset: {formatDate(client.creditsResetDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.hasReceivedFreeShortlist}
                                onChange={(e) => handleFormChange('hasReceivedFreeShortlist', e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-sm text-white-knight">Free Used</span>
                            </label>
                          ) : (
                            <Badge variant={client.hasReceivedFreeShortlist ? 'success' : 'outline'}>
                              {client.hasReceivedFreeShortlist ? 'Free Used' : 'New Client'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {isEditing ? (
                            <>
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={handleSaveClient}
                              >
                                <Save size={14} />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                <X size={14} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setShowUpgradeModal(client.id);
                                  setUpgradeToTier('');
                                }}
                                className="flex items-center gap-1"
                              >
                                <Crown size={12} />
                                UPGRADE
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setShowCreditsModal(client.id);
                                  setCreditsToAdd('');
                                }}
                                className="flex items-center gap-1"
                              >
                                <Plus size={12} />
                                CREDITS
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="error" 
                                size="sm"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-md border border-guardian/20">
            <div className="flex justify-between items-center border-b border-guardian/20 p-6">
              <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Upgrade Client</h3>
              <button 
                onClick={() => {
                  setShowUpgradeModal(null);
                  setUpgradeToTier('');
                }}
                className="text-guardian hover:text-supernova transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide">
                  Select New Tier
                </label>
                <select
                  value={upgradeToTier}
                  onChange={(e) => setUpgradeToTier(e.target.value)}
                  className="w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight focus:ring-supernova focus:border-supernova font-jakarta"
                >
                  <option value="">Select a tier...</option>
                  {tiers.filter(tier => tier.name !== 'Free').map(tier => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} - {tier.monthlyJobAllotment} jobs, {tier.monthlyCandidateAllotment} credits
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-supernova/10 border border-supernova/30 p-4 rounded-lg mb-6">
                <p className="text-supernova font-jakarta font-semibold text-sm">
                  ⚠️ This will reset the client's credits and jobs to the new tier limits
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpgradeModal(null);
                    setUpgradeToTier('');
                  }}
                  className="flex-1"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={() => handleUpgradeClient(showUpgradeModal)}
                  disabled={!upgradeToTier}
                  className="flex-1"
                >
                  UPGRADE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-shadowforce-light rounded-2xl shadow-2xl w-full max-w-md border border-guardian/20">
            <div className="flex justify-between items-center border-b border-guardian/20 p-6">
              <h3 className="text-xl font-anton text-white-knight uppercase tracking-wide">Grant Credits</h3>
              <button 
                onClick={() => {
                  setShowCreditsModal(null);
                  setCreditsToAdd('');
                }}
                className="text-guardian hover:text-supernova transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-jakarta font-semibold text-guardian mb-3 uppercase tracking-wide">
                  Number of Credits to Add
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  placeholder="Enter number of credits"
                  className="w-full rounded-lg border-guardian/30 bg-shadowforce text-white-knight placeholder-guardian/60 focus:ring-supernova focus:border-supernova font-jakarta"
                />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg mb-6">
                <p className="text-blue-400 font-jakarta font-semibold text-sm">
                  💡 Credits will be added to the client's current balance
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreditsModal(null);
                    setCreditsToAdd('');
                  }}
                  className="flex-1"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={() => handleGrantCredits(showCreditsModal)}
                  disabled={!creditsToAdd || parseInt(creditsToAdd) <= 0}
                  className="flex-1"
                >
                  GRANT CREDITS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
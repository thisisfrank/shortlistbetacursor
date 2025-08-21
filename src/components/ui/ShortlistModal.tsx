import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Users } from 'lucide-react';
import { Button } from './Button';
import { FormInput } from '../forms/FormInput';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Shortlist } from '../../types';

interface ShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidateIds: string[];
  onCandidatesAddedToShortlist?: () => void;
  mode?: 'add_candidates' | 'manage_shortlists';
}

export const ShortlistModal: React.FC<ShortlistModalProps> = ({
  isOpen,
  onClose,
  selectedCandidateIds,
  onCandidatesAddedToShortlist,
  mode = 'add_candidates'
}) => {
  const { user } = useAuth();
  const { 
    createShortlist, 
    updateShortlist, 
    deleteShortlist, 
    addCandidateToShortlist,
    getShortlistsByUser,
    getCandidatesByShortlist
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'manage'>('existing');
  const [newShortlistName, setNewShortlistName] = useState('');
  const [editingShortlist, setEditingShortlist] = useState<Shortlist | null>(null);
  const [editName, setEditName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShortlistId, setSelectedShortlistId] = useState<string>('');

  const userShortlists = user?.id ? getShortlistsByUser(user.id) : [];

  useEffect(() => {
    if (mode === 'manage_shortlists') {
      setActiveTab('manage');
    } else if (userShortlists.length === 0) {
      setActiveTab('new');
    }
  }, [userShortlists.length, mode]);

  const handleCreateShortlist = async () => {
    if (!newShortlistName.trim()) return;
    
    setIsLoading(true);
    try {
      const newShortlist = await createShortlist(newShortlistName.trim());
      
      // Add selected candidates to the new shortlist only in add_candidates mode
      if (mode === 'add_candidates' && selectedCandidateIds.length > 0) {
        for (const candidateId of selectedCandidateIds) {
          await addCandidateToShortlist(newShortlist.id, candidateId);
        }
      }
      
      setNewShortlistName('');
      
      if (mode === 'add_candidates') {
        onCandidatesAddedToShortlist?.();
        onClose();
      } else {
        // In manage mode, switch to manage tab to show the new shortlist
        setActiveTab('manage');
      }
    } catch (error) {
      console.error('Error creating shortlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToExistingShortlist = async () => {
    if (!selectedShortlistId || selectedCandidateIds.length === 0) return;
    
    setIsLoading(true);
    try {
      for (const candidateId of selectedCandidateIds) {
        await addCandidateToShortlist(selectedShortlistId, candidateId);
      }
      onCandidatesAddedToShortlist?.();
      onClose();
    } catch (error) {
      console.error('Error adding candidates to shortlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShortlist = (shortlist: Shortlist) => {
    setEditingShortlist(shortlist);
    setEditName(shortlist.name);
  };

  const handleSaveEdit = async () => {
    if (!editingShortlist || !editName.trim()) return;
    
    setIsLoading(true);
    try {
      await updateShortlist(editingShortlist.id, {
        name: editName.trim()
      });
      setEditingShortlist(null);
      setEditName('');
    } catch (error) {
      console.error('Error updating shortlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShortlist = async (shortlistId: string) => {
    if (!window.confirm('Are you sure you want to delete this shortlist? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteShortlist(shortlistId);
    } catch (error) {
      console.error('Error deleting shortlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-shadowforce border border-guardian/20 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-anton text-white-knight">
            {mode === 'manage_shortlists' 
              ? 'Manage Shortlists'
              : `Add to Shortlist (${selectedCandidateIds.length} candidate${selectedCandidateIds.length !== 1 ? 's' : ''})`
            }
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-guardian/20 mb-6">
          {mode === 'manage_shortlists' ? (
            <>
              <button
                className={`px-4 py-2 font-jakarta font-semibold transition-colors ${
                  activeTab === 'manage'
                    ? 'text-supernova border-b-2 border-supernova'
                    : 'text-guardian hover:text-white-knight'
                }`}
                onClick={() => setActiveTab('manage')}
              >
                Manage Existing ({userShortlists.length})
              </button>
              <button
                className={`px-4 py-2 font-jakarta font-semibold transition-colors ${
                  activeTab === 'new'
                    ? 'text-supernova border-b-2 border-supernova'
                    : 'text-guardian hover:text-white-knight'
                }`}
                onClick={() => setActiveTab('new')}
              >
                Create New Shortlist
              </button>
            </>
          ) : (
            <>
              <button
                className={`px-4 py-2 font-jakarta font-semibold transition-colors ${
                  activeTab === 'existing'
                    ? 'text-supernova border-b-2 border-supernova'
                    : 'text-guardian hover:text-white-knight'
                }`}
                onClick={() => setActiveTab('existing')}
              >
                Add to Existing ({userShortlists.length})
              </button>
              <button
                className={`px-4 py-2 font-jakarta font-semibold transition-colors ${
                  activeTab === 'new'
                    ? 'text-supernova border-b-2 border-supernova'
                    : 'text-guardian hover:text-white-knight'
                }`}
                onClick={() => setActiveTab('new')}
              >
                Create New Shortlist
              </button>
            </>
          )}
        </div>

        {/* Existing Shortlists Tab */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            {userShortlists.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="text-guardian/40 mx-auto mb-4" />
                <p className="text-guardian font-jakarta">
                  No shortlists yet. Create your first shortlist below.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab('new')}
                >
                  Create New Shortlist
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {userShortlists.map((shortlist) => {
                    const candidateCount = getCandidatesByShortlist(shortlist.id).length;
                    const isEditing = editingShortlist?.id === shortlist.id;

                    return (
                      <div
                        key={shortlist.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          selectedShortlistId === shortlist.id
                            ? 'border-supernova bg-supernova/10'
                            : 'border-guardian/20 hover:border-guardian/40'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <FormInput
                              label="Shortlist Name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Enter shortlist name"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveEdit}
                                isLoading={isLoading}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingShortlist(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => setSelectedShortlistId(shortlist.id)}
                              >
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name="shortlist"
                                    checked={selectedShortlistId === shortlist.id}
                                    onChange={() => setSelectedShortlistId(shortlist.id)}
                                    className="mr-3"
                                  />
                                  <div>
                                    <h3 className="text-white-knight font-jakarta font-semibold">
                                      {shortlist.name}
                                    </h3>
                                    <p className="text-guardian/60 text-xs mt-1">
                                      {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditShortlist(shortlist)}
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteShortlist(shortlist.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-guardian/20">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddToExistingShortlist}
                    disabled={!selectedShortlistId}
                    isLoading={isLoading}
                  >
                    Add to Shortlist
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manage Shortlists Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {userShortlists.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="text-guardian/40 mx-auto mb-4" />
                <p className="text-guardian font-jakarta">
                  No shortlists yet. Create your first shortlist below.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab('new')}
                >
                  Create New Shortlist
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userShortlists.map((shortlist) => {
                  const candidateCount = getCandidatesByShortlist(shortlist.id).length;
                  const isEditing = editingShortlist?.id === shortlist.id;

                  return (
                    <div
                      key={shortlist.id}
                      className="p-4 border border-guardian/20 rounded-lg bg-shadowforce/50"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <FormInput
                            label="Shortlist Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter shortlist name"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              isLoading={isLoading}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingShortlist(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white-knight font-jakarta font-semibold">
                              {shortlist.name}
                            </h3>
                            <p className="text-guardian/60 text-xs mt-1">
                              {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditShortlist(shortlist)}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteShortlist(shortlist.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* New Shortlist Tab */}
        {activeTab === 'new' && (
          <div className="space-y-4">
            <FormInput
              label="Shortlist Name"
              value={newShortlistName}
              onChange={(e) => setNewShortlistName(e.target.value)}
              placeholder="e.g., Senior Engineers, Marketing Candidates"
              required
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-guardian/20">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateShortlist}
                disabled={!newShortlistName.trim()}
                isLoading={isLoading}
              >
                {mode === 'manage_shortlists' ? 'Create Shortlist' : 'Create & Add Candidates'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
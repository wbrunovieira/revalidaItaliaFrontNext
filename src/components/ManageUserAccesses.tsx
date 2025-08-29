'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { Search, User, Eye, Gift, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAccessesModal from '@/components/UserAccessesModal';
import GrantAccessModal from '@/components/GrantAccessModal';

interface User {
  id: string;
  fullName: string;
  email: string;
  cpf?: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export default function ManageUserAccesses() {
  const t = useTranslations('Admin.manageAccesses');
  const { token } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [accessesModalOpen, setAccessesModalOpen] = useState(false);
  const [grantAccessModalOpen, setGrantAccessModalOpen] = useState(false);
  const [selectedUserForGrant, setSelectedUserForGrant] = useState<User | null>(null);

  const searchUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: t('error.emptySearch'),
        description: t('error.enterSearchTerm'),
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Determine search parameter based on query type
      let searchParams = '';
      const cleanQuery = searchQuery.trim();

      if (cleanQuery.includes('@')) {
        // Email search
        searchParams = `email=${encodeURIComponent(cleanQuery)}`;
      } else if (/^\d+$/.test(cleanQuery.replace(/\D/g, ''))) {
        // CPF/Document search (numbers only)
        searchParams = `nationalId=${encodeURIComponent(cleanQuery.replace(/\D/g, ''))}`;
      } else {
        // Name search
        searchParams = `name=${encodeURIComponent(cleanQuery)}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/search?${searchParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      
      // Handle different response structures
      let users = [];
      if (data.items) {
        users = data.items;
      } else if (data.users) {
        users = data.users;
      } else if (Array.isArray(data)) {
        users = data;
      }

      // Map the users to ensure consistent structure
      const mappedUsers = users.map((user: any) => ({
        id: user.id || user.identityId || '',
        identityId: user.identityId || user.id || '',
        fullName: user.fullName || user.name || 'Unnamed User',
        email: user.email || '',
        nationalId: user.nationalId || '',
        role: user.role || 'student',
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt || new Date().toISOString()
      }));

      setSearchResults(mappedUsers);

      if (mappedUsers.length === 0) {
        toast({
          title: t('noResults'),
          description: t('tryDifferentSearch'),
        });
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: t('error.searchFailed'),
        description: t('error.searchFailedDesc'),
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, token, t, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  const handleViewAccesses = (user: User) => {
    setSelectedUser(user);
    setAccessesModalOpen(true);
  };

  const handleGrantAccess = (user: User) => {
    setSelectedUserForGrant(user);
    setGrantAccessModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'tutor':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'student':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Search Section */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">{t('searchTitle')}</h3>
              <p className="text-gray-400 text-sm">{t('searchDescription')}</p>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <Button
                onClick={searchUsers}
                disabled={isSearching}
                className="bg-secondary text-primary-dark hover:bg-secondary/80"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    {t('searching')}
                  </>
                ) : (
                  <>
                    <Search className="mr-2" size={16} />
                    {t('search')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {hasSearched && (
          <Card className="bg-gray-800 border-gray-700">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-secondary" size={48} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto text-gray-500 mb-4" size={48} />
                <p className="text-gray-400">{t('noUsersFound')}</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="text-gray-400 text-sm mb-2">
                  {t('foundUsers', { count: searchResults.length })}
                </div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold">{user.fullName}</h4>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {t(`roles.${user.role}`)}
                          </Badge>
                          <Badge className={user.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                            {user.isActive ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="text-gray-400">
                            <span className="text-gray-500">{t('email')}:</span> {user.email}
                          </div>
                          {user.cpf && (
                            <div className="text-gray-400">
                              <span className="text-gray-500">{t('cpf')}:</span> {user.cpf}
                            </div>
                          )}
                          <div className="text-gray-400">
                            <span className="text-gray-500">{t('memberSince')}:</span> {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleGrantAccess(user)}
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-400 hover:bg-green-500/10"
                        >
                          <Gift className="mr-2" size={16} />
                          {t('grantAccess')}
                        </Button>
                        <Button
                          onClick={() => handleViewAccesses(user)}
                          size="sm"
                          variant="outline"
                          className="border-secondary text-secondary hover:bg-secondary/10"
                        >
                          <Eye className="mr-2" size={16} />
                          {t('viewAccesses')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Instructions Card */}
        {!hasSearched && (
          <Card className="bg-gray-800 border-gray-700 p-8">
            <div className="text-center">
              <User className="mx-auto text-gray-500 mb-4" size={64} />
              <h3 className="text-white font-semibold text-lg mb-2">{t('instructions.title')}</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                {t('instructions.description')}
              </p>
              <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-secondary mt-0.5" size={16} />
                  <p className="text-gray-400 text-sm">{t('instructions.tip1')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-secondary mt-0.5" size={16} />
                  <p className="text-gray-400 text-sm">{t('instructions.tip2')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-secondary mt-0.5" size={16} />
                  <p className="text-gray-400 text-sm">{t('instructions.tip3')}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* User Accesses Modal */}
      {selectedUser && (
        <UserAccessesModal
          isOpen={accessesModalOpen}
          onClose={() => {
            setAccessesModalOpen(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          userName={selectedUser.fullName}
          userEmail={selectedUser.email}
          token={token || ''}
        />
      )}

      {/* Grant Access Modal */}
      {selectedUserForGrant && (
        <GrantAccessModal
          isOpen={grantAccessModalOpen}
          onClose={() => {
            setGrantAccessModalOpen(false);
            setSelectedUserForGrant(null);
          }}
          user={{
            id: selectedUserForGrant.id,
            name: selectedUserForGrant.fullName,
            email: selectedUserForGrant.email,
          }}
          onSuccess={() => {
            // Optionally refresh or show success message
            toast({
              title: t('success.accessGranted'),
              description: t('success.accessGrantedDesc'),
            });
          }}
        />
      )}
    </>
  );
}
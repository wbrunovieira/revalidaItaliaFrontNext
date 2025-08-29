'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Edit3, 
  Clock, 
  Loader2, 
  AlertCircle,
  UserX,
  UserCheck,
  Ban,
  RefreshCw,
  Infinity
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';

interface AccessInfo {
  id: string;
  productName: string;
  status: string;
  startDate: string;
  expirationDate: string | null;
  isLifetime: boolean;
  accessType: string;
}

interface EditAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  access: AccessInfo;
  userName: string;
  onSuccess?: () => void;
}

type ActionType = 'status' | 'extend' | 'setDate' | 'lifetime' | null;
type StatusType = 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';

export default function EditAccessModal({
  isOpen,
  onClose,
  access,
  userName,
  onSuccess,
}: EditAccessModalProps) {
  const t = useTranslations('Admin.editAccess');
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [newStatus, setNewStatus] = useState<StatusType>(access.status as StatusType);
  const [additionalDays, setAdditionalDays] = useState<number | ''>('');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setActionType(null);
      setNewStatus(access.status as StatusType);
      setAdditionalDays('');
      setNewExpirationDate('');
      setReason('');
    }
  }, [isOpen, access.status]);

  const handleSave = async () => {
    if (!actionType) {
      toast({
        title: t('error.noActionTitle'),
        description: t('error.noActionDescription'),
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: t('error.noReasonTitle'),
        description: t('error.noReasonDescription'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      interface UpdateAccessBody {
        status?: StatusType;
        expirationDate?: string | null;
        additionalDays?: number;
        reason: string;
      }

      const body: UpdateAccessBody = {
        reason: reason.trim(),
      };

      switch (actionType) {
        case 'status':
          body.status = newStatus;
          break;
        case 'extend':
          if (additionalDays && Number(additionalDays) > 0) {
            body.additionalDays = Number(additionalDays);
          } else {
            throw new Error(t('error.invalidDays'));
          }
          break;
        case 'setDate':
          if (newExpirationDate) {
            body.expirationDate = new Date(newExpirationDate).toISOString();
          } else {
            throw new Error(t('error.invalidDate'));
          }
          break;
        case 'lifetime':
          body.expirationDate = null;
          break;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/accesses/${access.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update access');
      }

      await response.json();
      
      toast({
        title: t('success.title'),
        description: t('success.description', { userName }),
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error updating access:', error);
      toast({
        title: t('error.saveTitle'),
        description: error instanceof Error ? error.message : t('error.saveDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setActionType(null);
    setNewStatus(access.status as StatusType);
    setAdditionalDays('');
    setNewExpirationDate('');
    setReason('');
    onClose();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: UserCheck },
      SUSPENDED: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: UserX },
      REVOKED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Ban },
      EXPIRED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="mr-1" size={14} />
        {t(`status.${status.toLowerCase()}`)}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return t('lifetime');
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isRevoked = access.status === 'REVOKED';
  const isLifetime = access.isLifetime || !access.expirationDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit3 className="text-secondary" size={24} />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            {t('subtitle', { userName, productName: access.productName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-medium mb-2">{t('currentStatus')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">{t('status.label')}:</span>
                <div className="mt-1">{getStatusBadge(access.status)}</div>
              </div>
              <div>
                <span className="text-gray-400">{t('expiration')}:</span>
                <div className="mt-1 text-white">
                  {isLifetime ? (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Infinity className="mr-1" size={14} />
                      {t('lifetime')}
                    </Badge>
                  ) : (
                    formatDate(access.expirationDate)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <Label className="text-white">{t('selectAction')}</Label>
            
            {isRevoked ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                  <p className="text-red-400 text-sm">
                    {t('revokedWarning')}
                  </p>
                </div>
              </div>
            ) : (
              <RadioGroup value={actionType || ''} onValueChange={(value) => setActionType(value as ActionType)}>
                <div className="space-y-3">
                  {/* Change Status */}
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="status" id="status" />
                    <div className="flex-1">
                      <Label htmlFor="status" className="text-white cursor-pointer">
                        {t('actions.changeStatus')}
                      </Label>
                      {actionType === 'status' && (
                        <div className="mt-3 space-y-2 ml-6">
                          {(['ACTIVE', 'SUSPENDED', 'EXPIRED'] as StatusType[]).map((status) => (
                            <label key={status} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="newStatus"
                                value={status}
                                checked={newStatus === status}
                                onChange={(e) => setNewStatus(e.target.value as StatusType)}
                                className="text-secondary"
                              />
                              <span className="text-gray-300">{getStatusBadge(status)}</span>
                            </label>
                          ))}
                          {access.status !== 'REVOKED' && (
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="newStatus"
                                value="REVOKED"
                                checked={newStatus === 'REVOKED'}
                                onChange={(e) => setNewStatus(e.target.value as StatusType)}
                                className="text-secondary"
                              />
                              <span className="text-gray-300">{getStatusBadge('REVOKED')}</span>
                              <span className="text-xs text-red-400 ml-2">({t('irreversible')})</span>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extend Access */}
                  {!isLifetime && (
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="extend" id="extend" />
                      <div className="flex-1">
                        <Label htmlFor="extend" className="text-white cursor-pointer">
                          {t('actions.extendAccess')}
                        </Label>
                        {actionType === 'extend' && (
                          <div className="mt-3 ml-6">
                            <Input
                              type="number"
                              value={additionalDays}
                              onChange={(e) => setAdditionalDays(e.target.value ? Number(e.target.value) : '')}
                              placeholder={t('daysPlaceholder')}
                              className="bg-gray-800 border-gray-700 text-white w-32"
                              min="1"
                            />
                            <p className="text-xs text-gray-400 mt-1">{t('extendHelp')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Set Specific Date */}
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="setDate" id="setDate" />
                    <div className="flex-1">
                      <Label htmlFor="setDate" className="text-white cursor-pointer">
                        {t('actions.setDate')}
                      </Label>
                      {actionType === 'setDate' && (
                        <div className="mt-3 ml-6">
                          <Input
                            type="datetime-local"
                            value={newExpirationDate}
                            onChange={(e) => setNewExpirationDate(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <p className="text-xs text-gray-400 mt-1">{t('dateHelp')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grant Lifetime */}
                  {!isLifetime && (
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="lifetime" id="lifetime" />
                      <div className="flex-1">
                        <Label htmlFor="lifetime" className="text-white cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Infinity size={16} />
                            {t('actions.grantLifetime')}
                          </div>
                        </Label>
                        {actionType === 'lifetime' && (
                          <p className="text-xs text-yellow-400 mt-2 ml-6">
                            {t('lifetimeWarning')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Reason */}
          {actionType && !isRevoked && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white">
                {t('reason.label')} *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reason.placeholder')}
                className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
              />
              <p className="text-xs text-gray-400">{t('reason.help')}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !actionType || !reason.trim() || isRevoked}
              className="bg-secondary hover:bg-secondary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  {t('saving')}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2" size={16} />
                  {t('save')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
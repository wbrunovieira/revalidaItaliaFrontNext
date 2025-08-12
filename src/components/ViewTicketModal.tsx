'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Paperclip,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeInBytes: number;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER';
  uploadedAt: string;
}

interface MessageAuthor {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  profileImageUrl?: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: MessageAuthor;
  attachments: Attachment[];
}

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface TicketDetails {
  id: string;
  contextType: 'LESSON' | 'ASSESSMENT' | 'FLASHCARD' | 'GENERAL';
  contextId: string;
  contextTitle: string;
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  student: UserInfo;
  tutor?: UserInfo;
  messages: Message[];
}

interface ViewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onStatusChange?: () => void;
  isTutor?: boolean;
}

export function ViewTicketModal({
  isOpen,
  onClose,
  ticketId,
  onStatusChange,
  isTutor = false,
}: ViewTicketModalProps) {
  const t = useTranslations('ViewTicket');
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  // Fetch ticket details
  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/${ticketId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.status}`);
      }

      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetails();
    }
  }, [isOpen, ticketId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-blue-400 bg-blue-900/20';
      case 'ANSWERED':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'RESOLVED':
        return 'text-green-400 bg-green-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle size={14} />;
      case 'ANSWERED':
        return <MessageSquare size={14} />;
      case 'RESOLVED':
        return <CheckCircle size={14} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN':
        return t('status.open');
      case 'ANSWERED':
        return t('status.answered');
      case 'RESOLVED':
        return t('status.resolved');
      default:
        return status;
    }
  };

  const getContextColor = (contextType: string) => {
    switch (contextType) {
      case 'LESSON':
        return 'text-purple-400 bg-purple-900/20';
      case 'ASSESSMENT':
        return 'text-orange-400 bg-orange-900/20';
      case 'FLASHCARD':
        return 'text-pink-400 bg-pink-900/20';
      case 'GENERAL':
        return 'text-gray-400 bg-gray-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getContextText = (contextType: string) => {
    switch (contextType) {
      case 'LESSON':
        return t('context.lesson');
      case 'ASSESSMENT':
        return t('context.assessment');
      case 'FLASHCARD':
        return t('context.flashcard');
      case 'GENERAL':
        return t('context.general');
      default:
        return contextType;
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon size={16} />;
      case 'VIDEO':
        return <Film size={16} />;
      case 'DOCUMENT':
        return <FileText size={16} />;
      default:
        return <Paperclip size={16} />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tutor':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-blue-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30">
            {t('role.tutor')}
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {t('role.admin')}
          </span>
        );
      case 'student':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {t('role.student')}
          </span>
        );
      default:
        return null;
    }
  };

  const handleResolve = async () => {
    // TODO: Implement resolve ticket API call
    toast({
      title: t('resolveSuccess'),
      description: t('resolveSuccessDescription'),
    });
    onClose();
    onStatusChange?.();
  };

  const handleReopen = async () => {
    // TODO: Implement reopen ticket API call
    toast({
      title: t('reopenSuccess'),
      description: t('reopenSuccessDescription'),
    });
    onClose();
    onStatusChange?.();
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !ticketId) return;

    try {
      setSendingReply(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/${ticketId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: replyContent.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.status}`);
      }

      toast({
        title: t('replySuccess'),
        description: t('replySuccessDescription'),
      });

      setReplyContent('');
      setShowReplyBox(false);
      
      // Refresh ticket details to show the new message
      await fetchTicketDetails();
      onStatusChange?.();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: t('error.replyTitle'),
        description: t('error.replyDescription'),
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gray-900 border-gray-800">
        <DialogHeader className="px-6 py-4 border-b border-gray-800">
          <DialogTitle className="text-xl font-bold text-white">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        ) : ticket ? (
          <div className="flex flex-col h-full">
            {/* Ticket Header */}
            <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {getStatusText(ticket.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getContextColor(ticket.contextType)}`}>
                    {getContextText(ticket.contextType)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar size={14} />
                  <span>{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
              
              {ticket.contextTitle && (
                <h3 className="text-lg font-semibold text-white mb-2">
                  {ticket.contextTitle}
                </h3>
              )}

              {/* Student Info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  {ticket.student.profileImageUrl ? (
                    <img
                      src={ticket.student.profileImageUrl}
                      alt={ticket.student.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {ticket.student.fullName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ticket.student.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {ticket.messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.author.role === 'student' ? "flex-row" : "flex-row-reverse"
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      {message.author.profileImageUrl ? (
                        <img
                          src={message.author.profileImageUrl}
                          alt={message.author.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-primary" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={cn(
                      "flex-1 max-w-[70%]",
                      message.author.role === 'student' ? "mr-auto" : "ml-auto"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {message.author.fullName}
                        </span>
                        {getRoleBadge(message.author.role)}
                        <span className="text-xs text-gray-500">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>

                      <div className={cn(
                        "p-4 rounded-lg",
                        message.author.role === 'student'
                          ? "bg-gray-800 text-gray-100"
                          : "bg-secondary/20 text-gray-100 border border-secondary/30"
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-gray-900/50 rounded hover:bg-gray-900/70 transition-colors"
                              >
                                {getAttachmentIcon(attachment.type)}
                                <span className="flex-1 text-sm truncate">
                                  {attachment.fileName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(attachment.sizeInBytes)}
                                </span>
                                <Download size={14} className="text-gray-400" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply Section for Tutors */}
            {isTutor && ticket.status !== 'RESOLVED' && (
              <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {t('reply.title')}
                    </h4>
                    {!showReplyBox && (
                      <Button
                        onClick={() => setShowReplyBox(true)}
                        size="sm"
                        className="bg-secondary text-primary hover:bg-secondary/90"
                      >
                        <MessageSquare size={16} className="mr-2" />
                        {t('reply.button')}
                      </Button>
                    )}
                  </div>
                  
                  {showReplyBox && (
                    <div className="space-y-3">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={t('reply.placeholder')}
                        className="min-h-[100px] bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => {
                            setShowReplyBox(false);
                            setReplyContent('');
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          {t('reply.cancel')}
                        </Button>
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyContent.trim() || sendingReply}
                          size="sm"
                          className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                        >
                          {sendingReply ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                              {t('reply.sending')}
                            </>
                          ) : (
                            <>
                              <Send size={16} className="mr-2" />
                              {t('reply.send')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {ticket.status === 'RESOLVED' ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      {t('resolvedAt', { date: formatDate(ticket.resolvedAt!) })}
                    </span>
                  ) : (
                    <span>{t('messagesCount', { count: ticket.messages.length })}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Only show resolve/reopen buttons for students */}
                  {!isTutor && (
                    <>
                      {ticket.status === 'RESOLVED' ? (
                        <Button
                          onClick={handleReopen}
                          className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                          <RefreshCw size={16} className="mr-2" />
                          {t('reopen')}
                        </Button>
                      ) : ticket.status === 'ANSWERED' ? (
                        <Button
                          onClick={handleResolve}
                          className="bg-green-500 text-white hover:bg-green-600"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          {t('markResolved')}
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {t('waitingResponse')}
                        </div>
                      )}
                    </>
                  )}
                  
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    {t('close')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('notFound')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
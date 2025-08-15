'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { ReopenTicketModal } from './ReopenTicketModal';
import { useAuthStore } from '@/stores/auth.store';
import Image from 'next/image';
import {
  MessageSquare,
  Paperclip,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Send,
  Upload,
  X,
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
  messageType?: 'REGULAR' | 'REOPEN' | 'CLOSE' | 'SYSTEM' | 'ESCALATION';
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
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAcceptAnswer = async () => {
    if (!ticketId) return;

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/${ticketId}/accept`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to accept ticket: ${response.status}`);
      }

      toast({
        title: t('acceptSuccess'),
        description: t('acceptSuccessDescription'),
      });
      
      onClose();
      onStatusChange?.();
    } catch (error) {
      console.error('Error accepting ticket:', error);
      toast({
        title: t('error.acceptTitle'),
        description: t('error.acceptDescription'),
        variant: 'destructive',
      });
    }
  };


  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const MAX_ATTACHMENTS = 5;
    
    if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
      toast({
        title: t('error.tooManyFiles'),
        description: t('error.maxFilesDescription', { max: MAX_ATTACHMENTS }),
        variant: 'destructive',
      });
      return;
    }

    const validFiles = fileArray.filter(file => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t('error.fileTooLarge'),
          description: t('error.fileSizeDescription', { 
            name: file.name,
            max: '10MB' 
          }),
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  }, [attachments, t, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getAttachmentType = (mimeType: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER' => {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType === 'application/pdf') return 'DOCUMENT';
    return 'OTHER';
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

      // Upload attachments first
      const uploadedAttachments = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('category', 'attachment');
            uploadFormData.append('folder', 'tickets');
            
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            });
            
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              throw new Error(error.error || 'Failed to upload file');
            }
            
            const { url } = await uploadResponse.json();
            
            uploadedAttachments.push({
              url,
              fileName: file.name,
              mimeType: file.type,
              sizeInBytes: file.size,
              type: getAttachmentType(file.type),
            });
          } catch (uploadError) {
            console.error('Error uploading file:', file.name, uploadError);
            toast({
              title: t('error.uploadFailed'),
              description: `Failed to upload ${file.name}`,
              variant: 'destructive',
            });
          }
        }
      }

      const requestBody = {
        content: replyContent.trim(),
        ...(uploadedAttachments.length > 0 && { attachments: uploadedAttachments }),
      };

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/${ticketId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
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
      setAttachments([]);
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
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                  {user?.profileImageUrl ? (
                    <Image
                      src={user.profileImageUrl}
                      alt={ticket.student.fullName}
                      width={32}
                      height={32}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/avatar.svg"
                      alt={ticket.student.fullName}
                      width={32}
                      height={32}
                      className="w-full h-full"
                    />
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
                {ticket.messages.map((message) => {
                  // Check if message is from the ticket owner (student)
                  const isFromStudent = message.author.id === ticket.student.id;
                  
                  return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isFromStudent ? "flex-row" : "flex-row-reverse"
                    )}
                  >
                    {/* Avatar - Only show for student messages */}
                    {isFromStudent ? (
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user?.profileImageUrl ? (
                          <Image
                            src={user.profileImageUrl}
                            alt={message.author.fullName}
                            width={40}
                            height={40}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Image
                            src="/avatar.svg"
                            alt={message.author.fullName}
                            width={40}
                            height={40}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    ) : (
                      // For tutor/admin messages, just show initials or icon
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {message.author.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className={cn(
                      "flex-1 max-w-[70%]",
                      isFromStudent ? "mr-auto" : "ml-auto"
                    )}>
                      <div className={cn(
                        "flex items-center gap-2 mb-1",
                        !isFromStudent && "justify-end"
                      )}>
                        {/* Show reopen indicator if it's a reopen message */}
                        {message.messageType === 'REOPEN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            <RefreshCw size={12} />
                            {t('reopenIndicator')}
                          </span>
                        )}
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
                        message.messageType === 'REOPEN' 
                          ? "bg-orange-900/20 border border-orange-500/30 text-orange-100"
                          : isFromStudent
                          ? "bg-gray-800 text-gray-100"
                          : "bg-secondary/20 text-gray-100 border border-secondary/30"
                      )}>
                        {message.messageType === 'REOPEN' && (
                          <p className="text-xs text-orange-400 mb-2 font-medium">
                            {t('reopenMessagePrefix')}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {/* Image Previews */}
                            {message.attachments.filter(a => a.type === 'IMAGE').length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {message.attachments
                                  .filter(a => a.type === 'IMAGE')
                                  .map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative group block overflow-hidden rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-all"
                                    >
                                      {!brokenImages.has(attachment.id) ? (
                                        <Image
                                          src={attachment.url}
                                          alt={attachment.fileName}
                                          width={200}
                                          height={128}
                                          className="w-full h-32 object-cover"
                                          onError={() => {
                                            setBrokenImages(prev => new Set(prev).add(attachment.id));
                                          }}
                                        />
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-32 text-gray-500 bg-gray-900/50">
                                          <ImageIcon className="h-8 w-8 mb-2" />
                                          <span className="text-xs">Preview unavailable</span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Download size={20} className="text-white" />
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                        <p className="text-xs text-white truncate">
                                          {attachment.fileName}
                                        </p>
                                      </div>
                                    </a>
                                  ))}
                              </div>
                            )}
                            
                            {/* Other Attachments */}
                            {message.attachments.filter(a => a.type !== 'IMAGE').map((attachment) => (
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
                  );
                })}
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
                      
                      {/* Attachment Upload Area */}
                      <div className="space-y-2">
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "relative border-2 border-dashed border-gray-700 rounded-lg p-4",
                            "cursor-pointer transition-all duration-200 bg-gray-900/50",
                            "hover:border-gray-600 hover:bg-gray-900/70",
                            isDragging && "border-secondary bg-gray-900/70",
                            attachments.length >= 5 && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                            disabled={attachments.length >= 5}
                          />
                          
                          <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="h-6 w-6 text-gray-500 mb-2" />
                            <p className="text-xs text-gray-400">
                              {isDragging ? t('reply.dropFiles') : t('reply.dragDropText')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('reply.supportedFormats') || 'Images and PDFs • Max 10MB'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Attachment Preview */}
                        {attachments.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {attachments.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="relative group"
                              >
                                {file.type.startsWith('image/') ? (
                                  <div className="relative h-20 rounded-lg overflow-hidden bg-gray-800">
                                    <Image
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover"
                                      onLoad={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        if (img.src.startsWith('blob:')) {
                                          setTimeout(() => URL.revokeObjectURL(img.src), 100);
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                ) : (
                                  <div className="h-20 rounded-lg bg-gray-800 flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-500" />
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeAttachment(index);
                                  }}
                                  className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} className="text-white" />
                                </button>
                                
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {file.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {attachments.length}/5 {t('reply.attachments') || 'attachments'}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setShowReplyBox(false);
                              setReplyContent('');
                              setAttachments([]);
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
                  {/* Only show action buttons for students */}
                  {!isTutor && (
                    <>
                      {ticket.status === 'RESOLVED' ? (
                        <div className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle size={16} />
                          {t('ticketResolved')}
                        </div>
                      ) : ticket.status === 'ANSWERED' ? (
                        <>
                          <Button
                            onClick={() => setIsReopenModalOpen(true)}
                            variant="outline"
                            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                          >
                            <RefreshCw size={16} className="mr-2" />
                            {t('needClarification')}
                          </Button>
                          <Button
                            onClick={handleAcceptAnswer}
                            className="bg-green-500 text-white hover:bg-green-600"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            {t('acceptAnswer')}
                          </Button>
                        </>
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

      {/* Reopen Ticket Modal */}
      <ReopenTicketModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        ticketId={ticketId}
        onSuccess={() => {
          fetchTicketDetails(); // Refresh ticket details
          onStatusChange?.(); // Notify parent to refresh list
        }}
      />
    </Dialog>
  );
}
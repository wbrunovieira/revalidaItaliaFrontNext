"use client";

import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { 
  X, 
  Loader2, 
  Send, 
  Paperclip, 
  AlertCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  MessageSquareReply,
  User,
  Calendar,
  Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images

const formSchema = z.object({
  content: z
    .string()
    .min(10, "Minimum 10 characters")
    .max(5000, "Maximum 5000 characters"),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        sizeInBytes: z.number(),
        type: z.enum(["IMAGE", "VIDEO", "DOCUMENT", "OTHER"]),
      })
    )
    .max(MAX_ATTACHMENTS)
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TicketInfo {
  id: string;
  contextType: string;
  contextTitle: string;
  student: {
    fullName: string;
    email: string;
  };
  messageCount: number;
  createdAt: string;
}

interface RespondSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketInfo | null;
  onSuccess?: () => void;
}

export function RespondSupportTicketModal({
  isOpen,
  onClose,
  ticket,
  onSuccess,
}: RespondSupportTicketModalProps) {
  const t = useTranslations("Admin.supportResponse");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      attachments: [],
    },
  });

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
      toast({
        title: t("errors.tooManyFiles"),
        description: t("errors.maxFilesDescription", { max: MAX_ATTACHMENTS }),
        variant: "destructive",
      });
      return;
    }

    const validFiles = fileArray.filter(file => {
      // Check file size based on type
      let maxSize = MAX_FILE_SIZE;
      if (file.type.startsWith("video/")) {
        maxSize = 100 * 1024 * 1024; // 100MB for videos
      } else if (file.type === "application/pdf") {
        maxSize = 50 * 1024 * 1024; // 50MB for documents
      }

      if (file.size > maxSize) {
        toast({
          title: t("errors.fileTooLarge"),
          description: t("errors.fileSizeDescription", { 
            name: file.name,
            max: formatFileSize(maxSize) 
          }),
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  }, [attachments, t, toast]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

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

  const getAttachmentType = (mimeType: string): "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER" => {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType === "application/pdf") return "DOCUMENT";
    return "OTHER";
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <Paperclip className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContextColor = (contextType: string) => {
    switch (contextType) {
      case 'LESSON':
        return 'bg-purple-500';
      case 'ASSESSMENT':
        return 'bg-orange-500';
      case 'FLASHCARD':
        return 'bg-pink-500';
      case 'GENERAL':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!ticket) return;

    setIsSubmitting(true);
    
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      // Upload attachments if any
      const uploadedAttachments = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          // Simulate upload progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const formData = new FormData();
          formData.append("file", file);

          // Update progress simulation
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: Math.min((prev[file.name] || 0) + 20, 90)
            }));
          }, 200);

          try {
            const uploadRes = await fetch(`${apiUrl}/api/upload`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

            if (!uploadRes.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            const { url } = await uploadRes.json();
            
            uploadedAttachments.push({
              url,
              fileName: file.name,
              mimeType: file.type,
              sizeInBytes: file.size,
              type: getAttachmentType(file.type),
            });
          } catch (error) {
            clearInterval(progressInterval);
            throw error;
          }
        }
      }

      // Send the message
      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/${ticket.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: data.content,
            attachments: uploadedAttachments,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to send message: ${response.status}`);
      }

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>{t("success.title")}</span>
          </div>
        ) as any,
        description: t("success.description"),
      });

      form.reset();
      setAttachments([]);
      setUploadProgress({});
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("errors.submitError"),
        description: error instanceof Error ? error.message : t("errors.submitDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        {/* Animated Header with Gradient */}
        <DialogHeader className="relative p-0">
          {/* Hidden DialogTitle for accessibility */}
          <DialogTitle className="sr-only">{t("title")}</DialogTitle>
          <div className="relative h-32 bg-primary overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white rounded-full animate-pulse delay-75" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full animate-pulse delay-150" />
            </div>

            {/* Header Content */}
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl"
                >
                  <MessageSquareReply className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white"
                  >
                    {t("title")}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/80 text-sm mt-1"
                  >
                    {t("subtitle")}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-primary">
          {/* Ticket Info Card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/5 rounded-xl blur-xl" />
            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", getContextColor(ticket.contextType))}>
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-white/70">
                      {t(`contextTypes.${ticket.contextType.toLowerCase()}`)}
                    </p>
                    <span className="text-white/40">•</span>
                    <p className="text-xs text-white/70">
                      {ticket.messageCount} {t("messages")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">
                    {ticket.contextTitle}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{ticket.student.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Response Textarea */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold text-white">
                      <MessageSquareReply className="h-4 w-4 text-white" />
                      {t("responseLabel")}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          placeholder={t("responsePlaceholder")}
                          className={cn(
                            "min-h-[180px] resize-none",
                            "border-4 border-white/30 bg-white/95",
                            "focus:border-secondary focus:bg-white",
                            "focus:outline-none",
                            "rounded-xl p-4",
                            "text-base leading-relaxed text-gray-900",
                            "transition-all duration-300 ease-out",
                            "placeholder:text-gray-400"
                          )}
                          disabled={isSubmitting}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium transition-colors",
                            field.value.length > 4500 ? "text-orange-500" :
                            field.value.length > 4000 ? "text-yellow-500" :
                            "text-gray-400"
                          )}>
                            {field.value.length}/5000
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attachments Section with Drag & Drop */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-base font-semibold text-white">
                    <Paperclip className="h-4 w-4 text-white" />
                    {t("attachments")}
                  </label>
                  <span className={cn(
                    "text-sm font-medium px-3 py-1 rounded-full",
                    attachments.length === MAX_ATTACHMENTS 
                      ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                      : attachments.length > 0
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    {attachments.length}/{MAX_ATTACHMENTS}
                  </span>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed border-white/30 rounded-xl p-8",
                    "cursor-pointer transition-all duration-200 bg-white/5",
                    "group hover:border-white/50 hover:bg-white/10",
                    isDragging && "border-white/50 bg-white/10 scale-[1.02]",
                    isSubmitting && "opacity-50 cursor-not-allowed",
                    attachments.length >= MAX_ATTACHMENTS && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileInputChange}
                    disabled={isSubmitting || attachments.length >= MAX_ATTACHMENTS}
                  />
                  
                  <div className="flex flex-col items-center justify-center text-center">
                    <motion.div
                      animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                      className="p-4 bg-white/10 rounded-full mb-4 group-hover:bg-white/20 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-white" />
                    </motion.div>
                    <p className="text-sm font-medium text-white mb-1">
                      {isDragging ? t("dropFiles") : t("dragDropText")}
                    </p>
                    <p className="text-xs text-white/70">
                      {t("supportedFormats")}
                    </p>
                  </div>
                </div>

                {/* Attachment List with Animations */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {attachments.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group relative flex items-center gap-3 p-3 bg-white/90 rounded-lg hover:bg-white transition-colors"
                        >
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          
                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          
                          {/* Upload Progress (if uploading) */}
                          {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress[file.name]}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          )}
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(index);
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg transition-all"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Info Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-white/5 rounded-xl blur-xl" />
                <div className="relative flex gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <AlertCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-white font-medium">
                      {t("infoTitle")}
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {t("infoMessage")}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-w-[100px] rounded-xl"
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isValid}
                  className={cn(
                    "min-w-[140px] rounded-xl",
                    "bg-gradient-to-r from-primary to-primary/90",
                    "hover:from-primary/90 hover:to-primary",
                    "transform transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    "shadow-lg hover:shadow-xl"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("sending")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t("send")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
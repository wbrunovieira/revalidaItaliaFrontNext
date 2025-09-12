"use client";

import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import Image from 'next/image';
import { 
 
  Loader2, 
  Send, 
  Paperclip, 
  AlertCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  HelpCircle,
  Sparkles,
  MessageSquareText,
  X
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
import { useAuthStore } from "@/stores/auth.store";
import { motion, AnimatePresence } from "framer-motion";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
        type: z.enum(["IMAGE", "DOCUMENT", "OTHER"]),
      })
    )
    .max(MAX_ATTACHMENTS)
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    type: "LESSON" | "ASSESSMENT" | "FLASHCARD" | "GENERAL";
    id?: string;
    title?: string;
  };
}

export function CreateSupportTicketModal({
  isOpen,
  onClose,
  context = { type: "GENERAL" },
}: CreateSupportTicketModalProps) {
  const t = useTranslations("Support");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress] = useState<Record<string, number>>({});
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
        title: t("modal.errors.tooManyFiles"),
        description: t("modal.errors.maxFilesDescription", { max: MAX_ATTACHMENTS }),
        variant: "destructive",
      });
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t("modal.errors.fileTooLarge"),
          description: t("modal.errors.fileSizeDescription", { 
            name: file.name,
            max: "10MB" 
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

  const getAttachmentType = (mimeType: string): "IMAGE" | "DOCUMENT" | "OTHER" => {
    if (mimeType.startsWith("image/")) return "IMAGE";
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { token } = useAuthStore.getState();
    
    try {
      if (!token) {
        throw new Error('Authentication required');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      console.log("🔗 API URL:", apiUrl);
      console.log("🔐 Token exists:", !!token);
      console.log("🌍 process.env.NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
      
      // Upload attachments to local storage
      const uploadedAttachments = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            // Create FormData for upload
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('category', 'attachment');
            uploadFormData.append('folder', 'tickets');
            
            // Upload file to local storage
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
              url, // Use the returned URL from the upload
              fileName: file.name,
              mimeType: file.type,
              sizeInBytes: file.size,
              type: getAttachmentType(file.type),
            });
          } catch (uploadError) {
            console.error("Error uploading file:", file.name, uploadError);
            toast({
              title: t("modal.errors.uploadFailed") || "Upload Failed",
              description: t("modal.errors.uploadFailedDescription") || `Failed to upload ${file.name}`,
              variant: "destructive",
            });
            // Continue with other files even if one fails
          }
        }
      }

      // Create support ticket
      interface SupportTicketRequest {
        contextType: string;
        contextId?: string;
        contextTitle: string;
        content: string;
        attachments: Array<{
          url: string;
          fileName: string;
          mimeType: string;
          sizeInBytes: number;
          type: string;
        }>;
      }
      
      const requestBody: SupportTicketRequest = {
        contextType: context.type,
        contextTitle: context.title || t("modal.generalContext"),
        content: data.content,
        attachments: uploadedAttachments,
      };

      // Only include contextId for non-GENERAL types
      if (context.type !== 'GENERAL' && context.id) {
        requestBody.contextId = context.id;
      }

      console.log("🎫 Creating support ticket:", requestBody);
      
      const ticketUrl = `${apiUrl}/api/v1/support/tickets`;
      console.log("📮 Full URL:", ticketUrl);

      const response = await fetch(ticketUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", response.headers);
      
      const responseText = await response.text();
      console.log("📥 Raw response:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        responseData = { detail: responseText };
      }
      
      console.log("📥 Parsed response:", responseData);

      if (!response.ok) {
        console.error("❌ Request failed:", {
          status: response.status,
          statusText: response.statusText,
          detail: responseData.detail,
          url: ticketUrl
        });
        throw new Error(responseData.detail || responseData.message || `Failed to create support ticket: ${response.status}`);
      }

      toast({
        title: t("modal.success.title"),
        description: t("modal.success.description"),
      });

      form.reset();
      setAttachments([]);
      onClose();
    } catch (error) {
      console.error("❌ Error creating support ticket:", error);
      toast({
        title: t("modal.errors.submitError"),
        description: error instanceof Error ? error.message : t("modal.errors.submitDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 sm:inset-auto sm:left-[50%] sm:top-[50%] z-50 flex flex-col w-full sm:w-[95%] sm:max-w-[700px] h-full sm:h-auto sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] border-0 sm:border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg p-0 overflow-hidden">
        {/* Animated Header with Gradient - Fixed */}
        <DialogHeader className="relative p-0 flex-shrink-0">
          {/* Hidden DialogTitle for accessibility */}
          <DialogTitle className="sr-only">{t("modal.title")}</DialogTitle>
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
                  <MessageSquareText className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white"
                  >
                    {t("modal.title")}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/80 text-sm mt-1"
                  >
                    {t("modal.subtitle")}
                  </motion.p>
                </div>
              </div>
              
              {/* Custom Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-primary">
          {/* Context Badge with Animation */}
          <AnimatePresence>
            {context.type !== "GENERAL" && context.title && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-white/5 rounded-xl blur-xl" />
                <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/70 mb-1">
                        {t(`modal.contextTypes.${context.type.toLowerCase()}`)}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {context.title}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Enhanced Textarea Field */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold text-white">
                      <HelpCircle className="h-4 w-4 text-white" />
                      {t("modal.questionLabel")}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          placeholder={t("modal.questionPlaceholder")}
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

              {/* Enhanced Attachments Section with Drag & Drop */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-base font-semibold text-white">
                    <Paperclip className="h-4 w-4 text-white" />
                    {t("modal.attachments")}
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
                    accept="image/*,.pdf"
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
                      {isDragging ? t("modal.dropFiles") : t("modal.dragDropText")}
                    </p>
                    <p className="text-xs text-white/70">
                      {t("modal.supportedFormats")}
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
                          {/* File Icon or Image Preview */}
                          <div className="flex-shrink-0">
                            {file.type.startsWith("image/") ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <Image
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  onLoad={(e) => {
                                    // Clean up the object URL after loading
                                    const img = e.target as HTMLImageElement;
                                    if (img.src.startsWith('blob:')) {
                                      setTimeout(() => URL.revokeObjectURL(img.src), 100);
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                              </div>
                            ) : (
                              getFileIcon(file)
                            )}
                          </div>
                          
                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                              {file.type.startsWith("image/") && " • Image"}
                            </p>
                          </div>
                          
                          {/* Upload Progress (if uploading) */}
                          {uploadProgress[file.name] !== undefined && (
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

              {/* Info Message with Better Design */}
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
                      {t("modal.infoTitle")}
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {t("modal.infoMessage")}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-w-[100px] rounded-xl"
                >
                  {t("modal.cancel")}
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
                      {t("modal.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t("modal.send")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
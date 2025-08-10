"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { X, Loader2, Send, Paperclip, AlertCircle } from "lucide-react";
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
import { useAuthStore } from "@/stores/auth.store";

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      attachments: [],
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      toast({
        title: t("modal.errors.tooManyFiles"),
        description: t("modal.errors.maxFilesDescription", { max: MAX_ATTACHMENTS }),
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
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

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getAttachmentType = (mimeType: string): "IMAGE" | "DOCUMENT" | "OTHER" => {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType === "application/pdf") return "DOCUMENT";
    return "OTHER";
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
      // Upload attachments if any
      const uploadedAttachments = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch(`${apiUrl}/api/upload`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error("Failed to upload attachment");
          }

          const { url } = await uploadRes.json();
          
          uploadedAttachments.push({
            url,
            fileName: file.name,
            mimeType: file.type,
            sizeInBytes: file.size,
            type: getAttachmentType(file.type),
          });
        }
      }

      // Create support ticket
      const requestBody: any = {
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <span>{t("modal.title")}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Context Badge */}
        {context.type !== "GENERAL" && context.title && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-1">
              {t(`modal.contextTypes.${context.type.toLowerCase()}`)}
            </p>
            <p className="text-sm font-medium">{context.title}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("modal.questionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("modal.questionPlaceholder")}
                      className="min-h-[150px] resize-none"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground text-right">
                    {field.value.length}/5000
                  </p>
                </FormItem>
              )}
            />

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {t("modal.attachments")}
                </label>
                <span className="text-xs text-muted-foreground">
                  {attachments.length}/{MAX_ATTACHMENTS}
                </span>
              </div>

              {/* File Input */}
              <label
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3",
                  "border-2 border-dashed rounded-lg cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "transition-colors duration-200",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">{t("modal.addAttachment")}</span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  disabled={isSubmitting || attachments.length >= MAX_ATTACHMENTS}
                />
              </label>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Message */}
            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {t("modal.infoMessage")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t("modal.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
      </DialogContent>
    </Dialog>
  );
}
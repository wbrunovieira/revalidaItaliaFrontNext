'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Eye,
  Shield,
  Award,
  Calendar,
  Clock,
  User,
  Building,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, es, it } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getCookie } from '@/lib/auth-utils';

interface CertificateType {
  value: 'COURSE_COMPLETION' | 'TRACK_COMPLETION' | 'MODULE_COMPLETION';
  label: string;
}

interface CertificateStatus {
  value: 'AVAILABLE' | 'PENDING' | 'REVOKED';
  isAvailable: boolean;
  isRevoked: boolean;
  isPending: boolean;
}

interface CertificateMetadata {
  userName?: string;
  userEmail?: string;
  courseName?: string;
  trackName?: string;
  moduleName?: string;
  completionDate?: string;
  totalHours?: number;
  instructorName?: string;
  organizationName?: string;
}

interface CompletionData {
  startDate?: string;
  endDate?: string;
  totalLessons?: number;
  completedLessons?: number;
}

interface Certificate {
  id: string;
  userId: string;
  courseId?: string | null;
  trackId?: string | null;
  moduleId?: string | null;
  type: CertificateType;
  status: CertificateStatus;
  validationCode: string;
  issueDate: string;
  expirationDate?: string | null;
  certificateUrl?: string | null;
  thumbnailUrl?: string | null;
  metadata?: CertificateMetadata;
  completionData?: CompletionData;
  downloadCount: number;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CertificatesResponse {
  certificates: Certificate[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function ProfileCertificates() {
  const t = useTranslations('Profile.certificates');
  const { toast } = useToast();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt';
  
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getDateLocale = () => {
    switch (locale) {
      case 'pt':
        return ptBR;
      case 'es':
        return es;
      case 'it':
        return it;
      default:
        return ptBR;
    }
  };

  const fetchCertificates = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getCookie('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/v1/profile/certificates?page=${page}&pageSize=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data: CertificatesResponse = await response.json();
      setCertificates(data.certificates);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, t, toast]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleDownload = async (certificate: Certificate) => {
    if (!certificate.certificateUrl) return;

    try {
      setDownloadingId(certificate.id);
      
      // Open the certificate URL in a new tab
      window.open(certificate.certificateUrl, '_blank');
      
      // Update download count locally
      setCertificates(prev =>
        prev.map(cert =>
          cert.id === certificate.id
            ? { ...cert, downloadCount: cert.downloadCount + 1 }
            : cert
        )
      );
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: t('error.downloadTitle'),
        description: t('error.downloadDescription'),
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: getDateLocale() });
    } catch {
      return date;
    }
  };

  const getTypeIcon = (type: CertificateType['value']) => {
    switch (type) {
      case 'COURSE_COMPLETION':
        return <Award className="w-5 h-5" />;
      case 'TRACK_COMPLETION':
        return <FileText className="w-5 h-5" />;
      case 'MODULE_COMPLETION':
        return <Shield className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: CertificateType['value']) => {
    switch (type) {
      case 'COURSE_COMPLETION':
        return 'bg-secondary/20 text-secondary border-secondary/30 shadow-sm shadow-secondary/20';
      case 'TRACK_COMPLETION':
        return 'bg-primary/20 text-white border-primary/30 shadow-sm shadow-primary/20';
      case 'MODULE_COMPLETION':
        return 'bg-green-500/20 text-green-400 border-green-500/30 shadow-sm shadow-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-secondary/20 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin text-secondary" size={32} />
          <span className="ml-3 text-gray-300">{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-secondary/20 p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center">
            <Award className="text-secondary" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('noCertificates')}
          </h3>
          <p className="text-gray-400">{t('noCertificatesDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((certificate) => (
        <div
          key={certificate.id}
          className="bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg border border-secondary/20 p-6 hover:border-secondary/40 hover:from-primary/40 hover:to-primary/20 transition-all duration-300 shadow-lg hover:shadow-secondary/20"
        >
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            {certificate.thumbnailUrl ? (
              <img
                src={certificate.thumbnailUrl}
                alt="Certificate thumbnail"
                className="w-24 h-24 object-cover rounded-lg border-2 border-secondary/30 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-lg border-2 border-secondary/30 flex items-center justify-center shadow-md">
                <Award className="w-10 h-10 text-secondary" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                        getTypeColor(certificate.type.value)
                      )}
                    >
                      {getTypeIcon(certificate.type.value)}
                      {t(`type.${certificate.type.value}`)}
                    </span>
                    {certificate.status.value !== 'AVAILABLE' && (
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                        {t(`status.${certificate.status.value}`)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {certificate.metadata?.courseName ||
                      certificate.metadata?.trackName ||
                      certificate.metadata?.moduleName ||
                      'Certificate'}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {certificate.certificateUrl && (
                    <>
                      <button
                        onClick={() => window.open(certificate.certificateUrl!, '_blank')}
                        className="p-2 text-secondary hover:text-white hover:bg-secondary/20 rounded-lg transition-all duration-200 hover:shadow-md hover:shadow-secondary/20"
                        title={t('view')}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownload(certificate)}
                        disabled={downloadingId === certificate.id}
                        className="p-2 text-secondary hover:text-white hover:bg-secondary/20 rounded-lg transition-all duration-200 hover:shadow-md hover:shadow-secondary/20 disabled:opacity-50"
                        title={t('download')}
                      >
                        {downloadingId === certificate.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Download size={18} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {/* Validation Code */}
                <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
                  <Shield className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-gray-400 text-xs">{t('validationCode')}</p>
                    <p className="text-white font-mono text-xs font-semibold">
                      {certificate.validationCode}
                    </p>
                  </div>
                </div>

                {/* Issue Date */}
                <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-gray-400 text-xs">{t('issueDate')}</p>
                    <p className="text-white text-xs font-medium">
                      {formatDate(certificate.issueDate)}
                    </p>
                  </div>
                </div>

                {/* Total Hours */}
                {certificate.metadata?.totalHours && (
                  <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
                    <Clock className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-gray-400 text-xs">{t('details.totalHours')}</p>
                      <p className="text-white text-xs font-medium">
                        {t('details.hours', { count: certificate.metadata.totalHours })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Instructor */}
                {certificate.metadata?.instructorName && (
                  <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
                    <User className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-gray-400 text-xs">{t('details.instructor')}</p>
                      <p className="text-white text-xs font-medium">
                        {certificate.metadata.instructorName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Organization */}
                {certificate.metadata?.organizationName && (
                  <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
                    <Building className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-gray-400 text-xs">{t('details.organization')}</p>
                      <p className="text-white text-xs font-medium">
                        {certificate.metadata.organizationName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Download Count */}
                <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
                  <Download className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-white text-xs font-medium">
                      {t('downloadCount', { count: certificate.downloadCount })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expiration Warning */}
              {certificate.expirationDate && (
                <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg">
                  <AlertCircle size={14} />
                  <span>
                    {t('expirationDate')}: {formatDate(certificate.expirationDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm text-secondary bg-primary/20 rounded-lg hover:bg-secondary/20 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-white bg-primary/30 px-3 py-2 rounded-lg">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm text-secondary bg-primary/20 rounded-lg hover:bg-secondary/20 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
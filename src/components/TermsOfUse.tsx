'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, AlertTriangle, Info, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface TermsOfUseProps {
  locale: string;
}

export default function TermsOfUse({ locale }: TermsOfUseProps) {
  const t = useTranslations('Terms');
  const router = useRouter();
  const { acceptTerms } = useAuth();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [loading, setLoading] = useState(false);
  const CURRENT_TERMS_VERSION = '1.0'; // Versão atual dos termos

  useEffect(() => {
    // Get user agent
    setUserAgent(navigator.userAgent);

    // Get IP address (in production, this would come from the backend)
    fetchIpAddress();
  }, []);

  const fetchIpAddress = async () => {
    try {
      // In production, get this from your backend API
      // For now, using a placeholder
      setIpAddress('162.158.63.8');
    } catch (error) {
      console.error('Error fetching IP:', error);
      setIpAddress('Unknown');
    }
  };

  const handleAcceptTerms = async () => {
    if (!accepted) {
      toast({
        title: t('error.notAccepted'),
        description: t('error.mustAccept'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Chamar a nova API através do store
      await acceptTerms(CURRENT_TERMS_VERSION);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 1500);
    } catch (error) {
      console.error('Error accepting terms:', error);
      
      // Tratar diferentes tipos de erro
      let errorMessage = t('error.description');
      if (error instanceof Error) {
        if (error.message.includes('profile not found')) {
          errorMessage = 'Perfil não encontrado. Por favor, complete seu perfil primeiro.';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 2000);
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: t('error.title'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary/95 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Back button */}
      <div className="relative z-10 container mx-auto px-4 pt-6">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{t('buttons.back') || 'Voltar'}</span>
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-secondary/80 p-0.5">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <Shield size={40} className="text-secondary" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {t('title')}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {t('subtitle')}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Terms Content */}
              <ScrollArea className="h-96 rounded-lg border border-gray-200 p-6 bg-gray-50">
                <div className="space-y-6 text-gray-700">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">
                        {t('commitment.title')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('commitment.text')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="text-blue-500 mt-1 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">
                        {t('intellectualProperty.title')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('intellectualProperty.text')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Info className="text-yellow-500 mt-1 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">
                        {t('consequences.title')}
                      </h3>
                      <p className="leading-relaxed">
                        {t('consequences.text')}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">
                      {t('additionalTerms.title')}
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('additionalTerms.term1')}</li>
                      <li>{t('additionalTerms.term2')}</li>
                      <li>{t('additionalTerms.term3')}</li>
                      <li>{t('additionalTerms.term4')}</li>
                      <li>{t('additionalTerms.term5')}</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>

              {/* Signature Info */}
              <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>{t('signing.from')}:</strong> {ipAddress || 'Loading...'}
                </p>
                <p className="break-all">
                  <strong>{t('signing.browser')}:</strong> {userAgent || 'Loading...'}
                </p>
                <p>
                  <strong>{t('signing.date')}:</strong> {new Date().toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES')}
                </p>
              </div>

              {/* Accept Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="accept-terms"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {t('acceptance')}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/login`)}
                  disabled={loading}
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  onClick={handleAcceptTerms}
                  disabled={!accepted || loading}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      {t('buttons.signing')}
                    </span>
                  ) : (
                    t('buttons.signAndAccess')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Link, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';

interface Course {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  slug?: string;
  imageUrl?: string;
  translations?: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
}

interface Track {
  id: string;
  title?: string;
  description?: string;
  coursesCount?: number;
  slug?: string;
  imageUrl?: string;
  translations?: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  courses?: string[];
}

interface ProductContentMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    courseIds?: string[];
    trackIds?: string[];
  };
  onSuccess?: () => void;
}

export default function ProductContentMappingModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductContentMappingModalProps) {
  const t = useTranslations('Admin.productContentMapping');
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [trackSearch, setTrackSearch] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      console.log('Courses API Response:', data);
      
      // Process courses to extract title and description from translations
      const processedCourses = (data.data || data || []).map((course: Course) => {
        const translation = course.translations?.find(t => t.locale === 'pt') || 
                           course.translations?.[0];
        return {
          ...course,
          title: translation?.title || course.title || 'Sem título',
          description: translation?.description || course.description
        };
      });
      
      setCourses(processedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: t('error.fetchCoursesTitle'),
        description: t('error.fetchCoursesDescription'),
        variant: 'destructive',
      });
    }
  }, [t, token]);

  const fetchTracks = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch tracks');
      
      const data = await response.json();
      console.log('Tracks API Response:', data);
      
      // Process tracks to extract title and description from translations
      const processedTracks = (data.data || data || []).map((track: Track) => {
        const translation = track.translations?.find(t => t.locale === 'pt') || 
                           track.translations?.[0];
        return {
          ...track,
          title: translation?.title || track.title || 'Sem título',
          description: translation?.description || track.description,
          coursesCount: track.courses?.length || 0
        };
      });
      
      setTracks(processedTracks);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: t('error.fetchTracksTitle'),
        description: t('error.fetchTracksDescription'),
        variant: 'destructive',
      });
    }
  }, [t, token]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      console.log('Product data:', product);
      console.log('Course IDs:', product.courseIds);
      console.log('Track IDs:', product.trackIds);
      setSelectedCourses(product.courseIds || []);
      setSelectedTracks(product.trackIds || []);
      
      Promise.all([fetchCourses(), fetchTracks()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, product, fetchCourses, fetchTracks]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/products/${product.id}/content`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseIds: selectedCourses,
            trackIds: selectedTracks,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update content mapping');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating content mapping:', error);
      toast({
        title: t('error.saveTitle'),
        description: t('error.saveDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.description?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredTracks = tracks.filter(track =>
    track.title?.toLowerCase().includes(trackSearch.toLowerCase()) ||
    track.description?.toLowerCase().includes(trackSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Link className="text-secondary" size={24} />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            {t('subtitle', { productName: product.name })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <span className="ml-3 text-gray-400">{t('loading')}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                {t('selected', {
                  courses: selectedCourses.length,
                  tracks: selectedTracks.length,
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCourses([]);
                  setSelectedTracks([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                {t('clearAll')}
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="courses" className="data-[state=active]:bg-secondary">
                  {t('tabs.courses')} ({courses.length})
                  {selectedCourses.length > 0 && (
                    <span className="ml-1 text-xs bg-secondary/20 px-1.5 py-0.5 rounded">
                      {selectedCourses.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tracks" className="data-[state=active]:bg-secondary">
                  {t('tabs.tracks')} ({tracks.length})
                  {selectedTracks.length > 0 && (
                    <span className="ml-1 text-xs bg-secondary/20 px-1.5 py-0.5 rounded">
                      {selectedTracks.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder={t('searchCourses')}
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <ScrollArea className="h-[400px] border border-gray-800 rounded-lg p-4">
                  {filteredCourses.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {t('noCourses')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => toggleCourse(course.id)}
                        >
                          <Checkbox
                            checked={selectedCourses.includes(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white">{course.title}</h4>
                              {course.status && (
                                course.status === 'published' ? (
                                  <CheckCircle2 className="text-green-500" size={16} />
                                ) : (
                                  <XCircle className="text-gray-500" size={16} />
                                )
                              )}
                            </div>
                            {course.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tracks" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder={t('searchTracks')}
                    value={trackSearch}
                    onChange={(e) => setTrackSearch(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <ScrollArea className="h-[400px] border border-gray-800 rounded-lg p-4">
                  {filteredTracks.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {t('noTracks')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredTracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => toggleTrack(track.id)}
                        >
                          <Checkbox
                            checked={selectedTracks.includes(track.id)}
                            onCheckedChange={() => toggleTrack(track.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{track.title}</h4>
                            {track.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {track.description}
                              </p>
                            )}
                            {track.coursesCount !== undefined && (
                              <span className="text-xs text-gray-500 mt-1">
                                {t('coursesCount', { count: track.coursesCount })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-secondary hover:bg-secondary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
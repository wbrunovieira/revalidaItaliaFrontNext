// /src/components/ListAnimations.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCourseHierarchy, getTranslationByLocale } from '@/hooks/useCourseHierarchy';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Gamepad2,
  BookOpen,
  Layers,
  Play,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  Type,
  HelpCircle,
  GripHorizontal,
  ListOrdered,
  Hash,
  Calendar,
  Filter,
  X,
  Plus,
  Trash2,
  Save,
  Power,
  Ban,
} from 'lucide-react';

type AnimationType = 'CompleteSentence' | 'MultipleChoice';
type GameType = 'DRAG_WORD' | 'REORDER_WORDS' | 'TYPE_COMPLETION' | 'MULTIPLE_BLANKS';

interface Sentence {
  fullSentence: string;
  targetWord: string;
  wordPosition: number;
  hint?: string;
}

interface CompleteSentenceContent {
  gameType: GameType;
  sentences: Sentence[];
  distractors?: string[];
  shuffleWords?: boolean;
}

interface MultipleChoiceContent {
  question: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
  explanation?: string;
}

interface Animation {
  id: string;
  lessonId: string;
  type: AnimationType;
  content: CompleteSentenceContent | MultipleChoiceContent;
  order: number;
  totalQuestions: number;
  enabled: boolean;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LessonWithAnimations {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
  animations: Animation[];
}

export default function ListAnimations() {
  const t = useTranslations('Admin.listAnimations');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const {
    courses,
    modules,
    lessons,
    loadingCourses,
    loadingModules,
    loadingLessons,
    selectCourse,
    selectModule,
  } = useCourseHierarchy({ fetchLessons: true });

  const [loading, setLoading] = useState(true);
  const [allAnimations, setAllAnimations] = useState<LessonWithAnimations[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnimation, setEditingAnimation] = useState<Animation | null>(null);
  const [editForm, setEditForm] = useState<{
    order: number;
    // CompleteSentence fields
    gameType?: GameType;
    sentences?: Sentence[];
    distractors?: string[];
    shuffleWords?: boolean;
    // MultipleChoice fields
    question?: string;
    options?: [string, string, string];
    correctOptionIndex?: 0 | 1 | 2;
    explanation?: string;
  }>({ order: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Filter states
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterModuleId, setFilterModuleId] = useState('');
  const [filterLessonId, setFilterLessonId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getToken = useCallback(() => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }, []);

  // Fetch all animations for all lessons
  const fetchAllAnimations = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      // First, get all courses with their modules and lessons
      const coursesResponse = await fetch(`${apiUrl}/api/v1/courses`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        credentials: 'include',
      });

      if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
      const coursesData = await coursesResponse.json();

      const lessonsWithAnimations: LessonWithAnimations[] = [];

      // For each course, get modules and lessons
      for (const course of coursesData) {
        const courseTranslation = getTranslationByLocale(course.translations, locale);

        const modulesResponse = await fetch(`${apiUrl}/api/v1/courses/${course.id}/modules`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          credentials: 'include',
        });

        if (!modulesResponse.ok) continue;
        const modulesData = await modulesResponse.json();

        for (const moduleItem of modulesData) {
          const moduleTranslation = getTranslationByLocale(moduleItem.translations, locale);

          const lessonsResponse = await fetch(
            `${apiUrl}/api/v1/courses/${course.id}/modules/${moduleItem.id}/lessons?limit=100`,
            {
              headers: { ...(token && { Authorization: `Bearer ${token}` }) },
              credentials: 'include',
            }
          );

          if (!lessonsResponse.ok) continue;
          const lessonsData = await lessonsResponse.json();
          const lessonsList = lessonsData.lessons || [];

          for (const lesson of lessonsList) {
            const lessonTranslation = getTranslationByLocale(lesson.translations, locale);

            // Fetch animations for this lesson
            const animationsResponse = await fetch(
              `${apiUrl}/api/v1/animations?lessonId=${lesson.id}`,
              {
                headers: { ...(token && { Authorization: `Bearer ${token}` }) },
                credentials: 'include',
              }
            );

            if (animationsResponse.ok) {
              const animationsData = await animationsResponse.json();
              const animations = animationsData.animations || [];

              if (animations.length > 0) {
                lessonsWithAnimations.push({
                  lessonId: lesson.id,
                  lessonTitle: lessonTranslation?.title || `Lesson ${lesson.order}`,
                  moduleTitle: moduleTranslation?.title || moduleItem.slug,
                  courseTitle: courseTranslation?.title || course.slug,
                  animations,
                });
              }
            }
          }
        }
      }

      setAllAnimations(lessonsWithAnimations);
    } catch (error) {
      console.error('Error fetching animations:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, locale, toast, t]);

  // Fetch animations for a specific lesson (when filter is applied)
  const fetchAnimationsForLesson = useCallback(async (lessonId: string) => {
    setLoading(true);
    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const response = await fetch(`${apiUrl}/api/v1/animations?lessonId=${lessonId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch animations');

      const data = await response.json();
      const animations = data.animations || [];

      // Find lesson details from the hierarchy
      const lesson = lessons.find(l => l.id === lessonId);
      const lessonTranslation = lesson ? getTranslationByLocale(lesson.translations, locale) : null;

      // Find module and course details
      const moduleItem = modules.find(m => m.id === (lesson as { moduleId?: string })?.moduleId);
      const moduleTranslation = moduleItem ? getTranslationByLocale(moduleItem.translations, locale) : null;

      const course = courses.find(c => c.id === filterCourseId);
      const courseTranslation = course ? getTranslationByLocale(course.translations, locale) : null;

      if (animations.length > 0) {
        setAllAnimations([{
          lessonId,
          lessonTitle: lessonTranslation?.title || `Lesson`,
          moduleTitle: moduleTranslation?.title || 'Module',
          courseTitle: courseTranslation?.title || 'Course',
          animations,
        }]);
      } else {
        setAllAnimations([]);
      }
    } catch (error) {
      console.error('Error fetching animations:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, locale, toast, t, lessons, modules, courses, filterCourseId]);

  useEffect(() => {
    if (filterLessonId) {
      fetchAnimationsForLesson(filterLessonId);
    } else {
      fetchAllAnimations();
    }
  }, [filterLessonId, fetchAnimationsForLesson, fetchAllAnimations]);

  // Initial load
  useEffect(() => {
    fetchAllAnimations();
  }, [fetchAllAnimations]);

  const handleFilterCourseChange = useCallback((courseId: string) => {
    setFilterCourseId(courseId);
    setFilterModuleId('');
    setFilterLessonId('');
    if (courseId) {
      selectCourse(courseId);
    }
  }, [selectCourse]);

  const handleFilterModuleChange = useCallback((moduleId: string) => {
    setFilterModuleId(moduleId);
    setFilterLessonId('');
    if (moduleId) {
      selectModule(moduleId);
    }
  }, [selectModule]);

  const handleFilterLessonChange = useCallback((lessonId: string) => {
    setFilterLessonId(lessonId);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterCourseId('');
    setFilterModuleId('');
    setFilterLessonId('');
    fetchAllAnimations();
  }, [fetchAllAnimations]);

  const toggleLesson = useCallback((lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  }, []);

  const openViewModal = useCallback((animation: Animation) => {
    setSelectedAnimation(animation);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAnimation(null);
  }, []);

  // Edit modal handlers
  const openEditModal = useCallback((animation: Animation) => {
    setEditingAnimation(animation);

    if (animation.type === 'CompleteSentence') {
      const content = animation.content as CompleteSentenceContent;
      setEditForm({
        order: animation.order,
        gameType: content.gameType,
        sentences: [...content.sentences],
        distractors: content.distractors ? [...content.distractors] : [],
        shuffleWords: content.shuffleWords ?? false,
      });
    } else {
      const content = animation.content as MultipleChoiceContent;
      setEditForm({
        order: animation.order,
        question: content.question,
        options: [...content.options],
        correctOptionIndex: content.correctOptionIndex,
        explanation: content.explanation || '',
      });
    }

    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingAnimation(null);
    setEditForm({ order: 0 });
  }, []);

  // Validate form before submission
  const validateForm = useCallback((): string | null => {
    if (!editingAnimation) return 'No animation selected';

    if (editingAnimation.type === 'CompleteSentence') {
      const sentences = editForm.sentences || [];

      if (sentences.length === 0) {
        return t('edit.validation.noSentences');
      }

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        if (!sentence.fullSentence?.trim()) {
          return t('edit.validation.emptySentence', { index: i + 1 });
        }

        if (!sentence.targetWord?.trim()) {
          return t('edit.validation.emptyTargetWord', { index: i + 1 });
        }

        // Check if targetWord exists in fullSentence
        if (!sentence.fullSentence.includes(sentence.targetWord)) {
          return t('edit.validation.targetWordNotInSentence', {
            targetWord: sentence.targetWord,
            index: i + 1
          });
        }
      }
    } else {
      // MultipleChoice validation
      if (!editForm.question?.trim()) {
        return t('edit.validation.emptyQuestion');
      }

      const options = editForm.options || ['', '', ''];
      for (let i = 0; i < options.length; i++) {
        if (!options[i]?.trim()) {
          return t('edit.validation.emptyOption', { index: i + 1 });
        }
      }
    }

    return null;
  }, [editingAnimation, editForm, t]);

  // Update animation via API
  const updateAnimation = useCallback(async () => {
    if (!editingAnimation) return;

    // Validate form first
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: t('edit.validation.title'),
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      let content: CompleteSentenceContent | MultipleChoiceContent;

      if (editingAnimation.type === 'CompleteSentence') {
        // Clean up optional fields
        const cleanDistractors = (editForm.distractors || []).filter(d => d?.trim());

        content = {
          gameType: editForm.gameType!,
          sentences: editForm.sentences!.map(s => ({
            fullSentence: s.fullSentence,
            targetWord: s.targetWord,
            wordPosition: s.wordPosition,
            ...(s.hint?.trim() && { hint: s.hint }),
          })),
          ...(cleanDistractors.length > 0 && { distractors: cleanDistractors }),
          ...(editForm.shuffleWords !== undefined && { shuffleWords: editForm.shuffleWords }),
        };
      } else {
        content = {
          question: editForm.question!,
          options: editForm.options!,
          correctOptionIndex: editForm.correctOptionIndex!,
          ...(editForm.explanation?.trim() && { explanation: editForm.explanation }),
        };
      }

      const response = await fetch(`${apiUrl}/api/v1/animations/${editingAnimation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ content, order: editForm.order }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update animation');
      }

      const updatedAnimation = await response.json();

      // Update local state
      setAllAnimations(prev => prev.map(lessonGroup => ({
        ...lessonGroup,
        animations: lessonGroup.animations.map(anim =>
          anim.id === updatedAnimation.id ? updatedAnimation : anim
        ),
      })));

      toast({
        title: t('edit.successTitle'),
        description: t('edit.successDescription'),
      });

      closeEditModal();
    } catch (error) {
      console.error('Error updating animation:', error);
      toast({
        title: t('edit.errorTitle'),
        description: error instanceof Error ? error.message : t('edit.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingAnimation, editForm, getToken, toast, t, closeEditModal, validateForm]);

  // Toggle animation enabled/disabled
  const toggleAnimationEnabled = useCallback(async (animation: Animation) => {
    const newEnabled = !animation.enabled;

    // Add to toggling set
    setTogglingIds(prev => new Set(prev).add(animation.id));

    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const response = await fetch(`${apiUrl}/api/v1/animations/${animation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to toggle animation');
      }

      const updatedAnimation = await response.json();

      // Update local state
      setAllAnimations(prev => prev.map(lessonGroup => ({
        ...lessonGroup,
        animations: lessonGroup.animations.map(anim =>
          anim.id === updatedAnimation.id ? updatedAnimation : anim
        ),
      })));

      toast({
        title: newEnabled ? t('toggle.enabledTitle') : t('toggle.disabledTitle'),
        description: newEnabled ? t('toggle.enabledDescription') : t('toggle.disabledDescription'),
      });
    } catch (error) {
      console.error('Error toggling animation:', error);
      toast({
        title: t('toggle.errorTitle'),
        description: t('toggle.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      // Remove from toggling set
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(animation.id);
        return newSet;
      });
    }
  }, [getToken, toast, t]);

  // Delete animation
  const deleteAnimation = useCallback(async (animationId: string) => {
    setDeletingIds(prev => new Set(prev).add(animationId));

    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const response = await fetch(`${apiUrl}/api/v1/animations/${animationId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 409 Conflict - animation has progress records
        if (response.status === 409) {
          toast({
            title: t('delete.conflictTitle'),
            description: t('delete.conflictDescription'),
            variant: 'destructive',
          });
          return;
        }

        throw new Error(errorData.message || 'Failed to delete animation');
      }

      // Remove from local state
      setAllAnimations(prev => prev.map(lessonGroup => ({
        ...lessonGroup,
        animations: lessonGroup.animations.filter(anim => anim.id !== animationId),
      })).filter(lessonGroup => lessonGroup.animations.length > 0));

      toast({
        title: t('delete.successTitle'),
        description: t('delete.successDescription'),
      });
    } catch (error) {
      console.error('Error deleting animation:', error);
      toast({
        title: t('delete.errorTitle'),
        description: t('delete.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(animationId);
        return newSet;
      });
    }
  }, [getToken, toast, t]);

  // Handle delete confirmation with toast
  const handleDeleteAnimation = useCallback((animation: Animation, lessonTitle: string) => {
    const animationType = animation.type === 'CompleteSentence'
      ? t('types.completeSentence')
      : t('types.multipleChoice');

    toast({
      title: t('delete.confirmTitle'),
      description: (
        <div className="space-y-3">
          <p className="text-sm">
            {t('delete.confirmMessage')}
          </p>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <Gamepad2 size={14} />
                {t('delete.type')}: {animationType}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                {t('delete.lesson')}: {lessonTitle}
              </div>
              <div className="flex items-center gap-2">
                <Hash size={14} />
                {t('delete.order')}: {animation.order}
              </div>
            </div>
          </div>
          <p className="text-xs text-red-300 font-medium">
            {t('delete.warning')}
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => deleteAnimation(animation.id)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-red-600 bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              {t('delete.confirm')}
            </button>
          </div>
        </div>
      ),
      variant: 'destructive',
    });
  }, [toast, deleteAnimation, t]);

  // Edit form handlers
  const updateSentence = useCallback((index: number, field: keyof Sentence, value: string | number) => {
    setEditForm(prev => {
      const sentences = [...(prev.sentences || [])];
      sentences[index] = { ...sentences[index], [field]: value };
      return { ...prev, sentences };
    });
  }, []);

  const addSentence = useCallback(() => {
    setEditForm(prev => ({
      ...prev,
      sentences: [...(prev.sentences || []), { fullSentence: '', targetWord: '', wordPosition: 0 }],
    }));
  }, []);

  const removeSentence = useCallback((index: number) => {
    setEditForm(prev => ({
      ...prev,
      sentences: (prev.sentences || []).filter((_, i) => i !== index),
    }));
  }, []);

  const addDistractor = useCallback(() => {
    setEditForm(prev => ({
      ...prev,
      distractors: [...(prev.distractors || []), ''],
    }));
  }, []);

  const removeDistractor = useCallback((index: number) => {
    setEditForm(prev => ({
      ...prev,
      distractors: (prev.distractors || []).filter((_, i) => i !== index),
    }));
  }, []);

  const updateDistractor = useCallback((index: number, value: string) => {
    setEditForm(prev => {
      const distractors = [...(prev.distractors || [])];
      distractors[index] = value;
      return { ...prev, distractors };
    });
  }, []);

  const updateOption = useCallback((index: number, value: string) => {
    setEditForm(prev => {
      const options = [...(prev.options || ['', '', ''])] as [string, string, string];
      options[index] = value;
      return { ...prev, options };
    });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameTypeLabel = (gameType: GameType) => {
    const labels: Record<GameType, string> = {
      DRAG_WORD: t('gameTypes.dragWord'),
      REORDER_WORDS: t('gameTypes.reorderWords'),
      TYPE_COMPLETION: t('gameTypes.typeCompletion'),
      MULTIPLE_BLANKS: t('gameTypes.multipleBlanks'),
    };
    return labels[gameType] || gameType;
  };

  const getGameTypeIcon = (gameType: GameType) => {
    const icons: Record<GameType, React.ReactNode> = {
      DRAG_WORD: <GripHorizontal size={14} />,
      REORDER_WORDS: <ListOrdered size={14} />,
      TYPE_COMPLETION: <Type size={14} />,
      MULTIPLE_BLANKS: <Layers size={14} />,
    };
    return icons[gameType] || <Gamepad2 size={14} />;
  };

  // Filter animations by search term
  const filteredAnimations = useMemo(() => {
    if (!searchTerm) return allAnimations;

    return allAnimations.filter(lesson => {
      const matchesLesson = lesson.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = lesson.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = lesson.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesContent = lesson.animations.some(anim => {
        if (anim.type === 'MultipleChoice') {
          const content = anim.content as MultipleChoiceContent;
          return content.question.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (anim.type === 'CompleteSentence') {
          const content = anim.content as CompleteSentenceContent;
          return content.sentences.some(s =>
            s.fullSentence.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return false;
      });

      return matchesLesson || matchesModule || matchesCourse || matchesContent;
    });
  }, [allAnimations, searchTerm]);

  // Stats
  const totalStats = useMemo(() => {
    const totalLessons = filteredAnimations.length;
    const totalAnimations = filteredAnimations.reduce((sum, l) => sum + l.animations.length, 0);
    const completeSentence = filteredAnimations.reduce(
      (sum, l) => sum + l.animations.filter(a => a.type === 'CompleteSentence').length, 0
    );
    const multipleChoice = filteredAnimations.reduce(
      (sum, l) => sum + l.animations.filter(a => a.type === 'MultipleChoice').length, 0
    );
    return { totalLessons, totalAnimations, completeSentence, multipleChoice };
  }, [filteredAnimations]);

  if (loading && allAnimations.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <span className="ml-3 text-gray-400">{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Gamepad2 size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Search and Filter Toggle */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || filterCourseId
                ? 'bg-secondary/20 border-secondary text-secondary'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
            {filterCourseId && (
              <span className="ml-1 px-1.5 py-0.5 bg-secondary text-primary text-xs rounded-full">
                {filterLessonId ? '3' : filterModuleId ? '2' : '1'}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('filterBy')}</span>
              {filterCourseId && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                  {t('clearFilters')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course Filter */}
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs flex items-center gap-1">
                  <BookOpen size={12} />
                  {t('fields.course')}
                </Label>
                <Select value={filterCourseId} onValueChange={handleFilterCourseChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-9">
                    <SelectValue placeholder={loadingCourses ? t('loading') : t('placeholders.allCourses')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {courses.map(course => {
                      const translation = getTranslationByLocale(course.translations, locale);
                      return (
                        <SelectItem key={course.id} value={course.id} className="text-white hover:bg-gray-700">
                          {translation?.title || course.slug}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Module Filter */}
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs flex items-center gap-1">
                  <Layers size={12} />
                  {t('fields.module')}
                </Label>
                <Select
                  value={filterModuleId}
                  onValueChange={handleFilterModuleChange}
                  disabled={!filterCourseId}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-9">
                    {loadingModules ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                      </span>
                    ) : (
                      <SelectValue placeholder={t('placeholders.allModules')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {modules.map(module => {
                      const translation = getTranslationByLocale(module.translations, locale);
                      return (
                        <SelectItem key={module.id} value={module.id} className="text-white hover:bg-gray-700">
                          {translation?.title || module.slug}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Lesson Filter */}
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs flex items-center gap-1">
                  <Play size={12} />
                  {t('fields.lesson')}
                </Label>
                <Select
                  value={filterLessonId}
                  onValueChange={handleFilterLessonChange}
                  disabled={!filterModuleId}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-9">
                    {loadingLessons ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                      </span>
                    ) : (
                      <SelectValue placeholder={t('placeholders.allLessons')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {lessons.map(lesson => {
                      const translation = getTranslationByLocale(lesson.translations, locale);
                      return (
                        <SelectItem key={lesson.id} value={lesson.id} className="text-white hover:bg-gray-700">
                          {translation?.title || `Lesson ${lesson.order}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.totalLessons}</p>
          <p className="text-sm text-gray-400">{t('stats.lessons')}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.totalAnimations}</p>
          <p className="text-sm text-gray-400">{t('stats.animations')}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.completeSentence}</p>
          <p className="text-sm text-gray-400">{t('stats.completeSentence')}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.multipleChoice}</p>
          <p className="text-sm text-gray-400">{t('stats.multipleChoice')}</p>
        </div>
      </div>

      {/* Animations List */}
      {filteredAnimations.length > 0 ? (
        <div className="space-y-4">
          {filteredAnimations.map(lessonGroup => {
            const isExpanded = expandedLessons.has(lessonGroup.lessonId);

            return (
              <div key={lessonGroup.lessonId} className="border border-gray-700 rounded-lg overflow-hidden">
                {/* Lesson Header */}
                <div
                  onClick={() => toggleLesson(lessonGroup.lessonId)}
                  className="flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <button type="button" className="text-gray-400 hover:text-white transition-colors">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>

                  <div className="flex items-center justify-center w-10 h-10 bg-secondary/20 rounded-lg">
                    <Play size={20} className="text-secondary" />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-white font-medium">{lessonGroup.lessonTitle}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {lessonGroup.courseTitle}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers size={12} />
                        {lessonGroup.moduleTitle}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gamepad2 size={12} />
                        {lessonGroup.animations.length} {t('animations')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Animations */}
                {isExpanded && (
                  <div className="bg-gray-800/50 p-4 space-y-2">
                    {lessonGroup.animations.map(animation => {
                      const isToggling = togglingIds.has(animation.id);
                      const isDeleting = deletingIds.has(animation.id);
                      const isDisabled = animation.enabled === false;

                      return (
                      <div
                        key={animation.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isDisabled
                            ? 'bg-gray-800/50 border border-red-500/20'
                            : 'bg-gray-700/30 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${
                          isDisabled ? 'bg-gray-600/50 text-gray-500' : 'bg-secondary/20 text-secondary'
                        }`}>
                          {animation.order}
                        </div>

                        <div className={`flex items-center justify-center w-8 h-8 rounded ${
                          isDisabled
                            ? 'bg-gray-600/30 text-gray-500'
                            : animation.type === 'CompleteSentence'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {animation.type === 'CompleteSentence' ? <Type size={16} /> : <HelpCircle size={16} />}
                        </div>

                        <div className={`flex-1 min-w-0 ${isDisabled ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isDisabled
                                ? 'bg-gray-600/30 text-gray-500'
                                : animation.type === 'CompleteSentence'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {animation.type === 'CompleteSentence' ? t('types.completeSentence') : t('types.multipleChoice')}
                            </span>
                            {animation.type === 'CompleteSentence' && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                {getGameTypeIcon((animation.content as CompleteSentenceContent).gameType)}
                                {getGameTypeLabel((animation.content as CompleteSentenceContent).gameType)}
                              </span>
                            )}
                            {isDisabled && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                                <Ban size={10} />
                                {t('toggle.disabled')}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 truncate ${isDisabled ? 'text-gray-400' : 'text-white'}`}>
                            {animation.type === 'MultipleChoice'
                              ? (animation.content as MultipleChoiceContent).question
                              : (animation.content as CompleteSentenceContent).sentences[0]?.fullSentence || '-'
                            }
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Hash size={10} />
                              {t('order')}: {animation.order}
                            </span>
                            <span className="flex items-center gap-1">
                              <HelpCircle size={10} />
                              {animation.totalQuestions} {t('questions')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(animation.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Toggle Enable/Disable Button */}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              toggleAnimationEnabled(animation);
                            }}
                            disabled={isToggling}
                            className={`p-2 rounded transition-all ${
                              isToggling
                                ? 'text-gray-500 cursor-wait'
                                : isDisabled
                                  ? 'text-red-400 hover:text-green-400 hover:bg-green-500/20'
                                  : 'text-green-400 hover:text-red-400 hover:bg-red-500/20'
                            }`}
                            title={isDisabled ? t('toggle.enable') : t('toggle.disable')}
                          >
                            {isToggling ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              openViewModal(animation);
                            }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                            title={t('view')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              openEditModal(animation);
                            }}
                            className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/20 rounded transition-all"
                            title={t('edit.button')}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteAnimation(animation, lessonGroup.lessonTitle);
                            }}
                            disabled={isDeleting || isToggling}
                            className={`p-2 rounded transition-all ${
                              isDeleting
                                ? 'text-gray-500 cursor-wait'
                                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/20'
                            }`}
                            title={t('delete.button')}
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gamepad2 size={64} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchTerm || filterLessonId ? t('noResults') : t('noAnimations')}
          </p>
        </div>
      )}

      {/* View Modal */}
      {isModalOpen && selectedAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gamepad2 size={20} className="text-secondary" />
                {t('modal.title')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Type Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAnimation.type === 'CompleteSentence'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {selectedAnimation.type === 'CompleteSentence' ? t('types.completeSentence') : t('types.multipleChoice')}
                </span>
                {selectedAnimation.type === 'CompleteSentence' && (
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    {getGameTypeIcon((selectedAnimation.content as CompleteSentenceContent).gameType)}
                    {getGameTypeLabel((selectedAnimation.content as CompleteSentenceContent).gameType)}
                  </span>
                )}
              </div>

              {/* Content Details */}
              {selectedAnimation.type === 'CompleteSentence' ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400 text-xs uppercase">{t('modal.sentences')}</Label>
                    <div className="mt-2 space-y-2">
                      {(selectedAnimation.content as CompleteSentenceContent).sentences.map((sentence, idx) => (
                        <div key={idx} className="bg-gray-700/50 p-3 rounded-lg">
                          <p className="text-white">{sentence.fullSentence}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>{t('modal.targetWord')}: <strong className="text-secondary">{sentence.targetWord}</strong></span>
                            <span>{t('modal.position')}: {sentence.wordPosition}</span>
                            {sentence.hint && <span>{t('modal.hint')}: {sentence.hint}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(selectedAnimation.content as CompleteSentenceContent).distractors?.length ? (
                    <div>
                      <Label className="text-gray-400 text-xs uppercase">{t('modal.distractors')}</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(selectedAnimation.content as CompleteSentenceContent).distractors?.map((d, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400 text-xs uppercase">{t('modal.question')}</Label>
                    <p className="text-white mt-1">{(selectedAnimation.content as MultipleChoiceContent).question}</p>
                  </div>

                  <div>
                    <Label className="text-gray-400 text-xs uppercase">{t('modal.options')}</Label>
                    <div className="mt-2 space-y-2">
                      {(selectedAnimation.content as MultipleChoiceContent).options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            idx === (selectedAnimation.content as MultipleChoiceContent).correctOptionIndex
                              ? 'bg-green-500/20 border border-green-500/50'
                              : 'bg-gray-700/50'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                            idx === (selectedAnimation.content as MultipleChoiceContent).correctOptionIndex
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-white">{option}</span>
                          {idx === (selectedAnimation.content as MultipleChoiceContent).correctOptionIndex && (
                            <span className="ml-auto text-green-400 text-xs">{t('modal.correct')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(selectedAnimation.content as MultipleChoiceContent).explanation && (
                    <div>
                      <Label className="text-gray-400 text-xs uppercase">{t('modal.explanation')}</Label>
                      <p className="text-gray-300 mt-1 bg-gray-700/50 p-3 rounded-lg">
                        {(selectedAnimation.content as MultipleChoiceContent).explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <Label className="text-gray-400 text-xs uppercase">{t('modal.createdAt')}</Label>
                  <p className="text-gray-300 text-sm mt-1">{formatDate(selectedAnimation.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-xs uppercase">{t('modal.updatedAt')}</Label>
                  <p className="text-gray-300 text-sm mt-1">{formatDate(selectedAnimation.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="relative z-10 w-full max-w-3xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Pencil size={20} className="text-secondary" />
                {t('edit.title')}
              </h3>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Type Badge (read-only) */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  editingAnimation.type === 'CompleteSentence'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {editingAnimation.type === 'CompleteSentence' ? t('types.completeSentence') : t('types.multipleChoice')}
                </span>
                <span className="text-xs text-gray-500">{t('edit.typeReadOnly')}</span>
              </div>

              {/* Order Field */}
              <div>
                <Label className="text-gray-300 text-sm">{t('edit.order')}</Label>
                <input
                  type="number"
                  min={0}
                  value={editForm.order}
                  onChange={e => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              {/* CompleteSentence Form */}
              {editingAnimation.type === 'CompleteSentence' && (
                <div className="space-y-6">
                  {/* Game Type */}
                  <div>
                    <Label className="text-gray-300 text-sm">{t('edit.gameType')}</Label>
                    <Select
                      value={editForm.gameType}
                      onValueChange={(value: GameType) => setEditForm(prev => ({ ...prev, gameType: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="DRAG_WORD" className="text-white hover:bg-gray-700">{t('gameTypes.dragWord')}</SelectItem>
                        <SelectItem value="REORDER_WORDS" className="text-white hover:bg-gray-700">{t('gameTypes.reorderWords')}</SelectItem>
                        <SelectItem value="TYPE_COMPLETION" className="text-white hover:bg-gray-700">{t('gameTypes.typeCompletion')}</SelectItem>
                        <SelectItem value="MULTIPLE_BLANKS" className="text-white hover:bg-gray-700">{t('gameTypes.multipleBlanks')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sentences */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-gray-300 text-sm">{t('edit.sentences')}</Label>
                      <button
                        type="button"
                        onClick={addSentence}
                        className="flex items-center gap-1 text-sm text-secondary hover:text-secondary/80"
                      >
                        <Plus size={14} />
                        {t('edit.addSentence')}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {editForm.sentences?.map((sentence, idx) => (
                        <div key={idx} className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{t('edit.sentence')} {idx + 1}</span>
                            {(editForm.sentences?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSentence(idx)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">{t('edit.fullSentence')}</Label>
                            <input
                              type="text"
                              value={sentence.fullSentence}
                              onChange={e => updateSentence(idx, 'fullSentence', e.target.value)}
                              className="mt-1 w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-gray-400 text-xs">{t('edit.targetWord')}</Label>
                              <input
                                type="text"
                                value={sentence.targetWord}
                                onChange={e => updateSentence(idx, 'targetWord', e.target.value)}
                                className="mt-1 w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-400 text-xs">{t('edit.position')}</Label>
                              <input
                                type="number"
                                min={0}
                                value={sentence.wordPosition}
                                onChange={e => updateSentence(idx, 'wordPosition', parseInt(e.target.value) || 0)}
                                className="mt-1 w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-400 text-xs">{t('edit.hint')}</Label>
                              <input
                                type="text"
                                value={sentence.hint || ''}
                                onChange={e => updateSentence(idx, 'hint', e.target.value)}
                                className="mt-1 w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distractors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-gray-300 text-sm">{t('edit.distractors')}</Label>
                      <button
                        type="button"
                        onClick={addDistractor}
                        className="flex items-center gap-1 text-sm text-secondary hover:text-secondary/80"
                      >
                        <Plus size={14} />
                        {t('edit.addDistractor')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editForm.distractors?.map((distractor, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-gray-700 rounded-lg">
                          <input
                            type="text"
                            value={distractor}
                            onChange={e => updateDistractor(idx, e.target.value)}
                            className="w-32 px-3 py-1.5 bg-transparent text-white text-sm focus:outline-none"
                            placeholder={t('edit.distractorPlaceholder')}
                          />
                          <button
                            type="button"
                            onClick={() => removeDistractor(idx)}
                            className="p-1.5 text-red-400 hover:text-red-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shuffle Words */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="shuffleWords"
                      checked={editForm.shuffleWords || false}
                      onChange={e => setEditForm(prev => ({ ...prev, shuffleWords: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-secondary focus:ring-secondary"
                    />
                    <Label htmlFor="shuffleWords" className="text-gray-300 text-sm cursor-pointer">
                      {t('edit.shuffleWords')}
                    </Label>
                  </div>
                </div>
              )}

              {/* MultipleChoice Form */}
              {editingAnimation.type === 'MultipleChoice' && (
                <div className="space-y-6">
                  {/* Question */}
                  <div>
                    <Label className="text-gray-300 text-sm">{t('edit.question')}</Label>
                    <textarea
                      value={editForm.question || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <Label className="text-gray-300 text-sm">{t('edit.options')}</Label>
                    <div className="mt-2 space-y-3">
                      {editForm.options?.map((option, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            idx === editForm.correctOptionIndex
                              ? 'bg-green-500/20 border border-green-500/50'
                              : 'bg-gray-700/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, correctOptionIndex: idx as 0 | 1 | 2 }))}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                              idx === editForm.correctOptionIndex
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                            title={t('edit.markCorrect')}
                          >
                            {idx + 1}
                          </button>
                          <input
                            type="text"
                            value={option}
                            onChange={e => updateOption(idx, e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                            placeholder={`${t('edit.option')} ${idx + 1}`}
                          />
                          {idx === editForm.correctOptionIndex && (
                            <span className="text-green-400 text-xs">{t('modal.correct')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <Label className="text-gray-300 text-sm">{t('edit.explanation')}</Label>
                    <textarea
                      value={editForm.explanation || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, explanation: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                      placeholder={t('edit.explanationPlaceholder')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isSaving}
              >
                {t('edit.cancel')}
              </button>
              <button
                onClick={updateAnimation}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-primary font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('edit.saving')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {t('edit.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// /src/components/CreateAnimationForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCourseHierarchy, getTranslationByLocale } from '@/hooks/useCourseHierarchy';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
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
  Plus,
  Trash2,
  Check,
  Loader2,
  HelpCircle,
  GripHorizontal,
  Type,
  ListOrdered,
} from 'lucide-react';

type AnimationType = 'CompleteSentence' | 'MultipleChoice';
type GameType = 'DRAG_WORD' | 'REORDER_WORDS' | 'TYPE_COMPLETION' | 'MULTIPLE_BLANKS';

interface Sentence {
  fullSentence: string;
  // For single target word games (DRAG_WORD, REORDER_WORDS, TYPE_COMPLETION)
  targetWord?: string;
  wordPosition?: number;
  hint?: string;
  // For MULTIPLE_BLANKS - multiple target words per sentence
  targetWords?: string[];
  wordPositions?: number[];
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

interface FormErrors {
  lessonId?: string;
  type?: string;
  gameType?: string;
  sentences?: string;
  question?: string;
  options?: string;
}

export default function CreateAnimationForm() {
  const t = useTranslations('Admin.createAnimation');
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

  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const [animationType, setAnimationType] = useState<AnimationType>('CompleteSentence');
  const [gameType, setGameType] = useState<GameType>('DRAG_WORD');
  const [sentences, setSentences] = useState<Sentence[]>([
    { fullSentence: '', targetWord: '', wordPosition: 0, hint: '' }
  ]);

  // Handle gameType change - initialize with correct structure
  const handleGameTypeChange = useCallback((newGameType: GameType) => {
    setGameType(newGameType);

    // When switching to MULTIPLE_BLANKS, ensure we have targetWords array with minimum 2 items
    if (newGameType === 'MULTIPLE_BLANKS') {
      setSentences(prev => prev.map(sentence => ({
        ...sentence,
        targetWords: sentence.targetWords?.length ? sentence.targetWords : ['', ''],
        wordPositions: sentence.wordPositions?.length ? sentence.wordPositions : [0, 0],
      })));
    }
  }, []);
  const [distractors, setDistractors] = useState<string[]>(['']);
  const [shuffleWords, setShuffleWords] = useState(true);

  // MultipleChoice state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<[string, string, string]>(['', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<0 | 1 | 2>(0);
  const [explanation, setExplanation] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  const handleCourseChange = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId('');
    setSelectedLessonId('');
    selectCourse(courseId);
  }, [selectCourse]);

  const handleModuleChange = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId('');
    selectModule(moduleId);
  }, [selectModule]);

  const handleLessonChange = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    setErrors(prev => ({ ...prev, lessonId: undefined }));
  }, []);

  const handleAnimationTypeChange = useCallback((type: AnimationType) => {
    setAnimationType(type);
    setErrors({});
  }, []);

  // Sentence handlers
  const addSentence = useCallback(() => {
    if (gameType === 'MULTIPLE_BLANKS') {
      setSentences(prev => [...prev, {
        fullSentence: '',
        targetWord: '',
        wordPosition: 0,
        hint: '',
        targetWords: ['', ''],
        wordPositions: [0, 0],
      }]);
    } else {
      setSentences(prev => [...prev, { fullSentence: '', targetWord: '', wordPosition: 0, hint: '' }]);
    }
  }, [gameType]);

  const removeSentence = useCallback((index: number) => {
    setSentences(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSentence = useCallback((index: number, field: keyof Sentence, value: string | number) => {
    setSentences(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }, []);

  // Target words handlers for MULTIPLE_BLANKS
  const addTargetWord = useCallback((sentenceIndex: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      return {
        ...s,
        targetWords: [...(s.targetWords || []), ''],
        wordPositions: [...(s.wordPositions || []), 0],
      };
    }));
  }, []);

  const removeTargetWord = useCallback((sentenceIndex: number, wordIndex: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      const newTargetWords = (s.targetWords || []).filter((_, wi) => wi !== wordIndex);
      const newWordPositions = (s.wordPositions || []).filter((_, wi) => wi !== wordIndex);
      return {
        ...s,
        targetWords: newTargetWords.length >= 2 ? newTargetWords : s.targetWords, // Keep minimum 2
        wordPositions: newWordPositions.length >= 2 ? newWordPositions : s.wordPositions,
      };
    }));
  }, []);

  const updateTargetWord = useCallback((sentenceIndex: number, wordIndex: number, value: string) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      const newTargetWords = [...(s.targetWords || [])];
      newTargetWords[wordIndex] = value;
      return { ...s, targetWords: newTargetWords };
    }));
  }, []);

  const updateWordPosition = useCallback((sentenceIndex: number, wordIndex: number, value: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      const newWordPositions = [...(s.wordPositions || [])];
      newWordPositions[wordIndex] = value;
      return { ...s, wordPositions: newWordPositions };
    }));
  }, []);

  // Distractor handlers
  const addDistractor = useCallback(() => {
    setDistractors(prev => [...prev, '']);
  }, []);

  const removeDistractor = useCallback((index: number) => {
    setDistractors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateDistractor = useCallback((index: number, value: string) => {
    setDistractors(prev => prev.map((d, i) => i === index ? value : d));
  }, []);

  // Option handler for MultipleChoice
  const updateOption = useCallback((index: number, value: string) => {
    setOptions(prev => {
      const newOptions = [...prev] as [string, string, string];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  // Parse API error messages to user-friendly format
  const parseApiError = useCallback((message: string): string => {
    // Extract sentence number
    const sentenceMatch = message.match(/^Sentence (\d+):/);
    const sentenceNum = sentenceMatch ? sentenceMatch[1] : null;
    const sentencePrefix = sentenceNum ? t('apiErrors.sentencePrefix', { number: sentenceNum }) : '';

    // targetWord not found in fullSentence
    const wordNotFoundMatch = message.match(/targetWord "(.+)" not found in fullSentence/);
    if (wordNotFoundMatch) {
      return `${sentencePrefix}${t('apiErrors.wordNotFound', { word: wordNotFoundMatch[1] })}`;
    }

    // MULTIPLE_BLANKS requires targetWords array
    if (message.includes('requires targetWords array, not single targetWord')) {
      return `${sentencePrefix}${t('apiErrors.requiresTargetWordsArray')}`;
    }

    // MULTIPLE_BLANKS requires at least 2 words
    if (message.includes('requires targetWords array with at least 2 words')) {
      return `${sentencePrefix}${t('apiErrors.requiresAtLeast2Words')}`;
    }

    // wordPositions array must have same length
    if (message.includes('wordPositions array must have same length')) {
      return `${sentencePrefix}${t('apiErrors.positionsLengthMismatch')}`;
    }

    // targetWords[n] cannot be empty
    const emptyWordMatch = message.match(/targetWords\[(\d+)\] cannot be empty/);
    if (emptyWordMatch) {
      const wordIndex = parseInt(emptyWordMatch[1]) + 1;
      return `${sentencePrefix}${t('apiErrors.emptyTargetWord', { index: wordIndex })}`;
    }

    // wordPositions[n] must be >= 0
    const invalidPositionMatch = message.match(/wordPositions\[(\d+)\] must be >= 0/);
    if (invalidPositionMatch) {
      const posIndex = parseInt(invalidPositionMatch[1]) + 1;
      return `${sentencePrefix}${t('apiErrors.invalidPosition', { index: posIndex })}`;
    }

    // Return original message if no pattern matched
    return message;
  }, [t]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedLessonId) {
      newErrors.lessonId = t('errors.lessonRequired');
    }

    if (animationType === 'CompleteSentence') {
      if (!gameType) {
        newErrors.gameType = t('errors.gameTypeRequired');
      }

      if (gameType === 'MULTIPLE_BLANKS') {
        // For MULTIPLE_BLANKS, validate targetWords array (minimum 2 words per sentence)
        const validSentences = sentences.filter(s => {
          const hasFullSentence = s.fullSentence.trim();
          const validTargetWords = (s.targetWords || []).filter(w => w.trim());
          return hasFullSentence && validTargetWords.length >= 2;
        });
        if (validSentences.length === 0) {
          newErrors.sentences = t('errors.multipleBlanksRequired');
        }
      } else {
        // For other game types, validate single targetWord
        const validSentences = sentences.filter(s => s.fullSentence.trim() && s.targetWord?.trim());
        if (validSentences.length === 0) {
          newErrors.sentences = t('errors.sentenceRequired');
        }
      }
    } else {
      if (!question.trim()) {
        newErrors.question = t('errors.questionRequired');
      }

      const validOptions = options.filter(o => o.trim());
      if (validOptions.length !== 3) {
        newErrors.options = t('errors.threeOptionsRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedLessonId, animationType, gameType, sentences, question, options, t]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      let content: CompleteSentenceContent | MultipleChoiceContent;

      if (animationType === 'CompleteSentence') {
        const validDistractors = distractors.filter(d => d.trim());

        if (gameType === 'MULTIPLE_BLANKS') {
          // For MULTIPLE_BLANKS, use targetWords array
          const validSentences = sentences.filter(s => {
            const hasFullSentence = s.fullSentence.trim();
            const validTargetWords = (s.targetWords || []).filter(w => w.trim());
            return hasFullSentence && validTargetWords.length >= 2;
          });

          content = {
            gameType,
            sentences: validSentences.map(s => ({
              fullSentence: s.fullSentence.trim(),
              targetWords: (s.targetWords || []).filter(w => w.trim()).map(w => w.trim()),
              wordPositions: s.wordPositions || [],
              ...(s.hint?.trim() && { hint: s.hint.trim() }),
            })),
            ...(validDistractors.length > 0 && { distractors: validDistractors }),
            shuffleWords,
          };
        } else {
          // For other game types, use single targetWord
          const validSentences = sentences.filter(s => s.fullSentence.trim() && s.targetWord?.trim());

          content = {
            gameType,
            sentences: validSentences.map(s => ({
              fullSentence: s.fullSentence.trim(),
              targetWord: s.targetWord!.trim(),
              wordPosition: s.wordPosition ?? 0,
              ...(s.hint?.trim() && { hint: s.hint.trim() }),
            })),
            ...(validDistractors.length > 0 && { distractors: validDistractors }),
            shuffleWords,
          };
        }
      } else {
        content = {
          question: question.trim(),
          options: options.map(o => o.trim()) as [string, string, string],
          correctOptionIndex,
          ...(explanation.trim() && { explanation: explanation.trim() }),
        };
      }

      const requestBody = {
        lessonId: selectedLessonId,
        type: animationType,
        content,
      };

      const response = await fetch(`${apiUrl}/api/v1/animations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'default',
      });

      // Reset form
      setSelectedLessonId('');
      setAnimationType('CompleteSentence');
      setGameType('DRAG_WORD');
      setSentences([{ fullSentence: '', targetWord: '', wordPosition: 0, hint: '' }]);
      setDistractors(['']);
      setShuffleWords(true);
      setQuestion('');
      setOptions(['', '', '']);
      setCorrectOptionIndex(0);
      setExplanation('');
      setErrors({});

    } catch (error) {
      console.error('Error creating animation:', error);
      const errorMessage = error instanceof Error ? error.message : t('error.description');
      const parsedError = parseApiError(errorMessage);

      toast({
        title: t('error.title'),
        description: parsedError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const gameTypeOptions: { value: GameType; label: string; icon: React.ReactNode }[] = [
    { value: 'DRAG_WORD', label: t('gameTypes.dragWord'), icon: <GripHorizontal size={16} /> },
    { value: 'REORDER_WORDS', label: t('gameTypes.reorderWords'), icon: <ListOrdered size={16} /> },
    { value: 'TYPE_COMPLETION', label: t('gameTypes.typeCompletion'), icon: <Type size={16} /> },
    { value: 'MULTIPLE_BLANKS', label: t('gameTypes.multipleBlanks'), icon: <Layers size={16} /> },
  ];

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Gamepad2 size={24} className="text-secondary" />
          {t('title')}
        </h3>
        <p className="text-gray-400 mt-1">{t('description')}</p>
      </div>

      <div className="space-y-6">
        {/* Course Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <BookOpen size={16} className="text-secondary" />
              {t('fields.course')}
            </Label>
            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder={loadingCourses ? t('loading') : t('placeholders.course')} />
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

          {/* Module */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Layers size={16} className="text-secondary" />
              {t('fields.module')}
            </Label>
            <Select
              value={selectedModuleId}
              onValueChange={handleModuleChange}
              disabled={!selectedCourseId}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                {loadingModules ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t('loading')}
                  </span>
                ) : (
                  <SelectValue placeholder={t('placeholders.module')} />
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

          {/* Lesson */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Play size={16} className="text-secondary" />
              {t('fields.lesson')}
            </Label>
            <Select
              value={selectedLessonId}
              onValueChange={handleLessonChange}
              disabled={!selectedModuleId}
            >
              <SelectTrigger className={`bg-gray-700 border-gray-600 text-white ${errors.lessonId ? 'border-red-500' : ''}`}>
                {loadingLessons ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t('loading')}
                  </span>
                ) : (
                  <SelectValue placeholder={t('placeholders.lesson')} />
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
            {errors.lessonId && <p className="text-red-400 text-sm">{errors.lessonId}</p>}
          </div>
        </div>

        {/* Animation Type Selection */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            <Gamepad2 size={16} className="text-secondary" />
            {t('fields.animationType')}
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleAnimationTypeChange('CompleteSentence')}
              className={`p-4 rounded-lg border-2 transition-all ${
                animationType === 'CompleteSentence'
                  ? 'border-secondary bg-secondary/20 text-white'
                  : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Type size={24} className="mx-auto mb-2" />
              <p className="font-medium">{t('types.completeSentence')}</p>
              <p className="text-xs mt-1 opacity-70">{t('types.completeSentenceDesc')}</p>
            </button>
            <button
              type="button"
              onClick={() => handleAnimationTypeChange('MultipleChoice')}
              className={`p-4 rounded-lg border-2 transition-all ${
                animationType === 'MultipleChoice'
                  ? 'border-secondary bg-secondary/20 text-white'
                  : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
              }`}
            >
              <HelpCircle size={24} className="mx-auto mb-2" />
              <p className="font-medium">{t('types.multipleChoice')}</p>
              <p className="text-xs mt-1 opacity-70">{t('types.multipleChoiceDesc')}</p>
            </button>
          </div>
        </div>

        {/* CompleteSentence Form */}
        {animationType === 'CompleteSentence' && (
          <div className="space-y-6 border border-gray-700 rounded-lg p-4">
            {/* Game Type */}
            <div className="space-y-2">
              <Label className="text-gray-300">{t('fields.gameType')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {gameTypeOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleGameTypeChange(option.value)}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                      gameType === option.value
                        ? 'border-secondary bg-secondary/20 text-white'
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {option.icon}
                    <span className="text-xs text-center">{option.label}</span>
                  </button>
                ))}
              </div>
              {errors.gameType && <p className="text-red-400 text-sm">{errors.gameType}</p>}
            </div>

            {/* Sentences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">{t('fields.sentences')}</Label>
                <button
                  type="button"
                  onClick={addSentence}
                  className="flex items-center gap-1 text-secondary hover:text-secondary/80 text-sm"
                >
                  <Plus size={16} />
                  {t('actions.addSentence')}
                </button>
              </div>

              {sentences.map((sentence, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{t('fields.sentence')} {index + 1}</span>
                    {sentences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSentence(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <TextField
                    label={t('fields.fullSentence')}
                    value={sentence.fullSentence}
                    onChange={e => updateSentence(index, 'fullSentence', e.target.value)}
                    placeholder={t('placeholders.fullSentence')}
                  />

                  {gameType === 'MULTIPLE_BLANKS' ? (
                    /* Multiple target words for MULTIPLE_BLANKS */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-400 text-sm">{t('fields.targetWords')}</Label>
                        <button
                          type="button"
                          onClick={() => addTargetWord(index)}
                          className="flex items-center gap-1 text-secondary hover:text-secondary/80 text-xs"
                        >
                          <Plus size={14} />
                          {t('actions.addTargetWord')}
                        </button>
                      </div>
                      {(sentence.targetWords || ['', '']).map((word, wordIndex) => (
                        <div key={wordIndex} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <TextField
                              label={`${t('fields.targetWord')} ${wordIndex + 1}`}
                              value={word}
                              onChange={e => updateTargetWord(index, wordIndex, e.target.value)}
                              placeholder={t('placeholders.targetWord')}
                            />
                          </div>
                          <div className="w-24">
                            <TextField
                              label={t('fields.position')}
                              type="number"
                              value={(sentence.wordPositions?.[wordIndex] || 0).toString()}
                              onChange={e => updateWordPosition(index, wordIndex, parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          {(sentence.targetWords?.length || 0) > 2 && (
                            <button
                              type="button"
                              onClick={() => removeTargetWord(index, wordIndex)}
                              className="text-red-400 hover:text-red-300 p-2 mb-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <p className="text-gray-500 text-xs">{t('hints.multipleBlanks')}</p>
                    </div>
                  ) : (
                    /* Single target word for other game types */
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label={t('fields.targetWord')}
                        value={sentence.targetWord || ''}
                        onChange={e => updateSentence(index, 'targetWord', e.target.value)}
                        placeholder={t('placeholders.targetWord')}
                      />
                      <TextField
                        label={t('fields.wordPosition')}
                        type="number"
                        value={(sentence.wordPosition ?? 0).toString()}
                        onChange={e => updateSentence(index, 'wordPosition', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  )}

                  <TextField
                    label={t('fields.hint')}
                    value={sentence.hint || ''}
                    onChange={e => updateSentence(index, 'hint', e.target.value)}
                    placeholder={t('placeholders.hint')}
                  />
                </div>
              ))}
              {errors.sentences && <p className="text-red-400 text-sm">{errors.sentences}</p>}
            </div>

            {/* Distractors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">{t('fields.distractors')}</Label>
                <button
                  type="button"
                  onClick={addDistractor}
                  className="flex items-center gap-1 text-secondary hover:text-secondary/80 text-sm"
                >
                  <Plus size={16} />
                  {t('actions.addDistractor')}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {distractors.map((distractor, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={distractor}
                      onChange={e => updateDistractor(index, e.target.value)}
                      placeholder={t('placeholders.distractor')}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    />
                    {distractors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDistractor(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs">{t('hints.distractors')}</p>
            </div>

            {/* Shuffle Words Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShuffleWords(!shuffleWords)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  shuffleWords ? 'bg-secondary' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                  shuffleWords ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
              <Label className="text-gray-300">{t('fields.shuffleWords')}</Label>
            </div>
          </div>
        )}

        {/* MultipleChoice Form */}
        {animationType === 'MultipleChoice' && (
          <div className="space-y-6 border border-gray-700 rounded-lg p-4">
            {/* Question */}
            <TextField
              label={t('fields.question')}
              value={question}
              onChange={e => {
                setQuestion(e.target.value);
                setErrors(prev => ({ ...prev, question: undefined }));
              }}
              placeholder={t('placeholders.question')}
              error={errors.question}
            />

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-gray-300">{t('fields.options')}</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCorrectOptionIndex(index as 0 | 1 | 2)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      correctOptionIndex === index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    title={t('hints.markCorrect')}
                  >
                    {correctOptionIndex === index ? <Check size={16} /> : index + 1}
                  </button>
                  <input
                    type="text"
                    value={option}
                    onChange={e => updateOption(index, e.target.value)}
                    placeholder={`${t('placeholders.option')} ${index + 1}`}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              ))}
              {errors.options && <p className="text-red-400 text-sm">{errors.options}</p>}
              <p className="text-gray-500 text-xs">{t('hints.correctOption')}</p>
            </div>

            {/* Explanation */}
            <TextField
              label={t('fields.explanation')}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder={t('placeholders.explanation')}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-secondary hover:bg-secondary/90 text-primary font-semibold px-8"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                {t('actions.creating')}
              </>
            ) : (
              <>
                <Check size={18} className="mr-2" />
                {t('actions.create')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

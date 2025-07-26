// /src/components/CreateFlashcardForm.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateSlug } from '@/lib/slug';
import {
  CreditCard,
  Type,
  Image as ImageIcon,
  Tag,
  Check,
  X,
  Upload,
  RotateCcw,
} from 'lucide-react';

interface FormData {
  questionType: 'TEXT' | 'IMAGE';
  questionContent: string;
  answerType: 'TEXT' | 'IMAGE';
  answerContent: string;
  argumentId: string;
  tagIds: string[];
}

interface FormErrors {
  questionContent?: string;
  answerContent?: string;
  argumentId?: string;
  tagIds?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateFlashcardFormProps {
  onFlashcardCreated?: () => void;
}

interface Argument {
  id: string;
  title: string;
  order: number;
  assessmentId: string;
  createdAt: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface UploadedFile {
  file: File;
  url: string;
}

export default function CreateFlashcardForm({
  onFlashcardCreated,
}: CreateFlashcardFormProps) {
  const t = useTranslations('Admin.createFlashcard');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [argumentsList, setArgumentsList] = useState<
    Argument[]
  >([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingArguments, setLoadingArguments] =
    useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [questionImageFile, setQuestionImageFile] =
    useState<UploadedFile | null>(null);
  const [answerImageFile, setAnswerImageFile] =
    useState<UploadedFile | null>(null);
  const [
    uploadingQuestionImage,
    setUploadingQuestionImage,
  ] = useState(false);
  const [uploadingAnswerImage, setUploadingAnswerImage] =
    useState(false);

  const [formData, setFormData] = useState<FormData>({
    questionType: 'TEXT',
    questionContent: '',
    answerType: 'TEXT',
    answerContent: '',
    argumentId: '',
    tagIds: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const loadArguments = useCallback(async () => {
    setLoadingArguments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load arguments');
      }

      const data = await response.json();
      setArgumentsList(data.arguments || []);
    } catch (error) {
      console.error('Error loading arguments:', error);
      toast({
        title: t('errors.loadArgumentsTitle'),
        description: t('errors.loadArgumentsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingArguments(false);
    }
  }, [t, toast]);

  const loadTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcard-tags`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load tags');
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast({
        title: t('errors.loadTagsTitle'),
        description: t('errors.loadTagsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingTags(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadArguments();
    loadTags();
  }, [loadArguments, loadTags]);

  const validateField = (
    name: keyof FormData,
    value: string | string[]
  ): ValidationResult => {
    switch (name) {
      case 'questionContent':
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return {
            isValid: false,
            message: t('errors.questionRequired'),
          };
        }
        if (
          typeof value === 'string' &&
          value.length > 1000
        ) {
          return {
            isValid: false,
            message: t('errors.questionTooLong'),
          };
        }
        break;
      case 'answerContent':
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return {
            isValid: false,
            message: t('errors.answerRequired'),
          };
        }
        if (
          typeof value === 'string' &&
          value.length > 1000
        ) {
          return {
            isValid: false,
            message: t('errors.answerTooLong'),
          };
        }
        break;
      case 'argumentId':
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return {
            isValid: false,
            message: t('errors.argumentRequired'),
          };
        }
        break;
    }

    return { isValid: true };
  };

  const handleFieldChange = (
    name: keyof FormData,
    value: string | string[]
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const validation = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: validation.isValid
          ? undefined
          : validation.message,
      }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name];
    const validation = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: validation.isValid
        ? undefined
        : validation.message,
    }));
  };

  const handleQuestionImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingQuestionImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const uploadedFile: UploadedFile = {
        file,
        url: data.url,
      };

      setQuestionImageFile(uploadedFile);
      handleFieldChange('questionContent', data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('errors.uploadFailedTitle'),
        description: t('errors.uploadFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  const handleAnswerImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAnswerImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const uploadedFile: UploadedFile = {
        file,
        url: data.url,
      };

      setAnswerImageFile(uploadedFile);
      handleFieldChange('answerContent', data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('errors.uploadFailedTitle'),
        description: t('errors.uploadFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setUploadingAnswerImage(false);
    }
  };

  const removeQuestionImage = () => {
    setQuestionImageFile(null);
    handleFieldChange('questionContent', '');
  };

  const removeAnswerImage = () => {
    setAnswerImageFile(null);
    handleFieldChange('answerContent', '');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = [
      'questionContent',
      'answerContent',
      'argumentId',
    ];

    fieldsToValidate.forEach(field => {
      const validation = validateField(
        field,
        formData[field]
      );
      if (!validation.isValid) {
        newErrors[field] = validation.message;
      }
    });

    setErrors(newErrors);
    setTouched(
      fieldsToValidate.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      )
    );

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      // Gerar slug automaticamente a partir da pergunta
      const slug = generateSlug(
        formData.questionType === 'TEXT' 
          ? formData.questionContent 
          : `flashcard-${Date.now()}`
      );

      const payload = {
        question: {
          type: formData.questionType,
          content: formData.questionContent,
        },
        answer: {
          type: formData.answerType,
          content: formData.answerContent,
        },
        argumentId: formData.argumentId,
        slug,
        ...(formData.tagIds.length > 0 && {
          tagIds: formData.tagIds,
        }),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to create flashcard'
        );
      }

      toast({
        title: t('success.createTitle'),
        description: t('success.createDescription'),
      });

      if (onFlashcardCreated) {
        onFlashcardCreated();
      }
      resetForm();
    } catch (error) {
      console.error('Error creating flashcard:', error);
      toast({
        title: t('errors.createTitle'),
        description:
          error instanceof Error
            ? error.message
            : t('errors.createDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      questionType: 'TEXT',
      questionContent: '',
      answerType: 'TEXT',
      answerContent: '',
      argumentId: '',
      tagIds: [],
    });
    setQuestionImageFile(null);
    setAnswerImageFile(null);
    setErrors({});
    setTouched({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <CreditCard
              className="text-secondary"
              size={24}
            />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t('title')}
          </h2>
        </div>
          {/* Question Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Type className="text-secondary" size={20} />
              {t('questionSection')}
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('questionType', 'TEXT');
                  handleFieldChange('questionContent', '');
                  setQuestionImageFile(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.questionType === 'TEXT'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Type className="inline mr-2" size={16} />
                {t('textType')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFieldChange(
                    'questionType',
                    'IMAGE'
                  );
                  handleFieldChange('questionContent', '');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.questionType === 'IMAGE'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ImageIcon className="inline mr-2" size={16} />
                {t('imageType')}
              </button>
            </div>

            {formData.questionType === 'TEXT' ? (
              <div>
                <Label
                  htmlFor="questionContent"
                  className="text-gray-300"
                >
                  {t('questionText')}
                </Label>
                <Textarea
                  id="questionContent"
                  value={formData.questionContent}
                  onChange={(
                    e: React.ChangeEvent<HTMLTextAreaElement>
                  ) =>
                    handleFieldChange(
                      'questionContent',
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    handleBlur('questionContent')
                  }
                  placeholder={t('questionPlaceholder')}
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-secondary focus:ring-secondary"
                  rows={3}
                />
                {errors.questionContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.questionContent}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label
                  htmlFor="questionImage"
                  className="text-gray-300"
                >
                  {t('questionImage')}
                </Label>
                {!questionImageFile ? (
                  <div className="mt-1">
                    <label
                      htmlFor="questionImageUpload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-secondary transition-colors"
                    >
                      <div className="text-center">
                        <Upload
                          className="mx-auto text-gray-400 mb-2"
                          size={24}
                        />
                        <p className="text-sm text-gray-400">
                          {uploadingQuestionImage
                            ? t('uploading')
                            : t('uploadImage')}
                        </p>
                      </div>
                    </label>
                    <input
                      id="questionImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleQuestionImageUpload}
                      className="hidden"
                      disabled={uploadingQuestionImage}
                    />
                  </div>
                ) : (
                  <div className="mt-1 relative bg-gray-700 rounded-lg p-4">
                    <NextImage
                      src={questionImageFile.url}
                      alt={t('questionImage')}
                      width={400}
                      height={128}
                      className="w-full h-32 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={removeQuestionImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {errors.questionContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.questionContent}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Check className="text-secondary" size={20} />
              {t('answerSection')}
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('answerType', 'TEXT');
                  handleFieldChange('answerContent', '');
                  setAnswerImageFile(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.answerType === 'TEXT'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Type className="inline mr-2" size={16} />
                {t('textType')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('answerType', 'IMAGE');
                  handleFieldChange('answerContent', '');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.answerType === 'IMAGE'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ImageIcon className="inline mr-2" size={16} />
                {t('imageType')}
              </button>
            </div>

            {formData.answerType === 'TEXT' ? (
              <div>
                <Label
                  htmlFor="answerContent"
                  className="text-gray-300"
                >
                  {t('answerText')}
                </Label>
                <Textarea
                  id="answerContent"
                  value={formData.answerContent}
                  onChange={(
                    e: React.ChangeEvent<HTMLTextAreaElement>
                  ) =>
                    handleFieldChange(
                      'answerContent',
                      e.target.value
                    )
                  }
                  onBlur={() => handleBlur('answerContent')}
                  placeholder={t('answerPlaceholder')}
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-secondary focus:ring-secondary"
                  rows={3}
                />
                {errors.answerContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.answerContent}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label
                  htmlFor="answerImage"
                  className="text-gray-300"
                >
                  {t('answerImage')}
                </Label>
                {!answerImageFile ? (
                  <div className="mt-1">
                    <label
                      htmlFor="answerImageUpload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-secondary transition-colors"
                    >
                      <div className="text-center">
                        <Upload
                          className="mx-auto text-gray-400 mb-2"
                          size={24}
                        />
                        <p className="text-sm text-gray-400">
                          {uploadingAnswerImage
                            ? t('uploading')
                            : t('uploadImage')}
                        </p>
                      </div>
                    </label>
                    <input
                      id="answerImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleAnswerImageUpload}
                      className="hidden"
                      disabled={uploadingAnswerImage}
                    />
                  </div>
                ) : (
                  <div className="mt-1 relative bg-gray-700 rounded-lg p-4">
                    <NextImage
                      src={answerImageFile.url}
                      alt={t('answerImage')}
                      width={400}
                      height={128}
                      className="w-full h-32 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={removeAnswerImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {errors.answerContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.answerContent}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Argument Selection */}
          <div>
            <Label
              htmlFor="argumentId"
              className="text-gray-300"
            >
              {t('argument')}
            </Label>
            <Select
              value={formData.argumentId}
              onValueChange={value =>
                handleFieldChange('argumentId', value)
              }
            >
              <SelectTrigger
                id="argumentId"
                className="mt-1 w-full bg-gray-700 border-gray-600 text-white focus:border-secondary focus:ring-secondary"
                onBlur={() => handleBlur('argumentId')}
              >
                <SelectValue
                  placeholder={t('selectArgument')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {loadingArguments ? (
                  <SelectItem value="loading" disabled>
                    {t('loadingArguments')}
                  </SelectItem>
                ) : argumentsList.length === 0 ? (
                  <SelectItem value="no-arguments" disabled>
                    {t('noArguments')}
                  </SelectItem>
                ) : (
                  argumentsList.map(argument => (
                    <SelectItem
                      key={argument.id}
                      value={argument.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {argument.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.argumentId && (
              <p className="mt-1 text-sm text-red-400">
                {errors.argumentId}
              </p>
            )}
          </div>

          {/* Tags Selection */}
          <div>
            <Label
              htmlFor="tagIds"
              className="text-gray-300"
            >
              <Tag className="inline mr-2" size={16} />
              {t('tags')}
            </Label>
            <Select
              value={formData.tagIds.join(',')}
              onValueChange={value => {
                const selectedTags = value
                  ? value.split(',')
                  : [];
                handleFieldChange('tagIds', selectedTags);
              }}
            >
              <SelectTrigger
                id="tagIds"
                className="mt-1 w-full bg-gray-700 border-gray-600 text-white focus:border-secondary focus:ring-secondary"
              >
                <SelectValue
                  placeholder={t('selectTags')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {loadingTags ? (
                  <SelectItem value="loading" disabled>
                    {t('loadingTags')}
                  </SelectItem>
                ) : tags.length === 0 ? (
                  <SelectItem value="no-tags" disabled>
                    {t('noTags')}
                  </SelectItem>
                ) : (
                  tags.map(tag => (
                    <SelectItem
                      key={tag.id}
                      value={tag.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {tag.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="mr-2" size={18} />
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RotateCcw
                    className="mr-2 animate-spin"
                    size={18}
                  />
                  {t('creating')}
                </>
              ) : (
                <>
                  <Check className="mr-2" size={18} />
                  {t('create')}
                </>
              )}
            </button>
          </div>
      </div>
    </form>
  );
}

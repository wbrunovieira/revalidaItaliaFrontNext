'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ExternalLink, ClipboardList, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  timeLimitInMinutes?: number;
  passingScore?: number;
}

interface CollapsibleAssessmentsProps {
  assessments: Assessment[];
  locale: string;
  lessonId: string;
}

export default function CollapsibleAssessments({
  assessments,
  locale,
  lessonId,
}: CollapsibleAssessmentsProps) {
  const tLesson = useTranslations('Lesson');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const INITIAL_DISPLAY_COUNT = 3;
  const hasMoreAssessments = assessments.length > INITIAL_DISPLAY_COUNT;
  const displayedAssessments = isExpanded 
    ? assessments 
    : assessments.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = assessments.length - INITIAL_DISPLAY_COUNT;

  return (
    <div className="mt-12 mb-12 p-6 bg-primary/20 rounded-xl border border-secondary/20 shadow-lg shadow-black/20">
      <div className="mb-5">
        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <ClipboardList size={20} className="text-secondary" />
          </div>
          {tLesson('assessments')}
          {assessments.length > 0 && (
            <span className="text-sm font-normal text-gray-400">
              ({assessments.length})
            </span>
          )}
        </h4>
        <div className="h-0.5 w-20 bg-gradient-to-r from-secondary via-secondary/50 to-transparent rounded-full ml-11"></div>
      </div>
      
      <div className="space-y-3 overflow-visible">
        {displayedAssessments.map(assessment => (
          <div
            key={assessment.id}
            className="group relative bg-primary/50 rounded-lg border border-secondary/25 hover:border-secondary/40 transition-all duration-300 overflow-visible hover:shadow-xl hover:shadow-secondary/25 hover:bg-primary/60"
          >
            {/* Assessment icon positioned in top-left corner - appears on hover */}
            {assessment.type === 'QUIZ' && (
              <Image
                src="/icons/quiz.svg"
                alt="Quiz"
                width={40}
                height={40}
                className="absolute -top-2 -left-5 w-10 h-10 z-10 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
              />
            )}
            {assessment.type === 'SIMULADO' && (
              <Image
                src="/icons/rating.svg"
                alt="Simulado"
                width={40}
                height={40}
                className="absolute -top-2 -left-5 w-10 h-10 z-10 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
              />
            )}
            {assessment.type === 'PROVA_ABERTA' && (
              <Image
                src="/icons/examination.svg"
                alt="Prova Aberta"
                width={28}
                height={28}
                className="absolute -top-1 -left-3 w-7 h-7 z-10 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
              />
            )}

            {/* Collapsed state - only title and type */}
            <div className="p-4 transition-all duration-300 group-hover:pb-2">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-white group-hover:text-secondary transition-colors duration-300">
                  {assessment.title}
                </h5>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium transition-all duration-300 ${
                    assessment.type === 'QUIZ'
                      ? 'bg-primary text-accent-light border border-blue-500/30'
                      : assessment.type === 'SIMULADO'
                      ? 'bg-secondary/20 text-accent-light border border-secondary/30'
                      : 'bg-accent text-primary border border-primary/40'
                  }`}
                >
                  {tLesson(`assessmentTypes.${assessment.type.toLowerCase()}`)}
                </span>
              </div>
            </div>

            {/* Expanded content on hover */}
            <div className="max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden">
              <div className="px-4 pb-4">
                {assessment.description && (
                  <p className="text-gray-400 text-sm mb-3 pt-2">
                    {assessment.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {assessment.timeLimitInMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {assessment.timeLimitInMinutes} min
                      </span>
                    )}
                    {assessment.passingScore && (
                      <span>
                        {tLesson('passingScore')}: {assessment.passingScore}%
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/${locale}/lessons/${lessonId}/assessments/${assessment.id}`}
                    className="flex items-center gap-2 px-3 py-1 bg-secondary text-primary rounded-lg hover:bg-secondary/90 text-sm font-medium transform scale-0 group-hover:scale-100 transition-all duration-300"
                  >
                    {tLesson('startAssessment')}
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMoreAssessments && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 px-5 py-2.5 bg-secondary/15 hover:bg-secondary/25 text-white rounded-lg transition-all duration-300 border border-secondary/25 hover:border-secondary/40 shadow-md hover:shadow-lg"
          >
            <div className="flex items-center gap-2">
              {!isExpanded ? (
                <>
                  <AlertCircle size={16} className="text-secondary" />
                  <span className="text-sm font-medium">
                    {tLesson('showMoreAssessments', { count: hiddenCount })}
                  </span>
                  <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">
                    {tLesson('showLessAssessments')}
                  </span>
                  <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Indicator when collapsed */}
      {hasMoreAssessments && !isExpanded && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 font-medium">
            {tLesson('totalAssessments', { total: assessments.length })}
          </p>
        </div>
      )}
    </div>
  );
}
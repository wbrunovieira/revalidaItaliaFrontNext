// Types for lesson context information
export interface LessonContext {
  lessonId: string;
  lessonTitle: string;
  lessonImageUrl?: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
  moduleSlug: string;
}
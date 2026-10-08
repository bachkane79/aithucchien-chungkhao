import type { QuizDefinition } from './quizzes';

export interface QuizProgress {
  fingerprint: string;
  answers: Record<string, string>;
  flagged: string[];
  index: number;
  submitted: boolean;
}

// Any content edit invalidates a previous attempt, including changes to answer keys.
export function quizFingerprint(quiz: QuizDefinition) { return JSON.stringify(quiz); }
export function quizStorageKey(quiz: QuizDefinition) { return `mapstudy-stem:quiz:v1:${quiz.id}`; }

export function parseQuizProgress(raw: string | null, quiz: QuizDefinition): QuizProgress | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const saved = value as Partial<QuizProgress>;
    if (saved.fingerprint !== quizFingerprint(quiz) || !saved.answers || typeof saved.answers !== 'object' || Array.isArray(saved.answers)) return null;
    const answers: Record<string, string> = Object.create(null);
    for (const question of quiz.questions) {
      const option = saved.answers[question.id];
      if (Object.prototype.hasOwnProperty.call(saved.answers, question.id) && question.options.some((item) => item.id === option)) answers[question.id] = option;
    }
    const flagged = Array.isArray(saved.flagged) ? [...new Set(saved.flagged.filter((id): id is string => typeof id === 'string' && quiz.questions.some((question) => question.id === id)))] : [];
    const index = typeof saved.index === 'number' && Number.isInteger(saved.index) ? Math.max(0, Math.min(saved.index, quiz.questions.length - 1)) : 0;
    return { fingerprint: saved.fingerprint, answers, flagged, index, submitted: saved.submitted === true };
  } catch { return null; }
}

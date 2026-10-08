export type QuizLevel = 'understanding' | 'advanced';
export type QuestionSkill = 'interaction' | 'relationship' | 'theory';

export function quizLevelLabel(level: QuizLevel = 'understanding') {
  return level === 'advanced' ? 'Nâng cao' : 'Hiểu biết';
}

import batch1 from './understanding-quizzes/batch-1.json';
import batch5 from './understanding-quizzes/batch-5.json';
import batch8 from './understanding-quizzes/batch-8.json';

export interface QuizQuestion {
  skill?: QuestionSkill;
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizDefinition {
  id: string;
  /** Exact canonical Simulation.slug, not a legacy route alias. */
  simulationSlug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  level?: QuizLevel;
  /** Nguồn mô phỏng và tài liệu dùng để biên soạn; không phải đề thi do PhET phát hành. */
  sources?: string[];
  /** Demo content must remain visibly distinguished from approved quizzes. */
  isDemo: boolean;
  questions: QuizQuestion[];
}

/**
 * Các bài kiểm tra được biên soạn thủ công theo điều khiển của từng mô phỏng.
 * Không tổng hợp câu hỏi mẫu tự động khi gặp mô phỏng chưa có nội dung.
 * Mỗi bài có ID và câu hỏi riêng; đáp án, giải thích và kỹ năng được kiểm tra tự động.
 *
 * Cấu trúc ngân hàng câu hỏi:
 * {
 *   id: 'unique-quiz-id', simulationSlug: 'canonical-simulation-slug',
 *   title: 'Reviewed quiz title', description: 'Scope and learning objectives',
 *   estimatedMinutes: 5, isDemo: false,
 *   questions: [{
 *     id: 'question-1', prompt: 'Reviewed question',
 *     options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }],
 *     correctOptionId: 'a', explanation: 'Scientific reasoning for the answer',
 *   }],
 * }
 *
 * Chỉ nạp các nhóm câu hỏi đã viết xong. Các mô phỏng chưa có bài hiển thị chờ nội dung.
 * Bài mẫu con lắc vẫn dùng được nhưng luôn được đánh dấu Demo.
 */
export const sampleQuiz: QuizDefinition =
  {
    id: 'pendulum-lab-demo',
    simulationSlug: 'pendulum-lab',
    title: 'Bài kiểm tra mẫu: Con lắc đơn',
    description: 'DEMO — 3 câu hỏi cơ bản để minh họa tính năng. Nội dung mẫu, chưa phải bộ câu hỏi chính thức.',
    estimatedMinutes: 3,
    isDemo: true,
    questions: [
      {
        id: 'pendulum-length',
        prompt: 'Với con lắc đơn dao động góc nhỏ, giữ nguyên gia tốc trọng trường và tăng chiều dài dây lên 4 lần. Chu kỳ thay đổi như thế nào?',
        options: [
          { id: 'double', text: 'Tăng lên 2 lần.' },
          { id: 'quadruple', text: 'Tăng lên 4 lần.' },
          { id: 'half', text: 'Giảm còn một nửa.' },
          { id: 'unchanged', text: 'Không đổi.' },
        ],
        correctOptionId: 'double',
        explanation: 'Với góc lệch nhỏ, chu kỳ con lắc đơn là T = 2π√(L/g). Khi L tăng 4 lần và g không đổi, T tăng √4 = 2 lần.',
      },
      {
        id: 'pendulum-mass',
        prompt: 'Trong mô hình con lắc đơn lý tưởng, dao động góc nhỏ và bỏ qua lực cản, tăng khối lượng vật nặng có làm thay đổi chu kỳ không nếu chiều dài dây và gia tốc trọng trường giữ nguyên?',
        options: [
          { id: 'longer', text: 'Có, chu kỳ tăng theo khối lượng.' },
          { id: 'shorter', text: 'Có, chu kỳ giảm theo khối lượng.' },
          { id: 'unchanged', text: 'Không, chu kỳ không phụ thuộc khối lượng.' },
        ],
        correctOptionId: 'unchanged',
        explanation: 'Công thức T = 2π√(L/g) không chứa khối lượng. Trong các điều kiện lý tưởng đã nêu, thay đổi khối lượng không làm thay đổi chu kỳ.',
      },
      {
        id: 'pendulum-energy',
        prompt: 'Con lắc được thả từ vị trí lệch khỏi phương thẳng đứng và dao động không có ma sát. Khi đi qua vị trí thấp nhất, động năng và tốc độ của vật như thế nào?',
        options: [
          { id: 'zero', text: 'Động năng và tốc độ đều bằng không.' },
          { id: 'maximum', text: 'Động năng và tốc độ đều đạt giá trị lớn nhất.' },
          { id: 'minimum', text: 'Động năng và tốc độ đều nhỏ nhất nhưng khác không.' },
        ],
        correctOptionId: 'maximum',
        explanation: 'Khi không có ma sát, cơ năng được bảo toàn. Ở vị trí thấp nhất, thế năng trọng trường nhỏ nhất nên động năng lớn nhất; vì động năng bằng ½mv², tốc độ cũng lớn nhất.',
      },
    ],
  };

/** Các bài hiểu biết đã hoàn thiện; không nạp nhóm chưa có tệp. */
export const completedUnderstandingQuizzes = [
  ...batch1, ...batch5, ...batch8,
] as QuizDefinition[];

/** Bài mẫu con lắc giữ nguyên 3 câu và nhãn Demo, không tính vào số bài hoàn thiện. */
export const quizzes: QuizDefinition[] = [
  ...completedUnderstandingQuizzes,
  ...(completedUnderstandingQuizzes.some((quiz) => quiz.simulationSlug === sampleQuiz.simulationSlug) ? [] : [sampleQuiz]),
];

/** Exact canonical-slug lookup; unconfigured simulations return undefined. */
export function getQuizForSimulation(slug: string, level: QuizLevel = 'understanding'): QuizDefinition | undefined {
  return quizzes.find((quiz) => quiz.simulationSlug === slug && (quiz.level ?? 'understanding') === level);
}

export function getQuizById(id: string): QuizDefinition | undefined {
  return quizzes.find((quiz) => quiz.id === id);
}

/**
 * Grade every question against its own options. Missing/invalid option IDs count
 * as unanswered and incorrect; unrelated answer keys are ignored. Percentage is
 * correct / total on a 0–100 scale, rounded to the nearest integer (0 if empty).
 * The input quiz and answers are never mutated.
 */
export function gradeQuiz(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): { correct: number; total: number; answered: number; percentage: number } {
  let correct = 0;
  let answered = 0;

  for (const question of quiz.questions) {
    if (!Object.prototype.hasOwnProperty.call(answers, question.id)) continue;
    const selectedOptionId = answers[question.id];
    if (!question.options.some((option) => option.id === selectedOptionId)) continue;
    answered += 1;
    if (selectedOptionId === question.correctOptionId) correct += 1;
  }

  const total = quiz.questions.length;
  return {
    correct,
    total,
    answered,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

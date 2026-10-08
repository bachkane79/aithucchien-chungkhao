// Run: node scripts/check-quizzes.mjs (Node.js >= 22.13; no external packages).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = await readFile(new URL('../src/lib/quizzes.ts', import.meta.url), 'utf8');
const javascript = stripTypeScriptTypes(source);
const { quizzes, getQuizForSimulation, getQuizById, gradeQuiz } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

assert.equal(quizzes.length, 1, 'Only the pendulum demo should be configured for now');
const quiz = getQuizForSimulation('pendulum-lab');
assert.ok(quiz);
assert.equal(quiz.isDemo, true);
assert.match(quiz.title, /mẫu|demo/i);
assert.match(quiz.description, /demo/i);
assert.equal(quiz.questions.length, 3);
assert.equal(getQuizById(quiz.id), quiz);
assert.equal(getQuizById('unknown'), undefined);
assert.equal(getQuizForSimulation('build-an-atom'), undefined);
assert.equal(getQuizForSimulation('unknown'), undefined);
assert.equal(getQuizForSimulation('con-lac-don'), undefined, 'Use canonical slugs only');
assert.equal(getQuizForSimulation('toString'), undefined);
assert.equal(getQuizById('__proto__'), undefined);

const quizIds = new Set();
const slugs = new Set();
for (const entry of quizzes) {
  assert.ok(entry.id && entry.simulationSlug && entry.title && entry.description);
  assert.ok(Number.isFinite(entry.estimatedMinutes) && entry.estimatedMinutes > 0);
  assert.equal(quizIds.has(entry.id), false);
  assert.equal(slugs.has(entry.simulationSlug), false);
  quizIds.add(entry.id);
  slugs.add(entry.simulationSlug);
  const questionIds = new Set();
  for (const question of entry.questions) {
    assert.ok(question.id && question.prompt && question.explanation);
    assert.equal(questionIds.has(question.id), false);
    questionIds.add(question.id);
    assert.ok(question.options.length >= 2);
    assert.equal(new Set(question.options.map((option) => option.id)).size, question.options.length);
    assert.ok(question.options.every((option) => option.id && option.text));
    assert.equal(question.options.filter((option) => option.id === question.correctOptionId).length, 1);
  }
}

assert.deepEqual(gradeQuiz(quiz, {}), { correct: 0, total: 3, answered: 0, percentage: 0 });
const correctAnswers = Object.fromEntries(quiz.questions.map((question) => [question.id, question.correctOptionId]));
const snapshot = JSON.stringify({ quiz, correctAnswers });
assert.deepEqual(gradeQuiz(quiz, correctAnswers), { correct: 3, total: 3, answered: 3, percentage: 100 });
assert.equal(JSON.stringify({ quiz, correctAnswers }), snapshot, 'Grading must not mutate its inputs');
const [first, second, third] = quiz.questions;
const wrongOption = second.options.find((option) => option.id !== second.correctOptionId).id;
assert.deepEqual(gradeQuiz(quiz, {
  [first.id]: first.correctOptionId,
  [second.id]: wrongOption,
  [third.id]: 'not-an-option',
  unrelated: 'ignored',
}), { correct: 1, total: 3, answered: 2, percentage: 33 });
assert.deepEqual(gradeQuiz(quiz, {
  [first.id]: first.correctOptionId,
  [second.id]: second.correctOptionId,
}), { correct: 2, total: 3, answered: 2, percentage: 67 });
assert.deepEqual(gradeQuiz(quiz, Object.create(correctAnswers)), {
  correct: 0, total: 3, answered: 0, percentage: 0,
});
assert.deepEqual(gradeQuiz({ ...quiz, questions: [] }, { unrelated: 'ignored' }), {
  correct: 0, total: 0, answered: 0, percentage: 0,
});
console.log('Quiz checks passed: demo contract, canonical lookups, grading, rounding, invalid/missing answers, empty quizzes, and immutability.');

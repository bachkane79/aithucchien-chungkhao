import { expect, test } from '@playwright/test';
import { getQuizForSimulation, gradeQuiz, quizzes } from '../src/lib/quizzes';
import { getSimulation, simulations } from '../src/lib/simulations';
import { parseQuizProgress, quizFingerprint, quizStorageKey } from '../src/lib/quiz-progress';

const quiz = getQuizForSimulation('gravity-force-lab-basics', 'understanding')!;
const [first, second, third] = quiz.questions;
const path = `/trac-nghiem/${quiz.simulationSlug}`;
const other = getSimulation('waves-intro')!;
const completed = quizzes.filter((item) => !item.isDemo);
const firstPage = simulations.flatMap((simulation) => {
  const item = getQuizForSimulation(simulation.slug);
  return item ? [item] : [];
}).slice(0, 12);

async function noOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

// These unit checks need no browser or running server. The parent integrates
// the authored bank before executing this suite; never silently skip missing data.
test('available completed quizzes have valid unique keys and skills without inventing missing content', () => {
  expect(simulations).toHaveLength(122);
  expect(completed.length).toBeGreaterThan(0);
  expect(new Set(quizzes.map((item) => item.id)).size).toBe(quizzes.length);
  expect(new Set(quizzes.map((item) => item.simulationSlug)).size).toBe(quizzes.length);
  expect(getQuizForSimulation('build-an-atom')).toBeUndefined();
  expect(getQuizForSimulation('pendulum-lab')?.isDemo).toBe(true);
  for (const item of completed) {
    expect(getQuizForSimulation(item.simulationSlug, 'understanding')).toBe(item);
    expect(getQuizForSimulation(item.simulationSlug, 'advanced')).toBeUndefined();
    expect(item!.isDemo).toBe(false);
    expect(item!.level).toBe('understanding');
    expect(item!.questions).toHaveLength(6);
    expect(new Set(item!.questions.map((question) => question.id)).size).toBe(6);
    const skills = item!.questions.map((question) => question.skill);
    expect(skills.filter((skill) => skill === 'interaction').length).toBeGreaterThanOrEqual(3);
    expect(skills.filter((skill) => skill === 'relationship' || skill === 'theory').length).toBeGreaterThanOrEqual(2);
    expect(skills.filter((skill) => skill === 'theory').length).toBeGreaterThanOrEqual(1);
    for (const question of item!.questions) {
      expect(['interaction', 'relationship', 'theory']).toContain(question.skill);
      expect(question.prompt.trim().length).toBeGreaterThan(0);
      expect(question.explanation.trim().length).toBeGreaterThan(0);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options.map((option) => option.id)).size).toBe(4);
      expect(question.options.filter((option) => option.id === question.correctOptionId)).toHaveLength(1);
      for (const option of question.options) expect(option.text.trim().length).toBeGreaterThan(0);
    }
  }
  expect(getQuizForSimulation('chu-de-khong-ton-tai', 'understanding')).toBeUndefined();
});

test('quiz grading counts wrong, missing, invalid answers and uses all six questions as denominator', () => {
  expect(gradeQuiz(quiz, {})).toEqual({ correct: 0, answered: 0, total: 6, percentage: 0 });
  const wrong = second.options.find((option) => option.id !== second.correctOptionId)!;
  expect(gradeQuiz(quiz, { [first.id]: first.correctOptionId, [second.id]: wrong.id, [third.id]: 'invalid', extra: 'unused' })).toEqual({ correct: 1, answered: 2, total: 6, percentage: 17 });
  for (const item of quizzes) {
    const correct = Object.fromEntries(item.questions.map((question) => [question.id, question.correctOptionId]));
    const wrongAnswers = Object.fromEntries(item.questions.map((question) => [question.id, question.options.find((option) => option.id !== question.correctOptionId)!.id]));
    expect(gradeQuiz(item, correct)).toEqual({ correct: item.questions.length, answered: item.questions.length, total: item.questions.length, percentage: 100 });
    expect(gradeQuiz(item, wrongAnswers)).toEqual({ correct: 0, answered: item.questions.length, total: item.questions.length, percentage: 0 });
  }
});

test('saved progress validates fingerprint and sanitizes storage values', () => {
  expect(parseQuizProgress(null, quiz)).toBeNull();
  expect(parseQuizProgress('{broken', quiz)).toBeNull();
  expect(parseQuizProgress(JSON.stringify({ fingerprint: 'old', answers: {} }), quiz)).toBeNull();
  const parsed = parseQuizProgress(JSON.stringify({ fingerprint: quizFingerprint(quiz), answers: { [first.id]: first.correctOptionId, [second.id]: 'unknown', extra: 'x' }, flagged: [first.id, first.id, 123, 'unknown'], index: 999, submitted: 'yes' }), quiz)!;
  expect({ ...parsed.answers }).toEqual({ [first.id]: first.correctOptionId });
  expect(parsed.flagged).toEqual([first.id]);
  expect(parsed.index).toBe(quiz.questions.length - 1);
  expect(parsed.submitted).toBe(false);
  expect(parseQuizProgress(JSON.stringify({ fingerprint: quizFingerprint(quiz), answers: {}, index: -3, submitted: true }), quiz)?.index).toBe(0);
});

test('simulator CTA opens matching understanding quiz and aliases use canonical slug', async ({ page }) => {
  await page.goto(`/mo-phong/${quiz.simulationSlug}`);
  const cta = page.getByRole('region', { name: 'Kiểm tra sau mô phỏng' }).getByRole('link', { name: 'Test hiểu biết', exact: true });
  await expect(cta).toHaveAttribute('href', path);
  await cta.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByRole('heading', { level: 2, name: quiz.title, exact: true })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Thông tin bài test' })).toContainText('6 câu');
  await expect(page.getByText('Bài mẫu · Demo', { exact: true })).toHaveCount(0);
});

test('quiz library filters search, subjects and availability with honest empty states', async ({ page }) => {
  await page.goto('/trac-nghiem');
  await page.getByRole('checkbox', { name: /Có thể làm ngay/ }).check();
  const list = page.getByRole('region', { name: 'Danh sách bài trắc nghiệm' });
  await expect(page.getByRole('status')).toContainText('122 chủ đề phù hợp');
  await expect(list.getByRole('article')).toHaveCount(12);
  await expect(list.getByText('Hiểu biết', { exact: true })).toHaveCount(12);
  await expect(list.getByText('6 câu hỏi', { exact: true })).toHaveCount(12);
  await expect(list.getByText('Bài mẫu · Demo', { exact: true })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Tìm bài trắc nghiệm' }).fill('KHONG CO CHU DE');
  await expect(list.getByRole('heading', { name: 'Chưa tìm thấy bài phù hợp' })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Tìm bài trắc nghiệm' })).toHaveValue('');
  await page.getByRole('searchbox', { name: 'Tìm bài trắc nghiệm' }).fill('pendulum');
  await expect(list.getByRole('article')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Lọc bài trắc nghiệm theo môn' }).selectOption('Hóa học');
  await expect(list.getByRole('article')).toHaveCount(0);
});

test('pagination moves keyboard focus to new cards and header fits tablet widths', async ({ page }, testInfo) => {
  await page.goto('/trac-nghiem');
  const list = page.getByRole('region', { name: 'Danh sách bài trắc nghiệm' });
  await page.getByRole('navigation', { name: 'Phân trang bài trắc nghiệm' }).getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(list).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(list.getByRole('link').first()).toBeFocused();
  for (const width of [768, 900, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
  }
  await page.goto('/trac-nghiem');
  await page.screenshot({ path: testInfo.outputPath('quiz-library-desktop.png'), fullPage: true });
});

test('another catalog topic has a complete quiz; unknown topics display 404', async ({ page }) => {
  const otherQuiz = getQuizForSimulation(other.slug, 'understanding')!;
  await page.goto(`/trac-nghiem/${other.slug}`);
  await expect(page.getByRole('heading', { level: 2, name: otherQuiz.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bài test đang được chuẩn bị' })).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Thông tin bài test' })).toContainText('6 câu');
  await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
  await expect(page.getByRole('group', { name: otherQuiz.questions[0].prompt })).toBeVisible();
  await page.goto('/trac-nghiem/chu-de-khong-ton-tai');
  await expect(page.getByRole('heading', { name: 'Chưa tìm thấy trang này', exact: true })).toBeVisible();
});

test('draft answers, current question and flags survive refresh and resume; clearing works', async ({ page }, testInfo) => {
  await page.goto(path);
  await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
  await page.getByRole('radio', { name: first.options[0].text, exact: true }).check();
  await page.getByRole('button', { name: 'Đánh dấu xem lại', exact: true }).click();
  await page.getByRole('button', { name: 'Câu tiếp', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Bạn có bài đang làm dở', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục làm bài', exact: true }).click();
  await expect(page.getByRole('group', { name: second.prompt })).toBeVisible();
  await page.getByRole('button', { name: 'Câu 1, đã trả lời, đã đánh dấu', exact: true }).click();
  await expect(page.getByRole('radio', { name: first.options[0].text, exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Đã đánh dấu', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: testInfo.outputPath('quiz-question-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Bỏ lựa chọn', exact: true }).click();
  await expect(page.getByRole('radio', { name: first.options[0].text, exact: true })).not.toBeChecked();
  await expect(page.getByText('Đã trả lời 0/6 câu', { exact: true })).toBeVisible();
});

test('submission warns about unanswered questions, supports cancel, grades correctly and locks result', async ({ page }) => {
  await page.goto(path);
  await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
  await page.getByRole('radio', { name: first.options.find((option) => option.id === first.correctOptionId)!.text, exact: true }).check();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Còn 5 câu chưa trả lời');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('group', { name: first.prompt })).toBeVisible();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bạn đã hoàn thành bài test!' })).toBeVisible();
  await expect(page.getByText('1.7 / 10', { exact: true })).toBeVisible();
  await expect(page.getByText('17%', { exact: true })).toBeVisible();
  await expect(page.getByText('1/6', { exact: true })).toBeVisible();
  await expect(page.getByText(first.explanation, { exact: true })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bạn đã hoàn thành bài test!' })).toBeVisible();
  await page.getByRole('button', { name: 'Làm lại bài test', exact: true }).click();
  await dialog.getByRole('button', { name: 'Làm lại từ đầu', exact: true }).click();
  await expect(page.getByRole('group', { name: first.prompt })).toBeVisible();
  await expect(page.getByText('Đã trả lời 0/6 câu', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: first.options[0].text, exact: true })).not.toBeChecked();
});

test('all correct answers produce full marks and last-question submission works', async ({ page }) => {
  await page.goto(path);
  await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
  for (const [index, question] of quiz.questions.entries()) {
    await page.getByRole('radio', { name: question.options.find((option) => option.id === question.correctOptionId)!.text, exact: true }).check();
    if (index < quiz.questions.length - 1) await page.getByRole('button', { name: 'Câu tiếp', exact: true }).click();
  }
  await page.getByRole('region', { name: 'Câu hỏi hiện tại' }).getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await expect(page.getByText('10.0 / 10', { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
});

test('storage denied still permits answering and submitting, without false saved claim', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.goto(path);
  await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Không thể lưu');
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await expect(page.getByRole('heading', { name: 'Bạn đã hoàn thành bài test!' })).toBeVisible();
});

test('corrupted or outdated saved progress never blocks the quiz', async ({ page }) => {
  await page.goto(path);
  await page.evaluate((key) => localStorage.setItem(key, '{not-json'), quizStorageKey(quiz));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true })).toBeEnabled();
  await expect(page.getByText('Bạn có bài đang làm dở', { exact: true })).toHaveCount(0);
});

test('quiz flows fit mobile and keyboard focus stays inside submission dialog', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/trac-nghiem');
  await noOverflow(page);
  await page.goto(path);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Tiếp tục kiểm tra' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Xác nhận nộp bài' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Tiếp tục kiểm tra' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Xác nhận nộp bài' }).click();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('quiz-mobile.png'), fullPage: true });
});

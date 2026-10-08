const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const app = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(app, 'src/lib/phet-catalog.json'), 'utf8'));
const partial = process.argv.includes('--partial');
const requireComplete = process.argv.includes('--complete');
const errors = [];
const warnings = [];
const all = [];
const files = [];
for (let batch = 1; batch <= 8; batch++) {
  const file = path.join(app, `src/lib/understanding-quizzes/batch-${batch}.json`);
  if (!fs.existsSync(file)) { if (requireComplete) errors.push(`Thiếu batch-${batch}.json`); continue; }
  try {
    const quizzes = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(quizzes)) throw new Error('Nội dung phải là mảng');
    files.push({ file: `batch-${batch}.json`, quizCount: quizzes.length });
    all.push(...quizzes);
  } catch (error) { errors.push(`batch-${batch}: ${error.message}`); }
}
const slugs = new Set(catalog.map(sim => sim.slug));
const quizIds = new Set();
const seenSlugs = new Set();
const questionIds = new Set();
const prompts = new Map();
const skills = { interaction: 0, relationship: 0, theory: 0 };
const audit = [];
for (const quiz of all) {
  const fail = message => errors.push(`${quiz.simulationSlug ?? quiz.id}: ${message}`);
  if (!slugs.has(quiz.simulationSlug)) fail('Slug không thuộc danh mục 122 mô phỏng');
  if (seenSlugs.has(quiz.simulationSlug)) fail('Trùng mô phỏng');
  seenSlugs.add(quiz.simulationSlug);
  if (!quiz.id || quizIds.has(quiz.id)) fail('ID bài test trống hoặc trùng');
  quizIds.add(quiz.id);
  if (quiz.id !== `understanding-${quiz.simulationSlug}`) fail('ID không tách biệt mức hiểu biết');
  if (quiz.level !== 'understanding' || quiz.isDemo !== false) fail('Sai mức hoặc vẫn đánh dấu demo');
  if (!quiz.title?.startsWith('Bài test hiểu biết: ') || !quiz.description?.trim()) fail('Thiếu tên/mô tả riêng');
  if (!Number.isInteger(quiz.estimatedMinutes) || quiz.estimatedMinutes <= 0) fail('Thời gian không hợp lệ');
  if (!Array.isArray(quiz.sources) || !quiz.sources.some(url => /^https:\/\/phet\.colorado\.edu\/(vi|en)\/simulations\//.test(url))) fail('Thiếu nguồn mô phỏng chính thức');
  if (!Array.isArray(quiz.questions) || quiz.questions.length !== 6) { fail('Phải có đúng 6 câu'); continue; }
  const localPrompts = new Set();
  const answerPositions = new Set();
  const counts = { interaction: 0, relationship: 0, theory: 0 };
  for (const question of quiz.questions) {
    const qfail = message => fail(`${question.id}: ${message}`);
    if (!question.id || questionIds.has(question.id)) qfail('ID câu hỏi trống/trùng toàn bộ ngân hàng');
    questionIds.add(question.id);
    if (!question.prompt?.trim() || question.prompt.length < 25) qfail('Câu hỏi quá ngắn hoặc trống');
    if (!question.explanation?.trim() || question.explanation.length < 45) qfail('Giải thích thiếu cơ sở');
    if (!Object.hasOwn(counts, question.skill)) qfail('Thiếu phân loại kỹ năng');
    else { counts[question.skill]++; skills[question.skill]++; }
    const normalized = question.prompt?.toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
    if (localPrompts.has(normalized)) qfail('Trùng nội dung câu trong cùng bài');
    localPrompts.add(normalized);
    if (prompts.has(normalized)) warnings.push(`Câu trùng giữa ${prompts.get(normalized)} và ${question.id}`);
    else prompts.set(normalized, question.id);
    if (!Array.isArray(question.options) || question.options.length !== 4) { qfail('Phải có 4 phương án'); continue; }
    const ids = question.options.map(option => option.id);
    const values = question.options.map(option => option.text?.toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim());
    if (new Set(ids).size !== 4 || ids.some(id => !['a','b','c','d'].includes(id))) qfail('ID phương án không hợp lệ');
    if (values.some(value => !value) || new Set(values).size !== 4) qfail('Phương án trống hoặc trùng');
    if (!ids.includes(question.correctOptionId)) qfail('Đáp án không thuộc phương án');
    answerPositions.add(question.correctOptionId);
    if (/\b(TODO|TBD|placeholder|lorem ipsum)\b/i.test(`${question.prompt} ${question.explanation}`)) qfail('Còn nội dung chờ');
    audit.push({ slug: quiz.simulationSlug, questionId: question.id, skill: question.skill, prompt: question.prompt, correct: question.options.find(option => option.id === question.correctOptionId)?.text, explanation: question.explanation });
  }
  if (counts.interaction < 3) fail('Cần ít nhất 3 câu tương tác thực tế');
  if (counts.relationship + counts.theory < 2 || counts.theory < 1) fail('Thiếu quan hệ/lý thuyết nền');
  if (answerPositions.size < 3) fail('Vị trí đáp án đúng chưa đa dạng');
}
const missing = catalog.filter(sim => !seenSlugs.has(sim.slug)).map(sim => sim.slug);
if (requireComplete && missing.length) errors.push(`Còn thiếu ${missing.length} mô phỏng: ${missing.join(', ')}`);
if (requireComplete && all.length !== catalog.length) errors.push(`Có ${all.length}/122 bài`);

if (!partial && !errors.length) {
  const ts = require('typescript');
  const previous = require.extensions['.ts'];
  require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true } }).outputText, filename);
  try {
    const { quizzes, getQuizForSimulation, gradeQuiz } = require('../src/lib/quizzes.ts');
    assert.equal(quizzes.filter(quiz => quiz.level === 'understanding' && !quiz.isDemo).length, all.length);
    for (const entry of all) {
      const quiz = getQuizForSimulation(entry.simulationSlug, 'understanding');
      assert.ok(quiz, entry.simulationSlug);
      const answers = Object.fromEntries(quiz.questions.map(q => [q.id, q.correctOptionId]));
      assert.deepEqual(gradeQuiz(quiz,answers), { correct:6,total:6,answered:6,percentage:100 });
      assert.deepEqual(gradeQuiz(quiz,{}), { correct:0,total:6,answered:0,percentage:0 });
      const wrong = Object.fromEntries(quiz.questions.map(q => [q.id,q.options.find(option => option.id !== q.correctOptionId).id]));
      assert.equal(gradeQuiz(quiz,wrong).percentage,0);
      assert.equal(gradeQuiz(quiz,Object.fromEntries(quiz.questions.map(q => [q.id,'unknown-option']))).answered,0);
      assert.equal(getQuizForSimulation(entry.simulationSlug,'advanced'),undefined);
    }
  } catch(error) { errors.push(`Kiểm tra tích hợp/chấm điểm: ${error.message}`); }
  finally { if(previous) require.extensions['.ts']=previous; else delete require.extensions['.ts']; }
}
const report = { checkedAt:new Date().toISOString(), status: errors.length ? 'failed' : partial ? 'partial' : 'passed', expectedSimulations:122, quizCount:all.length, questionCount:all.reduce((sum,q)=>sum+(q.questions?.length??0),0), skills, files, missing, errors, warnings, coverageComplete:missing.length===0, gradingCasesChecked:!partial&&!errors.length?all.length*4:0, scope:'Hiểu biết cách tương tác, quan hệ thay đổi và lý thuyết nền; tách biệt bài nâng cao.' };
const reportFile=path.join(app,'src/lib/understanding-quiz-report.json');
if(!partial) fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
const refs=path.resolve(app,'../.tools/quiz-references');
fs.mkdirSync(refs,{recursive:true});
fs.writeFileSync(path.join(refs,'all-question-audit.json'),JSON.stringify(audit,null,2));
console.log(JSON.stringify(report,null,2));
if(errors.length) process.exitCode=1;

const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = path.resolve(__dirname, '../mapstudy-stem');
  const all = [1,5,8].flatMap(n => JSON.parse(fs.readFileSync(path.join(base, `src/lib/understanding-quizzes/batch-${n}.json`), 'utf8').replace(/^\uFEFF/,'')));
  const quiz = all.find(q => q.simulationSlug === 'gravity-force-lab-basics');
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('http://127.0.0.1:3000/trac-nghiem');
    await expect(page.getByText(`${all.length} bài hiểu biết đã hoàn thiện · 1 bài mẫu`, { exact: true })).toBeVisible();
    await page.goto(`http://127.0.0.1:3000/trac-nghiem/${quiz.simulationSlug}`);
    await page.getByRole('button', { name: 'Bắt đầu làm bài', exact: true }).click();
    for (const [index, question] of quiz.questions.entries()) {
      await page.getByRole('radio', { name: question.options.find(o => o.id === question.correctOptionId).text, exact: true }).check();
      if (index < quiz.questions.length-1) await page.getByRole('button', { name:'Câu tiếp', exact:true }).click();
    }
    await page.getByRole('region', { name:'Câu hỏi hiện tại' }).getByRole('button', { name:'Nộp bài', exact:true }).click();
    await page.getByRole('dialog').getByRole('button', { name:'Xác nhận nộp bài', exact:true }).click();
    await expect(page.getByText('10.0 / 10', { exact:true })).toBeVisible();
    await page.goto('http://127.0.0.1:3000/trac-nghiem/pendulum-lab');
    await expect(page.getByText('Bài mẫu · Demo', { exact:true })).toBeVisible();
    await page.goto('http://127.0.0.1:3000/trac-nghiem/build-an-atom');
    await expect(page.getByRole('heading', { name:'Bài test đang được chuẩn bị', exact:true })).toBeVisible();
    await page.goto('http://127.0.0.1:3000/mo-phong/waves-intro');
    const element = await page.locator('iframe.simulation-frame').elementHandle();
    const frame = await element.contentFrame();
    await frame.waitForFunction(() => window.phet?.joist?.sim?.isConstructionCompleteProperty?.value === true, null, { timeout:30000 });
    await page.setViewportSize({ width:375,height:812 });
    await page.goto('http://127.0.0.1:3000/trac-nghiem');
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-document.documentElement.clientWidth);
    if(overflow>1) throw new Error(`Mobile overflow: ${overflow}`);
    console.log(JSON.stringify({ status:'passed', completedQuizzes:all.length, completedQuestions:all.reduce((sum,q)=>sum+q.questions.length,0), productionWebsite:'http://127.0.0.1:3000', checks:['honest quiz counts','completed quiz 100% score','labeled original demo','unfinished quiz waiting state','actual PhET iframe initialized','mobile no overflow'] },null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error);process.exitCode=1; });

import { expect, test } from '@playwright/test';

import { getSimulation, normalizeSearch, simulations, subjects } from '../src/lib/simulations';

const pendulum = getSimulation('pendulum-lab')!;
const title = pendulum.title;
const detailPath = `/mo-phong/${pendulum.slug}`;
const otherSimulation = simulations.find((simulation) => simulation.slug !== pendulum.slug)!;
const physicsSimulations = simulations.filter((simulation) => (simulation.subjects ?? [simulation.subject]).includes('Vật lí'));
const languageLabel = (locale: string) => locale === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh';
const matchesQuery = (simulation: (typeof simulations)[number], query: string) =>
  normalizeSearch(`${simulation.title} ${simulation.englishTitle ?? ''} ${(simulation.subjects ?? [simulation.subject]).join(' ')} ${simulation.description}`).includes(normalizeSearch(query.trim()));

// Every test gets a fresh browser context; persistence checks deliberately use
// reload/navigation in the same context, not seeded or shared localStorage.
test('Vietnamese homepage introduces STEM and links to the library', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page).toHaveTitle(/BananaLearning/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Đừng chỉ học\.\s*Hãy khám phá\./);
  const main = page.getByRole('main');
  for (const subject of subjects.filter((subject) => subject !== 'Tất cả')) {
    const card = main.locator('.subject-card').filter({ has: page.getByRole('heading', { name: subject, exact: true }) });
    await expect(card).toBeVisible();
    const count = simulations.filter((simulation) => (simulation.subjects ?? [simulation.subject]).includes(subject)).length;
    await expect(card.getByText(`${count} mô phỏng`, { exact: true })).toBeVisible();
  }
  await expect(main.getByText(`${simulations.length} mô phỏng PhET HTML5.`, { exact: true })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'PhET Interactive Simulations · University of Colorado Boulder', exact: true })).toHaveAttribute('href', 'https://phet.colorado.edu');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'CC BY-NC 4.0', exact: true })).toBeVisible();
  await expect(main.getByRole('article')).toHaveCount(Math.min(4, simulations.length));
  await main.getByRole('link', { name: 'Khám phá mô phỏng', exact: true }).click();
  await expect(page).toHaveURL(/\/thu-vien$/);
  await expect(page.getByRole('heading', { name: 'Thư viện mô phỏng', exact: true })).toBeVisible();
});

test('library combines real subject, language, and accent-insensitive search', async ({ page }) => {
  await page.goto('/thu-vien');
  const filters = page.getByRole('complementary', { name: 'Bộ lọc mô phỏng' });
  const results = page.getByRole('region', { name: 'Danh sách mô phỏng' });
  await expect(results.getByRole('article')).toHaveCount(simulations.length);

  const physics = filters.getByRole('button', { name: /^Vật lí/ });
  await physics.click();
  await expect(physics).toHaveAttribute('aria-pressed', 'true');
  await expect(results.getByRole('article')).toHaveCount(physicsSimulations.length);
  await expect(results.getByRole('heading', { level: 3 })).toHaveText(physicsSimulations.map((simulation) => simulation.title));

  const locale = pendulum.locale!;
  const language = filters.getByRole('button', { name: languageLabel(locale), exact: true });
  await language.click();
  await expect(language).toHaveAttribute('aria-pressed', 'true');
  const localizedPhysics = physicsSimulations.filter((simulation) => simulation.locale === locale);
  await expect(results.getByRole('article')).toHaveCount(localizedPhysics.length);
  const search = page.getByRole('searchbox', { name: 'Tìm kiếm trong thư viện' });
  const query = normalizeSearch(title);
  // Exercise key-by-key editing of the URL-controlled input, not just fill.
  await search.pressSequentially(query, { delay: 120 });
  await expect(search).toHaveValue(query);
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(query);
  const matching = localizedPhysics.filter((simulation) => matchesQuery(simulation, query));
  await expect(results.getByRole('article')).toHaveCount(matching.length);
  await expect(results.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await search.fill(query.toUpperCase());
  await expect(results.getByRole('article')).toHaveCount(matching.length);
  await expect(results.getByRole('heading', { name: title, exact: true })).toBeVisible();

  const otherLocale = locale === 'vi' ? 'en' : 'vi';
  await filters.getByRole('button', { name: languageLabel(otherLocale), exact: true }).click();
  const alternate = physicsSimulations.filter((simulation) => simulation.locale === otherLocale && matchesQuery(simulation, query));
  await expect(results.getByRole('article')).toHaveCount(alternate.length);
  await expect(results.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
});

test('no-results reset clears search, subject, and language filters', async ({ page }) => {
  await page.goto('/thu-vien?mon=H%C3%B3a%20h%E1%BB%8Dc&ngonNgu=vi&q=khong-co-chu-de-nay');
  const results = page.getByRole('region', { name: 'Danh sách mô phỏng' });
  await expect(results.getByRole('heading', { name: 'Chưa tìm thấy chủ đề phù hợp' })).toBeVisible();
  await expect(results.getByRole('article')).toHaveCount(0);
  await results.getByRole('button', { name: 'Xem tất cả chủ đề', exact: true }).click();
  await expect(page).toHaveURL(/\/thu-vien$/);
  await expect(page.getByRole('searchbox', { name: 'Tìm kiếm trong thư viện' })).toHaveValue('');
  const filters = page.getByRole('complementary', { name: 'Bộ lọc mô phỏng' });
  await expect(filters.getByRole('button', { name: /^Tất cả/ })).toHaveAttribute('aria-pressed', 'true');
  for (const language of ['Tiếng Việt', 'Tiếng Anh']) {
    await expect(filters.getByRole('button', { name: language, exact: true })).toHaveAttribute('aria-pressed', 'false');
  }
  await expect(results.getByRole('article')).toHaveCount(simulations.length);
});

test('saving a favorite persists across reload and appears in saved-only library', async ({ page }) => {
  await page.goto('/thu-vien');
  const results = page.getByRole('region', { name: 'Danh sách mô phỏng' });
  await results.getByRole('button', { name: `Lưu ${title}`, exact: true }).click();
  await expect(results.getByRole('button', { name: `Bỏ lưu ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(results.getByRole('button', { name: `Bỏ lưu ${title}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('complementary', { name: 'Bộ lọc mô phỏng' }).getByRole('button', { name: /^Đã lưu/ }).click();
  await expect(results.getByRole('article')).toHaveCount(1);
  await results.getByRole('link', { name: title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${detailPath}$`));
  await expect(page.getByRole('button', { name: 'Đã lưu chủ đề', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Đã lưu chủ đề', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Lưu chủ đề', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/thu-vien?daLuu=1');
  await expect(results.getByRole('heading', { name: 'Chưa có mô phỏng phù hợp đã lưu' })).toBeVisible();
});

test('detail notes persist after reload and stay specific to their topic', async ({ page }) => {
  await page.goto(detailPath);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await page.getByRole('tab', { name: 'Ghi chú', exact: true }).click();
  const notes = page.getByRole('textbox', { name: 'Ghi chú khám phá' });
  await expect(notes).toBeEnabled();
  const text = 'Mình dự đoán chu kì tăng khi dây dài hơn.\nCần kiểm tra bằng thực nghiệm.';
  await notes.fill(text);
  await expect(page.getByRole('status')).toHaveText('Tự động lưu trên trình duyệt này.');
  await page.reload();
  await page.getByRole('tab', { name: 'Ghi chú', exact: true }).click();
  await expect(notes).toHaveValue(text);
  await page.goto(`/mo-phong/${otherSimulation.slug}`);
  await page.getByRole('tab', { name: 'Ghi chú', exact: true }).click();
  await expect(notes).toBeEnabled();
  await expect(notes).toHaveValue('');
  await page.goto(detailPath);
  await page.getByRole('tab', { name: 'Ghi chú', exact: true }).click();
  await expect(notes).toHaveValue(text);
});

test('inline HTML upload runs interactive JavaScript in an isolated sandbox and can be removed', async ({ page }) => {
  await page.goto(detailPath);
  const iframe = page.getByTitle(`Mô phỏng ${title}`, { exact: true });
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute('src', pendulum.embedSrc!);
  await expect(page.getByRole('button', { name: 'Tải lại khung mô phỏng' })).toBeEnabled();
  await expect(page.getByRole('main').getByRole('link', { name: 'PhET Interactive Simulations, University of Colorado Boulder', exact: true })).toBeVisible();
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Fixture</title>
    <body><h1>Thí nghiệm tương tác</h1><button type="button" id="increment">Tăng số lần thử</button>
    <p role="status" id="count">Số lần thử: 0</p><p id="isolation"></p>
    <script>
      let count = 0;
      document.getElementById('increment').onclick = () => {
        document.getElementById('count').textContent = 'Số lần thử: ' + (++count);
      };
      let parentBlocked = false, storageBlocked = false;
      try { void parent.document.body; } catch { parentBlocked = true; }
      try { localStorage.setItem('fixture-should-not-write', '1'); } catch { storageBlocked = true; }
      document.getElementById('isolation').textContent =
        parentBlocked && storageBlocked ? 'Trang cha và bộ nhớ được bảo vệ' : 'Cách ly thất bại';
    </script></body></html>`;
  await page.getByLabel('Chọn tệp HTML mô phỏng', { exact: true }).setInputFiles({
    name: 'interactive-fixture.html',
    mimeType: 'text/html',
    buffer: Buffer.from(html, 'utf8'),
  });
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute('src', /^blob:/);
  await expect(iframe).toHaveAttribute('title', `Mô phỏng ${title}`);
  await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-pointer-lock');
  const fixture = page.frameLocator(`iframe[title="Mô phỏng ${title}"]`);
  await expect(fixture.getByRole('heading', { name: 'Thí nghiệm tương tác' })).toBeVisible();
  await expect(fixture.getByText('Trang cha và bộ nhớ được bảo vệ', { exact: true })).toBeVisible();
  await fixture.getByRole('button', { name: 'Tăng số lần thử', exact: true }).click();
  await expect(fixture.getByRole('status')).toHaveText('Số lần thử: 1');
  await expect(page.getByText('Đang thử: interactive-fixture.html', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Gỡ tệp', exact: true }).click();
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute('src', pendulum.embedSrc!);
  await expect(page.getByText('Đang thử: interactive-fixture.html', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tải lại khung mô phỏng' })).toBeEnabled();
});

test('guide FAQ expands and collapses answers', async ({ page }) => {
  await page.goto('/huong-dan');
  await expect(page.getByRole('heading', { level: 1, name: 'Hướng dẫn sử dụng' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mở PhET có sẵn hoặc thử tệp riêng', exact: true })).toBeVisible();
  const question = page.getByText('Có cần tạo tài khoản không?', { exact: true });
  const answer = page.getByText('Không. Website không có đăng nhập hoặc cơ sở dữ liệu. Bạn có thể mở thư viện và sử dụng mô phỏng ngay.', { exact: true });
  await expect(answer).toBeHidden();
  await question.click();
  await expect(answer).toBeVisible();
  await question.click();
  await expect(answer).toBeHidden();
  await page.getByText('Ghi chú và chủ đề đã lưu nằm ở đâu?', { exact: true }).click();
  await expect(page.getByText(/^Chúng nằm trong localStorage của trình duyệt này/)).toBeVisible();
});

test('unknown simulation displays the 404 page and offers recovery', async ({ page }) => {
  // Next may stream a notFound boundary with HTTP 200; verify the explicit 404 UI.
  await page.goto('/mo-phong/chu-de-khong-ton-tai');
  await expect(page.getByRole('heading', { level: 1, name: 'Chưa tìm thấy trang này' })).toBeVisible();
  await expect(page.getByText('404 · LẠC KHỎI QUỸ ĐẠO MỘT CHÚT', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Về thư viện mô phỏng', exact: true }).click();
  await expect(page).toHaveURL(/\/thu-vien$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Thư viện mô phỏng' })).toBeVisible();
});

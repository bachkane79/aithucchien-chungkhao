import { expect, test, type Page } from '@playwright/test';
import { getSimulation, simulations } from '../src/lib/simulations';

const pendulum = getSimulation('pendulum-lab')!;
const detailPath = `/mo-phong/${pendulum.slug}`;

test.use({ viewport: { width: 375, height: 812 } });

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - width;
  }), { message: 'The page must fit the 375px viewport without horizontal scrolling' }).toBeLessThanOrEqual(1);
}

test('375px mobile menu opens, navigates, and closes', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Điều hướng chính' });
  const open = page.getByRole('button', { name: 'Mở menu', exact: true });
  await expect(open).toBeVisible();
  await expect(open).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await open.click();
  const close = page.getByRole('button', { name: 'Đóng menu', exact: true });
  await expect(close).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await navigation.getByRole('link', { name: 'Thư viện mô phỏng', exact: true }).click();
  await expect(page).toHaveURL(/\/thu-vien$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Thư viện mô phỏng' })).toBeVisible();
  await expect(open).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await open.click();
  await close.click();
  await expect(navigation).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test('major pages and expanded content have no horizontal overflow at 375px', async ({ page }) => {
  test.setTimeout(60_000);
  const routes = [
    { path: '/', heading: /Đừng chỉ học/ },
    { path: '/thu-vien', heading: 'Thư viện mô phỏng' },
    { path: detailPath, heading: pendulum.title },
    { path: '/huong-dan', heading: 'Hướng dẫn sử dụng' },
    { path: '/gioi-thieu', heading: /Mở một góc nhìn mới/ },
    { path: '/mo-phong/chu-de-khong-ton-tai', heading: 'Chưa tìm thấy trang này' },
  ];
  for (const route of routes) {
    await test.step(route.path, async () => {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (route.path === '/thu-vien') {
        await expect(page.getByRole('region', { name: 'Danh sách mô phỏng' }).getByRole('article')).toHaveCount(simulations.length);
      }
      if (route.path === '/huong-dan') {
        await page.getByText('Tại sao mô phỏng hoặc HTML thử không hiển thị đúng?', { exact: true }).click();
      }
      if (route.path === detailPath) {
        await expect(page.getByTitle(`Mô phỏng ${pendulum.title}`, { exact: true })).toHaveAttribute('src', pendulum.embedSrc!);
        await page.getByRole('tab', { name: 'Ghi chú', exact: true }).click();
        const notes = page.getByRole('textbox', { name: 'Ghi chú khám phá' });
        await expect(notes).toBeEnabled();
        await notes.fill('Quan sát trên điện thoại: ' + 'chukidaodong'.repeat(20));
      }
      await expectNoHorizontalOverflow(page);
    });
  }
});

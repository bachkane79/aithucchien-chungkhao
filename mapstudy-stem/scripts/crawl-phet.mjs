#!/usr/bin/env node
/**
 * Reproduce the exact official HTML5 filter membership (all subjects), then download
 * only official standalone HTML5 builds. No Java, Flash, arbitrary HTML mirrors,
 * guessed Vietnamese titles or school-grade assignments. Requires root Playwright
 * installation and Edge. Usage: node scripts/crawl-phet.mjs --discover-only
 *                          node scripts/crawl-phet.mjs --download-existing
 *                          node scripts/crawl-phet.mjs
 *                          node scripts/crawl-phet.mjs --verify-only --smoke-test
 * Downloads run at five concurrent requests; validated existing files are reused.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'src/lib/phet-catalog.json');
const reportPath = path.join(root, 'src/lib/phet-download-report.json');
const filterUrl = 'https://phet.colorado.edu/en/simulations/filter?type=html';
const metadataUrl = 'https://phet.colorado.edu/services/metadata/1.3/simulations?format=json&summary&includePrototypes';
// Verified against official website-common SUBJECT_ID_TO_KEY exported in its bundle.
const subjectIdToKey = { 4: 'physics', 5: 'motion', 6: 'sound-and-waves', 7: 'work-energy-and-power', 8: 'heat-and-thermodynamics', 9: 'quantum-phenomena', 10: 'light-and-radiation', 11: 'electricity-magnets-and-circuits', 12: 'biology', 13: 'chemistry', 14: 'earth-and-space', 15: 'math-and-statistics', 19: 'general', 20: 'quantum', 30: 'mathconcepts', 31: 'mathapplications' };
const topSubjectLabels = { 4: 'Vật lí', 12: 'Sinh học', 13: 'Hóa học', 14: 'Khoa học Trái Đất', 15: 'Toán học' };
const officialLicense = {
  name: 'CC BY-NC 4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/',
  source: 'https://phet.colorado.edu/en/licensing', verifiedAt: '2026-10-08',
  attribution: 'Simulation by PhET Interactive Simulations, University of Colorado Boulder, licensed under CC BY-NC 4.0 (https://phet.colorado.edu).',
  attributionVi: 'Mô phỏng bởi PhET Interactive Simulations, University of Colorado Boulder, được cấp phép theo CC BY-NC 4.0 (https://phet.colorado.edu).',
  preserveEmbeddedNotices: true, preserveUnobstructedLogo: true,
  commercialUseRequiresSeparateLicense: true
};
function enrich(item) {
  const ids = item.sourceClassifications.subjectIds;
  item.subjects = ids.filter(id => topSubjectLabels[id]).map(id => topSubjectLabels[id]);
  item.sourceClassifications.subjectKeys = ids.map(id => subjectIdToKey[id] || `unknown-${id}`);
  item.sourceClassifications.gradeLevelKeys = ['elementary-school', 'middle-school', 'high-school', 'university'].slice(item.sourceClassifications.lowGradeLevel, item.sourceClassifications.highGradeLevel + 1);
  item.license = officialLicense;
  return item;
}
const concurrency = 5;
const args = new Set(process.argv.slice(2));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const save = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
};
const hash = data => createHash('sha256').update(data).digest('hex');
const decode = buffer => buffer.toString('utf8');
function validateHtml(buffer, slug, locale = 'vi') {
  const text = decode(buffer);
  const tests = {
    substantial: buffer.length > 100000,
    htmlDocument: /<!doctype html/i.test(text) && /<html[\s>]/i.test(text),
    embeddedRuntime: /phet\.chipper|phet\[\s*['"]chipper|chipper\.queryParameters/.test(text),
    simulationIdentity: text.includes(`/sims/html/${slug}/latest/${slug}_${locale}.html`),
    declaredLocale: new RegExp(`<html[^>]*lang=["']${locale}["']`, 'i').test(text),
    simulationMetadata: /property=["']og:type["']\s+content=["']phet:simulation["']/i.test(text),
    attributionNotice: /PhET Interactive Simulations, University of Colorado Boulder/.test(text),
    embeddedScripts: /<script[\s>]/i.test(text),
    completeDocument: /<\/html>\s*$/i.test(text),
    notError: !/^\s*(?:<!doctype[^>]*>\s*)?<html[^>]*>[\s\S]{0,10000}<title>\s*(?:404|403|500|Error|Just a moment)/i.test(text)
  };
  return { valid: Object.values(tests).every(Boolean), tests };
}
async function pool(items, fn) {
  let index = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < items.length) await fn(items[index++]);
  }));
}

let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  let catalog, report;
  if (args.has('--download-existing') || args.has('--verify-only')) {
    catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    report = JSON.parse(await readFile(reportPath, 'utf8'));
    catalog = catalog.map(enrich);
    report.license = officialLicense;
    report.classificationIdToKey = subjectIdToKey;
    report.classificationSource = 'Official website-common SUBJECT_ID_TO_KEY and GradeLevel exports, verified from https://phet.colorado.edu/_m/1d739099de90a822efeb3d1f3b47c312e655adf1.js?meteor_js_resource=true';
    await save(catalogPath, catalog);
    await save(reportPath, report);
    console.log('CATALOG_READY', JSON.stringify({ count: catalog.length, locales: report.localeCounts }));
  } else {
    const page = await context.newPage();
    const metadataResponse = page.waitForResponse(r => r.url() === metadataUrl && r.ok(), { timeout: 90000 });
    await page.goto(filterUrl, { waitUntil: 'networkidle', timeout: 90000 });
    const metadata = await (await metadataResponse).json();
    const memberSlugs = await page.locator('a[href]').evaluateAll(links => [...new Set(links
      .map(a => a.getAttribute('href'))
      .filter(h => /^\/en\/simulations\/[a-z0-9-]+$/.test(h) && !h.endsWith('/filter'))
      .map(h => h.split('/').pop()))]);
    if (!memberSlugs.length) throw new Error('Official filtered listing returned no members');
    const htmlSimulations = metadata.projects.filter(p => p.type === 2 && p.name.startsWith('html/'))
      .flatMap(project => project.simulations.map(sim => ({ project, sim })));
    // Membership is determined by rendered exact-filter listing, NOT all projects.
    const missing = memberSlugs.filter(slug => !htmlSimulations.some(x => x.sim.name === slug));
    if (missing.length) throw new Error('Listing members unmatched in HTML metadata: ' + missing.join(','));
    const license = officialLicense;
    catalog = memberSlugs.map(slug => {
      const { project, sim } = htmlSimulations.find(x => x.sim.name === slug);
      const locale = sim.localizedSimulations.vi ? 'vi' : 'en';
      const expand = template => template.replaceAll('{{project-name}}', project.name).replaceAll('{{sim-name}}', slug).replaceAll('{{locale}}', locale);
      const base = `/simulators/phet/${slug}`;
      return {
        slug, title: sim.localizedSimulations[locale].title,
        englishTitle: sim.localizedSimulations.en.title,
        subjects: [],
        sourceClassifications: { subjectIds: sim.subjects, lowGradeLevel: sim.lowGradeLevel, highGradeLevel: sim.highGradeLevel },
        gradeLevels: ['Elementary School', 'Middle School', 'High School', 'University'].slice(sim.lowGradeLevel, sim.highGradeLevel + 1),
        sourcePage: `https://phet.colorado.edu/en/simulations/${slug}`,
        localizedSourcePage: `https://phet.colorado.edu/${locale}/simulations/${slug}`,
        downloadUrl: 'https://' + metadata.common.baseUrl + expand(metadata.common.html.runUrl) + '?download',
        locale, thumbnail: `${base}/thumbnail.png`,
        thumbnailSource: 'https://' + metadata.common.baseUrl + expand(metadata.common.html.thumbnailUrl),
        embedSrc: `${base}/index.html`, license,
        sourceMetadata: { projectId: project.id, simulationId: sim.id, projectType: project.type, isPrototype: sim.isPrototype, isCommunity: sim.isCommunity, projectName: project.name, version: project.version }
      };
    });
    report = {
      sourceFilter: filterUrl, metadataUrl, discoveredAt: new Date().toISOString(),
      discoveryMethod: 'Rendered exact official filter DOM membership matched to metadata projects type=2 and html/ prefix',
      exactHtml5Membership: memberSlugs, discoveredCount: catalog.length,
      metadataHtmlProjectCount: metadata.projects.filter(p => p.type === 2).length,
      excludedProjectTypes: { java: metadata.projects.filter(p => p.type === 0).length, flash: metadata.projects.filter(p => p.type === 1).length },
      metadataSchema: { root: ['common', 'projects'], project: ['id', 'name', 'type', 'version', 'simulations'], simulation: ['id', 'name', 'subjects', 'lowGradeLevel', 'highGradeLevel', 'localizedSimulations'], htmlProjectType: 2, runUrlTemplate: metadata.common.html.runUrl },
      localeCounts: { vi: catalog.filter(x => x.locale === 'vi').length, en: catalog.filter(x => x.locale === 'en').length },
      concurrency, license, status: 'discovered', results: [], failures: []
    };
    catalog = catalog.map(enrich);
    report.license = officialLicense;
    report.classificationIdToKey = subjectIdToKey;
    report.classificationSource = 'Official website-common SUBJECT_ID_TO_KEY and GradeLevel exports, verified from https://phet.colorado.edu/_m/1d739099de90a822efeb3d1f3b47c312e655adf1.js?meteor_js_resource=true';
    await save(catalogPath, catalog);
    await save(reportPath, report);
    console.log('DISCOVERY_READY', JSON.stringify({ count: catalog.length, locales: report.localeCounts, catalogPath, reportPath }));
    await page.close();
  }
  if (args.has('--verify-only')) {
    const validations = [];
    for (const item of catalog) {
      const file = path.join(root, 'public/simulators/phet', item.slug, 'index.html');
      try {
        const buffer = await readFile(file);
        const validation = validateHtml(buffer, item.slug, item.locale);
        const result = report.results.find(x => x.slug === item.slug);
        const sha256 = hash(buffer);
        const png = await readFile(path.join(root, 'public/simulators/phet', item.slug, 'thumbnail.png'));
        const pngValid = png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
        const hashMatchesDownload = sha256 === result?.sha256;
        if (result) result.validation = validation;
        validations.push({ slug: item.slug, valid: validation.valid && pngValid && hashMatchesDownload, tests: validation.tests, pngValid, hashMatchesDownload, bytes: buffer.length, sha256 });
      } catch (error) { validations.push({ slug: item.slug, valid: false, error: error.message }); }
    }
    report.diskVerification = { verifiedAt: new Date().toISOString(), checkedCount: validations.length, validCount: validations.filter(x => x.valid).length, invalid: validations.filter(x => !x.valid), checks: ['simulationIdentity', 'declaredLocale', 'simulationMetadata', 'embeddedRuntime', 'substantial', 'completeDocument', 'attributionNotice', 'PNG signature', 'SHA256 matches download'] };
    if (args.has('--smoke-test')) {
      report.runtimeSmokeTests = [];
      for (const slug of ['membrane-transport', 'quantum-wave-interference', 'buoyancy-basics', 'generator', 'number-pairs']) {
        const page = await context.newPage();
        const errors = [];
        const blockedRequests = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route(/^https?:/, route => { blockedRequests.push(route.request().url()); return route.abort(); });
        const test = { slug, networkBlocked: true };
        try {
          const absoluteFile = path.join(root, 'public/simulators/phet', slug, 'index.html');
          const fileUrl = new URL('file:///' + absoluteFile.replaceAll('\\', '/')).href;
          await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
          await page.waitForFunction(() => window.phet?.joist?.sim?.isConstructionCompleteProperty?.value === true, { timeout: 30000 });
          test.state = await page.evaluate(() => ({ locale: document.documentElement.lang, project: window.phet.chipper.project, constructionComplete: window.phet.joist.sim.isConstructionCompleteProperty.value, canvasCount: document.querySelectorAll('canvas').length, svgCount: document.querySelectorAll('svg').length }));
          test.title = await page.title();
          test.passed = errors.length === 0;
        } catch (error) { test.passed = false; test.error = error.message; }
        test.pageErrors = errors;
        test.blockedRequests = blockedRequests;
        report.runtimeSmokeTests.push(test);
        await page.close();
      }
    }
    await save(reportPath, report);
    console.log('VERIFIED', JSON.stringify(report.diskVerification));
    if (report.runtimeSmokeTests) console.log('SMOKE_TESTS', JSON.stringify(report.runtimeSmokeTests));
    if (validations.some(x => !x.valid) || report.runtimeSmokeTests?.some(x => !x.passed)) process.exitCode = 1;
  } else if (args.has('--discover-only')) {
    console.log('Discovery-only completed; no simulation HTML downloaded.');
  } else {
    report.status = 'downloading';
    report.downloadStartedAt = new Date().toISOString();
    await save(reportPath, report);
    const priorResults = new Map(report.results.map(x => [x.slug, x]));
    report.results = [];
    async function get(url) {
      if (!/^https:\/\/phet\.colorado\.edu\/sims\/html\/[a-z0-9-]+\/latest\/[a-z0-9-]+(?:_(?:vi|en)\.html\?download|-128\.png)$/.test(url)) throw new Error('Refused URL outside authoritative HTML5 standalone/thumbnail patterns: ' + url);
      let last;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await context.request.get(url, { timeout: 120000 });
          const status = response.status();
          if (!response.ok()) {
            await response.dispose();
            if (status === 404) throw Object.assign(new Error('HTTP 404'), { permanent: true });
            throw new Error('HTTP ' + status);
          }
          const body = await response.body();
          const finalUrl = response.url();
          await response.dispose();
          if (!finalUrl.startsWith('https://phet.colorado.edu/sims/html/')) throw new Error('Unexpected redirect: ' + finalUrl);
          return body;
        } catch (error) {
          last = error;
          if (error.permanent || attempt === 3) break;
          await sleep(1000 * attempt);
        }
      }
      throw last;
    }
    await pool(catalog, async item => {
      const dir = path.join(root, 'public/simulators/phet', item.slug);
      const file = path.join(dir, 'index.html');
      const result = { slug: item.slug, locale: item.locale, downloadUrl: item.downloadUrl, status: 'failed' };
      try {
        let html;
        try {
          const existing = await readFile(file);
          if (validateHtml(existing, item.slug, item.locale).valid) { html = existing; result.reused = true; }
        } catch {}
        if (!html) html = await get(item.downloadUrl);
        result.validation = validateHtml(html, item.slug, item.locale);
        if (!result.validation.valid) throw new Error('Response failed simulation HTML validation: ' + JSON.stringify(result.validation.tests));
        await mkdir(dir, { recursive: true });
        if (!result.reused) await writeFile(file, html);
        result.bytes = html.length;
        result.sha256 = hash(html);
        result.licenseNoticePresent = /creativecommons|Creative Commons|LICENSE/i.test(decode(html));
        result.status = 'downloaded';
        try {
          const thumbnailPath = path.join(dir, 'thumbnail.png');
          let png;
          try { const existing = await readFile(thumbnailPath); if (existing.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) png = existing; } catch {}
          if (!png) png = await get(item.thumbnailSource);
          if (!png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('Thumbnail is not a PNG');
          await writeFile(thumbnailPath, png);
          result.thumbnailStatus = 'downloaded';
          result.thumbnailBytes = png.length;
        } catch (error) { result.thumbnailStatus = 'failed'; result.thumbnailError = error.message; }
      } catch (error) { result.error = error.message; }
      report.results.push(result);
      console.log(`[${report.results.length}/${catalog.length}] ${item.slug}: ${result.status}${result.error ? ' ' + result.error : ' ' + result.bytes + ' bytes'}`);
      // At most one request per worker, including thumbnails; five total globally.
      await sleep(100);
      if (report.results.length % 10 === 0) await save(reportPath, report);
    });
    report.results.sort((a, b) => catalog.findIndex(x => x.slug === a.slug) - catalog.findIndex(x => x.slug === b.slug));
    report.failures = report.results.filter(x => x.status !== 'downloaded');
    report.downloadedCount = report.results.filter(x => x.status === 'downloaded').length;
    report.thumbnailCount = report.results.filter(x => x.thumbnailStatus === 'downloaded').length;
    report.totalHtmlBytes = report.results.reduce((n, x) => n + (x.bytes || 0), 0);
    report.completedAt = new Date().toISOString();
    report.status = report.failures.length ? 'completed-with-failures' : 'completed';
    await save(catalogPath, catalog);
    await save(reportPath, report);
    console.log('COMPLETE', JSON.stringify({ discovered: report.discoveredCount, downloaded: report.downloadedCount, thumbnails: report.thumbnailCount, bytes: report.totalHtmlBytes, failures: report.failures }));
    if (report.failures.length) process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
}

#!/usr/bin/env node
// Extract DeFiPunk'd protocol data via Playwright DOM scraping.
// Usage: node extract-defipunkd.mjs morpho [maker spark compound-v3 ethena ...]
import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('usage: extract-defipunkd.mjs <slug1> [slug2 ...]');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
});
const page = await ctx.newPage();

const out = {};
for (const slug of slugs) {
  const url = `https://defipunkd.com/protocol/${slug}`;
  console.error(`→ ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('main.detail', { timeout: 10000 });
    const data = await page.evaluate(() => {
      const txt = (el) => (el?.textContent || '').trim().replace(/\s+/g, ' ');
      const attr = (el, a) => el?.getAttribute(a) || null;

      // Header
      const name = txt(document.querySelector('header.head h1'));
      const subtitle = txt(document.querySelector('header.head .subtitle'));

      // Deployment tabs: name, slug, category, tvl, tier, grades
      const tabs = Array.from(document.querySelectorAll('astro-island[component-url*="DeploymentTabs"]')).flatMap((el) => {
        try {
          const props = JSON.parse(el.getAttribute('props') || '{}');
          const decode = (v) => {
            if (!Array.isArray(v)) return v;
            const [kind, val] = v;
            if (kind === 0) return Object.fromEntries(Object.entries(val).map(([k, vv]) => [k, decode(vv)]));
            if (kind === 1) return val.map(decode);
            return val;
          };
          const deployments = decode(props.deployments);
          return deployments || [];
        } catch { return []; }
      });

      // Per-deployment panels
      const panels = Array.from(document.querySelectorAll('.deployment-panel')).map((p) => {
        const dslug = p.getAttribute('data-slug');
        const tvl = txt(p.querySelector('.top-item.tvl .v'));
        const type = txt(p.querySelectorAll('.top-item .v')[1]);
        const chain = txt(p.querySelector('.top-item.chains .v'));
        const defillama = attr(p.querySelector('.defillama-link'), 'href');
        const about = txt(p.querySelector('.about .body'));
        const tier = txt(p.querySelector('.tier-row .tier-chip'));
        const defiscan = {
          stage: txt(p.querySelector('.defiscan-chip')),
          url: attr(p.querySelector('.defiscan-matrix .row-link'), 'href'),
        };
        const grades = Array.from(p.querySelectorAll('.risk-matrix-stack ul.risk-matrix li[data-slice-row]')).map((row) => {
          const dim = row.getAttribute('data-slice-row');
          const cls = Array.from(row.classList).find((c) => c.startsWith('grade-')) || '';
          const grade = cls.replace('grade-', '') || 'unknown';
          const chip = txt(row.querySelector('.chip'));
          const headline = txt(row.querySelector('.headline'));
          return { dim, grade, status: chip, headline };
        });
        // Risk analysis verdicts
        const verdicts = Array.from(p.querySelectorAll('section.risk-analysis ol.cards > li.card')).map((card) => {
          const id = card.id;
          const label = txt(card.querySelector('.label'));
          const cls = Array.from(card.classList).find((c) => c.startsWith('grade-')) || '';
          const grade = cls.replace('grade-', '') || 'unknown';
          const headline = txt(card.querySelector('.headline'));
          const verdict = txt(card.querySelector('.verdict'));
          const steelman = txt(card.querySelector('.steelman-text'));
          const findings = Array.from(card.querySelectorAll('dl.findings .finding')).map((f) => ({
            code: txt(f.querySelector('dt')),
            text: txt(f.querySelector('dd')),
          }));
          return { id, label, grade, headline, verdict, steelman, findings };
        });
        // Control criteria pills
        const pills = Object.fromEntries(
          Array.from(p.querySelectorAll('.about-row .control .pill')).map((pill) => {
            const lines = pill.innerText.trim().split('\n').map((s) => s.trim()).filter(Boolean);
            const key = lines[0] || '';
            const link = pill.querySelector('a');
            const val = link ? link.href : (lines.slice(1).join(' ') || null);
            return [key, val];
          })
        );
        return { slug: dslug, tvl, type, chain, defillama, about, tier, defiscan, grades, verdicts, pills };
      });

      // Reference section (Protocol Info)
      const ref = {};
      document.querySelectorAll('section.reference-section .group').forEach((g) => {
        const groupName = txt(g.querySelector('.group-head h3'));
        const fields = {};
        g.querySelectorAll('.field').forEach((f) => {
          const k = txt(f.querySelector('dt'));
          const dd = f.querySelector('dd');
          // collect any link list
          const links = Array.from(dd.querySelectorAll('a')).map((a) => ({ text: txt(a), href: a.href }));
          const v = links.length ? links : txt(dd);
          fields[k] = v;
        });
        ref[groupName] = fields;
      });

      // Audits
      const audits = Array.from(document.querySelectorAll('ul.bare.audits li')).map((li) => {
        const a = li.querySelector('a');
        const meta = Array.from(li.querySelectorAll('.muted')).map(txt);
        return { firm: txt(a), url: a?.href, meta };
      });

      return { name, subtitle, deployments: tabs, panels, reference: ref, audits };
    });
    out[slug] = data;
    console.error(`  ✓ ${data.name} — ${data.panels.length} deployments, ${data.audits.length} audits`);
  } catch (e) {
    console.error(`  ✗ ${e.message}`);
    out[slug] = { error: e.message };
  }
}

await browser.close();
console.log(JSON.stringify(out, null, 2));

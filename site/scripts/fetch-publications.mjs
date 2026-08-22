import { writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/data/publications.cache.json';
const ORCID = '0009-0003-3450-5728';

try {
  const res = await fetch(`https://pub.orcid.org/v3.0/${ORCID}/works`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`ORCID API ${res.status}`);
  const data = await res.json();
  const works = (data.group ?? []).map((g) => {
    const w = g['work-summary'][0];
    const ext = (w['external-ids']?.['external-id'] ?? [])[0] ?? {};
    return {
      title: w.title?.title?.value ?? '',
      type: w.type ?? '',
      year: w['publication-date']?.year?.value ?? '',
      venue: w['journal-title']?.value ?? '',
      doi: ext['external-id-type'] === 'doi' ? ext['external-id-value'] : null,
      url: w.url?.value ?? null,
    };
  });
  writeFileSync(OUT, JSON.stringify(works, null, 2) + '\n');
  console.log(`cached ${works.length} publications`);
} catch (e) {
  if (!existsSync(OUT)) {
    console.error('ORCID API failed and no cache exists:', e.message);
    process.exit(1);
  }
  console.warn('ORCID API failed; keeping existing cache:', e.message);
}

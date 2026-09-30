// Builds src/data/villages.json from Georgian Wikipedia (village categories + coordinates +
// Dusheti community lists). Run manually when the list needs refreshing: npm run villages
import fs from 'node:fs';

const UA = { 'User-Agent': 'nbnetworks.ge data script (lnugzar@gmail.com)' };
const API = 'https://ka.wikipedia.org/w/api.php';

const MUNICIPALITIES = [
  { key: 'dusheti', name: 'დუშეთი', gen: 'დუშეთის', cat: 'დუშეთის მუნიციპალიტეტის სოფლები', page: 'დუშეთის მუნიციპალიტეტი' },
  { key: 'tianeti', name: 'თიანეთი', gen: 'თიანეთის', cat: 'თიანეთის მუნიციპალიტეტის სოფლები' },
  { key: 'mtskheta', name: 'მცხეთა', gen: 'მცხეთის', cat: 'მცხეთის მუნიციპალიტეტის სოფლები' },
  { key: 'kazbegi', name: 'ყაზბეგი', gen: 'ყაზბეგის', cat: 'ყაზბეგის მუნიციპალიტეტის სოფლები' },
];

// Towns / daba that are not in the village categories.
const EXTRA = {
  dusheti: [['დუშეთი', 'დუშეთი', 'town'], ['ჟინვალი', 'ჟინვალი', 'daba'], ['ფასანაური', 'ფასანაური', 'daba']],
  tianeti: [['თიანეთი', 'თიანეთი', 'daba'], ['სიონი', 'სიონი (დაბა)', 'daba']],
  mtskheta: [['მცხეთა', 'მცხეთა', 'town']],
  kazbegi: [['სტეფანწმინდა', 'სტეფანწმინდა', 'daba']],
};

const get = async (params) => {
  const url = `${API}?format=json&formatversion=2&${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const clean = (title) => title.replace(/\s*\(.*\)\s*$/, '').trim();

async function categoryPages(cat) {
  const out = [];
  let cont;
  do {
    const j = await get({ action: 'query', list: 'categorymembers', cmtitle: `კატეგორია:${cat}`, cmlimit: '500', cmtype: 'page', ...(cont ? { cmcontinue: cont } : {}) });
    out.push(...j.query.categorymembers.map((m) => m.title));
    cont = j.continue?.cmcontinue;
  } while (cont);
  return out.filter((t) => !t.includes('სია'));
}

// kawiki has no GeoData, so resolve each page to its Wikidata item and read P625.
async function coordinates(titles) {
  const qid = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const j = await get({ action: 'query', prop: 'pageprops', ppprop: 'wikibase_item', redirects: '1', titles: titles.slice(i, i + 50).join('|') });
    const redirects = new Map((j.query.redirects ?? []).map((r) => [r.to, r.from]));
    for (const p of j.query.pages) {
      const id = p.pageprops?.wikibase_item;
      if (id) qid.set(id, redirects.get(p.title) ?? p.title);
    }
  }
  const map = new Map();
  const ids = [...qid.keys()];
  for (let i = 0; i < ids.length; i += 50) {
    const url = `https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&props=claims&ids=${ids.slice(i, i + 50).join('|')}`;
    const w = await (await fetch(url, { headers: UA })).json();
    for (const [id, e] of Object.entries(w.entities)) {
      const c = e.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (c) map.set(qid.get(id), [+c.latitude.toFixed(5), +c.longitude.toFixed(5)]);
    }
  }
  return map;
}

// Dusheti page lists villages per community ("# *X-ის თემში - a, b, c.").
async function dushetiCommunities() {
  const res = await fetch(`https://ka.wikipedia.org/w/index.php?action=raw&title=${encodeURIComponent('დუშეთის მუნიციპალიტეტი')}`, { headers: UA });
  const raw = await res.text();
  const byVillage = new Map();
  for (const line of raw.split('\n')) {
    const m = /^#\s*\*\s*(.+?თემ\S*)(.*)$/.exec(line);
    if (!m) continue;
    const head = m[1].replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1');
    // "ჟინვალის თემის შემადგენლობაში" -> "ჟინვალის თემი"
    const community = `${head.split(/თემ/)[0].trim()} თემი`;
    const list = (m[2].split(/:|\s[-–]\s/).slice(1).join(':') || m[2])
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
      .replace(/\d+\s*სოფელი/g, '')
      .split(/[,.;]/)
      .map((s) => s.replace(/^.*სოფლები\s*/, '').trim())
      .filter((s) => s && !/შემადგენლობ|შედის|გაერთიანებ|დაბა/.test(s));
    for (const v of list) if (!byVillage.has(v)) byVillage.set(v, community);
  }
  return byVillage;
}

const TR = { ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i', კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's', ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts', ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h' };
const latin = (s) => [...s].map((c) => TR[c] ?? c).join('');
const slugify = (s) => latin(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const communities = await dushetiCommunities();
const result = [];

for (const m of MUNICIPALITIES) {
  const titles = await categoryPages(m.cat);
  const entries = new Map();
  for (const [name, title, kind] of EXTRA[m.key]) entries.set(title, { name, kind });
  for (const t of titles) if (!entries.has(t)) entries.set(t, { name: clean(t), kind: 'village' });
  if (m.key === 'dusheti') {
    const known = new Set([...entries.values()].map((e) => e.name));
    for (const v of communities.keys()) if (!known.has(v)) entries.set(v, { name: v, kind: 'village' });
  }
  const coords = await coordinates([...entries.keys()]);
  const used = new Set();
  for (const [title, e] of entries) {
    let slug = slugify(e.name);
    const community = m.key === 'dusheti' ? (communities.get(e.name) ?? null) : null;
    if (used.has(slug)) slug = `${slug}-${slugify(community ?? String(used.size))}`;
    used.add(slug);
    result.push({ slug, name: e.name, latin: latin(e.name), kind: e.kind, municipality: m.key, community, geo: coords.get(title) ?? null });
  }
  console.log(m.key, entries.size, 'with coords:', [...entries.keys()].filter((t) => coords.has(t)).length);
}

// The Dusheti community lists spell some names differently from the article titles
// (ჭიკაანი / ჭიკანი). Merge near-identical pairs, keeping the other spelling as `alt`.
const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const MANUAL_COMMUNITY = { ფასანაური: 'ფასანაურის თემი' };
for (const r of result) if (MANUAL_COMMUNITY[r.name]) r.community = MANUAL_COMMUNITY[r.name];
const orphans = result.filter((r) => r.municipality === 'dusheti' && !r.geo && r.community);
for (const o of orphans) {
  const match = result.find((r) => r !== o && r.municipality === 'dusheti' && r.geo && !r.community && lev(r.name, o.name) <= 2);
  if (!match) continue;
  match.community = o.community;
  match.alt = o.name;
  result.splice(result.indexOf(o), 1);
  console.log('merged', o.name, '->', match.name);
}

fs.writeFileSync('src/data/villages.json', JSON.stringify(result, null, 1) + '\n');
console.log('total', result.length);

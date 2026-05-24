const POLY_API = 'https://api.polyhaven.com';
const POLY_THUMB = 'https://cdn.polyhaven.com/asset_img/thumbs';

export interface PolyHavenAsset {
  id: string;
  name: string;
  categories: string[];
  tags: string[];
  thumbnail: string;
  description: string;
  downloadCount: number;
}

interface PolyFileMap {
  gltf?: Record<string, { gltf: { url: string; size: number; include?: Record<string, { url: string }> } }>;
  blend?: Record<string, { blend: { url: string } }>;
}

let cache: {
  models: Record<string, PolyHavenAsset> | null;
  lastFetch: number;
} = { models: null, lastFetch: 0 };

const CACHE_TTL = 5 * 60 * 1000;

async function fetchAllModels(): Promise<Record<string, PolyHavenAsset>> {
  const now = Date.now();
  if (cache.models && (now - cache.lastFetch) < CACHE_TTL) {
    return cache.models;
  }

  const res = await fetch(`${POLY_API}/assets?type=models`);
  if (!res.ok) throw new Error(`Poly Haven API error: ${res.status}`);
  const data = await res.json();

  const mapped: Record<string, PolyHavenAsset> = {};
  for (const [id, asset] of Object.entries(data)) {
    const a = asset as any;
    mapped[id] = {
      id,
      name: a.name || id,
      categories: a.categories || [],
      tags: a.tags || [],
      thumbnail: a.thumbnail_url || `${POLY_THUMB}/${id}.png?width=256&height=256`,
      description: a.description || '',
      downloadCount: a.download_count || 0,
    };
  }

  cache.models = mapped;
  cache.lastFetch = now;
  return mapped;
}

export async function searchByTags(tags: string[], limit = 10): Promise<PolyHavenAsset[]> {
  const models = await fetchAllModels();
  const lowerTags = tags.map(t => t.toLowerCase());

  const scored = Object.values(models).map(model => {
    const allKeywords = [
      ...model.tags.map(t => t.toLowerCase()),
      ...model.categories.map(c => c.toLowerCase()),
      model.name.toLowerCase(),
    ];

    let score = 0;
    for (const tag of lowerTags) {
      const tagWords = tag.split(/[\s_-]+/);
      for (const word of tagWords) {
        if (word.length < 2) continue;
        for (const kw of allKeywords) {
          if (kw === word) score += 10;
          else if (kw.includes(word)) score += 3;
          else if (word.includes(kw)) score += 2;
        }
      }
    }

    return { model, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || b.model.downloadCount - a.model.downloadCount)
    .slice(0, limit)
    .map(s => s.model);
}

export async function searchByCategory(category: string): Promise<PolyHavenAsset[]> {
  const models = await fetchAllModels();
  const cat = category.toLowerCase();
  return Object.values(models)
    .filter(m => m.categories.some(c => c.toLowerCase() === cat))
    .sort((a, b) => b.downloadCount - a.downloadCount);
}

export async function getModelById(id: string): Promise<PolyHavenAsset | null> {
  const models = await fetchAllModels();
  return models[id] || null;
}

export async function getModelGltfUrl(modelId: string, resolution = '2k'): Promise<string | null> {
  try {
    const res = await fetch(`${POLY_API}/files/${modelId}`);
    if (!res.ok) return null;
    const files: PolyFileMap = await res.json();
    const gltfEntry = files.gltf?.[resolution]?.gltf;
    if (gltfEntry?.url) return gltfEntry.url;
    return null;
  } catch {
    return null;
  }
}

export async function getModelProxiedGltfUrl(modelId: string, resolution = '2k'): Promise<string | null> {
  const hasFiles = await checkModelHasGltf(modelId, resolution);
  if (!hasFiles) return null;
  return `/api/polyhaven/gltf/${modelId}?res=${resolution}`;
}

async function checkModelHasGltf(modelId: string, resolution = '2k'): Promise<boolean> {
  try {
    const res = await fetch(`${POLY_API}/files/${modelId}`);
    if (!res.ok) return false;
    const files: PolyFileMap = await res.json();
    return !!files.gltf?.[resolution]?.gltf;
  } catch {
    return false;
  }
}

const CATEGORY_TO_TAGS: Record<string, string[]> = {
  Seating: ['chair', 'sofa', 'stool', 'bench', 'seating', 'couch', 'lounge', 'ottoman', 'armchair'],
  Tables: ['table', 'desk', 'coffee', 'dining', 'console', 'nightstand', 'side table'],
  Storage: ['shelf', 'shelves', 'cabinet', 'drawer', 'storage', 'bookcase', 'filing'],
  Lighting: ['lamp', 'lighting', 'lantern', 'pendant', 'chandelier'],
  Decor: ['decorative', 'vase', 'statue', 'ornament', 'figurine', 'sculpture', 'decor', 'prop'],
  Textiles: ['rug', 'carpet', 'curtain', 'fabric', 'cushion', 'pillow', 'bed', 'throw', 'mattress', 'towel', 'blanket'],
  Other: ['furniture', 'prop', 'interior', 'decorative'],
};

export function getTagsForCategory(category: string): string[] {
  return CATEGORY_TO_TAGS[category] || CATEGORY_TO_TAGS.Other;
}

const FURNITURE_STYLE_WORDS = [
  'modern', 'vintage', 'industrial', 'minimalist', 'scandinavian',
  'coastal', 'traditional', 'contemporary', 'mid-century', 'retro',
  'bohemian', 'rustic', 'farmhouse', 'art-deco', 'victorian',
  'gothic', 'chinese', 'colonial', 'antique', 'classic', 'elegant',
  'ornate', 'mediterranean', 'asian'
];

export function generateTagsFromAnalysis(item: string, style: string, _color: string): string[] {
  const tags = new Set<string>();

  // Primary: extract all meaningful words from the item name
  const itemWords = item.toLowerCase().split(/[\s,]+/);
  for (const w of itemWords) {
    const clean = w.replace(/[^a-z0-9-]/g, '').trim();
    if (clean.length > 1) tags.add(clean);
  }

  // Secondary: only add recognized style words (skip color words entirely)
  const styleWords = style.toLowerCase().split(/[\s,]+/);
  for (const w of styleWords) {
    const clean = w.replace(/[^a-z0-9-]/g, '').trim();
    if (FURNITURE_STYLE_WORDS.includes(clean)) tags.add(clean);
  }

  return Array.from(tags);
}

export async function findBestMatch(
  itemName: string,
  category: string,
  extraTags: string[] = []
): Promise<{ asset: PolyHavenAsset | null; url: string | null; tags: string[] }> {
  const tags = [...getTagsForCategory(category), ...extraTags, ...itemName.toLowerCase().split(/[\s,]+/).filter(t => t.length > 1)];

  const matches = await searchByTags(tags, 5);

  if (matches.length === 0) {
    return { asset: null, url: null, tags };
  }

  const best = matches[0];
  const gltfUrl = await getModelGltfUrl(best.id);

  return { asset: best, url: gltfUrl, tags };
}

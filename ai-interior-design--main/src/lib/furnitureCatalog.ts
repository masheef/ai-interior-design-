export interface FurnitureItem {
  url: string;
  thumbnail: string;
  category: 'Seating' | 'Tables' | 'Storage' | 'Lighting' | 'Decor' | 'Textiles' | 'Other';
  description?: string;
  polyHavenId?: string;
  keyTags: string[];
}

// Synonym groups: maps a word to all its synonyms for fuzzy matching
const SYNONYM_GROUPS: Record<string, string[]> = {
  sofa: ['couch', 'settee', 'loveseat', 'divan', 'chesterfield'],
  chair: ['seat', 'armchair', 'recliner', 'throne', 'bench'],
  table: ['desk', 'surface', 'stand', 'counter'],
  cabinet: ['cupboard', 'credenza', 'sideboard', 'buffet'],
  bed: ['bunk', 'mattress', 'headboard', 'platform', 'frame'],
  shelf: ['bookcase', 'bookshelf', 'shelving', 'rack', 'case'],
  lamp: ['light', 'luminaire', 'lantern'],
  dresser: ['chest', 'commode', 'drawer', 'bureau'],
  stool: ['ottoman', 'footstool', 'bench'],
  vase: ['planter', 'pot', 'urn', 'vessel'],
  mirror: ['glass', 'reflector'],
  clock: ['timepiece', 'chronometer'],
  picture: ['frame', 'art', 'painting', 'print', 'canvas', 'poster'],
};

function expandSynonyms(word: string): string[] {
  for (const [, syns] of Object.entries(SYNONYM_GROUPS)) {
    if (syns.includes(word) || word === Object.keys(SYNONYM_GROUPS).find(k => SYNONYM_GROUPS[k].includes(word) || k === word)) {
      const key = Object.keys(SYNONYM_GROUPS).find(k => k === word || SYNONYM_GROUPS[k].includes(word));
      if (key) return [word, ...SYNONYM_GROUPS[key]];
    }
  }
  return [word];
}

export const FURNITURE_MODELS: Record<string, FurnitureItem> = {
  // ── Seating ─────────────────────────────────────────────
  'Modern Armchair': {
    url: '/api/polyhaven/gltf/modern_arm_chair_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Modern wooden armchair with warm oak frame and plush black leather cushions.',
    polyHavenId: 'modern_arm_chair_01',
    keyTags: ['modern', 'armchair', 'chair', 'seat', 'seating', 'leather', 'contemporary', 'lounge', 'wood', 'cushion', 'recliner']
  },
  'Antique Chair': {
    url: '/api/polyhaven/gltf/ArmChair_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Vintage Victorian armchair with carved wood frame and upholstered seat.',
    polyHavenId: 'ArmChair_01',
    keyTags: ['antique', 'vintage', 'chair', 'seat', 'victorian', 'gothic', 'wood', 'classic', 'upholstery', 'armchair']
  },
  'Sofa': {
    url: '/api/polyhaven/gltf/Sofa_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Vintage Victorian wooden sofa with decorative gothic-style upholstery.',
    polyHavenId: 'Sofa_01',
    keyTags: ['sofa', 'couch', 'settee', 'loveseat', 'vintage', 'victorian', 'gothic', 'wood', 'upholstery', 'decorative']
  },
  'Classic Chair': {
    url: '/api/polyhaven/gltf/WoodenChair_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Ornate Victorian Gothic wooden chair with pointed tracery back.',
    polyHavenId: 'WoodenChair_01',
    keyTags: ['classic', 'chair', 'seat', 'victorian', 'gothic', 'ornate', 'wood', 'antique', 'wooden']
  },
  'Modern Sofa': {
    url: '/api/polyhaven/gltf/sofa_02?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Tufted leather sofa with carved wood frame.',
    polyHavenId: 'sofa_02',
    keyTags: ['sofa', 'couch', 'modern', 'leather', 'tufted', 'wood', 'elegant', 'settee', 'loveseat', 'divan']
  },
  'Curvy Sofa': {
    url: '/api/polyhaven/gltf/sofa_03?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Vintage Victorian leather sofa with scrolled arms and carved wood frame.',
    polyHavenId: 'sofa_03',
    keyTags: ['sofa', 'couch', 'vintage', 'victorian', 'leather', 'antique', 'carved', 'elegant']
  },
  'Mid Century Lounge Chair': {
    url: '/api/polyhaven/gltf/mid_century_lounge_chair?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Mid-century lounge chair with wooden shell and leather cushions.',
    polyHavenId: 'mid_century_lounge_chair',
    keyTags: ['mid-century', 'lounge', 'chair', 'seat', 'retro', 'modern', 'leather', 'wood', 'recliner', 'armchair']
  },
  'Ottoman': {
    url: '/api/polyhaven/gltf/Ottoman_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Dark brown leather ottoman with stacked cushioned tiers.',
    polyHavenId: 'Ottoman_01',
    keyTags: ['ottoman', 'seating', 'leather', 'lounge', 'footstool', 'stool', 'upholstery']
  },
  'Dining Chair': {
    url: '/api/polyhaven/gltf/dining_chair_02?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1594007759138-0f0ac1c73b3b?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Modern dining chair with tufted brown leather and dark wooden legs.',
    polyHavenId: 'dining_chair_02',
    keyTags: ['dining', 'chair', 'seat', 'modern', 'leather', 'wood', 'elegant', 'dining room']
  },
  'Rocking Chair': {
    url: '/api/polyhaven/gltf/Rockingchair_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Solid wood vintage rocking chair with slatted back and curved legs.',
    polyHavenId: 'Rockingchair_01',
    keyTags: ['rocking', 'chair', 'seat', 'vintage', 'wood', 'traditional', 'antique', 'wooden']
  },
  'Bar Stool': {
    url: '/api/polyhaven/gltf/bar_chair_round_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Round wooden bar stool with footrest and dark finish.',
    polyHavenId: 'bar_chair_round_01',
    keyTags: ['bar', 'stool', 'seating', 'chair', 'kitchen', 'counter', 'pub', 'tall', 'wooden']
  },
  'Bench': {
    url: '/api/polyhaven/gltf/painted_wooden_bench?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Classic painted wooden bench with slatted design.',
    polyHavenId: 'painted_wooden_bench',
    keyTags: ['bench', 'seating', 'wooden', 'garden', 'outdoor', 'park', 'entryway', 'rustic']
  },
  'Chinese Armchair': {
    url: '/api/polyhaven/gltf/chinese_armchair?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Traditional Chinese wooden armchair with carved details.',
    polyHavenId: 'chinese_armchair',
    keyTags: ['chinese', 'armchair', 'chair', 'seat', 'traditional', 'oriental', 'wood', 'carved', 'asian']
  },
  'Painted Sofa': {
    url: '/api/polyhaven/gltf/painted_wooden_sofa?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Painted wooden sofa with colorful finish and classic design.',
    polyHavenId: 'painted_wooden_sofa',
    keyTags: ['sofa', 'couch', 'painted', 'wooden', 'colorful', 'settee', 'traditional']
  },
  'Wooden Stool': {
    url: '/api/polyhaven/gltf/wooden_stool_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Simple wooden stool with classic three-leg design.',
    polyHavenId: 'wooden_stool_01',
    keyTags: ['stool', 'wooden', 'seating', 'footstool', 'rustic', 'simple', 'ottoman']
  },
  'Folding Stool': {
    url: '/api/polyhaven/gltf/folding_wooden_stool?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Collapsible folding wooden stool with woven seat.',
    polyHavenId: 'folding_wooden_stool',
    keyTags: ['folding', 'stool', 'wooden', 'camp', 'portable', 'seating', 'collapsible']
  },

  // ── Tables ──────────────────────────────────────────────
  'Industrial Coffee Table': {
    url: '/api/polyhaven/gltf/industrial_coffee_table?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Industrial coffee table with perforated steel frame and rustic wood top.',
    polyHavenId: 'industrial_coffee_table',
    keyTags: ['industrial', 'coffee', 'table', 'metal', 'steel', 'rustic', 'wood', 'urban', 'living room']
  },
  'Modern Coffee Table': {
    url: '/api/polyhaven/gltf/modern_coffee_table_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Contemporary rectangular coffee table with stone top and wooden frame.',
    polyHavenId: 'modern_coffee_table_01',
    keyTags: ['modern', 'coffee', 'table', 'contemporary', 'stone', 'wood', 'rectangular']
  },
  'Round Coffee Table': {
    url: '/api/polyhaven/gltf/coffee_table_round_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Round coffee table with white marble top and looping metal legs.',
    polyHavenId: 'coffee_table_round_01',
    keyTags: ['coffee', 'table', 'round', 'marble', 'modern', 'metal', 'contemporary', 'circular']
  },
  'Wooden Dining Table': {
    url: '/api/polyhaven/gltf/round_wooden_table_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1467043153537-a4fba2cd39ef?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Vintage round wooden table with turned pedestal and splayed legs.',
    polyHavenId: 'round_wooden_table_01',
    keyTags: ['wooden', 'dining', 'table', 'round', 'vintage', 'pedestal', 'classic', 'kitchen']
  },
  'Wooden Side Table': {
    url: '/api/polyhaven/gltf/side_table_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Minimalist wooden side table with two shelves and warm oak finish.',
    polyHavenId: 'side_table_01',
    keyTags: ['side', 'table', 'wooden', 'minimalist', 'modern', 'shelf', 'living room', 'end table', 'nightstand']
  },
  'Console Table': {
    url: '/api/polyhaven/gltf/ClassicConsole_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Carved Victorian Gothic console table with ornate scrollwork.',
    polyHavenId: 'ClassicConsole_01',
    keyTags: ['console', 'table', 'victorian', 'gothic', 'ornate', 'wood', 'vintage', 'credenza', 'sideboard', 'buffet', 'hallway']
  },
  'Nightstand': {
    url: '/api/polyhaven/gltf/ClassicNightstand_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Victorian Gothic wooden nightstand with carved details.',
    polyHavenId: 'ClassicNightstand_01',
    keyTags: ['nightstand', 'bedside', 'table', 'victorian', 'wood', 'vintage', 'bedroom', 'end table']
  },
  'Classic Coffee Table': {
    url: '/api/polyhaven/gltf/CoffeeTable_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Classic wooden coffee table with traditional design.',
    polyHavenId: 'CoffeeTable_01',
    keyTags: ['coffee', 'table', 'classic', 'wooden', 'traditional', 'living room', 'center']
  },
  'Desk': {
    url: '/api/polyhaven/gltf/metal_office_desk?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Metal office desk with clean lines and practical workspace.',
    polyHavenId: 'metal_office_desk',
    keyTags: ['desk', 'office', 'workstation', 'table', 'writing', 'workspace', 'metal', 'modern', 'computer']
  },
  'Rustic Nightstand': {
    url: '/api/polyhaven/gltf/painted_wooden_nightstand?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Painted wooden nightstand with drawer and carved details.',
    polyHavenId: 'painted_wooden_nightstand',
    keyTags: ['nightstand', 'bedside', 'table', 'painted', 'wooden', 'bedroom', 'drawer', 'rustic']
  },
  'Tall Side Table': {
    url: '/api/polyhaven/gltf/side_table_tall_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Tall wooden side table with elegant slender profile.',
    polyHavenId: 'side_table_tall_01',
    keyTags: ['side', 'table', 'tall', 'wooden', 'accent', 'narrow', 'end table', 'plant stand']
  },
  'Small Round Table': {
    url: '/api/polyhaven/gltf/round_wooden_table_02?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1467043153537-a4fba2cd39ef?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Small round wooden table with three legs, ideal for tight spaces.',
    polyHavenId: 'round_wooden_table_02',
    keyTags: ['round', 'table', 'small', 'wooden', 'accent', 'pedestal', 'bistro', 'side']
  },
  'Chinese Console Table': {
    url: '/api/polyhaven/gltf/chinese_console_table?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Traditional Chinese console table with ornate carved apron.',
    polyHavenId: 'chinese_console_table',
    keyTags: ['chinese', 'console', 'table', 'oriental', 'traditional', 'carved', 'wood', 'asian', 'credenza']
  },

  // ── Lighting ────────────────────────────────────────────
  'Chandelier': {
    url: '/api/polyhaven/gltf/Chandelier_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Ornate vintage brass chandelier with six fabric shades.',
    polyHavenId: 'Chandelier_01',
    keyTags: ['chandelier', 'lighting', 'vintage', 'ornate', 'brass', 'ceiling', 'elegant', 'crystal']
  },
  'Modern Ceiling Lamp': {
    url: '/api/polyhaven/gltf/modern_ceiling_lamp_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Modern hanging ceiling lamp with frosted glass globe.',
    polyHavenId: 'modern_ceiling_lamp_01',
    keyTags: ['ceiling', 'lamp', 'light', 'modern', 'glass', 'minimalist', 'hanging', 'lighting', 'pendant']
  },
  'Desk Lamp': {
    url: '/api/polyhaven/gltf/desk_lamp_arm_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Industrial articulated desk lamp with clamp mount.',
    polyHavenId: 'desk_lamp_arm_01',
    keyTags: ['desk', 'lamp', 'light', 'industrial', 'articulated', 'lighting', 'workshop', 'task']
  },
  'Vintage Oil Lamp': {
    url: '/api/polyhaven/gltf/vintage_oil_lamp?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Ornate Victorian oil lamp with brass base and porcelain globe.',
    polyHavenId: 'vintage_oil_lamp',
    keyTags: ['vintage', 'oil', 'lamp', 'light', 'victorian', 'antique', 'brass', 'decorative', 'table lamp']
  },
  'Antique Lantern': {
    url: '/api/polyhaven/gltf/Lantern_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1517487216954-1b5e27a6c02a?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Antique brass hurricane lantern with textured glass globe.',
    polyHavenId: 'Lantern_01',
    keyTags: ['lantern', 'antique', 'brass', 'vintage', 'glass', 'hurricane', 'lighting', 'lamp', 'light']
  },
  'Wooden Lantern': {
    url: '/api/polyhaven/gltf/wooden_lantern_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1517487216954-1b5e27a6c02a?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Colonial wooden lantern with glass panels and metal top.',
    polyHavenId: 'wooden_lantern_01',
    keyTags: ['lantern', 'wooden', 'colonial', 'vintage', 'farmhouse', 'lighting', 'lamp', 'rustic']
  },
  'Pendant Light': {
    url: '/api/polyhaven/gltf/caged_hanging_light?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Industrial caged hanging pendant light with vintage bulb.',
    polyHavenId: 'caged_hanging_light',
    keyTags: ['pendant', 'hanging', 'light', 'caged', 'industrial', 'ceiling', 'lamp', 'lighting', 'vintage']
  },
  'Wall Sconce': {
    url: '/api/polyhaven/gltf/industrial_wall_sconce?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Industrial wall sconce with metal shade and vintage bulb.',
    polyHavenId: 'industrial_wall_sconce',
    keyTags: ['wall', 'sconce', 'light', 'lamp', 'industrial', 'lighting', 'hallway', 'bedroom', 'accent']
  },
  'Crystal Chandelier': {
    url: '/api/polyhaven/gltf/Chandelier_02?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Elegant crystal chandelier with multiple arms and drops.',
    polyHavenId: 'Chandelier_02',
    keyTags: ['chandelier', 'crystal', 'elegant', 'lighting', 'ceiling', 'formal', 'dining', 'luxury']
  },
  'Chinese Chandelier': {
    url: '/api/polyhaven/gltf/chinese_chandelier?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Traditional Chinese chandelier with ornate tassels and carved details.',
    polyHavenId: 'chinese_chandelier',
    keyTags: ['chandelier', 'chinese', 'oriental', 'lighting', 'ceiling', 'traditional', 'asian', 'ornate']
  },

  // ── Decor ───────────────────────────────────────────────
  'Ceramic Vase': {
    url: '/api/polyhaven/gltf/ceramic_vase_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Tall modern ceramic vase with glossy white finish and fluted rim.',
    polyHavenId: 'ceramic_vase_01',
    keyTags: ['vase', 'ceramic', 'modern', 'decorative', 'white', 'tall', 'pot', 'planter', 'vessel']
  },
  'Antique Vase': {
    url: '/api/polyhaven/gltf/antique_ceramic_vase_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Antique ceramic vase with blue floral transferware pattern.',
    polyHavenId: 'antique_ceramic_vase_01',
    keyTags: ['vase', 'antique', 'ceramic', 'floral', 'vintage', 'decorative', 'pattern', 'urn']
  },
  'Brass Vase': {
    url: '/api/polyhaven/gltf/brass_vase_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Antique brass vase with elegant elongated silhouette.',
    polyHavenId: 'brass_vase_01',
    keyTags: ['vase', 'brass', 'antique', 'metal', 'decorative', 'elegant', 'vessel']
  },
  'Ornate Vase': {
    url: '/api/polyhaven/gltf/brass_vase_03?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Ornate brass vase with engraved swirls and warm patina.',
    polyHavenId: 'brass_vase_03',
    keyTags: ['vase', 'ornate', 'brass', 'decorative', 'engraved', 'gold', 'antique', 'vessel']
  },
  'Brass Candleholders': {
    url: '/api/polyhaven/gltf/brass_candleholders?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Ornate antique brass candleholders with engraved bases.',
    polyHavenId: 'brass_candleholders',
    keyTags: ['candleholder', 'brass', 'antique', 'decorative', 'ornate', 'candle', 'candlestick', 'candelabra']
  },
  'Horse Statue': {
    url: '/api/polyhaven/gltf/horse_statue_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Decorative porcelain horse statue with white finish.',
    polyHavenId: 'horse_statue_01',
    keyTags: ['statue', 'horse', 'decorative', 'porcelain', 'figurine', 'sculpture', 'ornament']
  },
  'Potted Plant': {
    url: '/api/polyhaven/gltf/potted_plant_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Potted indoor plant in terracotta planter.',
    polyHavenId: 'potted_plant_01',
    keyTags: ['plant', 'potted', 'indoor', 'green', 'decorative', 'terracotta', 'foliage', 'tree']
  },
  'Ornate Mirror': {
    url: '/api/polyhaven/gltf/ornate_mirror_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Ornate framed mirror with carved gold detailing.',
    polyHavenId: 'ornate_mirror_01',
    keyTags: ['mirror', 'ornate', 'gold', 'decorative', 'wall', 'vanity', 'glass', 'framed']
  },
  'Wall Art': {
    url: '/api/polyhaven/gltf/fancy_picture_frame_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Ornate wooden picture frame with gold leaf detailing.',
    polyHavenId: 'fancy_picture_frame_01',
    keyTags: ['picture', 'frame', 'art', 'wall', 'decorative', 'painting', 'canvas', 'poster', 'print', 'ornate']
  },
  'Mantel Clock': {
    url: '/api/polyhaven/gltf/mantel_clock_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1563861826100-9cb868fdae1c?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Classic mantel clock with brass details and roman numerals.',
    polyHavenId: 'mantel_clock_01',
    keyTags: ['clock', 'mantel', 'timepiece', 'decorative', 'antique', 'brass', 'classic', 'shelf']
  },
  'Grandfather Clock': {
    url: '/api/polyhaven/gltf/vintage_grandfather_clock_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1563861826100-9cb868fdae1c?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Vintage grandfather clock with pendulum and carved wood case.',
    polyHavenId: 'vintage_grandfather_clock_01',
    keyTags: ['clock', 'grandfather', 'tall', 'vintage', 'antique', 'timepiece', 'wood', 'pendulum', 'standing']
  },
  'Decorative Books': {
    url: '/api/polyhaven/gltf/decorative_book_set_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800',
    category: 'Decor',
    description: 'Set of decorative vintage books for styling and display.',
    polyHavenId: 'decorative_book_set_01',
    keyTags: ['book', 'decorative', 'vintage', 'display', 'shelf', 'library', 'stack', 'reading']
  },

  // ── Storage ─────────────────────────────────────────────
  'Wooden Cabinet': {
    url: '/api/polyhaven/gltf/modern_wooden_cabinet?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Modern wooden cabinet with dark frame and slatted curved doors.',
    polyHavenId: 'modern_wooden_cabinet',
    keyTags: ['cabinet', 'modern', 'wooden', 'storage', 'slatted', 'contemporary', 'cupboard', 'credenza', 'sideboard']
  },
  'Vintage Drawer Cabinet': {
    url: '/api/polyhaven/gltf/vintage_wooden_drawer_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Vintage wooden six-drawer filing cabinet with worn patina.',
    polyHavenId: 'vintage_wooden_drawer_01',
    keyTags: ['cabinet', 'drawer', 'vintage', 'wooden', 'storage', 'filing', 'office', 'chest', 'dresser', 'bureau']
  },
  'Antique Chinese Cabinet': {
    url: '/api/polyhaven/gltf/chinese_tea_table?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Antique Chinese tea table with ornate traditional carving.',
    polyHavenId: 'chinese_tea_table',
    keyTags: ['cabinet', 'chinese', 'antique', 'ornate', 'traditional', 'wooden', 'cupboard', 'asian', 'credenza']
  },
  'Bookshelf': {
    url: '/api/polyhaven/gltf/wooden_bookshelf_worn?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Vintage worn wooden bookshelf with multiple display tiers.',
    polyHavenId: 'wooden_bookshelf_worn',
    keyTags: ['bookshelf', 'bookcase', 'shelf', 'shelving', 'wooden', 'vintage', 'storage', 'display', 'library', 'rack']
  },
  'Wall Shelves': {
    url: '/api/polyhaven/gltf/painted_wooden_shelves?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Set of painted wooden wall shelves for display and storage.',
    polyHavenId: 'painted_wooden_shelves',
    keyTags: ['shelf', 'shelves', 'wall', 'painted', 'wooden', 'storage', 'display', 'floating', 'decorative']
  },
  'Gothic Dresser': {
    url: '/api/polyhaven/gltf/GothicCommode_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Ornate gothic commode with carved details and brass hardware.',
    polyHavenId: 'GothicCommode_01',
    keyTags: ['dresser', 'chest', 'commode', 'gothic', 'drawer', 'storage', 'ornate', 'wooden', 'bureau']
  },
  'Painted Cabinet': {
    url: '/api/polyhaven/gltf/painted_wooden_cabinet?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Colorful painted wooden cabinet with traditional styling.',
    polyHavenId: 'painted_wooden_cabinet',
    keyTags: ['cabinet', 'painted', 'wooden', 'storage', 'colorful', 'cupboard', 'credenza', 'sideboard']
  },
  'Vintage Cabinet': {
    url: '/api/polyhaven/gltf/vintage_cabinet_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Antique vintage cabinet with glass doors and carved details.',
    polyHavenId: 'vintage_cabinet_01',
    keyTags: ['cabinet', 'vintage', 'antique', 'glass', 'display', 'storage', 'cupboard', 'china', 'credenza']
  },
  'Chinese Cabinet': {
    url: '/api/polyhaven/gltf/chinese_cabinet?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Traditional Chinese cabinet with ornate brass hardware.',
    polyHavenId: 'chinese_cabinet',
    keyTags: ['cabinet', 'chinese', 'traditional', 'oriental', 'storage', 'wooden', 'asian', 'cupboard']
  },
  'Chinese Commode': {
    url: '/api/polyhaven/gltf/chinese_commode?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1597006335771-31ced5b473bb?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Traditional Chinese commode chest with brass lock plates.',
    polyHavenId: 'chinese_commode',
    keyTags: ['commode', 'chest', 'dresser', 'chinese', 'oriental', 'drawer', 'storage', 'bureau', 'asian']
  },
  'Display Shelves': {
    url: '/api/polyhaven/gltf/wooden_display_shelves_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=800',
    category: 'Storage',
    description: 'Wooden display shelves with multiple compartments for decor.',
    polyHavenId: 'wooden_display_shelves_01',
    keyTags: ['shelf', 'shelves', 'display', 'wooden', 'storage', 'decorative', 'wall', 'compartment', 'cubby']
  },

  // ── Textiles ────────────────────────────────────────────
  'Throw Pillows': {
    url: '/api/polyhaven/gltf/throw_pillows_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&q=80&w=800',
    category: 'Textiles',
    description: 'Set of decorative throw pillows with African-inspired triangle patterns.',
    polyHavenId: 'throw_pillows_01',
    keyTags: ['pillow', 'throw', 'cushion', 'decorative', 'textile', 'fabric', 'sofa', 'bed', 'accent']
  },
  'Gothic Bed': {
    url: '/api/polyhaven/gltf/GothicBed_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
    category: 'Textiles',
    description: 'Ornate vintage gothic wooden bed with carved headboard and decorative details.',
    polyHavenId: 'GothicBed_01',
    keyTags: ['bed', 'gothic', 'vintage', 'wooden', 'furniture', 'ornate', 'bedroom', 'frame', 'headboard', 'platform', 'bunk']
  },
  'Television': {
    url: '/api/polyhaven/gltf/Television_01?res=2k',
    thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800',
    category: 'Other',
    description: 'Modern flat-screen television on metal stand.',
    polyHavenId: 'Television_01',
    keyTags: ['television', 'tv', 'entertainment', 'screen', 'media', 'living room', 'electronics', 'display']
  },

  // ── Custom / Other ──────────────────────────────────────
  'Custom Model': {
    url: '/my-model.glb',
    thumbnail: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=800',
    category: 'Other',
    description: 'Place your own .glb in /public and name it my-model.glb',
    keyTags: ['custom', 'model', 'import']
  }
};

export const DEFAULT_MODEL = '/api/polyhaven/gltf/modern_arm_chair_01?res=2k';

export const getFurnitureModel = (name: string, customModels: Record<string, FurnitureItem> = {}): string => {
  const lowerName = name.toLowerCase();
  const allModels = { ...FURNITURE_MODELS, ...customModels };

  // 1. Direct match
  for (const [key] of Object.entries(allModels)) {
    if (lowerName === key.toLowerCase()) return allModels[key].url;
  }

  // 2. Generate tags from name and find best match via keyTags
  const nameTags = lowerName.split(/[\s,]+/).filter(t => t.length > 1);
  const matches = findModelsByKeyTags(nameTags);
  if (matches.length > 0) {
    return matches[0].item.url;
  }

  // 3. Fallback
  return DEFAULT_MODEL;
};

export function findModelsByKeyTags(tags: string[]): Array<{ name: string; item: FurnitureItem; score: number }> {
  const lowerTags = tags.map(t => t.toLowerCase());
  const results: Array<{ name: string; item: FurnitureItem; score: number }> = [];

  for (const [name, item] of Object.entries(FURNITURE_MODELS)) {
    if (name === 'Custom Model') continue;
    const allKeywords = [...item.keyTags, name.toLowerCase(), item.category.toLowerCase()];
    let score = 0;
    for (const tag of lowerTags) {
      // Skip very generic words that add noise
      if (['custom', 'style', 'room', 'design', 'decor', 'quality', 'premium', 'luxury'].includes(tag)) continue;

      // Expand tag with synonyms
      const expanded = expandSynonyms(tag);

      for (const kw of allKeywords) {
        // Direct match on tag or any synonym
        for (const variant of expanded) {
          if (kw === variant) score += 10;
          else if (variant.length >= 3 && kw.includes(variant)) score += 4;
        }
        // Original tag matching on full keywords
        if (kw === tag) score += 10;
        else if (tag.length >= 3 && kw.includes(tag)) score += 3;
        // Reverse: keyword includes tag
        else if (tag.length >= 4 && tag.includes(kw)) score += 2;
      }
    }
    if (score > 0) results.push({ name, item, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

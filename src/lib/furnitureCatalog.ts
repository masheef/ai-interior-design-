export interface FurnitureItem {
  url: string;
  thumbnail: string;
  category: 'Seating' | 'Tables' | 'Storage' | 'Lighting' | 'Decor' | 'Textiles' | 'Other';
  description?: string;
}

export const FURNITURE_MODELS: Record<string, FurnitureItem> = {
  // Seating
  'Modern Armchair': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'A luxurious armchair showcasing velvet upholstery and premium PBR materials.'
  },
  'Antique Chair': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Ornate seating solution from the glTF official asset collection.'
  },
  'Sofa': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Elegant seating solution with advanced texture mapping.'
  },
  
  // Tables & Storage
  'Industrial Coffee Cart': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'A minimalist geometric cart that serves as a unique coffee table.'
  },
  'Glass Coffee Table': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    category: 'Tables'
  },
  'Wooden Dining Table': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    thumbnail: 'https://images.unsplash.com/photo-1467043153537-a4fba2cd39ef?auto=format&fit=crop&q=80&w=800',
    category: 'Tables',
    description: 'Classic geometric table with high-resolution PBR materials.'
  },
  'Classic Chair': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
    category: 'Seating'
  },
  'Modern Sofa': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    category: 'Seating'
  },
  'Curvy Sofa': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
    category: 'Seating',
    description: 'Modern seating solution emphasizing material sheen.'
  },
  'Custom Model': {
    url: '/my-model.glb', 
    thumbnail: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=800',
    category: 'Other',
    description: 'Place your own .glb in /public and name it my-model.glb'
  },
  'Stained Glass Lamp': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Lantern/glTF-Binary/Lantern.glb',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting',
    description: 'Artistic lamp with complex transmission.'
  },
  'Ceramic Duck': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800',
    category: 'Decor'
  },
  'Decorative Lantern': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Lantern/glTF-Binary/Lantern.glb',
    thumbnail: 'https://images.unsplash.com/photo-1517487216954-1b5e27a6c02a?auto=format&fit=crop&q=80&w=800',
    category: 'Lighting'
  },
  'Antique Flight Helmet': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    thumbnail: 'https://images.unsplash.com/photo-1614741480652-32b847bc18df?auto=format&fit=crop&q=80&w=800',
    category: 'Decor'
  },
  'Vintage Boombox': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
    thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800',
    category: 'Decor'
  }
};

export const DEFAULT_MODEL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb';

export const getFurnitureModel = (name: string, customModels: Record<string, FurnitureItem> = {}): string => {
  const lowerName = name.toLowerCase();
  const allModels = { ...FURNITURE_MODELS, ...customModels };

  // 1. Direct match check
  for (const [key, item] of Object.entries(allModels)) {
    if (lowerName === key.toLowerCase()) return item.url;
  }

  // 2. Keyword matching with variety logic
  if (lowerName.includes('chair') || lowerName.includes('armchair')) {
    const chairs = ['Modern Armchair', 'Antique Chair', 'Classic Chair'];
    const selected = chairs[Math.floor(Math.random() * chairs.length)];
    return allModels[selected]?.url || allModels['Modern Armchair'].url;
  }
  
  if (lowerName.includes('sofa') || lowerName.includes('couch')) {
    const sofas = ['Sofa', 'Curvy Sofa', 'Modern Sofa'];
    const selected = sofas[Math.floor(Math.random() * sofas.length)];
    return allModels[selected]?.url || allModels['Sofa']?.url || DEFAULT_MODEL;
  }

  if (lowerName.includes('table') || lowerName.includes('desk')) {
    const tables = ['Industrial Coffee Cart', 'Wooden Dining Table', 'Glass Coffee Table'];
    const selected = tables[Math.floor(Math.random() * tables.length)];
    return allModels[selected]?.url || allModels['Industrial Coffee Cart'].url;
  }

  if (lowerName.includes('lamp') || lowerName.includes('light')) {
    const lights = ['Stained Glass Lamp', 'Decorative Lantern'];
    const selected = lights[Math.floor(Math.random() * lights.length)];
    return allModels[selected]?.url || allModels['Stained Glass Lamp']?.url || DEFAULT_MODEL;
  }

  if (lowerName.includes('decor') || lowerName.includes('accent') || lowerName.includes('ornament')) {
    const decor = ['Ceramic Duck', 'Antique Flight Helmet', 'Vintage Boombox'];
    const selected = decor[Math.floor(Math.random() * decor.length)];
    return allModels[selected]?.url || allModels['Ceramic Duck']?.url || DEFAULT_MODEL;
  }

  // 3. Fallback to a random model from the catalog instead of the exact same default every time
  const modelKeys = Object.keys(allModels).filter(k => k !== 'Custom Model');
  const randomKey = modelKeys[Math.floor(Math.random() * modelKeys.length)];
  return allModels[randomKey]?.url || DEFAULT_MODEL;
};

/**
 * 🛠️ HOW TO ADD YOUR OWN MODELS:
 * 1. Open the file explorer in the editor.
 * 2. Upload your .glb file to the "/public" folder.
 * 3. In this file (furnitureCatalog.ts), add a new entry to FURNITURE_MODELS.
 * 4. Set the 'url' property to simply '/your-filename.glb'.
 * 
 * Example:
 * 'My Cool Sofa': {
 *    url: '/sofa.glb',
 *    thumbnail: '...',
 *    category: 'Seating'
 * }
 */

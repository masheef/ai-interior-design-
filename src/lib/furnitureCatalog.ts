export interface FurnitureItem {
  url: string;
  thumbnail: string;
}

export const FURNITURE_MODELS: Record<string, FurnitureItem> = {
  // Seating
  'Sofa': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'
  },
  'Modular Sectional Sofa': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&q=80&w=800'
  },
  'Accent Chair': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800'
  },
  'Armchair': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1598191383441-bc1902996dcd?auto=format&fit=crop&q=80&w=800'
  },
  'Bar Stools': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=800'
  },
  'Ergonomic Office Chair': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    thumbnail: 'https://images.unsplash.com/photo-1505797149-43b00fe2826c?auto=format&fit=crop&q=80&w=800'
  },
  
  // Tables & Storage
  'Oak Coffee Table': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CoffeeCart/glTF-Binary/CoffeeCart.glb',
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800'
  },
  'Dining Table': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CoffeeCart/glTF-Binary/CoffeeCart.glb',
    thumbnail: 'https://images.unsplash.com/photo-1467043153537-a4fba2cd39ef?auto=format&fit=crop&q=80&w=800'
  },
  'Ergonomic Desk': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CoffeeCart/glTF-Binary/CoffeeCart.glb',
    thumbnail: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800'
  },
  'Nightstand': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    thumbnail: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=800'
  },
  'Minimalist TV Stand': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoxInterleaved/glTF-Binary/BoxInterleaved.glb',
    thumbnail: 'https://images.unsplash.com/photo-1593073883962-b2d9924f1777?auto=format&fit=crop&q=80&w=800'
  },
  'Bookshelf': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    thumbnail: 'https://images.unsplash.com/photo-1594620302200-9a7622d4a156?auto=format&fit=crop&q=80&w=800'
  },

  // Textiles (Floor Mats & Curtains)
  'Luxury Persian Rug': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    thumbnail: 'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?auto=format&fit=crop&q=80&w=800'
  },
  'Velvet Curtains': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SpecGlossVsPBR/glTF-Binary/SpecGlossVsPBR.glb',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?auto=format&fit=crop&q=80&w=800'
  },
  'Jute Floor Mat': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    thumbnail: 'https://images.unsplash.com/photo-1615527333417-74f8309cc28a?auto=format&fit=crop&q=80&w=800'
  },

  // Decor & Accents
  'Floor Lamp': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Lantern/glTF-Binary/Lantern.glb',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed657baaa9?auto=format&fit=crop&q=80&w=800'
  },
  'Decorative Lantern': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Lantern/glTF-Binary/Lantern.glb',
    thumbnail: 'https://images.unsplash.com/photo-1517487216954-1b5e27a6c02a?auto=format&fit=crop&q=80&w=800'
  },
  'Ceramic Vase': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
    thumbnail: 'https://images.unsplash.com/photo-1580488123447-661793547214?auto=format&fit=crop&q=80&w=800'
  },
  'Antique Helmet': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb',
    thumbnail: 'https://images.unsplash.com/photo-1614741480652-32b847bc18df?auto=format&fit=crop&q=80&w=800'
  },
  'Vintage Boombox': {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800'
  }
};

export const DEFAULT_MODEL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb';

export const getFurnitureModel = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Direct match or partial match
  for (const [key, item] of Object.entries(FURNITURE_MODELS)) {
    if (lowerName.includes(key.toLowerCase())) return item.url;
  }

  // Keyword categorization
  if (lowerName.includes('chair') || lowerName.includes('sofa') || lowerName.includes('seating')) {
    return FURNITURE_MODELS['Armchair'].url;
  }
  if (lowerName.includes('table') || lowerName.includes('desk') || lowerName.includes('stand')) {
    return FURNITURE_MODELS['Oak Coffee Table'].url;
  }
  if (lowerName.includes('lamp') || lowerName.includes('light')) {
    return FURNITURE_MODELS['Floor Lamp'].url;
  }
  if (lowerName.includes('decor') || lowerName.includes('accent') || lowerName.includes('ornament')) {
    return FURNITURE_MODELS['Decorative Lantern'].url;
  }

  return DEFAULT_MODEL;
};

/**
 * ML Search Service - React Integration
 * Provides clean API wrapper for semantic furniture search
 * 
 * Drop this file into: src/services/mlSearchService.ts
 * 
 * Usage:
 *   const results = await mlSearchService.searchByQuery('armchair');
 *   const matches = await mlSearchService.searchByTags(['leather', 'modern']);
 */

import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:5000';
const API_TIMEOUT = 8000; // 8 seconds

// Types
export interface FurnitureSearchResult {
  id: string;
  name: string;
  score: number;
  url: string;
  thumbnail: string;
  category: string;
  polyHavenId: string;
}

export interface TagSearchResult {
  name: string;
  id: string;
  score: number;
  item: {
    url: string;
    thumbnail: string;
    category: string;
    polyHavenId: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

// Service Class
class MLSearchService {
  private apiClient: AxiosInstance;
  private isAvailable: boolean = true;
  private checkHealthInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 503) {
          this.isAvailable = false;
        }
        return Promise.reject(error);
      }
    );

    // Check health on initialization
    this.checkHealth();

    // Periodic health check every 30 seconds
    this.checkHealthInterval = setInterval(() => {
      this.checkHealth();
    }, 30000);
  }

  /**
   * Check if ML API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      this.isAvailable = response.data.model_ready === true;
      if (this.isAvailable) {
        console.debug('✓ ML API is healthy');
      }
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      console.debug('ML API not available - will use local fallback');
      return false;
    }
  }

  /**
   * Get API availability status
   */
  getStatus(): { available: boolean; message: string } {
    if (this.isAvailable) {
      return { available: true, message: 'Connected to ML API' };
    } else {
      return { available: false, message: 'Using local fallback search' };
    }
  }

  /**
   * Search by query string (semantic search)
   * Best for: Natural language queries like "comfortable armchair"
   */
  async searchByQuery(
    query: string,
    topK: number = 5,
    threshold: number = 0.3
  ): Promise<FurnitureSearchResult[]> {
    if (!query?.trim()) {
      console.warn('Empty query provided to searchByQuery');
      return [];
    }

    if (!this.isAvailable) {
      console.debug('API unavailable, using fallback');
      return [];
    }

    try {
      const response = await this.apiClient.post<any>('/api/search', {
        query: query.trim(),
        top_k: topK,
        threshold,
      });

      if (response.data.success) {
        return response.data.results || [];
      } else {
        console.warn('Search failed:', response.data.error);
        return [];
      }
    } catch (error) {
      console.warn('searchByQuery failed:', error);
      this.isAvailable = false;
      return [];
    }
  }

  /**
   * Search by tags array (replaces findModelsByKeyTags)
   * Best for: Image analysis tag results
   */
  async searchByTags(
    tags: string[],
    topK: number = 5
  ): Promise<TagSearchResult[]> {
    if (!tags || tags.length === 0) {
      console.warn('Empty tags provided to searchByTags');
      return [];
    }

    if (!this.isAvailable) {
      console.debug('API unavailable, using fallback');
      return [];
    }

    try {
      const response = await this.apiClient.post<any>('/api/search-by-tags', {
        tags: tags.filter((t) => t?.trim()),
        top_k: topK,
      });

      if (response.data.success) {
        return response.data.results || [];
      } else {
        console.warn('Tag search failed:', response.data.error);
        return [];
      }
    } catch (error) {
      console.warn('searchByTags failed:', error);
      this.isAvailable = false;
      return [];
    }
  }

  /**
   * Batch search multiple queries
   * Best for: Searching multiple items at once
   */
  async batchSearch(
    queries: string[],
    topK: number = 3
  ): Promise<Array<{ query: string; results: FurnitureSearchResult[] }>> {
    if (!queries || queries.length === 0) {
      console.warn('Empty queries provided to batchSearch');
      return [];
    }

    if (!this.isAvailable) {
      console.debug('API unavailable, using fallback');
      return [];
    }

    try {
      const response = await this.apiClient.post<any>('/api/batch-search', {
        queries: queries.filter((q) => q?.trim()),
        top_k: topK,
      });

      if (response.data.success) {
        return response.data.batch_results || [];
      } else {
        console.warn('Batch search failed:', response.data.error);
        return [];
      }
    } catch (error) {
      console.warn('batchSearch failed:', error);
      this.isAvailable = false;
      return [];
    }
  }

  /**
   * Get all furniture items
   */
  async getAllFurniture(): Promise<
    Array<{ id: string; name: string; category: string }>
  > {
    try {
      const response = await this.apiClient.get<any>('/api/furniture');
      if (response.data.success) {
        return response.data.items || [];
      }
      return [];
    } catch (error) {
      console.warn('getAllFurniture failed:', error);
      return [];
    }
  }

  /**
   * Get furniture by ID
   */
  async getFurnitureById(
    id: string
  ): Promise<FurnitureSearchResult | null> {
    try {
      const response = await this.apiClient.get<any>(
        `/api/furniture/${id}`
      );
      if (response.data.success) {
        return response.data.furniture;
      }
      return null;
    } catch (error) {
      console.warn('getFurnitureById failed:', error);
      return null;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await this.apiClient.get<any>('/api/categories');
      if (response.data.success) {
        return response.data.categories || [];
      }
      return [];
    } catch (error) {
      console.warn('getCategories failed:', error);
      return [];
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.checkHealthInterval) {
      clearInterval(this.checkHealthInterval);
    }
  }
}

// Singleton instance
export const mlSearchService = new MLSearchService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mlSearchService.destroy();
  });
}


const STORAGE_KEYS = {
  DESIGN_PARAMS: 'aura_design_params',
  LAST_SUGGESTION: 'aura_last_suggestion',
  RECENT_VISUALIZATION: 'aura_recent_visualization'
};

export const localStorageService = {
  saveDraft: (params: any, suggestion: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DESIGN_PARAMS, JSON.stringify(params));
      if (suggestion) {
        localStorage.setItem(STORAGE_KEYS.LAST_SUGGESTION, JSON.stringify(suggestion));
      }
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  },

  loadDraft: () => {
    try {
      const params = localStorage.getItem(STORAGE_KEYS.DESIGN_PARAMS);
      const suggestion = localStorage.getItem(STORAGE_KEYS.LAST_SUGGESTION);
      return {
        params: params ? JSON.parse(params) : null,
        suggestion: suggestion ? JSON.parse(suggestion) : null
      };
    } catch (error) {
      console.error('Error loading from local storage:', error);
      return { params: null, suggestion: null };
    }
  },

  clearDraft: () => {
    localStorage.removeItem(STORAGE_KEYS.DESIGN_PARAMS);
    localStorage.removeItem(STORAGE_KEYS.LAST_SUGGESTION);
  }
};

"""
Inference Module - Deployed ML Model for Furniture Search
Lightweight interface for semantic furniture retrieval.
"""

import pickle
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer
from scipy.spatial.distance import cosine

# ============================================================================
# PATHS & INITIALIZATION
# ============================================================================

ML_DIR = Path(__file__).parent
EMBEDDINGS_PATH = ML_DIR / "furniture_embeddings.pkl"
MODEL_PATH = ML_DIR / "model_checkpoint"

# Lazy-load model and embeddings
_model = None
_artifacts = None


def _load_model_and_embeddings():
    """Load model and embeddings on first use."""
    global _model, _artifacts
    
    if _model is not None and _artifacts is not None:
        return _model, _artifacts
    
    # Load sentence transformer model
    _model = SentenceTransformer(str(MODEL_PATH))
    
    # Load embeddings and corpus
    with open(EMBEDDINGS_PATH, 'rb') as f:
        _artifacts = pickle.load(f)
    
    return _model, _artifacts


# ============================================================================
# PUBLIC API
# ============================================================================

def search_furniture(
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.3
) -> List[Tuple[str, str, float]]:
    """
    Semantic search for furniture items.
    
    Args:
        query: User search query (e.g., "comfortable leather armchair")
        top_k: Number of results to return
        similarity_threshold: Minimum similarity score to include
    
    Returns:
        [(item_id, item_name, similarity_score), ...]
    """
    model, artifacts = _load_model_and_embeddings()
    
    embeddings_dict = artifacts['embeddings']
    corpus = artifacts['corpus']
    
    # Encode query
    query_embedding = model.encode([query])[0]
    
    # Search
    results = []
    for item_id, item_name, _ in corpus:
        item_embedding = embeddings_dict[item_id]
        similarity = 1 - cosine(query_embedding, item_embedding)
        
        if similarity >= similarity_threshold:
            results.append((item_id, item_name, float(similarity)))
    
    # Sort by similarity and return top_k
    results.sort(key=lambda x: x[2], reverse=True)
    return results[:top_k]


def batch_search(
    queries: List[str],
    top_k: int = 5
) -> List[List[Tuple[str, str, float]]]:
    """
    Batch search for multiple queries.
    
    Args:
        queries: List of search queries
        top_k: Results per query
    
    Returns:
        List of result lists
    """
    return [search_furniture(q, top_k=top_k) for q in queries]


def get_embedding(text: str) -> np.ndarray:
    """Get raw embedding vector for text."""
    model, _ = _load_model_and_embeddings()
    return model.encode([text])[0]


def is_model_ready() -> bool:
    """Check if model is trained and available."""
    return EMBEDDINGS_PATH.exists() and MODEL_PATH.exists()


# ============================================================================
# EXAMPLE USAGE (for testing)
# ============================================================================

if __name__ == "__main__":
    if not is_model_ready():
        print("❌ Model not trained. Run train_and_evaluate.py first.")
        exit(1)
    
    # Test queries
    test_queries = [
        "comfortable modern armchair",
        "vintage wooden cabinet storage",
        "industrial coffee table metal",
        "luxury dining chair leather",
        "lighting for bedroom ambiance",
    ]
    
    print("\n🔍 Testing Inference Module\n" + "="*50)
    
    for query in test_queries:
        print(f"\n📝 Query: '{query}'")
        results = search_furniture(query, top_k=3)
        
        if results:
            for i, (item_id, item_name, score) in enumerate(results, 1):
                print(f"   {i}. {item_name} (id: {item_id}, score: {score:.4f})")
        else:
            print("   ❌ No results found")
    
    print("\n" + "="*50 + " ✅ Inference Working")

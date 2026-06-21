"""
Comprehensive ML Training & Evaluation Pipeline
Trains semantic embedding model for furniture search with systematic evaluation.
"""

import json
import numpy as np
import pickle
from pathlib import Path
from typing import Dict, List, Tuple, Any
from sentence_transformers import SentenceTransformer
from scipy.spatial.distance import cosine
from sklearn.metrics.pairwise import cosine_similarity
import warnings

warnings.filterwarnings('ignore')

# ============================================================================
# CONFIG & PATHS
# ============================================================================

DATASET_PATH = Path(__file__).parent / "furniture_dataset.json"
RESULTS_PATH = Path(__file__).parent / "test_results.json"
EMBEDDINGS_PATH = Path(__file__).parent / "furniture_embeddings.pkl"
MODEL_PATH = Path(__file__).parent / "model_checkpoint"

# Use highly-tuned model for furniture retrieval
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # 384-dim, balanced speed/quality
BATCH_SIZE = 16
TOP_K_RESULTS = 5


# ============================================================================
# STEP 1: DATA LOADING & PREPARATION
# ============================================================================

def load_dataset() -> Dict[str, Any]:
    """Load and validate furniture dataset."""
    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)
    print(f"✓ Loaded {len(data['items'])} furniture items")
    return data


def prepare_embedding_corpus(data: Dict) -> List[Tuple[str, str, str]]:
    """
    Create rich text corpus from descriptions, tags, and metadata.
    Returns: [(item_id, item_name, embedding_text), ...]
    """
    corpus = []
    for item in data['items']:
        item_id = item['id']
        item_name = item['name']
        
        # Combine: name + description + tags + category + style
        description = item['annotations']['description']
        tags = " ".join(item['annotations']['keyTags'][:25])  # Top 25 tags
        category = item['category']
        style = item['annotations']['taxonomy'].get('style_classifier', '')
        
        # Comprehensive embedding text
        embedding_text = f"{item_name}. {description} Category: {category}. Style: {style}. Features: {tags}"
        
        corpus.append((item_id, item_name, embedding_text))
    
    print(f"✓ Prepared {len(corpus)} embedding texts")
    return corpus


# ============================================================================
# STEP 2: EMBEDDING GENERATION
# ============================================================================

def generate_embeddings(corpus: List[Tuple[str, str, str]]) -> Dict[str, np.ndarray]:
    """
    Generate sentence embeddings using Sentence Transformers.
    Returns: {item_id: embedding_vector}
    """
    print(f"\n📊 Loading model: {EMBEDDING_MODEL_NAME}")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    
    texts = [text for _, _, text in corpus]
    print(f"🔄 Generating {len(texts)} embeddings...")
    
    embeddings_list = model.encode(texts, batch_size=BATCH_SIZE, show_progress_bar=True)
    
    embeddings_dict = {}
    for (item_id, item_name, _), emb in zip(corpus, embeddings_list):
        embeddings_dict[item_id] = emb
    
    print(f"✓ Generated {len(embeddings_dict)} embeddings (dim: {embeddings_list[0].shape[0]})")
    return embeddings_dict, corpus


# ============================================================================
# STEP 3: SYNTHETIC TEST QUERY GENERATION
# ============================================================================

def generate_synthetic_queries(data: Dict) -> List[Tuple[str, List[str]]]:
    """
    Create diverse test queries with ground truth labels.
    Returns: [(query_text, [relevant_item_ids]), ...]
    """
    queries = []
    
    # 1. Category-based queries
    categories = {}
    for item in data['items']:
        cat = item['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item['id'])
    
    for cat, items in categories.items():
        if len(items) > 0:
            queries.append((f"Find me {cat.lower()}", items))
    
    # 2. Style-based queries
    styles = {}
    for item in data['items']:
        style = item['annotations']['taxonomy'].get('style_classifier', '')
        if style and len(style) > 3:
            if style not in styles:
                styles[style] = []
            styles[style].append(item['id'])
    
    for style, items in styles.items():
        if len(items) > 0:
            queries.append((f"I want a {style} piece", items[:3]))
    
    # 3. Material-based queries
    material_queries = [
        ("wooden furniture with natural finish", ['modern_armchair', 'classic_chair', 'wooden_stool']),
        ("leather seating comfortable", ['modern_armchair', 'dining_chair', 'ottoman']),
        ("metal and industrial style", ['industrial_coffee_table', 'desk', 'wall_sconce']),
    ]
    queries.extend(material_queries)
    
    # 4. Function-based queries
    function_queries = [
        ("comfortable seating for relaxation", ['ottoman', 'mid_century_lounge_chair', 'modern_sofa']),
        ("storage and organization cabinet", ['bookshelf', 'filing_cabinet', 'credenza']),
        ("lighting for ambiance", ['floor_lamp', 'chandelier', 'wall_sconce']),
        ("small table for bedroom", ['nightstand', 'rustic_nightstand', 'tall_side_table']),
    ]
    queries.extend(function_queries)
    
    # 5. Aesthetic queries
    aesthetic_queries = [
        ("modern minimalist design", ['modern_armchair', 'modern_coffee_table', 'desk']),
        ("vintage antique aesthetic", ['antique_chair', 'grandfather_clock', 'vintage_globe']),
        ("luxury high-end furniture", ['curvy_sofa', 'crystal_chandelier', 'ornate_mirror']),
    ]
    queries.extend(aesthetic_queries)
    
    print(f"✓ Generated {len(queries)} synthetic test queries")
    return queries


# ============================================================================
# STEP 4: SEMANTIC SEARCH & RETRIEVAL
# ============================================================================

def semantic_search(
    query_text: str,
    model: SentenceTransformer,
    embeddings_dict: Dict[str, np.ndarray],
    corpus: List[Tuple[str, str, str]],
    top_k: int = TOP_K_RESULTS
) -> List[Tuple[str, str, float]]:
    """
    Perform semantic search on query.
    Returns: [(item_id, item_name, score), ...]
    """
    query_embedding = model.encode([query_text])[0]
    
    results = []
    for item_id, item_name, _ in corpus:
        item_embedding = embeddings_dict[item_id]
        similarity = 1 - cosine(query_embedding, item_embedding)  # Convert distance to similarity
        results.append((item_id, item_name, float(similarity)))
    
    # Sort by similarity descending
    results.sort(key=lambda x: x[2], reverse=True)
    return results[:top_k]


# ============================================================================
# STEP 5: EVALUATION METRICS
# ============================================================================

def precision_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> float:
    """Precision@k: proportion of retrieved items that are relevant."""
    if k == 0:
        return 0.0
    retrieved_k = retrieved_ids[:k]
    if len(retrieved_k) == 0:
        return 0.0
    relevant_count = sum(1 for item_id in retrieved_k if item_id in relevant_ids)
    return relevant_count / len(retrieved_k)


def mean_reciprocal_rank(retrieved_ids: List[str], relevant_ids: List[str]) -> float:
    """MRR: 1 / rank of first relevant item."""
    for rank, item_id in enumerate(retrieved_ids, 1):
        if item_id in relevant_ids:
            return 1.0 / rank
    return 0.0


def normalized_discounted_cumulative_gain(retrieved_ids: List[str], relevant_ids: List[str], k: int = 5) -> float:
    """NDCG@k: relevance weighted by position."""
    dcg = 0.0
    for position, item_id in enumerate(retrieved_ids[:k], 1):
        relevance = 1.0 if item_id in relevant_ids else 0.0
        dcg += relevance / np.log2(position + 1)
    
    # Ideal DCG (all relevant items ranked first)
    ideal_dcg = sum(1.0 / np.log2(i + 1) for i in range(1, min(len(relevant_ids), k) + 1))
    
    return dcg / ideal_dcg if ideal_dcg > 0 else 0.0


# ============================================================================
# STEP 6: COMPREHENSIVE EVALUATION
# ============================================================================

def evaluate_model(
    model: SentenceTransformer,
    embeddings_dict: Dict[str, np.ndarray],
    corpus: List[Tuple[str, str, str]],
    test_queries: List[Tuple[str, List[str]]]
) -> Dict[str, Any]:
    """
    Evaluate model on all test queries.
    Returns: comprehensive metrics and results.
    """
    print(f"\n🧪 Evaluating on {len(test_queries)} queries...\n")
    
    results_list = []
    precisions_at_1 = []
    precisions_at_3 = []
    precisions_at_5 = []
    mrrs = []
    ndcgs = []
    similarities_all = []
    
    for i, (query_text, relevant_ids) in enumerate(test_queries):
        retrieved = semantic_search(query_text, model, embeddings_dict, corpus, top_k=TOP_K_RESULTS)
        retrieved_ids = [item_id for item_id, _, _ in retrieved]
        retrieved_scores = [score for _, _, score in retrieved]
        
        # Calculate metrics
        p_1 = precision_at_k(retrieved_ids, relevant_ids, 1)
        p_3 = precision_at_k(retrieved_ids, relevant_ids, 3)
        p_5 = precision_at_k(retrieved_ids, relevant_ids, 5)
        mrr = mean_reciprocal_rank(retrieved_ids, relevant_ids)
        ndcg = normalized_discounted_cumulative_gain(retrieved_ids, relevant_ids, k=5)
        
        precisions_at_1.append(p_1)
        precisions_at_3.append(p_3)
        precisions_at_5.append(p_5)
        mrrs.append(mrr)
        ndcgs.append(ndcg)
        similarities_all.extend(retrieved_scores)
        
        # Store result
        results_list.append({
            "query": query_text,
            "relevant_ids": relevant_ids,
            "results": [[item_id, item_name, score] for item_id, item_name, score in retrieved],
            "metrics": {
                "precision@1": p_1,
                "precision@3": p_3,
                "precision@5": p_5,
                "mrr": mrr,
                "ndcg@5": ndcg
            }
        })
        
        # Progress
        if (i + 1) % max(1, len(test_queries) // 5) == 0:
            print(f"  ✓ Evaluated {i+1}/{len(test_queries)} queries")
    
    # Aggregate metrics
    metrics = {
        "total_queries": len(test_queries),
        "dataset_size": len(corpus),
        "embedding_model": EMBEDDING_MODEL_NAME,
        "embedding_dimension": len(next(iter(embeddings_dict.values()))),
        "precision@1": float(np.mean(precisions_at_1)),
        "precision@3": float(np.mean(precisions_at_3)),
        "precision@5": float(np.mean(precisions_at_5)),
        "mean_reciprocal_rank": float(np.mean(mrrs)),
        "ndcg@5": float(np.mean(ndcgs)),
        "avg_similarity": float(np.mean(similarities_all)),
        "std_similarity": float(np.std(similarities_all)),
    }
    
    return {
        "metrics": metrics,
        "test_results": results_list
    }


# ============================================================================
# STEP 7: SAVE ARTIFACTS
# ============================================================================

def save_artifacts(
    model: SentenceTransformer,
    embeddings_dict: Dict[str, np.ndarray],
    corpus: List[Tuple[str, str, str]],
    evaluation: Dict[str, Any]
) -> None:
    """Save model, embeddings, and results."""
    
    # Save model
    MODEL_PATH.mkdir(exist_ok=True)
    model.save(str(MODEL_PATH))
    print(f"✓ Model saved to {MODEL_PATH}")
    
    # Save embeddings and corpus metadata
    artifacts = {
        'embeddings': embeddings_dict,
        'corpus': corpus,
        'model_name': EMBEDDING_MODEL_NAME,
    }
    with open(EMBEDDINGS_PATH, 'wb') as f:
        pickle.dump(artifacts, f)
    print(f"✓ Embeddings saved to {EMBEDDINGS_PATH}")
    
    # Save evaluation results
    with open(RESULTS_PATH, 'w') as f:
        json.dump(evaluation, f, indent=2)
    print(f"✓ Results saved to {RESULTS_PATH}")


# ============================================================================
# STEP 8: PRINT SUMMARY
# ============================================================================

def print_summary(evaluation: Dict[str, Any]) -> None:
    """Print comprehensive evaluation summary."""
    metrics = evaluation['metrics']
    
    print("\n" + "="*70)
    print("📈 MODEL EVALUATION SUMMARY")
    print("="*70)
    print(f"\n🎯 Retrieval Quality Metrics:")
    print(f"  • Precision@1:           {metrics['precision@1']:.4f}")
    print(f"  • Precision@3:           {metrics['precision@3']:.4f}")
    print(f"  • Precision@5:           {metrics['precision@5']:.4f}")
    print(f"  • Mean Reciprocal Rank:  {metrics['mean_reciprocal_rank']:.4f}")
    print(f"  • NDCG@5:                {metrics['ndcg@5']:.4f}")
    
    print(f"\n📊 Embedding Statistics:")
    print(f"  • Model:                 {metrics['embedding_model']}")
    print(f"  • Embedding Dimension:   {metrics['embedding_dimension']}")
    print(f"  • Dataset Size:          {metrics['dataset_size']} items")
    print(f"  • Test Queries:          {metrics['total_queries']}")
    
    print(f"\n🔢 Similarity Scores:")
    print(f"  • Mean Similarity:       {metrics['avg_similarity']:.4f}")
    print(f"  • Std Deviation:         {metrics['std_similarity']:.4f}")
    
    print("\n" + "="*70)
    print("✅ Training & Evaluation Complete!")
    print("="*70 + "\n")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main pipeline: load → prepare → embed → evaluate → save."""
    print("\n" + "="*70)
    print("🚀 FURNITURE SEARCH MODEL - TRAINING & EVALUATION PIPELINE")
    print("="*70 + "\n")
    
    # Step 1: Load data
    data = load_dataset()
    
    # Step 2: Prepare corpus
    corpus = prepare_embedding_corpus(data)
    
    # Step 3: Generate embeddings
    embeddings_dict, corpus = generate_embeddings(corpus)
    
    # Step 4: Load model for inference
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    
    # Step 5: Generate synthetic test queries
    test_queries = generate_synthetic_queries(data)
    
    # Step 6: Evaluate model
    evaluation = evaluate_model(model, embeddings_dict, corpus, test_queries)
    
    # Step 7: Save all artifacts
    save_artifacts(model, embeddings_dict, corpus, evaluation)
    
    # Step 8: Print summary
    print_summary(evaluation)


if __name__ == "__main__":
    main()

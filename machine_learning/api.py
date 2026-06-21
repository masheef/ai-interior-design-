"""
Flask API Server - ML-Powered Furniture Search
Wraps inference.py to provide REST endpoints for semantic furniture retrieval.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from pathlib import Path
from typing import List, Dict, Any
import logging

# Import inference module
from inference import search_furniture, is_model_ready

# ============================================================================
# SETUP
# ============================================================================

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load furniture dataset for metadata
DATASET_PATH = Path(__file__).parent / "furniture_dataset.json"
FURNITURE_DATA = {}

def load_furniture_data():
    """Load furniture dataset for quick lookups."""
    global FURNITURE_DATA
    try:
        with open(DATASET_PATH, 'r') as f:
            data = json.load(f)
            for item in data['items']:
                FURNITURE_DATA[item['id']] = {
                    'name': item['name'],
                    'url': item['url'],
                    'thumbnail': item['thumbnail'],
                    'category': item['category'],
                    'polyHavenId': item['polyHavenId'],
                }
        logger.info(f"✓ Loaded {len(FURNITURE_DATA)} furniture items")
    except Exception as e:
        logger.error(f"❌ Failed to load furniture data: {e}")

load_furniture_data()


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    model_ready = is_model_ready()
    return jsonify({
        'status': 'ok' if model_ready else 'degraded',
        'model_ready': model_ready,
        'furniture_items': len(FURNITURE_DATA)
    }), 200 if model_ready else 503


# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@app.route('/api/search', methods=['POST'])
def semantic_search():
    """
    Semantic furniture search endpoint.
    
    Request body:
    {
        "query": "comfortable modern armchair",
        "top_k": 5,
        "threshold": 0.3
    }
    
    Response:
    {
        "success": true,
        "results": [
            {
                "id": "modern_armchair",
                "name": "Modern Armchair",
                "score": 0.754,
                "url": "/api/polyhaven/gltf/modern_arm_chair_01?res=2k",
                "thumbnail": "https://...",
                "category": "Seating",
                "polyHavenId": "modern_arm_chair_01"
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json() or {}
        query = data.get('query', '').strip()
        top_k = data.get('top_k', 5)
        threshold = data.get('threshold', 0.3)
        
        # Validate input
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query cannot be empty'
            }), 400
        
        if len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Query too short (minimum 2 characters)'
            }), 400
        
        # Perform semantic search
        matches = search_furniture(query, top_k=top_k, similarity_threshold=threshold)
        
        # Enrich results with metadata
        results = []
        for item_id, item_name, score in matches:
            if item_id in FURNITURE_DATA:
                item_data = FURNITURE_DATA[item_id]
                results.append({
                    'id': item_id,
                    'name': item_data['name'],
                    'score': round(score, 4),
                    'url': item_data['url'],
                    'thumbnail': item_data['thumbnail'],
                    'category': item_data['category'],
                    'polyHavenId': item_data['polyHavenId'],
                })
        
        return jsonify({
            'success': True,
            'query': query,
            'result_count': len(results),
            'results': results
        }), 200
    
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/batch-search', methods=['POST'])
def batch_search():
    """
    Batch search multiple queries at once.
    
    Request body:
    {
        "queries": [
            "comfortable armchair",
            "coffee table",
            "storage cabinet"
        ],
        "top_k": 3
    }
    """
    try:
        data = request.get_json() or {}
        queries = data.get('queries', [])
        top_k = data.get('top_k', 3)
        
        if not queries or not isinstance(queries, list):
            return jsonify({
                'success': False,
                'error': 'Queries must be a non-empty list'
            }), 400
        
        # Search for each query
        batch_results = []
        for query in queries:
            query = query.strip()
            if query:
                matches = search_furniture(query, top_k=top_k)
                enriched = []
                for item_id, item_name, score in matches:
                    if item_id in FURNITURE_DATA:
                        item_data = FURNITURE_DATA[item_id]
                        enriched.append({
                            'id': item_id,
                            'name': item_data['name'],
                            'score': round(score, 4),
                            'url': item_data['url'],
                        })
                batch_results.append({
                    'query': query,
                    'results': enriched
                })
        
        return jsonify({
            'success': True,
            'batch_count': len(batch_results),
            'batch_results': batch_results
        }), 200
    
    except Exception as e:
        logger.error(f"Batch search error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/search-by-tags', methods=['POST'])
def search_by_tags():
    """
    Search furniture by tags (simulates old findModelsByKeyTags behavior).
    
    Request body:
    {
        "tags": ["armchair", "leather", "modern"],
        "top_k": 5
    }
    """
    try:
        data = request.get_json() or {}
        tags = data.get('tags', [])
        top_k = data.get('top_k', 5)
        
        if not tags or not isinstance(tags, list):
            return jsonify({
                'success': False,
                'error': 'Tags must be a non-empty list'
            }), 400
        
        # Convert tags to a query string
        query = ' '.join(tags)
        matches = search_furniture(query, top_k=top_k)
        
        # Enrich results
        results = []
        for item_id, item_name, score in matches:
            if item_id in FURNITURE_DATA:
                item_data = FURNITURE_DATA[item_id]
                results.append({
                    'name': item_data['name'],
                    'id': item_id,
                    'score': round(score, 4),
                    'item': {
                        'url': item_data['url'],
                        'thumbnail': item_data['thumbnail'],
                        'category': item_data['category'],
                        'polyHavenId': item_data['polyHavenId'],
                    }
                })
        
        return jsonify({
            'success': True,
            'tags': tags,
            'results': results
        }), 200
    
    except Exception as e:
        logger.error(f"Tag search error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# METADATA ENDPOINTS
# ============================================================================

@app.route('/api/furniture/<furniture_id>', methods=['GET'])
def get_furniture_by_id(furniture_id: str):
    """Get a specific furniture item by ID."""
    if furniture_id in FURNITURE_DATA:
        return jsonify({
            'success': True,
            'furniture': FURNITURE_DATA[furniture_id]
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': f'Furniture ID "{furniture_id}" not found'
        }), 404


@app.route('/api/furniture', methods=['GET'])
def list_all_furniture():
    """Get all available furniture items (lightweight)."""
    items = [
        {
            'id': item_id,
            'name': data['name'],
            'category': data['category']
        }
        for item_id, data in FURNITURE_DATA.items()
    ]
    return jsonify({
        'success': True,
        'count': len(items),
        'items': items
    }), 200


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all furniture categories."""
    categories = set(data['category'] for data in FURNITURE_DATA.values())
    return jsonify({
        'success': True,
        'categories': sorted(list(categories))
    }), 200


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    if not is_model_ready():
        logger.error("❌ ML model not trained. Run train_and_evaluate.py first.")
        exit(1)
    
    logger.info("\n" + "="*70)
    logger.info("🚀 FURNITURE SEARCH API - Starting Server")
    logger.info("="*70)
    logger.info("📍 Base URL: http://localhost:5000")
    logger.info("🔍 API Endpoints:")
    logger.info("   POST /api/search              - Semantic search by query")
    logger.info("   POST /api/batch-search        - Batch search multiple queries")
    logger.info("   POST /api/search-by-tags      - Search by tags list")
    logger.info("   GET  /api/furniture           - List all furniture")
    logger.info("   GET  /api/furniture/<id>      - Get item by ID")
    logger.info("   GET  /api/categories          - List categories")
    logger.info("   GET  /health                  - Health check")
    logger.info("="*70 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True
    )

"""
Validation & Testing Script
Verifies ML pipeline is complete and working correctly.
Run: python validate_setup.py
"""

import sys
import json
from pathlib import Path

print("\n" + "="*70)
print("🔍 VALIDATING ML SETUP")
print("="*70 + "\n")

# ============================================================================
# CHECK 1: Required Files
# ============================================================================

print("✓ Checking required files...")
required_files = [
    "furniture_dataset.json",
    "train_and_evaluate.py",
    "inference.py",
    "api.py",
    "model_checkpoint/",
    "furniture_embeddings.pkl",
    "test_results.json",
]

for file in required_files:
    path = Path(file)
    exists = path.exists()
    status = "✓" if exists else "✗"
    print(f"  {status} {file}")
    if not exists:
        print(f"\n    ⚠️  Missing: {file}")
        if file == "model_checkpoint/":
            print("    → Run: python train_and_evaluate.py")

# ============================================================================
# CHECK 2: Import Inference Module
# ============================================================================

print("\n✓ Testing inference module...")
try:
    from inference import is_model_ready, search_furniture
    print("  ✓ Imported successfully")
    
    ready = is_model_ready()
    print(f"  ✓ Model ready: {ready}")
    
    if not ready:
        print("\n  ⚠️  Model not trained")
        print("    → Run: python train_and_evaluate.py")
except Exception as e:
    print(f"  ✗ Import failed: {e}")
    sys.exit(1)

# ============================================================================
# CHECK 3: Load Dataset
# ============================================================================

print("\n✓ Checking dataset...")
try:
    with open("furniture_dataset.json", "r") as f:
        data = json.load(f)
    
    count = len(data.get("items", []))
    print(f"  ✓ Dataset loaded: {count} items")
    
    if count != 53:
        print(f"  ⚠️  Expected 53 items, got {count}")
except Exception as e:
    print(f"  ✗ Dataset error: {e}")
    sys.exit(1)

# ============================================================================
# CHECK 4: Test Evaluation Results
# ============================================================================

print("\n✓ Checking evaluation results...")
try:
    with open("test_results.json", "r") as f:
        results = json.load(f)
    
    metrics = results.get("metrics", {})
    p1 = metrics.get("precision@1", 0)
    
    print(f"  ✓ Precision@1: {p1:.2%}")
    print(f"  ✓ NDCG@5: {metrics.get('ndcg@5', 0):.4f}")
    print(f"  ✓ MRR: {metrics.get('mean_reciprocal_rank', 0):.4f}")
    
    if p1 < 0.5:
        print(f"\n  ⚠️  Precision@1 is low ({p1:.2%})")
except Exception as e:
    print(f"  ✗ Evaluation error: {e}")
    sys.exit(1)

# ============================================================================
# CHECK 5: Test Inference (if model ready)
# ============================================================================

if ready:
    print("\n✓ Testing semantic search...")
    try:
        test_queries = [
            "comfortable armchair",
            "coffee table",
            "storage cabinet",
        ]
        
        for query in test_queries:
            results = search_furniture(query, top_k=1)
            if results:
                item_id, item_name, score = results[0]
                print(f"  ✓ '{query}' → {item_name} ({score:.4f})")
            else:
                print(f"  ✗ '{query}' → No results")
    except Exception as e:
        print(f"  ✗ Inference error: {e}")
        sys.exit(1)

# ============================================================================
# CHECK 6: Dependencies
# ============================================================================

print("\n✓ Checking Python dependencies...")
required_packages = [
    "sentence_transformers",
    "torch",
    "numpy",
    "scipy",
    "flask",
    "flask_cors",
]

missing = []
for package in required_packages:
    try:
        __import__(package.replace("_", "-"))
        print(f"  ✓ {package}")
    except ImportError:
        print(f"  ✗ {package}")
        missing.append(package)

if missing:
    print(f"\n  ⚠️  Missing packages: {', '.join(missing)}")
    print(f"  → Run: pip install {' '.join(missing)}")

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "="*70)
print("✅ VALIDATION COMPLETE")
print("="*70)

if ready and not missing:
    print("\n🚀 Ready to start API server:")
    print("   python api.py")
    print("\n🔧 Ready to integrate with React:")
    print("   1. Copy mlSearchService.ts to src/services/")
    print("   2. Update components to use mlSearchService")
    print("   3. Set REACT_APP_ML_API_URL in .env")
else:
    print("\n⚠️  Setup incomplete. Follow the suggestions above.")

print("\n📖 For detailed setup instructions:")
print("   Read: README.md")
print("   Read: INTEGRATION_GUIDE.md")
print("\n")

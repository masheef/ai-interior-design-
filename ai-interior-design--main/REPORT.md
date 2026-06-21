# Aura Home AI — Project Report

## Overview
- **What it does:** A web app that generates interior design plans from simple user inputs, creates photoreal visualizations and 3D assets, and lets users search a furniture catalog using plain English.
- **Who it's for:** Designers, product teams, or non-technical stakeholders who want automated design suggestions and fast visualizations.

## High-level architecture (plain language)
- **Frontend (React SPA):** Collects user input (room size, style, budget), builds prompts, shows AI suggestions, and visualizers. (Main entry: `src/App.tsx`.)
- **App Server (Node/Express):** Proxies 3D assets, forwards image uploads to a 3D-generation API, and provides a simple local persistence layer via an in-memory SQLite that can persist to disk. (See `server.ts`.)
- **ML Service (Python Flask):** A separate service that performs semantic furniture search using sentence-transformer embeddings. It serves endpoints like `/api/search` and `/api/search-by-tags`. (See `machine_learning/api.py` and `machine_learning/inference.py`.)
- **Catalog & Assets:** A built-in furniture catalog (`src/lib/furnitureCatalog.ts`) and helpers to fetch additional 3D assets from PolyHaven (`src/services/polyHavenService.ts`).

## User flow (step-by-step, non-technical)
1. User opens the app and provides room details (type, size, style, color, budget).
2. The app sends a natural-language prompt to a text-generation AI to create a structured design JSON (furniture list, placements, colors, insights).
3. The app displays the design; the user can request a photoreal render (AI image model) or a 3D model from a photo.
4. For 3D-from-image, the photo is uploaded to the server which forwards it to Stability AI; if that fails, the app matches the item to an existing model from the catalog or PolyHaven.
5. The user can save the design to Firestore (cloud) or to the local SQLite-backed API served by the Node server.

## ML pipeline explained simply
- **Goal:** Let users search the furniture library using plain English (e.g., "comfortable leather armchair").
- **Training data:** `machine_learning/furniture_dataset.json` (names, descriptions, tags for each item).
- **Text → Numbers:** Each item’s descriptive text is converted to a numeric vector called an embedding using the `all-MiniLM-L6-v2` Sentence-Transformer model. Similar meanings map to nearby points in this vector space.
- **Store artifacts:** Save embeddings and a local copy of the trained model (`furniture_embeddings.pkl` and `model_checkpoint/`).
- **Search (inference):** Convert user query to an embedding, compute cosine similarity to item embeddings, return top-K matches. Implemented in `machine_learning/inference.py` and exposed via Flask (`machine_learning/api.py`).

## ML algorithm details (clear, non-technical + technical)

- **Plain language:** We teach the app what each furniture item "means" by turning the item's description into a compact numeric fingerprint. When a user types a sentence, we turn that sentence into the same kind of fingerprint and then find the items whose fingerprints are closest — those are the matches you see.

- **Algorithm (technical):**
	- Model: `all-MiniLM-L6-v2` from Sentence-Transformers — a pre-trained transformer that maps text to 384-dimensional vectors (embeddings).
	- Training step: There is no heavy custom neural-network training here — we use the pre-trained `all-MiniLM-L6-v2` to encode dataset texts. The training script focuses on preparing rich embedding inputs from item metadata and evaluating retrieval quality.
	- Retrieval: Query embedding vs. item embeddings compared with cosine similarity (1 - cosine distance). Results are ranked by similarity and filtered by a threshold.
	- Evaluation: `train_and_evaluate.py` generates synthetic queries and computes Precision@K, MRR, and NDCG@K to measure how often the system returns useful items near the top.

## How the trained ML files work (what each file contains)

- `furniture_embeddings.pkl` (pickled artifact): contains a dictionary of `{ item_id: embedding_vector }` and the `corpus` list used to map ids back to names/text. The Flask API loads this file for fast, memory-resident search.
- `model_checkpoint/` (SentenceTransformer save): a lightweight copy of the embedding model saved by `SentenceTransformer.save()` so inference can use a local model instead of downloading from the internet.
- `test_results.json`: evaluation outputs (per-query results + aggregated metrics) created by `train_and_evaluate.py`.

## Full end-to-end pipeline (from user to model and back) — non-technical and technical views

### Non-technical flow (what a user-seen journey looks like)
1. The person enters room details and clicks "Generate" in the web app (`src/App.tsx`).
2. The app builds a natural-language instruction and sends it to the AI text/image service to produce a structured design.
3. The design is displayed. If the user searches the catalog or asks for a specific furniture item, the frontend calls the ML Search API.
4. The ML Search API converts the user's phrase into numbers and finds the closest furniture items, returning them to the app for display.

### Technical flow (component-level, what actually happens)

- Frontend (`src/App.tsx` / UI components):
	- Builds prompt and calls external GenAI via `GoogleGenAI` (client-side). Receives structured JSON and image data and updates state.
	- For furniture lookups, calls the client ML wrapper (`src/services/mlSearchService.ts`) which calls the Flask ML API.

- Server (`server.ts`):
	- Proxies PolyHaven glTF files via `GET /api/polyhaven/gltf/:modelId` to rewrite URIs for browser consumption.
	- Provides `POST /api/stability/3d` to send images to Stability AI and return glTF binary.
	- Offers `POST /api/designs` and `GET /api/designs/:userId` backed by sql.js/`database.sqlite` for local persistence.

- ML Service (Flask) (`machine_learning/api.py` + `inference.py`):
	- On startup, the Flask service loads `furniture_embeddings.pkl` (embeddings and corpus) and the `SentenceTransformer` from `model_checkpoint/`.
	- When the endpoint `POST /api/search` receives a query, the service encodes the query with the local `SentenceTransformer` model to get a query embedding.
	- The service computes cosine similarity between the query embedding and each stored item embedding; it sorts and returns top-K results as JSON.

- Data & artifacts path summary:
	- Input data: `machine_learning/furniture_dataset.json` → processed into corpus texts.
	- Artifacts: `machine_learning/furniture_embeddings.pkl`, `machine_learning/model_checkpoint/`, `machine_learning/test_results.json`.

### Connection & deployment notes
- The frontend expects the ML API at `http://localhost:5000` by default (see `src/services/mlSearchService.ts`). If you deploy the ML API elsewhere, update `REACT_APP_ML_API_URL` or the `API_BASE_URL` constant.
- The Express server proxies PolyHaven and runs on port 3000 in dev. Vite middleware is used during development so the React app + server run together.

---
Updated ML & pipeline sections added to make the model, artifacts, and data flow clear for both technical and non-technical audiences.


## Key algorithms & metrics (concise)
- **Embedding model:** `all-MiniLM-L6-v2` (sentence-transformers) — compact and fast (384 dims).
- **Similarity:** Cosine similarity between query and item embeddings.
- **Evaluation metrics (training script):** Precision@K, Mean Reciprocal Rank (MRR), NDCG@K. These are computed in `machine_learning/train_and_evaluate.py` and saved to `test_results.json`.

## Important files to show a non-technical person
- `src/App.tsx` — main UI and orchestration (collect inputs, call AI, display results).
- `src/components/SpatialLab.tsx` — upload photo → generate 3D asset or find matching model.
- `server.ts` — backend routes: PolyHaven proxy, 3D generation endpoint, local save/load of designs.
- `machine_learning/train_and_evaluate.py` — training & evaluation pipeline (creates embeddings and evaluation report).
- `machine_learning/inference.py` & `machine_learning/api.py` — search engine and API wrapper.

## How to run the project (copy-paste commands)

Frontend + Node server (development):
```bash
cd ai-interior-design--main
npm install
npm run dev
```

ML service (train &1245 run):
```bash
cd machine_learning
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_and_evaluate.py   # produces embeddings + model checkpoint
python api.py                  # starts ML API on port 5000
```

## Environment variables / secrets (what to set)
- `GEMINI_API_KEY` — required by the frontend to call Google GenAI for text & images.
- `STABILITY_API_KEY` — required by `server.ts` to call Stability AI for 3D generation.
- Firebase credentials — stored in `firebase-applet-config.json` if you want cloud saves.

## Common failure points & non-technical fixes
- Missing ML artifacts (`furniture_embeddings.pkl` or `model_checkpoint`): run `python train_and_evaluate.py` in `machine_learning`.
- Missing API keys: visualizations or 3D generation will fail. Add the keys to the runtime environment.
- Stability AI quota/credits exhausted: 3D generation will fail — the app falls back to searching the catalog and PolyHaven for close matches.

## Artifacts & outputs
- `machine_learning/furniture_embeddings.pkl` — embeddings + corpus metadata.
- `machine_learning/model_checkpoint/` — model files for fast inference.
- `machine_learning/test_results.json` — per-query evaluation and aggregated metrics.
- `database.sqlite` — created by the Node server to persist local saved designs.

## Non-technical summary to present verbally (3 lines)
1. "The app asks a smart AI to design a room from a few inputs, then shows a list of furniture, colors and placement ideas."  
2. "It can create photorealistic renders and convert a photo into a 3D object, or find a matching model from our catalog."  
3. "Search works with plain English because we converted item descriptions into numeric fingerprints and match by similarity."

---
If you want, I can also:
- Add a short `README-NONTECH.md` that distills this report into talking points for demos.
- Run the ML training here and confirm artifacts are produced.

REPORT created on: 2026-06-03

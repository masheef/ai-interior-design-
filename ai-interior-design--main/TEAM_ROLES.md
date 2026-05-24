# Aura Spatial Design Studio - Team Roles & Roadmap

## Group Members & Responsibilities

### 🎨 Project Lead: [User]
* **Role:** Lead Designer & System Architect
* **Tasks:** UI/UX consistency, core feature integration, architectural decisions, and brand identity.

### 📦 Dataset Collection: Amra
* **Role:** Asset Curator
* **Tasks:** Sourcing 3D models (GLB format) from Free3D, Sketchfab, and Khronos. Verifying license compatibility and aesthetic fit.

### 🛠️ Dataset Integration: Nuha
* **Role:** Data Engineer
* **Tasks:** Integrating sourced assets into `furnitureCatalog.ts`. Managing the Firestore structure for the "Spatial Library."

### 🧠 AI Model Training: Thakreeth
* **Role:** AI/Prompt Engineer
* **Tasks:** Refining the Gemini API prompts. Training the AI on spatial constraints, room-specific furniture density, and style accuracy.

### 🔦 Technical Data Specialist: Hudha
* **Role:** Rendering & QA Engineer
* **Tasks:** Validating PBR materials, fixing texture loading issues, and ensuring model-viewer compatibility across assets.

### 📱 PWA & Performance: Mubashira
* **Role:** Optimization Lead
* **Tasks:** Configuring service workers, maximizing cache efficiency for 3D models, and ensuring AR performance on mobile devices.

---

## Technical Goals
1. **Library Expansion:** Reach 50+ verified architectural assets (Including Free3D Modern Couch).
2. **Spatial Logic:** Fine-tuned via few-shot training on `ellljoy/interior-design` dataset.
3. **Dataset Streaming:** Live Hugging Face API integration implemented in the Discovery view.
4. **Mobile First:** Achieve a 90+ performance score on Lighthouse for the PWA.

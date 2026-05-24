# Software Requirements Specification (SRS) - Aura Spatial Design Studio

## 1. Project Overview
**Aura Spatial Design Studio** is a professional-grade, AI-powered platform designed for interior designers, architects, and home enthusiasts. It leverages generative AI to conceptualize spaces and Augmented Reality (AR) to visualize furniture and decor in real-world environments.

---

## 2. Target Audience
- **Interior Designers:** For rapid prototyping of spatial concepts.
- **Homeowners:** Visualizing furniture purchases before buying.
- **Architectural Visualizers:** Exploring material finishes and lightning in a 3D context.

---

## 3. Functional Requirements

### 3.1 AI Design Studio (The "AI Brain")
- **Conceptual Greeting:** Users engage with a Gemini-powered terminal to describe their spatial vision (e.g., "Minimalist Zen garden bedroom").
- **Smart Suggestions:** The AI provides real-time design prescriptions, suggesting color palettes, materials, and specific furniture types.
- **Concept Generation:** Integration with AI vision models to generate visual moodboards from text prompts.

### 3.2 3D Asset Library
- **Curated Catalog:** Access to high-quality glTF 3D models (Sofas, Lamps, Tables, etc.).
- **Metadata Search:** Ability to filter assets by architectural category.
- **Thumbnail Previews:** High-resolution visual cards for each asset in the library.

### 3.3 Augmented Reality (AR) Visualization
- **WebXR Integration:** Direct-to-browser AR viewing without needing a native mobile app.
- **Placement Logic:** Smart floor/wall detection for realistic object anchoring.
- **Measurement Tool:** On-screen rulers to calculate real-world dimensions between virtual points.

### 3.4 Material Fabrication Lab
- **Real-time Shaders:** Ability to modify 3D model properties in real-time.
- **Parameters:**
    - **Core Pigment:** Hex color modification.
    - **Metallic Factor:** Adjusting sheen from matte to chrome.
    - **Roughness Factor:** Controlling surface texture from polished to coarse.
- **Persistence:** Saving customized material states to the user's project history.

### 3.5 User History & Identity
- **Google Authentication:** Secure login via Firebase Auth.
- **Cloud Persistence:** Saving design drafts and customized assets to Firestore.
- **Project Snapshots:** Capturing AR "photos" of virtual placements for later review.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Low Latency AR:** 3D models must load within 3 seconds on standard mobile connections.
- **Smooth Animation:** UI transitions should maintain 60FPS using `motion`.

### 4.2 Security
- **Data Privacy:** Personal design history must be isolated using Firestore Security Rules.
- **Auth Integrity:** MFA-ready login via Google Identity.

### 4.3 Scalability
- **Serverless Architecture:** Deployment on Cloud Run for handling varying traffic loads.
- **NoSQL Scaling:** Using Firestore for elastic data storage.

---

## 5. Technical Stack
- **Frontend:** React 18+ with TypeScript.
- **Styles:** Tailwind CSS (Modern Architectural Aesthetic).
- **Animation:** `motion/react`.
- **3D/AR Engine:** Google `<model-viewer>` (WebXR).
- **Backend:** Firebase (Auth & Firestore).
- **AI Core:** Google Gemini API (Text & Vision).

---

## 6. Implementation Timeline (Current MVP Phase)
- [x] Base 3D Visualization
- [x] AI Chat Concept Studio
- [x] Material Modification Engine
- [x] Firebase Data Persistence
- [ ] Multi-user Collaborative Design Sessions (Planned)

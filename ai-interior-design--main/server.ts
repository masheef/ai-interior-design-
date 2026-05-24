import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import initSqlJs from "sql.js";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
  });

  // Initialize SQLite via sql.js (pure JS, no native deps)
  const SQL = await initSqlJs();
  let db: any;
  const dbPath = path.join(process.cwd(), "database.sqlite");
  try {
    const buf = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
    db = new SQL.Database(buf);
  } catch (e) {
    console.warn("Could not load database, creating in-memory");
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS designs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT,
      roomType TEXT,
      params TEXT,
      suggestion TEXT,
      previewImage TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Poly Haven glTF proxy - rewrites texture URIs to absolute CDN URLs
  app.get("/api/polyhaven/gltf/:modelId", async (req, res) => {
    const { modelId } = req.params;
    const resolution = (req.query.res as string) || "2k";

    try {
      // Get the file manifest from Poly Haven API
      const manifestRes = await axios.get(`https://api.polyhaven.com/files/${modelId}`);
      const manifest = manifestRes.data;

      if (!manifest.gltf?.[resolution]?.gltf) {
        return res.status(404).json({ error: `No glTF found for ${modelId} at ${resolution}` });
      }

      const gltfInfo = manifest.gltf[resolution].gltf;
      const gltfUrl = gltfInfo.url;
      const includes = gltfInfo.include || {};

      // Fetch the glTF file
      const gltfRes = await axios.get(gltfUrl, { responseType: 'json' });
      const gltfData = gltfRes.data;

      // Rewrite texture URIs in the glTF to absolute URLs
      if (gltfData.images) {
        for (const image of gltfData.images) {
          if (image.uri && !image.uri.startsWith('http') && !image.uri.startsWith('data:')) {
            const matchedKey = Object.keys(includes).find(k => k.endsWith(image.uri) || k === image.uri);
            if (matchedKey && includes[matchedKey]?.url) {
              image.uri = includes[matchedKey].url;
            }
          }
        }
      }

      // Also rewrite buffer URIs
      if (gltfData.buffers) {
        for (const buffer of gltfData.buffers) {
          if (buffer.uri && !buffer.uri.startsWith('http') && !buffer.uri.startsWith('data:')) {
            const matchedKey = Object.keys(includes).find(k => k.endsWith(buffer.uri) || k === buffer.uri);
            if (matchedKey && includes[matchedKey]?.url) {
              buffer.uri = includes[matchedKey].url;
            }
          }
        }
      }

      res.json(gltfData);
    } catch (error: any) {
      console.error("Poly Haven proxy error:", error.message);
      res.status(500).json({ error: "Failed to fetch Poly Haven model" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", persistence: "sqljs", dbPath });
  });

  // Stability AI Stable Fast 3D Integration
  app.post("/api/stability/3d", upload.single("image"), async (req: any, res: any) => {
    const apiKey = process.env.STABILITY_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "STABILITY_API_KEY not configured" });
    }

    try {
      let imageBuffer: Buffer;
      let filename: string;
      let contentType: string;

      if (req.file) {
        imageBuffer = req.file.buffer;
        filename = req.file.originalname;
        contentType = req.file.mimetype;
      } else if (req.body.image_url) {
        const imageRes = await axios.get(req.body.image_url, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(imageRes.data);
        filename = "input.png";
        contentType = (imageRes.headers['content-type'] as string) || 'image/png';
      } else {
        return res.status(400).json({ error: "No image file or URL provided" });
      }

      const formData = new FormData();
      formData.append("image", imageBuffer, { filename, contentType });
      formData.append("texture_resolution", "512");

      const response = await axios.post(
        "https://api.stability.ai/v1/generation/stable-fast-3d",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "model/gltf-binary",
          },
          responseType: "arraybuffer",
        }
      );

      res.setHeader("Content-Type", "model/gltf-binary");
      res.send(response.data);
    } catch (error: any) {
      let errorData = error.response?.data;
      
      if (errorData && (Buffer.isBuffer(errorData) || errorData instanceof ArrayBuffer)) {
        try {
          const buffer = Buffer.isBuffer(errorData) ? errorData : Buffer.from(errorData);
          errorData = buffer.toString('utf8');
          if (errorData.trim().startsWith('{')) {
            errorData = JSON.parse(errorData);
          }
        } catch (e) {
          errorData = "Error parsing response buffer";
        }
      }

      console.error("Stability 3D Error:", errorData || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "Stability AI Generation Failed",
        details: typeof errorData === 'string' ? errorData : JSON.stringify(errorData) || error.message,
        raw: errorData 
      });
    }
  });

  // Save a design
  app.post("/api/designs", (req, res) => {
    const { id, userId, name, roomType, params, suggestion, previewImage } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO designs (id, userId, name, roomType, params, suggestion, previewImage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([id, userId, name, roomType, JSON.stringify(params), JSON.stringify(suggestion), previewImage]);
      // Persist to disk after write
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error saving design:", error);
      res.status(500).json({ error: "Failed to save design" });
    }
  });

  // Get user designs
  app.get("/api/designs/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const stmt = db.prepare("SELECT * FROM designs WHERE userId = ? ORDER BY createdAt DESC");
      const rows = stmt.all([userId]);
      const designs = rows.map((d: any) => ({
        ...d,
        params: JSON.parse(d.params),
        suggestion: JSON.parse(d.suggestion)
      }));
      res.json(designs);
    } catch (error) {
      console.error("Error fetching designs:", error);
      res.status(500).json({ error: "Failed to fetch designs" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server failed to start:", err);
  process.exit(1);
});

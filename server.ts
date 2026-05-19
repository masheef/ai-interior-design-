import express from "express";
import path from "path";
import cors from "cors";
import Database from "better-sqlite3";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup Multer for memory storage
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // Initialize SQLite Database
  // Fallback to /tmp if the current directory is not writable (common in some container environments)
  let dbPath = path.join(process.cwd(), "database.sqlite");
  try {
    const db = new Database(dbPath);
    db.close();
  } catch (e) {
    console.warn("Could not create database in root, falling back to /tmp");
    dbPath = path.join("/tmp", "database.sqlite");
  }
  
  const db = new Database(dbPath);
  
  // Create tables if they don't exist
  db.exec(`
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
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", persistence: "local-sqlite", dbPath });
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
      formData.append("image", imageBuffer, {
        filename,
        contentType,
      });
      formData.append("texture_resolution", "512");

      const response = await axios.post(
        "https://api.stability.ai/v2beta/3d/stable-fast-3d",
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
      
      // Convert Buffer/ArrayBuffer to string if necessary
      if (errorData && (Buffer.isBuffer(errorData) || errorData instanceof ArrayBuffer)) {
        try {
          const buffer = Buffer.isBuffer(errorData) ? errorData : Buffer.from(errorData);
          errorData = buffer.toString('utf8');
          // Try to parse as JSON if it looks like JSON
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
      stmt.run(id, userId, name, roomType, JSON.stringify(params), JSON.stringify(suggestion), previewImage);
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
      const designs = stmt.all(userId).map((d: any) => ({
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

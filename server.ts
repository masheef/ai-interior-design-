import express from "express";
import path from "path";
import cors from "cors";
import Database from "better-sqlite3";

async function startServer() {
  const app = express();
  const PORT = 3000;

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

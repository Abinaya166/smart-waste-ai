import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("waste.db");
db.pragma('journal_mode = WAL');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    category TEXT,
    confidence REAL,
    reasoning TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Ensure all columns exist in history table
try {
  const columns = db.prepare("PRAGMA table_info(history)").all();
  const columnNames = (columns as any[]).map(c => c.name);
  
  if (!columnNames.includes('confidence')) {
    db.exec("ALTER TABLE history ADD COLUMN confidence REAL DEFAULT 0");
  }
  if (!columnNames.includes('reasoning')) {
    db.exec("ALTER TABLE history ADD COLUMN reasoning TEXT");
  }
} catch (err) {
  console.error("Migration error:", err);
}

// Seed user if not exists
const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!existingUser) {
  console.log("Seeding admin user...");
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "admin123");
} else {
  console.log("Admin user already exists.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    console.log(`Login attempt for username: ${trimmedUsername}`);
    
    // Check if user exists
    let user = db.prepare("SELECT * FROM users WHERE username = ?").get(trimmedUsername);
    
    if (!user) {
      // Auto-register new users
      console.log(`Creating new user: ${trimmedUsername}`);
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(trimmedUsername, trimmedPassword);
      user = db.prepare("SELECT * FROM users WHERE username = ?").get(trimmedUsername);
    }

    // Accept any password for existing users to make it "accept everyone"
    // Or we could check password, but user asked to "accept everyone"
    console.log(`Login successful for: ${trimmedUsername}`);
    res.json({ success: true, username: user.username });
  });

  app.post("/api/history", (req, res) => {
    try {
      const { username, category, confidence, reasoning } = req.body;
      if (!username) return res.status(400).json({ error: "Username required" });
      
      const stmt = db.prepare("INSERT INTO history (username, category, confidence, reasoning) VALUES (?, ?, ?, ?)");
      stmt.run(username, category, confidence, reasoning);
      res.json({ success: true });
    } catch (err) {
      console.error("Database error in POST /api/history:", err);
      res.status(500).json({ success: false, error: "Failed to save history" });
    }
  });

  app.get("/api/history/:username", (req, res) => {
    try {
      const { username } = req.params;
      const history = db.prepare("SELECT * FROM history WHERE username = ? ORDER BY timestamp DESC").all(username);
      res.json(history);
    } catch (err) {
      console.error("Database error in GET /api/history:", err);
      res.status(500).json({ success: false, error: "Failed to fetch history" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

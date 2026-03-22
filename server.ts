import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for downloading the app as ZIP
  app.get("/api/download-app", (req, res) => {
    try {
      const zip = new AdmZip();
      const rootDir = process.cwd();
      
      // Add files and folders to zip, excluding node_modules, dist, etc.
      const items = fs.readdirSync(rootDir);
      
      items.forEach(item => {
        const itemPath = path.join(rootDir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          if (!['node_modules', 'dist', '.git', '.next', '.gemini'].includes(item)) {
            zip.addLocalFolder(itemPath, item);
          }
        } else {
          // Add individual files
          if (!['.DS_Store'].includes(item)) {
            zip.addLocalFile(itemPath);
          }
        }
      });

      const zipBuffer = zip.toBuffer();
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=mi-studio-source.zip',
        'Content-Length': zipBuffer.length
      });
      
      res.send(zipBuffer);
    } catch (error) {
      console.error("Error creating zip:", error);
      res.status(500).send("Failed to generate zip file.");
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

startServer();

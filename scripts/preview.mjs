import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8000);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    let filePath = path.join(root, requestPath);
    if (!filePath.startsWith(root)) throw new Error("Invalid path");

    const stats = await fs.stat(filePath).catch(() => null);
    if (stats?.isDirectory()) filePath = path.join(filePath, "index.html");

    const data = await fs.readFile(filePath).catch(async () => {
      response.statusCode = 404;
      return fs.readFile(path.join(root, "404.html"));
    });
    response.setHeader("Content-Type", mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    response.end(data);
  } catch (error) {
    response.statusCode = 500;
    response.end(error.message);
  }
});

server.listen(port, () => {
  console.log(`Portfolio preview: http://localhost:${port}`);
  console.log("Press Control+C to stop.");
});

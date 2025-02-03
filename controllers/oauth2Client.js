import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define paths
const CREDENTIALS_PATH = path.resolve(__dirname, "../client_secret.json");
const TOKEN_PATH = path.resolve(__dirname, "../token.json");

async function loadOAuthClient() {
  try {
    // Load credentials
    const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf8"));
    const { client_secret, client_id, redirect_uris } = credentials.web;

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Try to load token.json
    try {
      const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf8"));
      oauth2Client.setCredentials(token);
      console.log("✅ Token loaded successfully!");
    } catch (err) {
      console.log("⚠ No existing token found. Please authenticate manually.");
    }

    return oauth2Client;
  } catch (err) {
    console.error("❌ Error loading OAuth Client:", err.message);
    throw err;
  }
}

export { loadOAuthClient };

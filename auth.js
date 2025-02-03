import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CREDENTIALS_PATH = path.resolve(__dirname, "client_secret.json");
const TOKEN_PATH = path.resolve(__dirname, "token.json");

async function authenticate() {
  console.log("🔍 Reading credentials...");

  try {
    const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf8"));
    console.log("✅ Credentials loaded successfully.");

    const { client_secret, client_id, redirect_uris } = credentials.web; // Use "web" instead of "installed"
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if token.json exists
    try {
      const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf8"));
      oauth2Client.setCredentials(token);
      console.log("✅ Using saved token from token.json.");
      return oauth2Client;
    } catch (err) {
      console.log("⚠️ No saved token found. Need to authenticate.");
    }

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/youtube.upload"],
    });

    console.log("\n🌍 Open this URL in your browser to authenticate:");
    console.log(authUrl);

    // Ask user for auth code
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\n🔑 Enter the code from that page here: ", async (code) => {
      console.log("🔄 Exchanging code for tokens...");
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
      console.log("✅ Authentication successful! Tokens saved to token.json.");
      
      rl.close();
    });

    return oauth2Client;
  } catch (err) {
    console.error("❌ Error in authentication:", err.message);
  }
}

// Call authenticate function when running auth.js
authenticate();

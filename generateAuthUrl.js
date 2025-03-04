import { google } from "googleapis";
import fs from "fs/promises";

// Load your credentials JSON file asynchronously
const credentials = JSON.parse(
  await fs.readFile(new URL("calendor_auth.json", import.meta.url))
);

const { client_id, client_secret, redirect_uris } = credentials.web;

// Initialize OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] // Use the first redirect URI
);

// Generate Auth URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/calendar.events"],
});

console.log("Authorize this app by visiting this URL:", authUrl);

// Wait for the authorization code (You can set up a simple HTTP server to capture it)

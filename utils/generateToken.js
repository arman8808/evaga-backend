import fs from "fs/promises";
import readline from "readline";
import { google } from "googleapis";

const CLIENT_SECRET_PATH = "./client_secret.json"; // Path to your client_secret.json
const TOKEN_PATH = "./token.json"; // Path to save the token
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]; // Scopes for YouTube API

const generateToken = async () => {
  try {
    // Load client credentials
    const credentials = JSON.parse(await fs.readFile(CLIENT_SECRET_PATH, "utf-8"));
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Generate authentication URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("Authorize this app by visiting this URL:");
    console.log(authUrl);

    // Wait for the user to provide the authorization code
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the code from the page here: ", async (code) => {
      try {
        // Get the token
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save the token to a file
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log("Token stored to", TOKEN_PATH);
        rl.close();
      } catch (error) {
        console.error("Error retrieving access token:", error.message);
        rl.close();
      }
    });
  } catch (error) {
    console.error("Error generating token:", error.message);
  }
};

generateToken();

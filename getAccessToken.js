import { google } from "googleapis";
import fs from "fs/promises";

const code =
  "4/0AQSTgQGakb_6BjkwZpIxOhRyqRQMploC2guitzYbO0EBs0rVGZDwPAEy6fyGMQf6_PnfNg";

// Load credentials.json
const credentials = JSON.parse(
  await fs.readFile(new URL("calendor_auth.json", import.meta.url))
);

const { client_id, client_secret, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

try {
  // Exchange the code for tokens
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Save tokens to tokens.json
  await fs.writeFile("calendor_tokens.json", JSON.stringify(tokens, null, 2));
  console.log("Tokens saved to tokens.json");

  console.log("Access Token:", tokens);
} catch (err) {
  console.error("Error retrieving access token:", err);
}

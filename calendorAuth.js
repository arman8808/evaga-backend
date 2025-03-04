import { google } from "googleapis";
import fs from "fs/promises";

const credentials = JSON.parse(
  await fs.readFile(new URL("credentials.json", import.meta.url))
);

const { client_id, client_secret, redirect_uris } = credentials.web;


const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] 
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/calendar.events"],
});

console.log("Authorize this app by visiting this URL:", authUrl);


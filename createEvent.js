import { google } from "googleapis";
import fs from "fs/promises";

// Function to initialize the OAuth2 client
async function initializeOAuth2Client() {
  const credentials = JSON.parse(
    await fs.readFile(new URL("calendor_auth.json", import.meta.url))
  );
  const { client_id, client_secret, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const tokens = JSON.parse(await fs.readFile("calendor_tokens.json", "utf8"));
  oAuth2Client.setCredentials(tokens);

  return oAuth2Client;
}

// Function to create an event
export async function createEvent(eventData) {
  try {
    const auth = await initializeOAuth2Client();
    const calendar = google.calendar({ version: "v3", auth });

    const res = await calendar.events.insert({
      calendarId: "primary",
      resource: eventData,
      sendUpdates: "all", 
    });

    return res.data;
  } catch (err) {
    console.error("Error creating event:", err);
    throw err;
  }
}

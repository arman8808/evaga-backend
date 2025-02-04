import { google } from "googleapis";
import fs from "fs";
import { loadOAuthClient } from "./oauth2Client.js"; // Corrected import

async function uploadToYouTube(filePath, title, description) {
  console.log(`📤 Uploading: ${title}`);

  try {
    const oauth2Client = await loadOAuthClient(); // Corrected function name
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus: "public" },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    console.log("YouTube Response:", response.data);

    return `https://www.youtube.com/watch?v=${response.data.id}`; 
  } catch (err) {
    console.error("❌ YouTube Upload Error:", err.message);
    throw err;
  }
}

export { uploadToYouTube };

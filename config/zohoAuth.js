import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.Zoho_client_id;
const CLIENT_SECRET = process.env.Zoho_client_Secret;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

let ACCESS_TOKEN = "";


export const getAccessToken = async (authCode) => {
  try {
    const response = await axios.post("https://accounts.zoho.in/oauth/v2/token", null, {
      params: {
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code"
      }
    });

    console.log("Access Token:", response.data.access_token);
    console.log("Refresh Token:", response.data.refresh_token); // Save this for future use

    ACCESS_TOKEN = response.data.access_token;
    return response.data;
  } catch (error) {
    console.error("Error fetching access token:", error.response?.data || error.message);
  }
};


export const refreshAccessToken = async () => {
  try {
    const response = await axios.post("https://accounts.zoho.in/oauth/v2/token", null, {
      params: {
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token"
      }
    });

    ACCESS_TOKEN = response.data.access_token;
    console.log("New Access Token:", ACCESS_TOKEN);
    return ACCESS_TOKEN;
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
  }
};


export const authMiddleware = async (req, res, next) => {
  if (!ACCESS_TOKEN) {
    await refreshAccessToken();
  }
  next();
};

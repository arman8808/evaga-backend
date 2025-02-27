import { google } from "googleapis";
import { JWT } from "google-auth-library";
import fs from "fs";

// import key from "../calendar-452010-bb6c9bbc15ce.json" assert { type: "json" };
// let key;

// const auth = new JWT({
//   email: key.client_email,
//   key: key.private_key,
//   scopes: ["https://www.googleapis.com/auth/calendar"],
// });

// const calendar = google.calendar({ version: "v3", auth });

async function addOrderToCalendar(orderDetails) {
  // try {
  //   const event = {
  //     summary: `Order: ${orderDetails.orderId}`,
  //     description: `Order Details: ${orderDetails.description}`,
  //     start: {
  //       dateTime: orderDetails.date, // ISO format: YYYY-MM-DDTHH:mm:ss
  //       timeZone: "UTC",
  //     },
  //     end: {
  //       dateTime: orderDetails.date, // Add duration if needed
  //       timeZone: "UTC",
  //     },
  //   };

  //   const response = await calendar.events.insert({
  //     calendarId: "primary", // Admin's calendar
  //     resource: event,
  //   });

  //   console.log("Event created:", response);

  //   // Optionally, send an email notification to the vendor
  //   sendEmailNotification(orderDetails, response.data.htmlLink);
  // } catch (error) {
  //   console.error("Error adding event:", error);
  // }
}



export { addOrderToCalendar };

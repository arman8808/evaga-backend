import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();
export const getDistance = async (req, res) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination pincodes are required' });
    }

    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        console.log(apiKey);
        
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
        
        const response = await axios.get(url);
        const data = response.data;

        if (data.status !== 'OK') {
            return res.status(500).json({ error: 'Error fetching distance data', details: data });
        }

        const distance = data.rows[0].elements[0].distance.text;
        const duration = data.rows[0].elements[0].duration.text;

        res.json({
            origin,
            destination,
            distance,
            duration,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from Google Maps API', details: error.message });
    }
};

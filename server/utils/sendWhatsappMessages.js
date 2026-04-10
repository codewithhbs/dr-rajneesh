require("dotenv").config();
const axios = require("axios");

const sendWhatsApp = async ({ mobile, msg, pdf = "", img1 = "", img2 = "" }) => {
    try {

        const response = await axios.get(process.env.API_WAPP_URL, {
            params: {
                apikey: process.env.API_WAPP_KEY,
                mobile,
                msg,
                pdf,
                img1,
                img2
            }
        });

        return response.data;

    } catch (error) {
        console.error("WhatsApp API Error:", error.message);
        return {
            status: "error",
            msg: "Failed to send WhatsApp message"
        };
    }
};

module.exports = {
    sendWhatsApp
};
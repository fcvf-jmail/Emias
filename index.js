const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
require("dotenv").config({path: path.join(__dirname, ".env")})

const bot = new Telegraf(process.env.botToken);
const chatId = '1386450473';

const responseFile = 'previousResponse.json';


async function fetchDoctorInfo() {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://emias.info/api-ng/v3/saOrchestrator/getDoctorsInfo',
            headers: {
                'Host': 'emias.info',
                'Cookie': process.env.sessionCookie,
                'accept': '*/*',
                'content-type': 'application/json',
                'x-app': 'ios',
                'user-agent': 'EMIAS.INFO/172615771 CFNetwork/1498.700.2 Darwin/23.6.0',
                'accept-language': 'ru',
                'x-app-version': '7.16.1 (172615771)',
            },
            data: {
                birthDate: process.env.birthDate,
                omsNumber: process.env.omsNumber,
                referralId: process.env.referalId
            },
            decompress: true,
        });

        const newResponseBody = response.data;
        checkAndUpdateResponse(newResponseBody);
    } 
    catch (error) {
        console.error('Error fetching doctor info:', error);
    }
}

function checkAndUpdateResponse(newResponseBody) {
    let previousResponseBody;

    if (fs.existsSync(responseFile)) previousResponseBody = JSON.parse(fs.readFileSync(responseFile, 'utf-8'));

    if (JSON.stringify(newResponseBody) == JSON.stringify(previousResponseBody)) return
    
    console.log('Response has changed!');
    fs.writeFileSync(responseFile, JSON.stringify(newResponseBody));
    sendTelegramNotification(newResponseBody);
}

function sendTelegramNotification(newBody) {
    const message = `The response body has changed:\n\n<code>${JSON.stringify(newBody, null, 4)}</code>`;
    bot.telegram.sendMessage(chatId, message, {parse_mode: "HTML"}).catch((error) => console.error('Error sending Telegram message:', error));
}

setInterval(fetchDoctorInfo, 10 * 1000);

fetchDoctorInfo();
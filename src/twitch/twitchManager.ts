import { config } from "../config.ts";
import p from '../database/database.ts'
import axios from 'axios';
import qs from 'qs';
import {DateTime} from 'luxon'




const CLIENT_ID = config.TCLIENT_ID
const SECRET = config.SECRET


const CHECK_INTERVAL = 3600000; // 1 Stunde in Millisekunden

// Hilfsfunktion, die eine asynchrone Wartezeit erstellt
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function mainLoop() {
    try {
        console.log("Starte Haupt-Schleife...");

        // Überprüft den Token und erneuert ihn bei Bedarf
        await checkDBEntry();

        // Überprüfe die Streams, nachdem der Token gecheckt wurde
        // Warte 3 Sekunden, bevor du die Streams abfragst
        // await delay(3000); 
        // await getStreams("dein_streamer_name"); // Ersetze "dein_streamer_name"

    } catch (error) {
        console.error("Ein Fehler ist in der Haupt-Schleife aufgetreten:", error);
    } finally {
        // Rufe die Haupt-Schleife nach einer bestimmten Zeit wieder auf
        setTimeout(mainLoop, 3000);
    }
}



async function checkDBEntry() {
    console.log("DB Entry check")
    let token = ""
    let expireTime = ""
    const twitchSetup = await p.twitchSetup.findMany()
    const extract = twitchSetup[0]
    token = extract.access_token
    expireTime = extract.token_expire_time;
    const now = DateTime.now().toISO()

    if (now >= expireTime || !twitchSetup) {
        getTwitchToken()
    } else {
        console.log("No Token Renewal required")
    }
}





async function getTwitchToken() {
    const data = qs.stringify({
        'client_id': CLIENT_ID,
        'client_secret': SECRET,
        'grant_type': 'client_credentials'
    });

    try {
        const response = await axios.request({
            method: 'post',
            url: 'https://id.twitch.tv/oauth2/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data
        });

        const access_token = response.data.access_token;
        const access_token_expire = response.data.expires_in;
        const now = DateTime.now().toUTC()
        const expireTime = now.plus({seconds: access_token_expire})
        const dbTime = expireTime.toISO()


        console.log(`AccessToken: ${access_token} and expire in ${access_token_expire}`);
        
        await p.twitchSetup.upsert({
            create: {
                entry: "entry", // Assuming 'entry' is a unique identifier
                access_token: access_token,
                token_expire_time: dbTime
            }, 
            update: {
                access_token: access_token,
                token_expire_time: dbTime
            }, 
            where: {
                entry: "entry"
            }
        });
        
        console.log("Database updated successfully.");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function getStreams(streamer: string) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.twitch.tv/helix/streams?user_login=handofblood',
        headers: { 
            'Authorization': 'Bearer {bearer}', 
            'Client-Id': CLIENT_ID
        }
        };

        axios.request(config)
        .then((response) => {
        console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
        console.log(error);
        });

}

mainLoop()
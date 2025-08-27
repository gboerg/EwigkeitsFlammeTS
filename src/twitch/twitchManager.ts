import { config } from "../config.ts";
import p from '../database/database.ts'
import axios from 'axios';
import qs from 'qs';
import {DateTime} from 'luxon'
import { client } from "../main.ts";
import { ChannelType } from "discord.js";




const CLIENT_ID = config.TCLIENT_ID
const SECRET = config.SECRET
let status = false;


const CHECK_INTERVAL = 3600000; // 1 Stunde in Millisekunden

// Hilfsfunktion, die eine asynchrone Wartezeit erstellt
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export async function onlyOnce() {
    console.log("BOT RDY AND ONLY ONCE TRIGGERED")
    twitchMain()
    await StreamerLiveStatusCheck()
    
}


async function twitchMain() {
    try {
        await checkDBEntry();
        

    } catch (error) {
        console.log("Error during fetch:", error);
    } finally {
        setTimeout(twitchMain, 60000);
    }
}



async function checkStreamerDB() {
    const result = await p.streamerTable.findMany();

    // Verwende .map(), um ein Array von Objekten zurückzugeben
    // Jedes Objekt enthält den twitch_user_name und die guild_id
    const streamerData = result.map(streamer => {
        return {
            twitch_user_name: streamer.twitch_user_name,
            guild_id: streamer.guild_id
        };
    });

    // Gib das neue Array von Objekten zurück
    return streamerData;
}


async function StreamerLiveStatusCheck() {
    const twitchUsernames = await checkStreamerDB();

    for (const streamer of twitchUsernames) {
        await getStreams(streamer.twitch_user_name);


    


    setTimeout(StreamerLiveStatusCheck, 90000);
    }
}




async function checkDBEntry() {
    console.log("DB Entry check");
    
    // Findet alle Einträge in der Tabelle
    const twitchSetup = await p.twitchSetup.findMany();

    // Prüfe, ob das Array leer ist (Länge = 0)
    if (twitchSetup.length === 0) {
        console.log("Kein DB-Eintrag gefunden, erstelle neuen Token.");
        await getTwitchToken();
    } else {
        const extract = twitchSetup[0];
        const token = extract.access_token;
        const expireTime = extract.token_expire_time;
        const now = DateTime.now().toISO();

        if (now >= expireTime) {
            console.log("Token ist abgelaufen, erneuere ihn.");
            await getTwitchToken();
        } else {
            console.log("Keine Token-Erneuerung erforderlich.");
        }
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
    console.log("Get Streams triggered")
    const dbBearerResult = await p.twitchSetup.findMany()
    const dbBearer = dbBearerResult[0]
    const bearer = dbBearer.access_token

    try {
        const request = await axios.request({
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.twitch.tv/helix/streams?user_login=${streamer}`,
            headers: {
                'Authorization': `Bearer ${bearer}`,
                'Client-Id': CLIENT_ID
            }
        })
        console.log("Response From Streamer Streams Request: ", request.data)


        // Makes data useable in Notification function 
        const data = request.data
        await sendNotificationToGuild(streamer, data)



    } catch (error) {
        console.log(`[TWITCH | FETCH] : Error during fetching Streams: ${error}`)
    }
}

// TODO: Seperater Status für jeden Streamer der in der Guilde Aktiv ist um Nachrichten Spam vorzubeugen
// Das der Channel auch anzeigt: Streamer: Offline mit Link zum Kanal -> Wenn er Live geht wird die Nachricht selbst Überarbeitet mit einer Neuen Benachrichtigung
// Gerne auch mit Rollen insgesamt oder Pro Streamer diese Nachricht wird allerding öfters gesendet um den Ping zu bekommen
// Zu dem Ping: Sichergehen das Kein Spam Statfindet falls der Streamer durch selbst und oder Probleme offline geht


// Bei Offline Nachricht die Stream Benachrichtigung Löschen damit kein Spam Vorliegt

async function sendNotificationToGuild(streamer: any, data: any) {
    console.log("Notify Send triggered")
    const setupDB = await p.setup.findMany()
    const notifyDB = setupDB[0].stream_notification_channel
    console.log("notifyDB",notifyDB )

    const streamerDB = await p.streamerTable.findMany({
        select: {
            guild_id: true,
        }, where: {
            twitch_user_name: streamer
        }
    })
    const extract = streamerDB[0].guild_id
    // const dbGuild = streamer.guild_id
    console.log("StreamerDB: ", extract)






    const guild = client.guilds.cache.get(extract)


    const notifyChannel = await guild.channels.fetch(notifyDB)
    if (!notifyChannel || notifyChannel.type !== 0) { // Überprüfen, ob der Kanal ein Textkanal ist
        console.error("Kanal nicht gefunden oder ist kein Textkanal.");
        return;
    }
    notifyChannel.send(`HEY: Streamer: ${streamer} ist LIVE AUF: https://www.twitch.tv/${streamer}`)

}
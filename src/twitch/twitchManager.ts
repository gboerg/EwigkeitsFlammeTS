import { config } from "../config.ts";
import p from '../database/database.ts'
import axios from 'axios';
import qs from 'qs';
import {DateTime} from 'luxon'
import { client } from "../main.ts";
import { ChannelType, EmbedBuilder, Embed, AttachmentBuilder } from "discord.js";
import path, { dirname } from 'path'; // Wichtig für die korrekte Pfadverwaltung
import { fileURLToPath } from "url";
// ...



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imagePath = path.join(__dirname, '../assets/images/twitch.png');
// const file = new AttachmentBuilder(imagePath);
const twitchImage = new AttachmentBuilder(imagePath, { name: 'twitch.png' })
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
    await twitchMain()
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
async function getTwitchProfileImage(streamer: string) {
    const dbBearerResult = await p.twitchSetup.findMany();
    const bearer = dbBearerResult[0].access_token;

    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${bearer}`,
                'Client-Id': CLIENT_ID
            },
            params: {
                login: streamer
            }
        });

        const userData = response.data.data[0];
        if (userData && userData.profile_image_url) {
            console.log(`[TWITCH | FETCH] Profilbild-URL für ${streamer}: ${userData.profile_image_url}`);
            return userData.profile_image_url;
        } else {
            console.log(`[TWITCH | FETCH] Kein Profilbild für ${streamer} gefunden.`);
            return null;
        }
    } catch (error) {
        console.error(`[TWITCH | FETCH] Fehler beim Abrufen des Benutzerbildes: ${error}`);
        return null;
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
        console.log("Data to be send: ", data)
        await sendNotificationToGuild(streamer, data.data[0])



    } catch (error) {
        console.log(`[TWITCH | FETCH] : Error during fetching Streams: ${error}`)
    }
}

async function sendNotificationToGuild(streamer: any, data: any) {
    console.log("Notify Send triggered");
    // The 'streamer' parameter is the username, e.g., 'bycoba'.
    // The 'data' parameter is the stream data object from Twitch.
    const isStreamerLive = !!data;
    const twitchUsername = streamer;
    

    // Fetch the streamer's data from your DB for all guilds.
    const streamerDB = await p.streamerTable.findMany({
        where: { twitch_user_name: twitchUsername }
    });
    
    // If the streamer is not in the DB, there's nothing to do.
    if (streamerDB.length === 0) {
        console.log(`Streamer '${twitchUsername}' not found in the database.`);
        return;
    }

    // Process each guild the streamer is configured for.
    for (const streamerInfo of streamerDB) {
        try {
            let gameTitle = ""
            gameTitle = data.game_name
            const guild = client.guilds.cache.get(streamerInfo.guild_id);
            if (!guild) {
                console.error(`Guild ${streamerInfo.guild_id} not found.`);
                continue;
            }

            const notifyDB = await p.setup.findFirst({
                where: { guild_id: guild.id },
                select: { stream_notification_channel: true }
            });

            if (!notifyDB || !notifyDB.stream_notification_channel) {
                console.error(`Notification channel not configured for guild ${guild.id}.`);
                continue;
            }

            const notifyCh = await guild.channels.fetch(notifyDB.stream_notification_channel);
            if (!notifyCh || notifyCh.type !== ChannelType.GuildText) {
                console.error(`Channel ${notifyDB.stream_notification_channel} is not a text channel.`);
                continue;
            }
            
            // Check if a message for this stream is already in Discord.
            let existingMsg = null;
            if (streamerInfo.live_msg_id) {
                try {
                    existingMsg = await notifyCh.messages.fetch(streamerInfo.live_msg_id);
                } catch (error) {
                    console.log(`Message with ID ${streamerInfo.live_msg_id} was not found. Will create a new one.`);
                    // If fetching fails, the message doesn't exist.
                }
            }
            const profileImageUrl = await getTwitchProfileImage(twitchUsername);
            const thumbnailUrl = data.thumbnail_url.replace('-{width}x{height}', '-1920x1080');
            // const newName = twitchUsername.toLocaleUpperCase()
            const newName = twitchUsername
            // TODO: Notification Role, da @everyone ziehmlich nervig ist und zu Mute führt
            const getNotfyRole = ""
            const twitchContent = "||@everyone||\nCobatastischen Guten Tag, jünger der Flamme"
            const TwitchEmbed = new EmbedBuilder()
                .setColor(0x990099)
                .setTitle(`${newName} teilt die Worte der Flamme auf Twitch`)
                .setURL(`https://www.twitch.tv/${twitchUsername}`)
                .setThumbnail(profileImageUrl)
                .addFields(
                    { name: 'Titel', value: `${data.title}`, inline: false },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Game: ', value: `${data.game_name}`, inline: true },
                    { name: 'Zuschauer', value: `${data.viewer_count}`, inline: true },
                    { name: 'Link', value: `https://www.twitch.tv/${twitchUsername}`, inline: true}
                )
                .setImage(thumbnailUrl)
                .setTimestamp()
                .setFooter({ text: `Gespielt wird mit ganz viel Liebe | Streamer: ${twitchUsername}`, iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Twitch_logo_2019.svg/2560px-Twitch_logo_2019.svg.png'});
            // Case 1: Streamer is LIVE and there is NO existing message.
            if (isStreamerLive && !existingMsg) {
                console.log(`Streamer '${twitchUsername}' is LIVE. Creating a new notification message.`);
                const streamMsg = await notifyCh.send({ embeds: [TwitchEmbed], content: twitchContent});
                
                // Update DB with new message ID and live status.
                await p.streamerTable.update({
                    where: {
                        guild_id_twitch_user_name: {
                            guild_id: guild.id,
                            twitch_user_name: twitchUsername
                        }
                    },
                    data: {
                        live_msg_id: streamMsg.id,
                        twitch_live_status: true,
                    },
                });

            } 
            // Case 2: Streamer is LIVE and there IS an existing message.
            else if (isStreamerLive && existingMsg && data.game_name !== gameTitle) {
                console.log(`Streamer '${twitchUsername}' is LIVE and changed Game. Updating existing message.`);

                const profileImageUrl = await getTwitchProfileImage(twitchUsername);
                const thumbnailUrl = data.thumbnail_url.replace('-{width}x{height}', '-1920x1080');
                await existingMsg.edit({ embeds: [TwitchEmbed] });
            
            } 
            // Case 3: Streamer is OFFLINE and there IS an existing message.
            else if (!isStreamerLive && existingMsg) {
                console.log(`Streamer '${twitchUsername}' is OFFLINE. Deleting old message.`);
                await existingMsg.delete();
                
                // Update DB to reflect offline status and remove message ID.
                await p.streamerTable.update({
                    where: {
                        guild_id_twitch_user_name: {
                            guild_id: guild.id,
                            twitch_user_name: twitchUsername
                        }
                    },
                    data: {
                        twitch_live_status: false,
                        live_msg_id: ""
                    },
                });
            } else {
                console.log("No relevant changes found - Skipping Message creation and updating")
            }
        } catch (error) {
            console.error(`Error in guild loop for ${streamerInfo.guild_id}:`, error);
        }
    }
}
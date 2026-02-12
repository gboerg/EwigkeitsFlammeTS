import { config } from "../config.ts";
import p from '../database/database.ts'
import axios from 'axios';
import qs from 'qs';
import {DateTime} from 'luxon'
import { client } from "../main.ts";
import { ChannelType, EmbedBuilder, Embed, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import path, { dirname } from 'path';
import { fileURLToPath } from "url";
// ...



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imagePath = path.join(__dirname, '../assets/images/twitch.png');
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
        // The `data.data[0]` can be `undefined` if the streamer is offline.
        // The `sendNotificationToGuild` function has been updated to handle this case.
        await sendNotificationToGuild(streamer, data.data[0])

        return data

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
            
            // Case 1: Streamer is LIVE.
            if (isStreamerLive) {
                // This block only runs if `data` is a valid stream object.
                // Now it is safe to access `data.thumbnail_url` and other properties.
                const profileImageUrl = await getTwitchProfileImage(twitchUsername);
                const thumbnailUrl = data.thumbnail_url.replace('-{width}x{height}', '-1920x1080');
                const newName = twitchUsername
                let role = "@everyone"
                let msg = `||${role}||\nCobatastischen Guten Tag, jünger der Flamme.`
                // TODO: Notification Role, da @everyone ziehmlich nervig ist und zu Mute führt
                const getNotfyRole = await p.setup.findMany({
                    where: {
                        guild_id: guild.id
                    }, select: {
                        stream_notification_role: true
                    }
                })
                const roleDb = getNotfyRole[0].stream_notification_role
                // CHECK IF ROLE EVEN EXIST BEFORE SENDING: 
                const r_role = await guild.roles.fetch(roleDb)
                if (roleDb) {
                    role = r_role.id
                    msg = `||<@&${role}>||\nCobatastischen Guten Tag, jünger der Flamme`
                } else {
                    role = role
                    msg = msg
                    continue
                }

                const twitchButton = new ButtonBuilder()
                    .setLabel("Direkt zum Stream")
                    .setStyle(ButtonStyle.Link) // You may need to add this
                    .setURL(`https://www.twitch.tv/${twitchUsername}`);

                const twitchRow = new ActionRowBuilder()
                    .addComponents(twitchButton)

                const twitchContent = msg
                const TwitchEmbed = new EmbedBuilder()
                    .setColor(0x990099)
                    .setTitle(data.title)
                    .setURL(`https://www.twitch.tv/${twitchUsername}`)
                    .setThumbnail(profileImageUrl)
                    .setAuthor({name: twitchUsername, url: `https://www.twitch.tv/${twitchUsername}` })
                    .addFields(
//                         { name: 'Titel', value: `${data.title}`, inline: false },
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Game: ', value: `${data.game_name}`, inline: true },
                        { name: 'Zuschauer', value: `${data.viewer_count}`, inline: true },
                        { name: 'Link', value: `https://www.twitch.tv/${twitchUsername}`, inline: true}
                    )
                    .setImage(thumbnailUrl)
                    .setTimestamp()
                    .setFooter({ text: `Gespielt wird mit ganz viel Liebe | Streamer: ${twitchUsername}`, iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Twitch_logo_2019.svg/2560px-Twitch_logo_2019.svg.png'});
                
                if (!existingMsg) {
                    console.log(`Streamer '${twitchUsername}' is LIVE. Creating a new notification message.`);
                    const streamMsg = await notifyCh.send({ embeds: [TwitchEmbed], content: twitchContent, components: [twitchRow.toJSON()]});
                    
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
        
                } else {
                    // If the stream is live and a message already exists, update it.
                    // This ensures the embed is always up-to-date with title/game changes.
//                     console.log(`Streamer '${twitchUsername}' is LIVE. Updating existing message.`);
//                     await existingMsg.edit({ embeds: [TwitchEmbed] });
                }
            }
            // Case 2: Streamer is OFFLINE and there IS an existing message.
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
                // Streamer is offline and no old message exists.
                // No action required.
                console.log("No relevant changes found - Skipping Message creation and updating")
            }
        } catch (error) {
            console.error(`Error in guild loop for ${streamerInfo.guild_id}:`, error);
        }
    }
}




// ... (rest of your code) ...

export async function checkRemainingStreamMessages() {
    console.log("checking Remaining Streamer Messages")

    const result = await p.streamerTable.findMany()
    console.log("Result of remaining ", result)

    for (const each of result) {
        const guildId = each.guild_id
        const streamer = each.twitch_user_name
        const messageChannelId = each.live_channel_id
        const messageId = each.live_msg_id
        const guild = client.guilds.cache.get(guildId)

        const dbSetup = await p.setup.findMany({
            select: {
                stream_notification_channel: true
            }, where: {
                guild_id: guild.id
            }
        })
        const channelDb= dbSetup[0].stream_notification_channel

        if (!guild) {
            console.error(`Guild ${guildId} not found.`);
            continue;
        }

        const channel = await guild.channels.fetch(channelDb)
        if (!channel || channel.type !== ChannelType.GuildText) {
            console.error(`Channel ${messageChannelId} is not a text channel or was not found.`);
            continue;
        }

        const re_fetch = await getStreams(streamer)

        // Add this check to see if the streamer is currently live
        if (re_fetch && re_fetch.data.length > 0) {
            const data = re_fetch.data[0]
            const name = data.user_login
            console.log("[TWITCH | REFETCHING MESSAGE AND CLEANUP] ", data, name)
            
        } else {
            const prevMsg = await channel.messages.fetch()
            console.log("Streamer offline:", streamer, prevMsg);
            const message = prevMsg.first()
            if (message && message.embeds.length > 0) {
                const embed = message.embeds[0]; // Access the first embed
                // Now you can log the content of the embed
                console.log("Embed Title:", embed.title);
                console.log("Embed Description:", embed.description);
                console.log("Embed Fields:", embed.fields);
                console.log("Embed Author:", embed.author);
                const fields = embed.fields
                
                for (const field of embed.fields) {
                    console.log(`${field.name} and ${field.value}`)
                    if (field.value.includes(streamer)) {
                        await message.delete()
                    }
                }
            }// This is the code for offline streamers.
        }
    }
}        
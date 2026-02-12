import { DateTime } from 'luxon'
import p from '../database/database.ts'
import {client} from '../main.ts'
import {botSelf} from './changePresence.ts'


export async function botManager() {
    console.log("Starting Bot Smart Setup")
    try {
        await botSelf()
        await startAutoSetup()
        await streamAutoNotificationRole()
    } catch (error) {
        console.log("Error during BotManager", error)
    }
}




async function startAutoSetup() {
    try {
        const guilds = client.guilds.cache.values();
        for (const guild of guilds) {
            console.log(`Guild Name: ${guild.name} | Guild ID: ${guild.id}`);

            const channels = await guild.channels.fetch();
            const streamStr = ["stream", "live", "twitch", "on-air"];

            for (const [channelId, channel] of channels) { // Changed .each() to a for...of loop
                console.log(`Channel ID: ${channel.id} | Channel Name: ${channel.name} and #${channel.type}`);
                for (const name of streamStr) {
                    if (channel.type === 0 && channel.name.includes(name)|| channel.type === 5 && channel.name.includes(name)) {
                        console.log(`Found stream channel: ${channel.id}`);
                        await p.setup.upsert({
                            create: {
                                guild_id: channel.guild.id,
                                stream_notification_channel: channel.id,
                                channel_id: ""
                            }, update: {
                                stream_notification_channel: channel.id,
                                guild_id: channel.guildId
                            }, where: {
                                guild_id: channel.guildId
                            }
                        });
                        const messages = await channel.messages.fetch()
                    
                        const twitchWords = ["twitch", "twitch.tv"]
                        const ttv = "twitch"
                        for (const msg of messages) {
                            const message = msg[1]
                            console.log("Smart Message Content Scanner: ", message)
                            if (message && message.embeds.length > 0) {
                                for (const each of twitchWords) {
                                    console.log("each content filter for twitch message content checker", each)
                                    if (message.content.includes(each)) {
                                        console.log("Twitch Match During Check: ", message.content)
                                        // Teile den Nachrichteninhalt in einzelne Wörter
                                        const words = message.content.split(' ');
                                        
                                        // Finde das Wort, das eine gültige Twitch-URL ist
                                        const twitchUrl = words.find(word => word.startsWith('https://www.twitch.tv/'));
                                        
                                        let filtered = "";
                                        if (twitchUrl) {
                                            // Teile die gefundene URL an den Slashes und nimm das letzte Element
                                            filtered = twitchUrl.split('/').pop();
                                        }
    
                                        await p.streamerTable.upsert({
                                            create: {
                                                guild_id: channel.guildId,
                                                live_channel_id: channel.id,
                                                live_msg_id: "",
                                                twitch_live_status: false,
                                                twitch_user_name: filtered,
                                                youtube_user_name: "",
                                            }, update: {
                                                twitch_user_name: filtered
                                            }, where: {
                                                guild_id_twitch_user_name: {
                                                    guild_id: channel.guildId,
                                                    twitch_user_name: filtered
                                                }
                                            }
                                        })
                                    }
                                    
                                }
                                const embed = message.embeds[0]; // Access the first embed
                                // Now you can log the content of the embed
                                console.log("Embed Title:", embed.title);
                                console.log("Embed Description:", embed.description);
                                console.log("Embed Fields:", embed.fields);
                                console.log("Embed Author:", embed.author);
                                const fields = embed.fields
    
                                for (const field of embed.fields) {
                                    console.log(`${field.name} and ${field.value}`)
                                    for (const words of twitchWords) {
                                        console.log("words for embed filter", words)
                                        if (field.value.includes(words)) {
                                            const filtered = field.value.split('/').pop()
                                            console.log("Say True", filtered)
                                            // TODO: Fetch Default Stream mention role -> Und diese wird dann in die DB eingetragen und zur neuen Stream Benachrichtigung genutzt 
                                            await p.streamerTable.upsert({
                                                create: {
                                                    guild_id: channel.guildId,
                                                    live_channel_id: channel.id,
                                                    live_msg_id: "",
                                                    twitch_live_status: false,
                                                    twitch_user_name: filtered,
                                                    youtube_user_name: "",
                                                }, update: {
                                                    twitch_user_name: filtered
                                                }, where: {
                                                    guild_id_twitch_user_name: {
                                                        guild_id: channel.guildId,
                                                        twitch_user_name: filtered
                                                    }
                                                }
                                            })
                                        }
    
                                    }
        
                                }
                                const allStreamerDB = await p.streamerTable.findMany({
                                    where: {
                                        guild_id: guild.id
                                    },select: {
                                        twitch_user_name: true
                                    }
                                })
    
                                const allSetupDb = await p.setup.findMany({
                                    select: {
                                        notification_channel_msg_send: true
                                    }, where: {
                                        guild_id: guild.id
                                    }
                                })
                                const dbCont = allSetupDb[0].notification_channel_msg_send
    
                                const streamerNames = allStreamerDB.map(streamer => streamer.twitch_user_name);
                                const streamerList = streamerNames.join(', ');
                                if (dbCont && dbCont.length > 3) {
                                    console.log("Notification message already exists, returning.");
                                    return;
                                } else {
                                    console.log("Success Message send");
                                    
                                    // Die Nachricht wird gesendet
                                    const success = await channel.send(`Twitch notification channel established and following streamers are now being tracked: ${streamerList}`);
                                    
                                    // Anstelle von `create` verwenden wir `upsert`
                                    await p.setup.upsert({
                                        where: {
                                            guild_id: guild.id
                                        },
                                        create: {
                                            guild_id: guild.id,
                                            notification_channel_msg_send: success.id,
                                            channel_id: "",
                                            stream_notification_channel: "",
                                            stream_notification_role: ""
                                        },
                                        update: {
                                            notification_channel_msg_send: success.id,
                                        }
                                    });
                                }
    
                                
    
                                // You can access all other embed properties like color, footer, image, etc.
                            } else {
                                console.log("No embeds found in the message.");
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("An error occurred during auto setup:", error); // Use console.error for better error logging
    }
}

async function streamAutoNotificationRole() {
    try {
        const guilds = client.guilds.cache.values();
        for (const guild of guilds) {
            console.log(`Guild Name: ${guild.name} | Guild ID: ${guild.id}`);
            const dbResult = await p.setup.findMany({
                select: {
                    stream_notification_channel: true
                }, where: {
                    guild_id: guild.id
                }
            })

            // if (dbResult.length > 1) {
            // }
            console.log("say stream auto role")
            console.log("Stream Auto Role")
            const db = dbResult[0].stream_notification_channel 
            // if (db || db) {
            //     console.log("Twitch default role is already in db")
            //     return
            // }
            const ch = await guild.channels.fetch(db)
            if (ch.type === 0 || ch.type === 5) {
                const messages = await ch.messages.fetch()
                const word = "@"
                
                for (const msg of messages) {
                    const message = msg[1]
                    console.log("Message First; ", message)
    
                    if (message.content.includes(word)) {
                        console.log(`Message fetched with ${word}, and message content is: ${message} timestamp: ${message.createdTimestamp}`)
                        if(message) {
                            const all_roles = await guild.roles.fetch()
                            console.log("All Roles during fetch: ", all_roles)
                            for (const role of all_roles) {
                                const roles = role[1]
                                console.log("Message fetched during twitch stream auto role ", message.content)
                                console.log(`Fetched Stream Notification Role: ${roles.name}, ${roles.id}`) 
    
                                await p.setup.update({
                                    where: {
                                        guild_id: guild.id
                                    }, data: {
                                        stream_notification_role: roles.id
                                    }
                                })

                            }
                        }
    
    
                    }

                }
            }


            
            
        }
    } catch (error) {
        console.error("An error occurred during auto setup:", error); // Use console.error for better error logging
    }
    
}
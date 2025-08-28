import p from '../database/database.ts'
import {client} from '../main.ts'
import {botSelf} from './changePresence.ts'


export async function botManager() {
    console.log("Starting Bot Smart Setup")
    try {
        await botSelf()
        await startAutoSetup()
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
            const streamStr = "stream";

            for (const [channelId, channel] of channels) { // Changed .each() to a for...of loop
                console.log(`Channel ID: ${channel.id} | Channel Name: ${channel.name} and #${channel.type}`);

                if (channel.type === 0 && channel.name.includes(streamStr)) {
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
                    const prevMsg = await channel.messages.fetch()
                    const message = prevMsg.first()
                    if (message && message.embeds.length > 0) {
                        const embed = message.embeds[0]; // Access the first embed
                        const ttv = "twitch"
                        // Now you can log the content of the embed
                        console.log("Embed Title:", embed.title);
                        console.log("Embed Description:", embed.description);
                        console.log("Embed Fields:", embed.fields);
                        console.log("Embed Author:", embed.author);
                        const fields = embed.fields

                        for (const field of embed.fields) {
                            console.log(`${field.name} and ${field.value}`)
                            if (field.value.includes(ttv)) {
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


                        // You can access all other embed properties like color, footer, image, etc.
                    } else {
                        console.log("No embeds found in the message.");
                    }
                }
            }
        }
    } catch (error) {
        console.error("An error occurred during auto setup:", error); // Use console.error for better error logging
    }
}
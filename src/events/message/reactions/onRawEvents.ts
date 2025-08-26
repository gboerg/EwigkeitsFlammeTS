import { Events, Guild, Message, Client, MessageReaction, User } from 'discord.js';
import p from '../.././../database/database.ts'
import {client} from '../../../main.ts'

export default {
    name: Events.Raw,
    once: false,
    execute: async (data: any) => {
        // Log the raw data to see everything that comes in
        // console.log("raw data:", data);
        // const client = 
        // Check if the 't' property exists and matches a specific event type
        if (data.t === 'MESSAGE_REACTION_ADD') {
            // Extract the 't' value
            const eventType = data.t;

            // Extract the 'emoji' value from the nested 'd' object
            const emojiData = data.d.emoji;
            const guildID = data.d.guild_id
            const memberData = data.d.user_id;
            const channelID = data.d.channel_id
            const messageID = data.d.message_id
            const emojiName = emojiData.name;
            const emojiId = emojiData.id;
            const guild = client.guilds.cache.get(guildID)

            if (!guild) {
                return
            }

            console.log(`Event Type: ${eventType}`);
            console.log(`Event GuildID: ${guildID}`)
            console.log(`Event MemberID: ${memberData}`);
            console.log(`Event ChannelID: ${channelID}`)
            console.log(`Event MsgID: ${messageID}`)
            console.log(`Emoji Name: ${emojiName}`);
            console.log(`Emoji ID: ${emojiId}`);
            const dbResult = await checkDBReaction(guildID, channelID, messageID)
            let reaction = ''
            let action = ''
            let ch = ''
            let msg = ''

            if (dbResult && dbResult.length > 0) {
                const result = dbResult[0]
                // console.log("reading")
                const dbAction = result.action
                // console.log("readin2")
                const dbReaction = result.reaction
                const message = result.message_id
                const channel = result.channel_id
                // console.log("readin3")
                reaction = dbReaction
                action = dbAction
                msg = message
                ch =  channel
            }
            const r_ch = await guild.channels.fetch(ch)
            if (!r_ch || r_ch.type !== 0) { // Überprüfen, ob der Kanal ein Textkanal ist
                console.error("Kanal nicht gefunden oder ist kein Textkanal.");
                return;
            }
            
            // Korrekte Methode, um die Nachricht zu fetchen:
            const message = await r_ch.messages.fetch(msg)
            if (!message) {
                console.error("Nachricht konnte nicht gefunden werden.");
                return;
            }

            const reacto = message.reactions.cache
            console.log("reacto: ", reacto)
            const r_role = await guild.roles.fetch(action)
            const r_user = await guild.members.fetch(memberData)
            await r_user.roles.add(r_role.id)

            
            // Now you can perform specific actions based on this event,
            // for example, adding the reaction to your database.
        } else if (data.t === 'MESSAGE_REACTION_REMOVE') {
            const eventType = data.t;

            // Extract the 'emoji' value from the nested 'd' object
            const emojiData = data.d.emoji;
            const guildID = data.d.guild_id
            const memberData = data.d.user_id;
            const channelID = data.d.channel_id
            const messageID = data.d.message_id
            const emojiName = emojiData.name;
            const emojiId = emojiData.id;
            const guild = client.guilds.cache.get(guildID)
            if (!guild) {
                return
            }
            console.log("guild: ", guild)

            console.log(`Event Type: ${eventType}`);
            console.log(`Event GuildID: ${guildID}`)
            console.log(`Event MemberID: ${memberData}`);
            console.log(`Event ChannelID: ${channelID}`)
            console.log(`Event MsgID: ${messageID}`)
            console.log(`Emoji Name: ${emojiName}`);
            console.log(`Emoji ID: ${emojiId}`);
            const dbResult = await checkDBReaction(guildID, channelID, messageID)
            let reaction = ''
            let action = ''
            let ch = ''
            let msg = ''

            if (dbResult && dbResult.length > 0) {
                const result = dbResult[0]
                console.log("reading")
                const dbAction = result.action
                console.log("readin2")
                const dbReaction = result.reaction
                const message = result.message_id
                const channel = result.channel_id
                console.log("readin3")
                reaction = dbReaction
                action = dbAction
                msg = message
                ch =  channel
            }
            const r_ch = await guild.channels.fetch(ch)
            if (!r_ch || r_ch.type !== 0) { // Überprüfen, ob der Kanal ein Textkanal ist
                console.error("Kanal nicht gefunden oder ist kein Textkanal.");
                return;
            }
            
            // Korrekte Methode, um die Nachricht zu fetchen:
            const message = await r_ch.messages.fetch(msg)
            if (!message) {
                console.error("Nachricht konnte nicht gefunden werden.");
                return;
            }
            
            
            const bot_member = await guild.members.fetch(client.user.id)
            const b_perms = bot_member.roles.highest
            
            const dbSch = await getBotSetupChannel(guild.id)
            console.log("DB SETUP CHANNEL : ", dbSch)
            const guildSetupChannel = dbSch.channel_id
            const gSetUp = await guild.channels.fetch(guildSetupChannel)
            if (!gSetUp || gSetUp.type !== 0) { // Überprüfen, ob der Kanal ein Textkanal ist
                console.error("Kanal nicht gefunden oder ist kein Textkanal.");
                return;
            }


            const r_role = await guild.roles.fetch(action)
            if (r_role && b_perms.position <= r_role.position) {
                console.log("Bot Insufficient Perms")
                const msgFailure = await gSetUp.send(`Bot muss Höher sein als <@&${r_role.id}> um sie Setzen zu können @everyone`)
                return
            }
            const r_user = await guild.members.fetch(memberData)
            await r_user.roles.remove(r_role.id)

        }
    }
};

async function checkDBReaction(guild_id: any, channel_id: any, message_id: any) {
    const result = await p.messages.findMany({
        where: {
            guild_id: guild_id,
            channel_id: channel_id,
            message_id: message_id
        }
    })
    console.log("Result from db entry: ", result)
    return result
}

async function getBotSetupChannel(guild_id: any) {
    const channel = await p.setup.findFirst({
        where: {
            guild_id: guild_id
        }
    })
    console.log("Setup Channel found: ", channel)
    return channel
}
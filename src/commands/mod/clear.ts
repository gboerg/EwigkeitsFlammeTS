import { ChannelType, ChatInputCommandInteraction, CommandInteraction, GuildWidgetStyle, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, type GuildTextBasedChannel } from "discord.js";
import type { Command } from "../../types/command.ts";
import p from "../../database/database.ts";
import {DateTime} from 'luxon'

export default {
    data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("take out the trash")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption(option => option
        .setName("limit")
        .setDescription("set a limit for how many should be delted")
        .setRequired(false)
    )
    .addChannelOption(option => option
        .setName("channel")
        .setDescription("clear all messages in channel")
        .setRequired(false)
    )
    .addUserOption(option => option
        .setName("user")
        .setDescription("clear messages only from a specific user")
        .setRequired(false)
    )
    .addBooleanOption(option => option
        .setName("clear_old")
        .setDescription("clear old messages (can be rate limited)")
        .setRequired(false)
    ),
execute: async (interaction: ChatInputCommandInteraction) => {
    // const subCommand = interaction.options.getSubcommand()
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as GuildTextBasedChannel
    await interaction.deferReply({ flags: MessageFlags.Ephemeral});
    const user = interaction.options.getUser("user") || null
    const clearOld = interaction.options.getBoolean("clear_old") || false
    const limit = interaction.options.getInteger("limit") || 30

    if (channel.type !== ChannelType.GuildText) {
        await interaction.editReply('That channel is not a text channel.');
        return;
    }
    const guild = interaction.guild

    const messages = await channel.messages.fetch()
    const now = DateTime.now().toUnixInteger()
    const db_messages = await getMessagesFromDatabase(guild, channel, now)

    const filtered = messages.filter(msg => {
        if (user && msg.author?.id !== user.id) return false;
        if (!clearOld && isOlderThan14Days(msg.createdAt)) return false;
        return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).first(30);

        
    if (filtered.length == 0) {
        await interaction.editReply("There are no messages that can be deleted")
        return
    }
    
    if (clearOld) {
        const clearDbCommand: string = 'clear'
        let foundCommandName: string | undefined;   // Variable für den gefundenen Befehlsnamen
        let foundTimestamp: number | undefined; 

        let foundMsg: string | undefined;
        let msgTimeStamp: number | undefined
        let foundChannelId: string | undefined
        
        const dbActionEntry = await getCommandAction(guild)
        let clearCommand = false

        if (dbActionEntry) {
            for (const entry of dbActionEntry) {
                if (entry.command === clearDbCommand) {
                    foundCommandName = entry.command
                    foundTimestamp = entry.timestamp
                    clearCommand = true;
                    break
                }
            }
        }

        for (const message of messages) {
            const dbActionEntry = await getCommandAction(guild)
            if (dbActionEntry) {
                for (const entry of dbActionEntry) {
                    if (entry.command === clearDbCommand) {
                        foundCommandName = entry.command
                        foundTimestamp = entry.timestamp
                    }
                }
            }


            let msg = message[1] // Correctly access the message object

            await msgToDatabase(guild, channel, msg, interaction.user.id)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const dbMessageEntry = await getMessagesFromDatabase(guild, channel)
        for (const msg of dbMessageEntry) {
            const dbActionEntry = await getCommandAction(guild)
            if (dbActionEntry) {
                for (const entry of dbActionEntry) {
                    if (entry.command === clearDbCommand) {
                        foundCommandName = entry.command
                        foundTimestamp = entry.timestamp
                    }
                }
            }

            foundMsg = msg.message_id
            msgTimeStamp = msg.timestamp
            foundChannelId = msg.channel_id

            if (foundCommandName) {
                console.log("Further Deletion of messages canceld")
                await removeActionFromDatabase(guild, foundCommandName)
                // TODO: DEFAULT SETTINGS IN DER DB ansonsten vorher fragen mit /confirm besätigen oder mit /cancel clear_deletion  | Maybe mit Timeout
                await interaction.editReply("Willst du alle makierten Nachrichten für die Löschung die bis jetzt in der DB sind Löschen oder ganz abbrechen?")
                return

            } 
            else {
                console.log("No cancel request of clear command detected - Continue ")
                const r_msg_id = await channel.messages.fetch(foundMsg)
                const success = await r_msg_id.delete() 
                await removeMessageFromDatabase(foundMsg, guild.id)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

        await interaction.editReply(`Queued old messages for deletion.`) // Changed reply to reflect queuing
        return
    }

} as Command;

/**
 * Checks if a given date is older than 14 days from the current time.
 * @param date The date to check.
 * @returns True if the date is older than 14 days, false otherwise.
 */
function isOlderThan14Days(date: Date): boolean {
    return (Date.now() - date.getTime()) > 14 * 24 * 60 * 60 * 1000;
}

/**
 * Stores message information into the database for queued deletion.
 * @param guild The guild object.
 * @param channel The channel object.
 * @param msg The message object to store.
 * @param userId The ID of the user who initiated the clear command.
 */

async function getCommandAction(guild: any, ) {
    const results = await p.actions.findMany({
        select: {
            command: true,
            timestamp: true
        },
        where: {
            guild_id: guild.id
        }
    })
    return results    
}

// TODO: any canceld action should be removed after cancelation occurred -> Retype Manually and configure a active type ()
async function removeActionFromDatabase(guild, action: string) {
    await p.actions.delete({
        where: {
            guild_id_command: {
                guild_id: guild.id, 
                command: action
            }, 
        }
    })
}
async function removeMessageFromDatabase(messageId: string, guildId: string) {
    try {
        await p.messages.delete({
            where: {
                // You must provide both parts of the composite primary key
                guild_id_message_id: {
                    guild_id: guildId,
                    message_id: messageId,
                },
            },
        });
        console.log(`Message entry ${messageId} successfully removed from the database for guild ${guildId}.`);
    } catch (error) {
        console.error(`Error removing message entry ${messageId} from the database for guild ${guildId}:`, error);
    }
}

async function getMessagesFromDatabase(guild: any, channel: any) {
    try {
        const results = await p.messages.findMany({
            select: {
                message_id: true,
                timestamp:true,
                channel_id: true,
            }, 
            where: {
                guild_id: guild.id,
                channel_id: channel.id,
                queued_deletion: true,
            }
        })
        return results
    } catch (error) {
        console.log("failed to get messages from database")
    }
}

async function msgToDatabase(guild: any, channel: any, msg: any, userId: string) {
    try {
        await p.messages.create({
            data: {
                
                guild_id: guild.id,
                channel_id: channel.id,
                message_id: msg.id, // Added the missing message_id
                queued_deletion: true,
                user_id: userId, // Using the user who initiated the command, as per original code
                timestamp: DateTime.now().toUnixInteger()

            }
        });
        console.log(`Message ${msg.id} from guild ${guild.id} queued for deletion.`);
    } catch (error) {
        console.error(`Failed to queue message ${msg.id} for deletion:`, error);
    }
}

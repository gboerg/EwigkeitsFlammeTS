import { ChannelType, ChatInputCommandInteraction, CommandInteraction, DiscordAPIError, GuildWidgetStyle, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, type GuildTextBasedChannel } from "discord.js";
import type { Command } from "../../types/command.ts";
import p from "../../database/database.ts";
import {DateTime} from 'luxon'
import { channel } from "node:diagnostics_channel";

export default {
    data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("take out the trash")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand(option => option
        .setName("old")
        .setDescription("clear older messages and new ones")
        .addBooleanOption(option => option
            .setName("include_pins")
            .setDescription("If selected, I'll deleted pinned messages")
            .setRequired(false)
        )
        .addChannelOption(option => option
            .setName("channel")
            .setDescription("select the channel - default - current channel")
            .setRequired(false)
        ).addUserOption(option => option
            .setName("user")
            .setDescription("only delete messages of user")
            .setRequired(false)
        ).addIntegerOption(option => option
            .setName("limit")
            .setDescription("set a limit")
            .setRequired(false)
        )
    ).addSubcommand(option => option
        .setName("bulk")
        .setDescription("deletion all messages in the last 14 days")
        .addChannelOption(option => option
            .setName("channel")
            .setDescription("select the channel - default: current channel")
            .setRequired(false)
        ).addUserOption(option => option
            .setName("user")
            .setDescription("only messages of a user")
            .setRequired(false)
        ).addIntegerOption(option => option
            .setName("limit")
            .setDescription("even within 14 days there should be a limit")
            .setRequired(false)
        )
    ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral});
        const subCommand = interaction.options.getSubcommand()
        const guild = interaction.guild
        const safelimit = 2
        const channel = (interaction.options.getChannel("channel") || interaction.channel) as GuildTextBasedChannel
        const user = interaction.options.getUser("user") || null
        const limit = interaction.options.getInteger("limit") || {safelimit}
        const includePins = interaction.options.getBoolean("include_pins") || false
        if (channel.type !== ChannelType.GuildText) {
            await interaction.editReply('That channel is not a text channel.');
            return;
        }

        const fetchedMessages = await channel.messages.fetch()
        const now = DateTime.now().toUnixInteger()


        
        if (subCommand === "old") {
            await interaction.editReply("Löschvorgang gestartet")
            let clearDbCommand: string = 'clear_old'
            let clear_state: string = 'None'
            
            let foundActionCommandName: string | undefined;   // Variable für den gefundenen Befehlsnamen
            let foundActionActive: boolean | false
            let foundActionChannelID: string | undefined
            let foundActionUserID: string | undefined
            // let foundTimestamp: number | undefined; 
            
            let foundMsg: string | undefined;
            let foundMsgUser: string | undefined;
            let foundMsgChannelId: string | undefined
            // let msgTimeStamp: number | undefined
            
            const dbActionEntry = await getCommandAction(guild)
            const dbMessageEntry = await getMessagesFromDatabase(guild, channel)
            let clearCommand = false
            let deleted_count = 0

            if(user) {
                clearDbCommand = 'clear_old_user_only'
                clear_state = `user` 

            } else if (channel) {
                clearDbCommand = 'clear_old_channel_only'
                clear_state = 'channel'

            } else if (user && channel) {
                clearDbCommand = 'clear_old_channel_and_user'
                clear_state = 'user_channel'
                
            }
            for (const action of dbActionEntry) {
                foundActionCommandName = action.command 
                foundActionChannelID = action.channel_id
                foundActionUserID = action.user_id
                foundActionActive = action.active

                if (foundActionChannelID == channel.id && foundActionActive == true) {
                    interaction.editReply(`Die Nachrichten in diesem Channel <#${channel.id}> werden Bereits gelöscht`)
                    return
                }
            }
            

            await actionToDatabase(guild, clearDbCommand, true, interaction.user, user, channel)

            interaction.followUp({content: `Löschvorgang gestartet mit folgenden Parametern: \n**${clear_state}**\n Um Löschvorgang abzubrechen gebe: \n**/cancel ${clearDbCommand}** \n ein`, flags: MessageFlags.Ephemeral})



            const messagesToDelete = fetchedMessages.filter(msg => {
                // If a user is specified, only include messages from that user
                if (user && msg.author.id !== user.id) {
                    return false;
                }
                // If includePins is false, exclude pinned messages
                if (!includePins && msg.pinned) {
                    return false;
                }
                return true;
            });
            console.log("queued messages", messagesToDelete)
            for (const message of messagesToDelete) {
                let msg = message[1]
                msg.delete()
                deleted_count = deleted_count+1
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            // if (messagesToDelete.)

        }
        
        
        
        if (subCommand === "bulk") {
            
            // const filtered = messages.filter(msg => {
            //     if (user && msg.author?.id !== user.id) return false;
            //     if (!clearOld && isOlderThan14Days(msg.createdAt)) return false;
            //     return true;
            // }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).first(30);
            
            
            // if (filtered.length == 0) {
            //     await interaction.editReply("There are no messages that can be deleted")
            //     return
            // }
        }
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



async function actionToDatabase(guild: any, action: any, active: boolean, executor: any, user_only_clear: any, channel: any) {
    await p.actions.upsert({
        where: {
            // This is the unique identifier for the record we're looking for
            guild_id_command: { // This composite key name is generated by Prisma for @@unique fields
                guild_id: guild.id,
                command: action,
            },
        },
        create: {
            // Data to create if the record does NOT exist
            guild_id: guild.id,
            command: action,
            active: active,
            executor: executor.id, // Corrected: Access id property
            user_id: user_only_clear ? user_only_clear.id : null, // <-- HIER: Im create-Block
            channel_id: channel.id,
            channel_name: channel.name,
            timestamp: DateTime.now().toUnixInteger(), // Store as Unix timestamp (integer), use current timestamp
        },
        update: {
            // Data to update if the record DOES exist
            active: active,
            executor: executor.id, // Corrected: Access id property
            channel_id: channel.id,
            channel_name: channel.name,
            user_id: user_only_clear ? user_only_clear.id : null, // <-- HIER: Im update-Block
            timestamp: DateTime.now().toUnixInteger(), // Update timestamp on every action
        },
    });
}

async function getCommandAction(guild: any, ) {
    const results = await p.actions.findMany({
        select: {
            command: true,
            timestamp: true,
            active: true,
            channel_name: true,
            user_id: true,
            channel_id: true
        },
        where: {
            guild_id: guild.id
        }
    })
    return results    
}


async function clearMessageTable(guild: any) {
    await p.actions.deleteMany({
        where: {
            guild_id: guild.id
        }
    })
}

// TODO: any canceld action should be removed after cancelation occurred -> Retype Manually and configure a active type ()
async function removeActionFromDatabase(guild, action: string, channel: any, user: any) {
    await p.actions.delete({
        where: {
            guild_id_command: {
                guild_id: guild.id, 
                command: action,
            }, AND: {
                channel_id: channel.id,
                user_id: user.id
            }
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
                user_id: true,
            }, 
            where: {
                guild_id: guild.id,
                channel_id: channel.id,
                queued_deletion: true,
            }, orderBy: {
                message_id: 'desc',

            }
        })
        console.log("Nachrichten: ", results)
        return results
    } catch (error) {
        console.log("failed to get messages from database")
    }
}

async function msgToDatabase(guild: any, channel: any, msg: any, userId: string, authorized_id: string) {
    try {
        await p.messages.upsert({
            where: {
                // This is the unique identifier Prisma will use to find the record.
                // It matches your @@id([guild_id, message_id]) in the schema.
                guild_id_message_id: {
                    guild_id: guild.id,
                    message_id: msg.id,
                },
            },
            create: {
                // These are the fields to set if the record *does not* exist (it's created).
                guild_id: guild.id,
                channel_id: channel.id,
                message_id: msg.id,
                queued_deletion: true,
                executer: authorized_id,
                user_id: userId,
                timestamp: DateTime.now().toUnixInteger()
            },
            update: {
                // These are the fields to set if the record *does* exist (it's updated).
                // For your use case with `clear.ts`, you might not need to update anything
                // if the message already exists and is just being re-queued for deletion.
                // However, you could update `timestamp` or `queued_deletion` if the logic demands it.
                // For now, we'll just keep it simple, but you could add more fields here.
                queued_deletion: true, // Ensuring it's still marked for deletion
                timestamp: DateTime.now().toUnixInteger() // Update timestamp on re-attempt/re-queue
            }
        });
        console.log(`Message ${msg.id} from guild ${guild.id} successfully processed (created or updated) for deletion.`);
    } catch (error) {
        console.error(`Failed to process message ${msg.id} for deletion:`, error);
    }
}
            // messages.forEach(element => {
            //     element.delete()
            // });


            // // Vorab check ob 
            // for (const entry of dbActionEntry) {
            //     if (entry.command === clearDbCommand) {
            //         foundCommandName = entry.command
            //         foundTimestamp = entry.timestamp
            //         clearCommand = true;
            //         // break
            //     }
            // }
          
            
            // for (const message of messages) {
            //     if (dbActionEntry) {
            //         for (const entry of dbActionEntry) {
            //             if (entry.command === clearDbCommand) {
            //                 foundCommandName = entry.command
            //                 foundTimestamp = entry.timestamp
            //                 foundActive = entry.active
            //                 foundChannelId = entry.channel_id
            //                 // break
            //             }
            //         }
            //     } 
            //     else {
            //         let msg = message[1] // Correctly access the message object
            //         await msgToDatabase(guild, channel, msg, msg.author.id, interaction.user.id, )
            //     }
                
            // }
            
            // // if (!dbMessageEntry) {
            // //     for (const message of messages) {
            // //         let msg = message[1]
            // //         await msgToDatabase(guild, channel, msg, msg.author.id, interaction.user.id,)
            // //     }
            // // }
            
            // for (const msg of dbMessageEntry) {
            //     if (dbActionEntry) {
            //         for (const entry of dbActionEntry) {
            //             if (entry.command === clearDbCommand) {
            //                 foundCommandName = entry.command
            //                 foundActive = entry.active,
            //                 foundTimestamp = entry.timestamp
            //             }
            //         }
            //     }
            //     else if (dbMessageEntry.length === 0) {
            //         interaction.editReply("Es sind keine Nachrichten mehr zum Löschen in der Datenbank.");
            //         return;
            //     }
                
            //     foundMsg = msg.message_id
            //     foundUser = msg.user_id
                
                
            //     msgTimeStamp = msg.timestamp
            //     foundChannelId = msg.channel_id
                
            //     if (foundCommandName && foundChannelId == channel.id && foundActive === true) {
            //         console.log("Further Deletion of messages canceld")
            //         await removeActionFromDatabase(guild, foundCommandName)
            //         if (deleted_count === 0) {
                        
            //             interaction.editReply(`Löschung der Nachrichten Abgebrochen - ${deleted_count} Nachrichten wurden gelöscht `)
            //         } else if (deleted_count === 1) {
            //             interaction.editReply(`Löschung der Nachrichten Abgebrochen - Eine Nachricht wurde gelöscht`)
            //         } else {
            //             interaction.editReply(`Löschung der Nachrichten Abgebrochen - ${deleted_count} Nachrichten wurden gelöscht `)
            //         }
            //         await clearMessageTable(guild)
            //         await new Promise(resolve => setTimeout(resolve, 6000));
            //         interaction.deleteReply()
            //         await p.messages.deleteMany({
            //             where: {
            //                 guild_id: guild.id
            //             }
            //         })
            //         return
                    
            //     } else if (messages && channel){
            //         if (limit === deleted_count) {
            //             interaction.editReply("Nachrichten Lösch limit erreicht - Stoppe...")
            //             await new Promise(resolve => setTimeout(resolve, 4000));
            //             interaction.deleteReply()
            //             return
            //         }
            //         console.log("No cancel request of clear command detected - Continue ")
            //         const r_msg_id = await channel.messages.fetch(foundMsg)
            //         if (!r_msg_id || undefined) {
            //             continue
            //         }
            //         if (user) {
            //             if (r_msg_id.author.id === user.id) {
            //                 const success = await r_msg_id.delete()
            //                 if (success) {
            //                     deleted_count = deleted_count +1
            //                     await removeMessageFromDatabase(foundMsg, guild.id)
            //                     await new Promise(resolve => setTimeout(resolve, 2000));
            //                     interaction.editReply(`Current Messages deleted: ${deleted_count}`)
            //                 } 
            //             }
            //         } else {
                        
            //             const success = await r_msg_id.delete() 
            //             if (success) {
            //                 deleted_count = deleted_count +1
            //                 await removeMessageFromDatabase(foundMsg, guild.id)
            //                 await new Promise(resolve => setTimeout(resolve, 2000));
            //                 interaction.editReply(`Current Messages deleted: ${deleted_count}`)
            //             } 
            //         }
            //     } 
            // }
            // await p.messages.deleteMany({
            //     where: {
            //         guild_id: guild.id
            //     }
            // })
            // await new Promise(resolve => setTimeout(resolve, 3000));
            // interaction.editReply(`Löschvorgang abgeschlossen - ${deleted_count} Nachrichten wurden gelöscht`)
            // await new Promise(resolve => setTimeout(resolve, 8000));
            // interaction.deleteReply()
            // return
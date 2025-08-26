import { ChatInputCommandInteraction, Emoji, GuildEmoji, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import p from '../../database/database.ts'

console.log("reaction command loaded")
export default {
    data: new SlashCommandBuilder()
        .setName("reaction")
        .setDescription("role reaction of a message")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand => subcommand
            .setName("add")
            .setDescription("add role react to a given message")
            .addStringOption(option => option
                .setName("message_id")
                .setDescription("message id of")
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName("emoji")
                .setDescription("role react action will be bound to emojy")
                .setRequired(true)
            )
            .addRoleOption(option => option
                .setName("role")
                .setDescription("the role you want to grant if a user reacted with previous assigned emojy")
                .setRequired(true)
            )
        ).addSubcommand(subcommand => subcommand
            .setName("remove")
            .setDescription("remove a role reaction")
            .addStringOption(option => option
                .setName("action")
                .setDescription("remove role reaction option of a message")
            )
        ), execute: async (interaction: ChatInputCommandInteraction) => {
            interaction.deferReply({flags: MessageFlags.Ephemeral})
            const subCommand = interaction.options.getSubcommand()
            const message = interaction.options.getString("message_id")
            const emoji = interaction.options.getString("emoji")
            const role = interaction.options.getRole("role")
            
            const guild = interaction.guild
            const channel = interaction.channel
            const r_msg = await channel.messages.fetch(message)
            const r_role = await guild.roles.fetch(role.id)
            if (subCommand === "add") {

            
                if(!r_msg) {
                    interaction.editReply(`Die Nachricht: ${message} existiert nicht`)
                    return
                }

                
                const perms = r_role.permissions.has([
                    "Administrator",
                    "BanMembers",
                    "KickMembers",
                    "ManageGuild",
                    "ManageRoles",
                    "ViewAuditLog",

                    
                ])
                if (role && perms) {
                    interaction.editReply("Vorgang Abgebrochen - Rolle Enthält Kritische Preveliegien")
                    return
                }


                await p.messages.upsert({
                    where: {
                        guild_id_message_id_action: {
                            guild_id: guild.id,
                            message_id: message,
                            action: role.id
                        }
                    }, update: {
                        action: role.id,
                        message_id: message,
                        reaction: emoji
                    }, create: {
                        guild_id: guild.id,
                        message_id: message,
                        channel_id: channel.id,
                        user_id: interaction.user.id,
                        reaction: emoji,
                        action: role.id,



                    }
                })
                await r_msg.react(emoji)
                interaction.editReply(`Der Nachricht ${message} wurde die Role: <@&${role.id}> `)
            }


        }
}
import { ChannelType, ChatInputCommandInteraction, CommandInteraction, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, type GuildTextBasedChannel } from "discord.js";
import type { Command } from "../../types/command.ts";
import p from "../../database/database.ts";
import { DateTime } from "luxon";

export default {
    data: new SlashCommandBuilder()
    .setName("cancel")
    .setDescription("cancel any stacked action before this command")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild)
    .addStringOption(option => option
        .setName("action")
        .setDescription("select reoccuring action that need to be canceld")
        .setAutocomplete(true)
    ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const guild = interaction.guild
        const command = interaction.options.getString("action")
        const user = interaction.user
        await interaction.deferReply()

        await p.actions.create({
            data: {
                guild_id: guild.id,
                command: command,
                user_id: user.id,
                timestamp: DateTime.now().toUnixInteger(),
            }
        })
        await interaction.editReply(`${command} will be canceld`)
    }
}                
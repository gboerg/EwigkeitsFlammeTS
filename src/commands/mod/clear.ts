import { ChannelType, ChatInputCommandInteraction, CommandInteraction, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, type GuildTextBasedChannel } from "discord.js";
import type { Command } from "../../types/command.ts";

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
execute: async (client, interaction) => {
    const subCommand = interaction.options.getSubcommand()
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as GuildTextBasedChannel

    const user = interaction.options.getUser("user") || null
    const clearOld = interaction.options.getBoolean("clear_old") || false
    const limit = interaction.options.getInteger("limit") || 30

    if (channel.type !== ChannelType.GuildText) {
        await interaction.reply('That channel is not a text channel.');
        return;
    }
    const guild = interaction.guild

    const messages = await channel.messages.fetch()

    const filtered = messages.filter(msg => {
        if (user && msg.author?.id !== user.id) return false;
        if (!clearOld && isOlderThan14Days(msg.createdAt)) return false;
        return true;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).first(30);

        
    if (filtered.length == 0) {
        await interaction.reply("There are no messages that can be deleted")
        return
    }
    
    if (clearOld) {
        filtered.forEach(msg => {
            msg.delete()
        })

        await interaction.reply(`Deleted old messages`)
        return
    }

    const success = await channel.bulkDelete(filtered)
    if (!success) {
        await interaction.reply("Fetched messages are older than 14 Days - Action canceld")
        return
    }

    await interaction.reply(`Deleted ${filtered.length}`)

    // console.log("Messages", messages)
    }
} as Command;

function isOlderThan14Days(date: Date) {
  return (Date.now() - date.getTime()) > 14 * 24 * 60 * 60 * 1000;
}
import {ButtonBuilder, ButtonStyle, ActionRow, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js"



export const thread_close = new ButtonBuilder()
    .setCustomId("ticket_close")
    .setLabel("Schließen")
    .setStyle(ButtonStyle.Primary)

export const thread_close_confirm = new ButtonBuilder()
    .setCustomId("ticket_close_confirm")
    .setLabel("Bestätigen")
    .setStyle(ButtonStyle.Danger)

export const tag_select_menu = new StringSelectMenuBuilder()
    .setCustomId("tag_select")
    .setPlaceholder("Was beschreibt dein Problem als bestes")
    .setOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel("Bug")
            .setDescription("Tendieren dinge zu zebrechen")
            .setValue("bug")
    )




export const threadStartRow = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
    // .addComponents(tag_select_menu)
    .addComponents(thread_close)

export const threadStartRow2 = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
// .addComponents(tag_select_menu)
    .addComponents(tag_select_menu)
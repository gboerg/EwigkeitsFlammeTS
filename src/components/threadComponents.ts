import {ButtonBuilder, ButtonStyle, ActionRow, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js"



export const thread_close = new ButtonBuilder()
    .setCustomId("thread_close")
    .setLabel("Schließen")
    .setStyle(ButtonStyle.Primary)

export const thread_close_confirm = new ButtonBuilder()
    .setCustomId("thread_close_confirm")
    .setLabel("Bestätigen")
    .setStyle(ButtonStyle.Danger)


export const thread_close_cancel = new ButtonBuilder()
    .setCustomId("thread_close_cancel")
    .setLabel("Abbrechen")
    .setStyle(ButtonStyle.Success)

export const tag_select_menu = new StringSelectMenuBuilder()
    .setCustomId("tag_select")
    .setPlaceholder("Was beschreibt dein Problem als bestes")
    .setOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel("Bug")
            .setDescription("Tendieren dinge zu zebrechen")
            .setValue("bug"),
        new StringSelectMenuOptionBuilder()
            .setLabel("test")
            .setDescription("test")
            .setValue("test"),
        new StringSelectMenuOptionBuilder()
            .setLabel("Remove Tags")
            .setDescription("Remove tags of the current page")
            .setValue("tag_remove_0")
    )


export const tag_solved_menu = new StringSelectMenuBuilder()
    .setCustomId("tag_solved_select")
    .setPlaceholder("Was beschreibt dein Problem als bestes")
    .setOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel("Lösung im Chat")
            .setDescription("Tendieren dinge zu zebrechen")
            .setValue("solved"),
        new StringSelectMenuOptionBuilder()
            .setLabel("Lösung nicht im Chat")
            .setDescription("test")
            .setValue("unsolved"),
        new StringSelectMenuOptionBuilder()
            .setLabel('Tag Remove')
            .setDescription("Remove all current tags active in section")
            .setValue("tag_remove_1")
        
    )





export const threadStartRow = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
// .addComponents(tag_select_menu)
    .addComponents(tag_select_menu)

export const threadStartRow2 = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
    // .addComponents(tag_select_menu)
    .addComponents(thread_close)




    // 
export const threadCloseConfirmRow = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
    .addComponents(tag_solved_menu)

export const threadCloseConfirmRow2 = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
    .addComponents(thread_close_cancel, thread_close_confirm)
    
// export const threadCloseConfirmRow3 = new ActionRowBuilder <ButtonBuilder | StringSelectMenuBuilder>()
//     .addComponents(thread_close_confirm)



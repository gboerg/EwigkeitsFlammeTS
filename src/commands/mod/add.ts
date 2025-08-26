import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js'
import p from '../../database/database.ts'

export default {
    data: new SlashCommandBuilder()
    .setName("entry")
    .setDescription("general entry command add/remove")
    .addStringOption(option => option
        .setName("content")
        .setDescription("Example: /entry add TwitchStreamerbycoba")
        .setRequired(true)
        .setAutocomplete(true)
    ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral});
        const content = interaction.options.getString("content")
        const guild = interaction.guild

        const formatContent = content.toLocaleLowerCase()
        const addAlieas = ["add", "@", "+"]
        const removeAlias = ["remove", "delete", "-"]
        const removeTrue = removeAlias.some(word =>content.includes(word))
        // const removeTrue = formatContent.includes(removeAlias)
        const addTrue = addAlieas.some(word =>content.includes(word))
        console.log("Content: ", formatContent)

        const isTwitch = formatContent.includes("twitch")

        if (removeTrue) {

        } else if (addTrue) {
            console.log("Add Entry event detected")
            if (isTwitch) {
                const regex = /twitch(.*)/i; 
                const match = formatContent.match(regex);

                if (match && match.length > 1) {
                    const result = match[1].trim();
                    console.log(result);
                    await p.streamerTable.upsert({
                        where: {
                            guild_id_twitch_user_name: {
                                guild_id: guild.id,
                                twitch_user_name: result
                            }
                        },
                        update: {
                            twitch_user_name: result
                        },
                        create: {
                            // Das hier wird ausgeführt, wenn der Datensatz in der Datenbank nicht existiert.
                            guild_id: guild.id,
                            twitch_user_name: result,
                            youtube_user_name: ""
                        }
                    });

                    // Ausgabe: "bycoba aber twitch nochmal"
                } else {
                    console.log("Das Muster wurde nicht gefunden.");
                }
            } else {
                console.log("Add Entry detected but not twitch")
            }
        } else {
            console.log("Neither add or remove found for new Entry")
        }



        interaction.editReply(`Content: ${formatContent}`)
    }
}
import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "../../types/command.js";
import prisma from "../../database/database.js";

export default {
    data: new SlashCommandBuilder()
        .setName("mod")
        .setDescription("main mod command")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setContexts(InteractionContextType.Guild)
        .addSubcommand(subcommand => subcommand
            .setName("ban")
            .setDescription("ban a user")
            .addUserOption(option => option
                .setName("user")
                .setDescription("the user you want to ban")
                .setRequired(true))
            .addStringOption(option => option
                .setName("reason")
                .setDescription("reason of the ban")
            )
        ).addSubcommand(option => option
            .setName("unban")
            .setDescription("unban a user")
            .addStringOption(option => option
                .setName("user")
                .setDescription("the user ID or name you want to unban")
                .setAutocomplete(true)
                .setRequired(true))
        ).addSubcommand(subcommand => subcommand
            .setName("mute")
            .setDescription("mute a user for a set duration")
            .addUserOption(option => option
                .setName("user")
                .setDescription("the user you want to mute")
                .setRequired(true)
            ).addIntegerOption(option => option
                .setName("duration")
                .setDescription("the duration you want to mute a user")
                .setRequired(false)
            ).addStringOption(option => option
                .setName("reason")
                .setDescription("the reason for the timeout")
                .setRequired(false)
            ).addBooleanOption(option => option
                .setName("restrict_voice")
                .setDescription("limit the mute for voice ")
                .setRequired(false)
            ).addBooleanOption(option => option
                .setName("restrict_text")
                .setDescription("restrict text comms")
                .setRequired(false))
            // .addBooleanOption(option => option
            //     .setName("")
            // )
        ).addSubcommand(subcommand => subcommand
            .setName("unmute")
            .setDescription("main unmute command")
            .addUserOption(option => option
                .setName("user")
                .setDescription("the user") 
                .setRequired(true)
            ) 
        ),
        // .addSubcommand(option => option
        //     .setName("clear")
        //     .setDescription("clears out the chat")
        //     .addChannelOption(option => option
        //         .setName("channel")
        //         .setDescription("which channel do you want to clear")
        //     )
        // ),

    // KORRIGIERT: execute erhält nur noch 'interaction'. Der Client ist via 'interaction.client' erreichbar.
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.inGuild() || !interaction.guild) return; // Stellt sicher, dass wir in einem Server sind

        await interaction.deferReply({ flags: MessageFlags.Ephemeral});

        const subCommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") ?? "Kein Grund angegeben";
        const duration = interaction.options.getInteger("duration") ?? 30
        const r_user = await guild.members.fetch(user.id)
        const textOnly = interaction.options.getBoolean("restrict_text")
        const voiceOnly = interaction.options.getBoolean("restrict_voice")

        if (subCommand === "ban") {
            console.log("ban")
            // const user = interaction.options.getUser("user", true);
            // const reason = interaction.options.getString("reason") ?? "Kein Grund angegeben";

            
            await guild.members.ban(user, { reason: reason });
            try {
                await user.send(`Leider hat es mit uns nicht funktioniert | Server: ${guild.name} | Grund: ${reason}`);
            } catch (error) {
                console.log(`Konnte keine DM an ${user.tag} senden.`);
            }
            
            await prisma.user.upsert({
                where: { guild_id_user_id: { guild_id: guild.id, user_id: user.id } },
                update: { is_banned: true },
                create: { user_id: user.id, guild_id: guild.id, is_banned: true }
            });

            await interaction.editReply(`${user.username} wurde gebannt. Grund: ${reason}`);

        } else if (subCommand === "unban") {
            // BEIM UNBAN IST 'user' EINE ID (string), kein User-Objekt!
            const userIdToUnban = interaction.options.getString("user", true);

            try {
                await guild.members.unban(userIdToUnban, "Unban per Befehl");
                await interaction.editReply(`Benutzer mit der ID \`${userIdToUnban}\` wurde entbannt.`);
            } catch {
                await interaction.editReply(`Konnte Benutzer mit der ID \`${userIdToUnban}\` nicht finden oder entbannen.`);
            }
        } else if (subCommand === "mute") {
            if (textOnly || voiceOnly) {
                const user_roles = r_user.roles
                console.log("User Roles: ", user_roles)
                interaction.editReply("User wurde Limitiert gemutet")
            } else {
                r_user.timeout(duration * 60 * 1000, reason)
                await interaction.editReply(`${r_user.user} wurde für ${duration} mit dem Grund ${reason} in den timeout versetzt`)
            }
        } else if (subCommand === "unmute") {
            r_user.timeout(null)
            await interaction.editReply(`Timeout von ${r_user.user} wurde aufgehoben`)
        }
    },

    // KORRIGIERT: Auch hier nur 'interaction'
    async autocomplete(interaction: AutocompleteInteraction) {
        if (!interaction.guild) return;
        const focusedValue = interaction.options.getFocused();

        // Zeigt gebannte User aus der Datenbank als Vorschläge an
        const bannedUsers = await prisma.user.findMany({
            where: {
                guild_id: interaction.guild.id,
                is_banned: true,
            },
            take: 25,
        });

        // Du müsstest hier eventuell noch die User-Namen von Discord fetchen
        const choices = bannedUsers.map(user => ({ name: `ID: ${user.user_id}`, value: user.user_id }));

        const filtered = choices.filter(choice => choice.value.startsWith(focusedValue));
        await interaction.respond(filtered);
    }
} as Command;

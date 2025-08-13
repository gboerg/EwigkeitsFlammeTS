import { Events, type Interaction } from 'discord.js';
import type { Event } from '../types/event.js';
import type { ExtendedClient } from '../main.js';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: Interaction) {
        // Hol den erweiterten Client aus der Interaktion
        const client = interaction.client as ExtendedClient;
        // const limiter = client.rest.globalRemaining
        // console.log(`New Limit: ${limiter}`)

        // if (limiter <= 48) {
        //     console.log("API LIMIT REACHED - Queing actions")
        //     console.log("saved interaction", interaction)
        //     return
        // }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            console.log("command executed: ", command)

            if (!command) {
                console.error(`Kein Befehl mit dem Namen ${interaction.commandName} gefunden.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errorMessage = { content: 'Beim Ausführen ist ein Fehler aufgetreten!', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
} as Event;
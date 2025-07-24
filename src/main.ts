import { Client, Collection, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import type { Command } from "./types/command.ts";
import { loadCommands, loadEvents } from "./loader.js";

// Erweitere den Client, um eine Collection für Befehle zu speichern.
// Das ist der entscheidende Schritt, um 'interaction.client.commands' verfügbar zu machen.


// TODO: Interface genau nachvollziehen - Für eigene Programmierung
export class ExtendedClient extends Client {
    public commands:  Collection<string, Command> = new Collection();
}

// const client = new ExtendedClient({
//     intents: ["Guilds", "GuildMessages", "DirectMessages"],
// });
// }

const client = new ExtendedClient({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        // GatewayIntentBits.
    ]
});




// TODO: Mit Ratelimits auseinander setzen 
// const limiter = client.rest.globalRemaining
// console.log(`New Limit: ${limiter}`)





// Starte den Bot
async function startBot() {
    console.log("Discord Bot gestartet")
    client.login(config.TOKEN);
    await loadCommands(client);
    await loadEvents(client);
}

startBot();
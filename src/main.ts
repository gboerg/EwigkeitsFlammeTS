import { Client, Collection } from "discord.js";
import { config } from "./config.js";
import { loadCommands, loadEvents } from "./loader.js";
import type { Command } from "./types/command.js";

// Erweitere den Client, um eine Collection für Befehle zu speichern.
// Das ist der entscheidende Schritt, um 'interaction.client.commands' verfügbar zu machen.
export class ExtendedClient extends Client {
    public commands: Collection<string, Command> = new Collection();
}

const client = new ExtendedClient({
    intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

// Starte den Bot
async function startBot() {
    // Lade die Befehle und Events und übergib die Client-Instanz.
    await loadCommands(client);
    await loadEvents(client);

    // Logge dich ein, NACHDEM alles geladen ist.
    client.login(config.TOKEN);
}

startBot();
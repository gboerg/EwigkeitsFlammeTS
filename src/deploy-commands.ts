// /src/deploy-commands.ts
// Dieses Skript ist dafür gedacht, eigenständig ausgeführt zu werden, um Befehle zu registrieren.
// z.B. mit: tsx src/deploy-commands.ts

import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Command } from "./types/command.js";
import p from "./database/database.ts";


async function deploy() {
    const commandsData = [];
    console.log("Lese Befehlsdateien für die Bereitstellung...");

    // Wiederverwende die Logik zum rekursiven Einlesen von Dateien.
    async function getTsFiles(dir: string): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(entry => {
            const res = path.join(dir, entry.name);
            return entry.isDirectory() ? getTsFiles(res) : res;
        }));
        return files.flat().filter(file => file.endsWith(".ts") || file.endsWith(".js"));
    }

    const commandsPath = path.join(process.cwd(), "src", "commands");
    const commandFiles = await getTsFiles(commandsPath);
    // Lade die 'data'-Eigenschaft aus jeder Befehlsdatei.
    for (const file of commandFiles) {
        const fileUrl = pathToFileURL(file).href;
        try {
            const cmd = (await import(fileUrl)).default as Command;
            if ('data' in cmd && 'execute' in cmd) {
                // Konvertiere die Builder-Daten in ein JSON-Objekt für die API.
                commandsData.push(cmd.data.toJSON());
                console.log(`[+] Befehlsdaten geladen: ${cmd.data.name}`);
            } else {
                console.log(`[!] Die Datei in ${file} scheint kein gültiger Befehl zu sein.`);
            }
        } catch (error) {
            console.error(`Fehler beim Laden von ${file}:`, error);
        }
    }

    // Initialisiere den REST-Client, um mit der Discord-API zu kommunizieren.
    const rest = new REST({ version: "10" }).setToken(config.TOKEN);

    try {
        console.log(`\nStarte das Aktualisieren von ${commandsData.length} Anwendungsbefehlen (/).`);

        // Lade die Befehle global für den Bot hoch.
        // Für Testserver: Routes.applicationGuildCommands(config.CLIENT_ID, 'DEINE_GUILD_ID')
        const data = await rest.put(
            Routes.applicationCommands(config.CLIENT_ID),
            { body: commandsData },
        );

        console.log(`\nErfolgreich ${ (data as any[]).length } Anwendungsbefehle (/) neu geladen.`);
    } catch (error) {
        console.error("\nFehler bei der Bereitstellung der Befehle:", error);
    }
}

// Führe die Funktion aus.
deploy();
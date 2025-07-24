import { Collection, Client } from "discord.js";
import { join } from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { Command } from "./types/command.js";
import type { Event } from "./types/event.js";
import type { ExtendedClient } from "./main.js";

async function getTsFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    console.log("Entries:", entries)
    const files = await Promise.all(entries.map(entry => {
        const res = join(dir, entry.name);
        console.log("fileloader_res: ", res)
        return entry.isDirectory() ? getTsFiles(res) : res;
    }));
    console.log("ts files: ", files.flat().filter(file => file.endsWith(".ts") || file.endsWith(".js")))
    return files.flat().filter(file => file.endsWith(".ts") || file.endsWith(".js"));
}   

// Nimmt jetzt den Client als Parameter, um die Befehle direkt anzuhängen.
export async function loadCommands(client: ExtendedClient) {
    const path = join(process.cwd(), "src", "commands");
    const files = await getTsFiles(path);

    for (const file of files) {
        const fileUrl = pathToFileURL(file).href;

        // Wichtig: Deine Befehlsdateien exportieren ein Objekt als "default".
        const cmd = (await import(fileUrl)).default as Command;
        console.log("cmd Commandloader: ", cmd)

        if ("data" in cmd && "execute" in cmd) {
            client.commands.set(cmd.data.name, cmd);
            // console.log("commandloader", client.commands.set(cmd.data.name, cmd))
            console.log(`[+] Befehl geladen: ${cmd.data.name}`);
        } else {
            console.log(`[-] Fehler beim Laden des Befehls in ${file}`);
        }
    }
}

export async function loadEvents(client: Client) {
    const path = join(process.cwd(), "src", "events");
    const files = await getTsFiles(path);

    for (const file of files) {
        const fileUrl = pathToFileURL(file).href;
        const event = (await import(fileUrl)).default as Event;

        if (!event || !event.name || !event.execute) {
            console.log(`[-] Fehler beim Laden des Events in ${file}`);
            continue;
        }

        if (event.once) {
            // console.log("event logger: ", client.once(event.name, (...args) => event.execute(...args)) )
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[+] Event geladen: ${event.name}`);
    }
}

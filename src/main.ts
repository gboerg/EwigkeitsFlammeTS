
import { ChatInputCommandInteraction, Client, Collection } from "discord.js";
import { config } from "./config.ts";

import { deployCommands } from "./deploy-commands.ts";
import { join } from "node:path";
import fs from "node:fs"
import type { Command } from "./types/command.ts";
import { pathToFileURL } from "node:url";
import type { Event } from "./types/event.ts";

export const commands = new Collection<string, Command>()

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});


loadEvents()

async function getTsFiles(dir: string): Promise<string[]> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const res = join(dir, entry.name);
    return entry.isDirectory() ? getTsFiles(res) : res;
  }));
  return files.flat().filter(file => file.endsWith(".ts") || file.endsWith(".js"));
}


export async function loadCommands() {
  const path = join(process.cwd(), "src", "commands");
  const files = await getTsFiles(path);

  for (const file of files) {
    const fileUrl = pathToFileURL(file).href;

    const cmd = await import(fileUrl).then(v => v.default) as Command;

    if ("data" in cmd && "execute" in cmd) {
      commands.set(cmd.data.name, cmd)
      console.log(`Loaded command ${cmd.data.name}`)
    }
  }
}

export async function loadEvents() {
  const path = join(process.cwd(), "src", "events");
  const files = await getTsFiles(path);

  for (const file of files) {
    const fileUrl = pathToFileURL(file).href;

    const event = (await import(fileUrl)).default as Event;
    console.log("file", file)
    console.log("event", event)

    if (event.once) {
      client.once(event.name, event.execute.bind(null, client))
    } else {
      client.on(event.name, event.execute.bind(null, client))
    }

    console.log(`Loaded event ${event.name}`);
  }
}




// client.on






client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }
  const { commandName } = interaction;
  const cmd = commands.get(commandName) 

  if (!cmd) return

  cmd.execute(client, interaction as ChatInputCommandInteraction<"cached">)
});

client.login(config.TOKEN);
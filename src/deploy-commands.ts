import { REST, Routes } from "discord.js";
import { config } from "./config.ts";
import { commands, loadCommands } from "./main.ts";

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

export async function deployCommands() { // No guildId needed for global deployment
  try {
    
  const commandsData = Object.values(commands).map((command) => command.data);
    console.log("Started refreshing application (/) commands globally.");

    await rest.put(
      Routes.applicationCommands(config.CLIENT_ID), // Use applicationCommands for global deployment
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands globally.");
  } catch (error) {
    console.error(error);
  }
}

interface ImportMeta {
  main?: boolean;
}

if ((import.meta as ImportMeta).main) {
  loadCommands().then(() => {
    deployCommands();
  });
}
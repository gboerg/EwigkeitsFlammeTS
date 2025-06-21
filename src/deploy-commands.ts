import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.TOKEN);

export async function deployCommands() { // No guildId needed for global deployment
  try {
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
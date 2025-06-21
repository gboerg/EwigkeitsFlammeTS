import { Events } from "discord.js";
import { loadCommands } from "../main.ts";

export default {
    name: Events.ClientReady,
    once: true,
    execute: async (client) => {
        loadCommands()
        console.log("Discord bot is ready! 🤖");
    }
};
import { Client, Events } from "discord.js";
// import { loadCommands } from "../main.ts";

export default {
    name: Events.ClientReady,
    once: false,
    execute: async (client: Client) => {
        // loadCommands()
        console.log("Discord bot is ready! 🤖");

        // const get_guilds = await client.guilds.fetch()
        // console.log("all guilds:", get_guilds)


    }
};
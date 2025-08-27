import { Client, Events } from "discord.js";
import {onlyOnce} from '../../src/twitch/twitchManager.ts'

// import { loadCommands } from "../main.ts";

export default {
    name: Events.ClientReady,
    once: false,
    execute: async (client: Client) => {
        // loadCommands()
        console.log("Discord bot is ready! 🤖");
        await onlyOnce()
        

        // const get_guilds = await client.guilds.fetch()
        // console.log("all guilds:", get_guilds)


    }
};
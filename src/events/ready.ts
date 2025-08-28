import { Client, Events } from "discord.js";
import {onlyOnce} from '../../src/twitch/twitchManager.ts'
import p from "../database/database.ts";
// import { loadCommands } from "../main.ts";
import {botManager} from '../bot/smartBotManager.ts'
export default {
    name: Events.ClientReady,
    once: false,
    execute: async (client: Client) => {
        // loadCommands()
        console.log("Discord bot is ready! 🤖");
        
        try {
            await onlyOnce()
            await botManager()
            
        } catch (error) {
            
        }
        

        // const get_guilds = await client.guilds.fetch()
        // console.log("all guilds:", get_guilds)


    }
};
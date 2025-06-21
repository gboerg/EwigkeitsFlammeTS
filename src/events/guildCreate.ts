import { Events, Guild } from "discord.js";

export default {
    name: Events.GuildCreate,
    once: false,
    execute: async (client, g: Guild) => {
        console.log(`Joined ${g.name}`)
    }
};
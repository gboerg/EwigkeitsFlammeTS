import { Events, Guild, type Interaction } from "discord.js";

export default {
    name: Events.InteractionCreate,
    execute: async (client: Interaction) => {
        // if(!client.isButton()) {
        //     return
        // }

        console.log("Button pressed")
    }
};
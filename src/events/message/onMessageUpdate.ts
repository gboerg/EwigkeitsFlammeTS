import { Events, Message } from "discord.js";

export default {
    name: Events.MessageUpdate,
    once: false,


    execute: async (message: Message) => {
        console.log("Message update detected")
    }
}
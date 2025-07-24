import {Events, Message} from 'discord.js'


export default {
    name: Events.MessageCreate,
    once: false,

    execute: async (event: Message) => {
        console.log(event.content)
    }
}
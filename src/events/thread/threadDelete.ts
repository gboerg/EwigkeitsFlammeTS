import {Events, ThreadChannel} from 'discord.js' 
import p from "../../database/database.ts"

export default {
    name: Events.ThreadDelete,
    once: false,

    execute: async (thread: ThreadChannel) => {
        console.log("thread deletion detected")

        const guild = thread.guild

        if (thread) {
            await p.threads.delete({
                where: ({
                    guild_id_thread_channel: {
                        guild_id: guild.id,
                        thread_channel: thread.id
                    }
                })
            })

        }

    }

}
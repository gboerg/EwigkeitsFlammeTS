import { Events, ThreadChannel } from "discord.js";
import {threadStartRow, thread_close, tag_select_menu, thread_close_confirm, threadStartRow2} from "../components/threadComponents.ts"
import prisma from "../database/database.ts"

export default {
    name: Events.ThreadCreate,
    once: false,
    execute: async (thread: ThreadChannel) => {
        // TODO: weitere logik hier einfügen
        const guild = thread.guild
        const author = await guild.members.fetch(thread.ownerId)

        const thread_intial_msg = await thread.send({content:`Vielen Dank ${author}, dass du unsere Thread-Support System nutzt\nWähle deine Tags aus\nWenn du keine hilfe mehr brauchst kannst du hier dein Ticket schließen:`, components: [threadStartRow2, threadStartRow]})
        await thread_intial_msg.pin()
        

        await prisma.threads.create({
            data:{
                guild_id: guild.id,
                user_id: thread.ownerId,
                first_user_message: "NONE",
                thread_channel: thread.id,
                thread_initial_message: thread_intial_msg.id,
            }
        })
    }
};                        
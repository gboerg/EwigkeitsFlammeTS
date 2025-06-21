import { Events, ThreadChannel } from "discord.js";
import {threadStartRow, thread_close, tag_select_menu, thread_close_confirm, threadStartRow2} from "../components/threadComponents.ts"

export default {
    name: Events.ThreadCreate,
    once: false,
    execute: async (client, thread: ThreadChannel) => {

        const guild = thread.guild
        const author = await guild.members.fetch(thread.ownerId)

        await thread.send({content:`Vielen Dank ${author}, dass du unsere Thread-Support System nutzt\nWähle deine Tags aus\nWenn du keine hilfe mehr brauchst kannst du hier dein Ticket schließen:`, components: [threadStartRow2, threadStartRow]})
        // console.log(`Thread created: ${g.name}`)
    }
};                        
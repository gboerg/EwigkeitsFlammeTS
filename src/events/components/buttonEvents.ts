import { Events, Guild, type Interaction } from "discord.js";
import {threadCloseConfirmRow, threadCloseConfirmRow2, threadStartRow, threadStartRow2} from "../../components/threadComponents.ts"
import prisma from "../../database/database.ts"

export default {
    name: Events.InteractionCreate,
    /**
     *
     *
     * @param {Interaction} button
     */
    execute: async (button: Interaction) => {
        if (!button.isButton()) {
            return
        } else {
            button.deferUpdate()
            const guild = button.guild
            const user = button.user
            const channel = button.channelId
            const thread_channel= button.channel
            const button_msg = button.message
            const threadMain = thread_channel.parent
            // threadMain.
            switch(button.customId) {
                case 'thread_close':
                    console.log("button_msg:", button_msg)
                    button_msg.edit({components: []})
                    button_msg.edit({components: [threadCloseConfirmRow, threadCloseConfirmRow2]})
                    break

                case 'thread_close_confirm': 
                    thread_channel.edit({locked: true, archived: true})
                    break

                case 'thread_close_cancel':
                    button_msg.edit({components:[]})
                    button_msg.edit({components: [threadStartRow, threadStartRow2]})
                    break

                default:
                    console.log("Unknown Action")
            }
            console.log("Button pressed EXTRA")
        }

    }
};

async function getDBResults(guild, user, channel) {
    const results = await prisma.threads.findMany({
        where: {
            guild_id: guild.id,
            user_id: user.id,
            thread_channel: channel.id,
        }
    })
    console.log("DB Function Returned vals", results)
    return results
}
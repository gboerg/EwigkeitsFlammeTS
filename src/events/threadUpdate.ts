import { Events, ThreadChannel, ChannelType, ThreadOnlyChannel, TextChannel } from "discord.js";
import {threadStartRow, thread_close, tag_select_menu, thread_close_confirm, threadStartRow2} from "../components/threadComponents.ts"
import prisma from "../database/database.ts"

export default {
    name: Events.ThreadUpdate,
    once: false,
    execute: async (newThread: ThreadChannel) => { 
        console.log("Thread Update detected");

        // We should always work with the newThread state for the current status
        const thread = newThread;
        const guild = thread.guild;

        // Fetching author might not be necessary for status update logic,
        // but keeping it if needed elsewhere in your code.
        // const author = await guild.members.fetch(thread.ownerId);

        let newStatus: number;

        // Case 1: Thread is both locked AND archived
        if (thread.locked && thread.archived) {
            console.log("Thread is locked and archived (status 2)");
            newStatus = 2;
        }
        // Case 2: Thread is locked but NOT archived (or only locked)
        else if (thread.locked && !thread.archived) {
             console.log("Thread is only locked (status 1)");
             newStatus = 1;
        }
        // Case 4: Thread is neither locked NOR archived (open/active)
        else { // thread.locked == false && thread.archived == false
            console.log("Thread is neither locked nor archived (status 0)");
            newStatus = 0;
        }

        // Only update the database if the status has actually changed
        // This requires comparing with the old state, but for simplicity,
        // we'll update every time the conditions are met.
        // If you want to optimize, you'd need to fetch old DB status or use oldThread's properties.
        // consguild.channels.fetch(thread.id)
        if (!thread) {

            console.log("Thread Deleted", thread)
        }
        try {
            await prisma.threads.update({
                where: {
                    guild_id_thread_channel: {
                        guild_id: guild.id,
                        thread_channel: thread.id
                    }
                },
                data: {
                    thread_closed_status: newStatus
                }
            });
            console.log(`Database updated for thread ${thread.name} with status: ${newStatus}`);
        } catch (error) {
            console.error(`Error updating thread status for ${thread.name}:`, error);
        }
    }
};
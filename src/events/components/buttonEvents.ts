import { ChannelType, Events, Guild, ThreadChannel, type Interaction } from "discord.js";
import {threadCloseConfirmRow, threadCloseConfirmRow2, threadStartRow, threadStartRow2} from "../../components/threadComponents.ts"
import prisma from "../../database/database.ts"

export default {
    name: Events.InteractionCreate,
    /**
     *
     *
     * @param {Interaction} button
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
            const parent = button.channel.parent
            const r_channel = button.channel

            switch(button.customId) {
                case 'thread_close':
                    console.log("button_msg:", button_msg)
                    button_msg.edit({components: []})
                    button_msg.edit({components: [threadCloseConfirmRow, threadCloseConfirmRow2]})
                    break
            // if (r_channel == ChannelType.GuildForum)
            // let tags = 


                case 'thread_close_confirm': 
                    const solved_status = await getDBResults(guild, user.id, thread_channel.id)
                    const status = solved_status[0].thread_solved_status
                    if (parent.type == ChannelType.GuildForum) {
                        const tags_channel = thread_channel as ThreadChannel

                        let tags = tags_channel.appliedTags

                        const getSpecificParentTag = (tagName: string) => {
                            return parent.availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
                        }
                        const solved = getSpecificParentTag("solved");
                        const unsolved = getSpecificParentTag('unsolved')
                        if (status === 1) {

                            if (thread_channel) {
                                if (tags)  {
                                    tags.push(solved.id)
                                    tags_channel.setAppliedTags(tags)
                                } else {
                                    thread_channel.edit({appliedTags: [solved.id]})

                                }
                            }
                        } else if (status === 0) {
                            if (thread_channel) {
                                if (tags) {
                                    tags.push(unsolved.id)
                                    tags_channel.setAppliedTags(tags)
                                } else {
                                    thread_channel.edit({appliedTags: [unsolved.id]})

                                }
                            } 
                        } else if (status === 3) {
                            console.log("No Tag selected skipping steps")
                        }

                    }

                    console.log("Solved Database entry: ", )
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

async function changeTags(guild: any, channel: any, tag: any) {
    const changed = await prisma.threads.upsert({
        update: {
            thread_previous_tags: tag
        }, where: {
            guild_id_thread_channel: {
                guild_id: guild.id,
                thread_channel: channel.id
            }
        },create: {
            guild_id: "sdsad",
            user_id: "adasdasd",
            first_user_message: "sdasd", 
            thread_channel: "sdasd",
            thread_channel_name:"sdasdas",
            thread_closed_status: 1,
            thread_initial_message: "sdasd",
            thread_previous_tags: tag,
            thread_solved_status: 0
        }
    })
}
import { Events, ChannelType, type Interaction } from "discord.js";
import p from "../../database/database.ts";
import prisma from "../../database/database.ts";

export default {
    name: Events.InteractionCreate,
    execute: async (menu: Interaction) => {
        if (!menu.isStringSelectMenu()) return;

        await menu.deferUpdate();

        const channel = menu.channel;
        const parent = channel?.parent;
        const guild = menu.guild;

        if (!guild || !channel || channel.type !== ChannelType.PublicThread) {
            console.log("Not a valid thread channel");
            return;
        }

        // Selector-Tag-Zuordnung
        const selectorTagMap: Record<string, string[]> = {
            tag_select: ['bug', 'test'],
            tag_solved_select: ['solved', 'unsolved'],
        };

        // === Wenn NICHT Forum ===
        if (!parent || parent.type !== ChannelType.GuildForum) {
            if (menu.customId === 'tag_select') {
                const dbContent = await getDbConntent(guild.id, channel.id);
                if (!dbContent || !dbContent.thread_channel_name) {
                    console.error(`Kein ursprünglicher Name für ${channel.id} in DB.`);
                    return;
                }
                const originalName = dbContent.thread_channel_name;
                const selectedValue = menu.values[0];
                let newName = originalName;

                switch (selectedValue) {
                    case 'bug':
                        newName = `🪳 [Bug] ${originalName}`;
                        break;
                    case 'test':
                        newName = `🧪 [Test] ${originalName}`;
                        break;
                    case 'tag_remove_0': {
                        const allowedTags = selectorTagMap[menu.customId] ?? [];
                        break;
                    }
                    default:
                        console.log(`Unbekannte Auswahl: ${selectedValue}`);
                        return;
                }

                try {
                    if (newName.length > 100) newName = newName.substring(0, 100);
                    await channel.setName(newName);
                    console.log(`Kanal umbenannt: "${newName}"`);
                } catch (error) {
                    console.error("Fehler beim Umbenennen:", error);
                }
            }
            return;
        }

        // === Forum-Logik ===
        if (parent.type === ChannelType.GuildForum) {
            if (menu.customId === 'tag_select' || 'tag_solved_select') {
                console.log("some menu was triggered")
                const selectedValue = menu.values[0];

                const getSpecificParentTag = (tagName: string) => {
                    return parent.availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
                };
                console.log("available tags: ", parent.availableTags)
                const bug = getSpecificParentTag("bug");
                const test = getSpecificParentTag("test");
                const solved = getSpecificParentTag("solved");
                const unsolved = getSpecificParentTag('unsolved')

                switch (selectedValue) {
                    case 'bug':{
                        if (bug) await channel.setAppliedTags([bug.id]);
                        break;
                    }
                    case 'test':{
                        if (test) await channel.setAppliedTags([test.id]);
                        break;
                    }
                    case 'solved':
                        console.log("cased solved")
                        await prisma.threads.update({
                            where:{
                                guild_id_thread_channel : {
                                    guild_id: guild.id,
                                    thread_channel: channel.id
                                }
    
                            }, 
                            data: {
                                thread_solved_status: 1
                            }
                        })
                        break;


                    case 'unsolved': {
                        if (unsolved) await channel.setAppliedTags([unsolved.id])
                        break
                    }
                    case 'tag_remove_0': {
                        const allowedTags = selectorTagMap[menu.customId] ?? [];
                        break;
                    }

                    case 'tag_remove_1' : {
                        const allowedTags = selectorTagMap[menu.customId] ?? [];
                        break;
                    }
                    default:
                        console.log(`Unbekannte Auswahl: ${selectedValue}`);
                        return;
                }
            } else {
                console.log("error during")
                }
            }
            return;
        }
    }





// 📦 DB-Anfrage
async function getDbConntent(guild: string, channel: string) {
    const values = await p.threads.findFirst({
        select: { thread_channel_name: true },
        where: {
            guild_id: guild,
            thread_channel: channel,
        }
    });
    console.log("Werte aus DB:", values);
    return values;
}

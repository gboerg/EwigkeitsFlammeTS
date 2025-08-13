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

                
                const solvedMsg = "\n\nDu hast ausgewählt, dass die Lösung nicht im Chat steht \n Wird bei Schließung des Threads Übernommen"
                const unsolvedMsg = "\n\nDu hast ausgewählt, dass die Lösung im Chat steht \n Wird bei Schließung des Threads Übernommen"

                let tags = channel.appliedTags;

                switch (selectedValue) {
                    case 'bug':{
                        // tags.length == 0
                        tags.push(bug.id)
                        await channel.setAppliedTags(tags)
                        break;
                    }
                    case 'test':{
                        // tags.length == 0
                        tags.push(test.id)
                        await channel.setAppliedTags(tags)
                        break;
                    }








                    case 'solved': {
                        const getMsg = menu.message.content;

                        // Entfern alle bekannten Statusmeldungen, egal wo sie in der Nachricht stehen
                        const cleanedMsg = getMsg.replace(/(\n\nDu hast ausgewählt, dass die Lösung im Chat steht.*)$/s, "");
                        const preMsg = cleanedMsg.replace(/(\n\nDu hast ausgewählt, dass die Lösung NICHT im Chat steht.*)$/s, "");
                        
                        const solvedMsg = "\n\nDu hast ausgewählt, dass die Lösung im Chat steht \n Wird bei Schließung des Threads Übernommen";
                        await menu.message.edit({
                            content: preMsg + solvedMsg
                        });

                        // ... sleep und entfernen ...
                        
                        break;
                    }

                    case 'unsolved': {
                        const getMsg = menu.message.content;

                        // Entfern alle bekannten Statusmeldungen, egal wo sie in der Nachricht stehen
                        const cleanedMsg = getMsg.replace(/(\n\nDu hast ausgewählt, dass die Lösung im Chat steht.*)$/s, "");
                        const preMsg = cleanedMsg.replace(/(\n\nDu hast ausgewählt, dass die Lösung NICHT im Chat steht.*)$/s, "");
                        
                        const unsolvedMsg = "\n\nDu hast ausgewählt, dass die Lösung NICHT im Chat steht \n Wird bei Schließung des Threads Übernommen";
                        await menu.message.edit({
                            content: preMsg + unsolvedMsg
                        });
                        
                        // ... sleep und entfernen ...
                        
                        break;
                    }















                    case 'tag_remove_0': {
                        channel.edit({appliedTags: []})
                        break;
                    }

                    case 'tag_remove_1' : {
                        channel.edit({appliedTags: []})
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
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
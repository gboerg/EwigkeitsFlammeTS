import { skip } from "@prisma/client/runtime/library";
import { Events, Guild, ChannelType, TextInputStyle, PermissionOverwrites, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import p from "../database/database.ts";

export default {
    name: Events.GuildCreate,
    once: false,
    execute: async (g: Guild) => {
        // Finde heraus, ob ein Kanal mit dem Namen "bot-setup" bereits existiert.
        // .find() durchsucht die Kanal-Collection und gibt den ersten Treffer zurück oder undefined, wenn nichts gefunden wird.
        const setupChannel = g.channels.cache.find(channel => channel.name === "bot-setup");
        console.log("guild create event triggered: ")
        if (setupChannel) {
            await p.setup.upsert({
                create: {
                    guild_id: g.id,
                    channel_id: setupChannel.id
                }, update: {
                    channel_id: setupChannel.id,
                }, where: {
                    guild_id: g.id,
                }
            })
        }

        // Prüfe, ob der Kanal NICHT gefunden wurde (!setupChannel).
        if (!setupChannel) {
            // Wenn er nicht existiert, erstelle ihn.
            console.log("Kanal 'bot-setup' nicht gefunden. Er wird erstellt...");
            try {
                const setup = await g.channels.create({
                    name: "bot-setup",
                    type: 0, // 0 steht für TEXT_CHANNEL
                    position: 0,
                    permissionOverwrites: [
                        {
                            id: g.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                    // Optional: Füge hier weitere Optionen hinzu, z.B. Berechtigungen
                });

                await p.setup.upsert({
                    create: {
                        guild_id: g.id,
                        channel_id: setup.id
                    }, update: {
                        channel_id: setup.id,
                    }, where: {
                        guild_id: g.id,
                    }
                })
                
                // setup.edit({permissionOverwrites.edit})
                console.log("Kanal 'bot-setup' erfolgreich erstellt.");
            } catch (error) {
                console.error("Fehler beim Erstellen des Kanals:", error);
            }
        } else {
            // Wenn der Kanal bereits existiert, gib eine Info aus.
            console.log("Kanal 'bot-setup' existiert bereits.");
        }
    }
};
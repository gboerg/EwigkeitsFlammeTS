import { Events, Message, MessageReaction, User } from 'discord.js';
import p from '../.././../database/database.ts'



// export default {
//     name: Events.Raw,
//     once: false,
//     execute: async (message: Message) => {
//         console.log("raw: ", message)
//     }
// }
export default {
    name: Events.MessageReactionAdd,
    once: false,
    
    execute: async (reaction: MessageReaction, user: User) => {
        // Falls die Reaktion unvollständig ist (partial), muss sie zuerst vollständig geladen werden.
        // if (reaction.partial) {
        //     try {
        //         await reaction.fetch();
        //     } catch (error) {
        //         console.error('Fetching reaction failed:', error);
        //         return;
        //     }
        // }

        // // Falls die Nachricht unvollständig ist (partial), muss sie ebenfalls geladen werden.
        // if (reaction.message.partial) {
        //     try {
        //         await reaction.message.fetch();
        //     } catch (error) {
        //         console.error('Fetching message failed:', error);
        //         return;
        //     }
        // }

        const guild = reaction.message.guild
        const message = reaction.message
        // const react =


        // await p.messages.upsert({
        //     where: {
        //         guild_id_message_id: {
        //             guild_id: guild.id,
        //             message_id: message.id
        //         }
        //     },
        //     update: {

        //     }
        // })
        
        console.log(`Benutzer ${user.tag} hat eine Reaktion hinzugefügt: ${reaction.emoji.name} id: ${reaction.emoji.id}`);
        console.log(`Nachricht: ${reaction.message.content}`);
        // const dbResults = p.messages.findMany({
        //     where: {
        //         guild_id: guild.id,
        //         message_id: message.id,
        //         reaction: reaction.emoji.id
        //     }
        // })
    }
};
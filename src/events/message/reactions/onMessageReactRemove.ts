import { Events, MessageReaction, User } from 'discord.js';

export default {
    name: Events.MessageReactionRemove,
    once: false,
    
    execute: async (reaction: MessageReaction, user: User) => {
        // Falls die Reaktion unvollständig ist (partial), muss sie zuerst vollständig geladen werden.
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Fetching reaction failed:', error);
                return;
            }
        }

        // Falls die Nachricht unvollständig ist (partial), muss sie ebenfalls geladen werden.
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Fetching message failed:', error);
                return;
            }
        }
        
        console.log(`Benutzer ${user.tag} hat eine Reaktion entfernt: ${reaction.emoji.name}`);
        console.log(`Nachricht: ${reaction.message.content}`);
    }
};
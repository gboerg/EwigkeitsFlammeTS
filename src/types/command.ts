import type {
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    ChatInputCommandInteraction,
    AutocompleteInteraction
} from 'discord.js';

export interface Command {
    // data kann nun ein einfacher Builder oder einer mit Sub-Commands sein.
    // Das behebt deinen ursprünglichen TypeScript-Fehler.
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
    
    // execute erhält nur die Interaktion. Den Client erreichst du über interaction.client.
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    
    // autocomplete ist eine optionale Eigenschaft.
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}


// /src/types/event.ts
// NEUE DATEI: Eine zentrale Definition für deine Event-Typen.

import type { ClientEvents } from 'discord.js';

export interface Event {
    name: keyof ClientEvents;
    once?: boolean;
    execute: (...args: any[]) => Promise<void> | void;
}
import type { ClientEvents } from 'discord.js';

export interface Event {
    name: keyof ClientEvents;
    once?: boolean;
    execute: (...args: any[]) => Promise<void> | void;
}

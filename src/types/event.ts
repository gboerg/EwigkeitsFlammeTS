import type { Client } from "discord.js";

export interface Event {
    name: string,
    once: boolean,
    execute: (client: Client, ...params: any) => any;
}
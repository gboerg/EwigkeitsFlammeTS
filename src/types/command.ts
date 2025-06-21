import type { ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";

export interface Command {
    data: SlashCommandBuilder;
    execute: InteractionExecuteFN;
}

declare type InteractionExecuteFN = (client: Client, interaction: ChatInputCommandInteraction<"cached">) => any;
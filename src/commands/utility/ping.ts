import { CommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.ts";

export default {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong!"),

    execute: async (interaction) => {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }); 

      // Do any long-running tasks here (though none for "ping")
      // await someLongProcess(); 

      // Edit the deferred reply with the actual response
      await interaction.editReply("Pong!"); 
    }
} as Command;


// import { CommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

// export const data = new SlashCommandBuilder()

//   .setName("ping")

//   .setDescription("Replies with Pong!");



// export async function execute(interaction: CommandInteraction) {

//     interaction.deferReply({flags: MessageFlags.Ephemeral});



//     interaction.reply("Pong!");

// }
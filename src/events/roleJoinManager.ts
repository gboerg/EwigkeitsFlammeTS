// import { Events, GuildMember, PermissionFlagsBits } from "discord.js";

// export default {
//     name: Events.GuildMemberAdd,
//     once: false,

//     execute: async (event: GuildMember) => {
//         // event.
//         console.log("New Member Joined")
//         // event.roles.add("1360568933807034509")
//         // event.r
//         const role = await event.guild.roles.fetch("1360568933807034509")


//         if (role.permissions.has([
//                 "Administrator",
//                 "BanMembers",
//                 "CreateEvents",
//                 "DeafenMembers",
//                 "KickMembers",
//                 "ManageChannels",
//                 "ManageGuild",
//                 "CreateGuildExpressions",
//                 "ManageEmojisAndStickers",
//                 "ManageNicknames",
//                 "ManageRoles",
//                 "ManageThreads",
//                 "ManageWebhooks",
//                 "MuteMembers",
//                 "PrioritySpeaker", 
//                 "ViewAuditLog",
//                 "ViewGuildInsights"
//             ])
//         ) {
//             // const owner =  
//         }

        
//         console.log("The Role", role)
//         event.roles.add(role.id)

//     }
// }
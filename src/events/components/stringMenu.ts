import {
  Events,
  ChannelType,
  type Interaction,
  type ThreadChannel,
} from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(menu: Interaction) {
    if (!menu.isStringSelectMenu()) return;

    console.log("MENU SELECT");
    await menu.deferUpdate();

    const channel = menu.channel;
    const guild = menu.guild;

    if (!guild || !channel || channel.type !== ChannelType.PublicThread) {
      console.log("Not a valid thread channel");
      return;
    }

    const parent = channel.parent;
    if (!parent || parent.type !== ChannelType.GuildForum) {
      console.log("Not a forum parent");
      return;
    }

    const parent_info = await parent.fetch();
    const parent_tags = parent_info.availableTags;
    console.log("Stringify:", JSON.stringify(parent_tags, null, 2));



    // TODO: Tags dynamisch Hinzufügen und gegebenfalls auch durch eine Config mit SlashCommand ändern lassen da Hardcode echt mies ist
    const tag_bug = parent_tags.find((tag) => tag.name === "Bug");
    if (!tag_bug) {
      console.log("Tag 'Bug' not found.");
      return;
    }

    switch (menu.customId) {
      case "tag_select":
        switch (menu.values[0]) {
          case "bug":
            console.log("Applying tag 'Bug'");
            await (channel as ThreadChannel).setAppliedTags([tag_bug.id]);
            break;
          case "test":
            console.log("TEST");
            break;
          default:
            console.log("Unknown Action");
        }
        break;
    }
  },
};

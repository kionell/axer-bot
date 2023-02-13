import { ChannelType, PermissionFlagsBits } from "discord.js";
import { guilds } from "../../../../database";
import generateSuccessEmbed from "../../../../helpers/text/embeds/generateSuccessEmbed";
import generateErrorEmbed from "../../../../helpers/text/embeds/generateErrorEmbed";
import { SlashCommandSubcommand } from "../../../../models/commands/SlashCommandSubcommand";

const verificationSetChannel = new SlashCommandSubcommand(
    "channel",
    "Sets the channel for the system",
    false,
    {
        syntax: "/verification `set channel` `text_channel:<channel>`",
        example: "/verification `set channel` `text_channel:#arrival`",
    },
    [PermissionFlagsBits.ManageGuild]
);

verificationSetChannel.builder.addChannelOption((o) =>
    o.setName("channel").setDescription("System channel")
);

verificationSetChannel.setExecuteFunction(async (command) => {
    await command.deferReply();

    const channel = command.options.getChannel("channel", true);

    if (channel.type != ChannelType.GuildText)
        return command.editReply({
            embeds: [
                generateErrorEmbed("You need to provide a **TEXT** channel."),
            ],
        });

    let guild = await guilds.findById(command.guildId);
    if (!guild)
        return command.editReply({
            embeds: [
                generateErrorEmbed(
                    "This guild isn't validated yet, try again after a few seconds.."
                ),
            ],
        });

    guild.verification.enable = true;
    guild.verification.channel = channel.id;

    await guilds.findByIdAndUpdate(command.guildId, guild);

    command.editReply({
        embeds: [generateSuccessEmbed("Verification channel is set!")],
    });
});

export default verificationSetChannel;

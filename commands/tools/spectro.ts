import { SlashCommand } from "../../models/commands/SlashCommand";
import { ExecException } from "child_process";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { readFileSync, unlinkSync } from "fs";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js";
import generateErrorEmbed from "../../helpers/text/embeds/generateErrorEmbed";
import colors from "../../constants/colors";
import { AudioSpectrogram } from "../../modules/osu/spectrogram/AudioSpectrogram";
import generateErrorEmbedWithTitle from "../../helpers/text/embeds/generateErrorEmbedWithTitle";
import truncateString from "../../helpers/text/truncateString";

const spectrum = new SlashCommand(
    "spectro",
    "Generate a frequency spectrogram from an audio file.",
    "Tools",
    true
);

spectrum.builder.addAttachmentOption((o) =>
    o.setName("audio").setDescription("Audio file").setRequired(true)
);

spectrum.setExecuteFunction(async (command) => {
    const audioFileData = command.options.getAttachment("audio", true);
    const fileId = crypto.randomBytes(10).toString("hex");

    const mimes = ["audio/ogg", "audio/wav", "audio/x-wav", "audio/mpeg"];

    if (!mimes.includes(audioFileData.contentType || ""))
        return command.editReply({
            embeds: [
                generateErrorEmbed(
                    `Invalid audio type! Audio type must be ${mimes
                        .map((m) => `\`${m}\``)
                        .join(", ")}`
                ),
            ],
        });

    if (audioFileData.size > 1e7)
        return command.editReply({
            embeds: [generateErrorEmbed(`Max file size must be 10mb or less!`)],
        });

    const audioFile = await axios(audioFileData.url, {
        responseType: "stream",
    });

    const progressEmbed = new EmbedBuilder()
        .setDescription("Generating spectro, this can take a while...")
        .setColor(colors.yellowBright);

    command.editReply({
        embeds: [progressEmbed],
    });

    const Spectro = new AudioSpectrogram();

    Spectro.setAudio(audioFile.data);
    Spectro.start();

    Spectro.on("data", (image: Buffer) => {
        const attachment = new AttachmentBuilder(image, {
            name: "image.jpg",
        });

        const successEmbed = new EmbedBuilder()
            .setTitle("📉 Spectro")
            .setDescription(`Spectro for \`${audioFileData.name}\` generated!`)
            .setImage("attachment://image.jpg")
            .setColor(colors.blue);

        const guideButton = new ButtonBuilder()
            .setLabel("How to read spectrograms")
            .setStyle(ButtonStyle.Link)
            .setURL(
                "https://github.com/AxerBot/axer-bot/wiki/Spectrogram-Guide"
            );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            guideButton
        );

        command.editReply({
            embeds: [successEmbed],
            files: [attachment],
            components: [row],
        });
    }).on("error", (error: ExecException) => {
        console.error(error);

        command.editReply({
            embeds: [
                generateErrorEmbedWithTitle(
                    ":x: Something went wrong!",
                    `${error?.message || "**Error:**"}\n${truncateString(
                        error.stack || "",
                        4096
                    )}`
                ),
            ],
        });
    });

    try {
    } catch (e) {
        console.error(e);
        return command.editReply({
            embeds: [generateErrorEmbed("Something went wrong! Try again.")],
        });
    }
});

export default spectrum;

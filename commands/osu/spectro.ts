import { SlashCommand } from "../../models/commands/SlashCommand";
import { spawn } from "child_process";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { readFileSync, unlinkSync } from "fs";
import { AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import generateErrorEmbed from "../../helpers/text/embeds/generateErrorEmbed";

const spectrum = new SlashCommand(
    "spectro",
    "Generate mp3 frequency spectrum graph",
    "osu!",
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
                        .join(",")}`
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

    command.editReply({
        content: "Generating spectro, this can take a while...",
    });

    try {
        const f = ffmpeg(audioFile.data);

        if (process.platform == "win32") {
            f.setFfmpegPath(path.resolve("./bin/ffmpeg.exe"));
        }
        f.toFormat("wav")

            .save(`./temp/spectro/audio/${fileId}.wav`)
            .on("error", (err) => {
                console.log("An error occurred: " + err.message);
            })
            .on("end", () => {
                const pythonProcess = spawn("python3", [
                    "./helpers/audio/spectrogram.py",
                    `${fileId}.wav`,
                ]);

                pythonProcess.on("exit", async () => {
                    const image = readFileSync(
                        path.resolve(`./temp/spectro/images/${fileId}.png`)
                    );

                    const attachment = new AttachmentBuilder(image, {
                        name: "image.jpg",
                    });

                    command
                        .editReply({
                            content: `Spectro for \`${audioFileData.name}\` generated!`,
                            files: [attachment],
                        })
                        .then(() => {
                            setTimeout(() => {
                                unlinkSync(
                                    path.resolve(
                                        `./temp/spectro/images/${fileId}.png`
                                    )
                                );
                                unlinkSync(
                                    path.resolve(
                                        `./temp/spectro/audio/${fileId}.wav`
                                    )
                                );
                            }, 30000);
                        });
                });
            });
    } catch (e) {
        console.error(e);
        return command.editReply({
            embeds: [generateErrorEmbed("Something went wrong! Sorry.")],
        });
    }
});

export default spectrum;

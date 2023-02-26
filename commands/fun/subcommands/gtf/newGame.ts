import crypto from "crypto";
import {
    ActionRowBuilder,
    EmbedBuilder,
    GuildResolvable,
    InteractionCollector,
    InteractionType,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    TextChannelResolvable,
} from "discord.js";

import colors from "../../../../constants/colors";
import { countryCodes } from "../../../../constants/countrycodes";
import { guilds } from "../../../../database";
import { randomizeArray } from "../../../../helpers/transform/randomizeArray";
import { SlashCommandSubcommand } from "../../../../models/commands/SlashCommandSubcommand";
import { CountryCodes } from "../../../../types/flags";

const gtfNewGame = new SlashCommandSubcommand("start", "Start a new game");

gtfNewGame.setExecuteFunction(async (command) => {
    const codes = countryCodes;

    let score = 0;
    let lifes = 5;
    let turn = getRandomFlag();
    const gameData = JSON.stringify({
        user: command.user.id,
        id: crypto.randomBytes(10).toString("hex"),
    });

    command.editReply({
        content: "Starting a new game...",
    });

    function getRandomFlag() {
        const code =
            Object.keys(codes)[
                Math.floor(Math.random() * Object.keys(codes).length)
            ];

        const name = countryCodes[code];

        return {
            code,
            name,
        };
    }

    function getSelectMenuFor(currentTurn: string) {
        let randomizedCodes = randomizeArray<keyof CountryCodes>(
            Object.keys(codes)
        ).filter((c) => c != currentTurn);

        randomizedCodes = randomizedCodes.slice(0, 4);
        randomizedCodes.push(currentTurn);
        randomizedCodes = randomizeArray(randomizedCodes);

        const selectMenu = new StringSelectMenuBuilder()
            .setPlaceholder("Select country")
            .setCustomId(gameData)
            .setOptions(
                randomizedCodes.map((code) => {
                    return {
                        label: codes[code],
                        value: code as string,
                    };
                })
            );

        return selectMenu;
    }

    function wrongAnswerEmbed(answer: string) {
        const embed = new EmbedBuilder()
            .setTitle(`Wrong answer!`)
            .setDescription(
                `You lost 1 life and you have \`${lifes}\` lifes now. The correct answer is \`${answer}\``
            )
            .setColor(colors.red);

        return embed;
    }

    function rightAnswerEmbed(score: number, lifes: number) {
        const embed = new EmbedBuilder()
            .setTitle(`Correct answer!`)
            .setDescription(`Next game will start in 5 seconds...`)
            .setColor(colors.green)
            .addFields(
                {
                    name: "Score",
                    value: `\`${score}\` points`,
                    inline: true,
                },
                {
                    name: "Lifes",
                    value: `\`${lifes}\``,
                    inline: true,
                }
            );

        return embed;
    }

    async function updateGuildLeaderboard() {
        const guild = await guilds.findById(command.guildId);

        if (!guild) return;
        let leaderboard = guild.flaglb || [];

        leaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));

        const currentPosition = leaderboard.findIndex(
            (s) => s.userId == command.user.id
        );

        let position =
            leaderboard.length -
            leaderboard.filter((u) => (u.score || 0) < score).length;

        if (position > 0) position = position - 1;
        if (position < 0) position = 0;

        if (position > 20) return;

        if (currentPosition != -1) {
            leaderboard.splice(currentPosition, 1);
        }

        leaderboard.splice(position, 0, {
            userId: command.user.id,
            score: score,
        });

        guild.flaglb = leaderboard;

        await guilds.findByIdAndUpdate(guild.id, {
            $set: {
                flaglb: leaderboard,
            },
        });
    }

    function sendGameOver() {
        const embed = new EmbedBuilder()
            .setTitle(`Game over!`)
            .setDescription(
                `You lost all your lifes. Your final score is \`${score}\` points`
            )
            .setColor(colors.red);

        command
            .fetchReply()
            .then((msg) => {
                msg.edit({
                    content: "",
                    components: [],
                    embeds: [embed],
                }).catch(console.error);
            })
            .catch(console.error);
    }

    function sendGame() {
        turn = getRandomFlag();

        const embed = new EmbedBuilder()
            .setTitle("🌍 Guess the flag")
            .setImage(`https://flagcdn.com/w320/${turn.code}.png`)
            .setDescription("What's the name of this flag country?")
            .setColor(colors.yellow);

        return command
            .fetchReply()
            .then((msg) => {
                msg.edit({
                    content: "",
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                            getSelectMenuFor(turn.code)
                        ),
                    ],
                    embeds: [embed],
                })
                    .then(() => {
                        createCollector();
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }

    function createCollector() {
        if (command.guild) updateGuildLeaderboard();

        const collector = new InteractionCollector(command.client, {
            channel: command.channel as TextChannelResolvable,
            guild: command.guild as GuildResolvable,
            filter: (i) => i.user.id == command.user.id,
        });

        collector.on("collect", (select: StringSelectMenuInteraction) => {
            if (select.type != InteractionType.MessageComponent) return;
            if (select.customId != gameData) return;
            select.deferUpdate();
            collector.stop();

            if (select.values[0] != turn.code) {
                lifes -= 1;

                if (lifes == 0) return sendGameOver();

                command
                    .fetchReply()
                    .then((msg) => {
                        msg.edit({
                            content: "",
                            components: [],
                            embeds: [wrongAnswerEmbed(turn.name)],
                        })
                            .then(() => {
                                setTimeout(() => {
                                    sendGame();
                                }, 5000);
                            })
                            .catch(console.error);
                    })
                    .catch(console.error);
            } else {
                score += 1;

                command
                    .fetchReply()
                    .then((msg) => {
                        msg.edit({
                            content: "",
                            components: [],
                            embeds: [rightAnswerEmbed(score, lifes)],
                        })
                            .then(() => {
                                setTimeout(() => {
                                    sendGame();
                                }, 5000);
                            })
                            .catch(console.error);
                    })
                    .catch(console.error);
            }
        });
    }

    sendGame();
});

export default gtfNewGame;

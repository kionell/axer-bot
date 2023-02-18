import { PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../../models/commands/SlashCommand";
import mappertrackerNewTracker from "./subcommands/maptracker/newTracker";
import mappertrackerListTracker from "./subcommands/maptracker/listTracker";
import mappertrackerRemoveTracker from "./subcommands/maptracker/removeTracker";

export enum MapperTrackerType {
    BeatmapFavorite = "favorite",
    BeatmapRevive = "revive",
    NewHype = "hype",
    NewBeatmap = "new",
    RankedBeatmap = "ranked",
    QualifiedBeatmap = "qualify",
    DisqualifiedBeatmap = "dq",
    BeatmapNomination = "nom",
    BeatmapLoved = "loved",
    BeatmapGraveyard = "graveyard",
}

const mappertracker = new SlashCommand(
    ["mappertracker", "maptracker"],
    "Track mapper beatmap events",
    "osu!",
    false,
    {
        "Which data can be tracked?": [
            "`User beatmap uploads`",
            "`User beatmap updates`",
            "`User new ranked/loved/disqualified beatmap`",
        ],
    },
    [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
);

mappertracker
    .addSubcommand(mappertrackerNewTracker)
    .addSubcommand(mappertrackerListTracker)
    .addSubcommand(mappertrackerRemoveTracker);

export default mappertracker;

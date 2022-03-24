import { Message } from "discord.js";
import * as database from "../../../database";
import createNewGuild from "../../../database/utils/createNewGuild";

export const config = {
	name: "set default",
	description: "Change quotes system list to default list",
	syntax: "!quotes `set` `default`",
};

export async function run(message: Message) {
	let guild = await database.guilds.findById(message.guildId);

	if (!message.guild) return;

	guild.fun.enable = true;
	guild.fun.mode = "default";

	await database.guilds.updateOne(
		{ _id: message.guildId },
		{
			fun: guild.fun,
		}
	);

	message.channel.send(`✅ Switched mode to default`);
}

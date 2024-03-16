import { Guild, MessagePayload, type MessageCreateOptions } from "discord.js";

export default class Logger {
	public static info(message: unknown) {
		console.log(`[ \x1b[0;34mi\x1b[0m ] ${message}`);
	}

	public static warn(message: unknown) {
		console.log(`[ \x1b[0;33m!\x1b[0m ] ${message}`);
	}

	public static error(message: unknown) {
		// replace with console.error(message) to print stack traces when fixing errors
		console.error(`[ \x1b[0;31mx\x1b[0m ] ${message}`);
	}

	public static async channel(
		guild: Guild,
		channelId: string,
		options: string | MessagePayload | MessageCreateOptions,
	) {
		const channel = guild.channels.cache.get(channelId);

		if (!channel || !channel.isTextBased())
			throw new Error("Channel not found or is not a text-based channel.");

		return await channel.send(options);
	}
}

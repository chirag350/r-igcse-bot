import { Routes } from "discord.js";
import { readdir } from "fs/promises";
import { extname, join as joinPaths } from "path";
import type BaseCommand from "./Structure/BaseCommand";
import type BaseEvent from "./Structure/BaseEvent";
import { DiscordClient } from "./DiscordClient";
import type BaseMenu from "./Structure/BaseMenu";
import { logger } from "..";

export async function registerCommands(
	client: DiscordClient,
	category: string = "",
) {
	const commandsPath = joinPaths(
		`${import.meta.dir}`,
		"..",
		"commands",
		category,
	);

	const commandItems = await readdir(commandsPath, { withFileTypes: true });

	commandItems
		.filter((dirent) => dirent.isDirectory())
		.forEach((dirent) => registerCommands(client, dirent.name));

	const commandFiles = commandItems
		.filter(
			(dirent) =>
				dirent.isFile() &&
				((x: string) => x !== x.toLowerCase())(dirent.name[0]),
		)
		.map((dirent) => dirent.name);

	for (const file of commandFiles) {
		const filePath = joinPaths(commandsPath, file);
		try {
			const { default: BotCommand }: { default: new () => BaseCommand } =
				await import(filePath);

			const command = new BotCommand();
			command.category = category;

			if (command instanceof BotCommand)
				client.commands.set(command.data.name, command);
			else
				logger.warn(
					`The command at ${filePath} is missing a required "data", "execute" or "category" property. Ignoring.`,
				);
		} catch (error) {
			logger.error(error);
		}
	}
}

export async function registerMenus(client: DiscordClient) {
	const menusPath = joinPaths(`${import.meta.dir}`, "..", "menus");

	const menuFiles = await readdir(menusPath, { recursive: true });

	for (const file of menuFiles) {
		const filePath = joinPaths(menusPath, file);
		try {
			const { default: BotMenu }: { default: new () => BaseMenu } =
				await import(filePath);

			const menu = new BotMenu();

			if (menu instanceof BotMenu) client.menus.set(menu.data.name, menu);
			else
				logger.warn(
					`The menu at ${filePath} is missing a required "data" or "execute" property. Ignoring.`,
				);
		} catch (error) {
			logger.error(error);
		}
	}
}

export async function registerEvents(client: DiscordClient) {
	const eventsPath = joinPaths(`${import.meta.dir}`, "..", "events");
	const eventFiles = (
		await readdir(eventsPath, {
			recursive: true,
		})
	).filter(
		(file) =>
			((x: string) => x !== x.toLowerCase())(file[0]) &&
			(extname(file) == ".js" || extname(file) == ".ts"),
	);

	for (const file of eventFiles) {
		const filePath = joinPaths(eventsPath, file);
		const { default: BotEvent }: { default: new () => BaseEvent } =
			await import(filePath);

		const event = new BotEvent();

		client.on(event.name, (...args) => event.execute(client, ...args));
	}
}

export async function syncInteractions(
	client: DiscordClient,
	guildId?: string,
) {
	if (!client.application?.id) {
		logger.error("No application id");
		return;
	}

	try {
		await client.rest.put(
			guildId
				? Routes.applicationGuildCommands(client.application.id, guildId)
				: Routes.applicationCommands(client.application.id),
			{ body: client.interactionData },
		);
	} catch (error) {
		logger.error(error);
	}
}

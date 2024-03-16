import { Punishment } from "@/mongo";
import { GuildPreferencesCache } from "@/redis";
import type { DiscordClient } from "@/registry/DiscordClient";
import BaseCommand, {
	type DiscordChatInputCommandInteraction,
} from "@/registry/Structure/BaseCommand";
import {
	Colors,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

export default class KickCommand extends BaseCommand {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("kick")
				.setDescription("Kick a user from the server (for mods)")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("User to kick")
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("reason")
						.setDescription("Reason for kick")
						.setRequired(true),
				)
				.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
				.setDMPermission(false),
		);
	}

	async execute(
		client: DiscordClient<true>,
		interaction: DiscordChatInputCommandInteraction<"cached">,
	) {
		const user = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason", true);

		// if (user.id === interaction.user.id) {
		//     await interaction.reply({
		//         content: 'You cannot kick yourself!',
		//         ephemeral: true,
		//     });
		//     return;
		// }

		const guildPreferences = await GuildPreferencesCache.get(
			interaction.guildId,
		);

		if (!guildPreferences) return;

		const latestPunishment = await Punishment.findOne()
			.sort({ createdAt: -1 })
			.exec();

		const caseNumber = latestPunishment?.caseId ?? 0;

		const dmEmbed = new EmbedBuilder()
			.setAuthor({
				name: `You have been kicked from ${interaction.guild.name}!`,
				iconURL: client.user.displayAvatarURL(),
			})
			.setDescription(
				`Hi there from ${interaction.guild.name}. You have been kicked from the server due to \`${reason}\`.`,
			)
			.setColor(Colors.Red);

		await user.send({
			embeds: [dmEmbed],
		});

		try {
			await interaction.guild.members.kick(user, reason);
		} catch (error) {
			await interaction.reply({
				content: "Failed to kick user",
				ephemeral: true,
			});

			const botlogChannel = interaction.guild.channels.cache.get(
				guildPreferences.botlogChannelId,
			);

			if (!botlogChannel || !botlogChannel.isTextBased()) return;

			const embed = new EmbedBuilder()
				.setAuthor({
					name: "Error | Kicking User",
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setDescription(`${error}`);

			await botlogChannel.send({
				embeds: [embed],
			});
		}

		await Punishment.create({
			guildId: interaction.guild.id,
			actionAgainst: user.id,
			actionBy: interaction.user.id,
			action: "Kick",
			caseId: caseNumber,
			reason,
		});

		const modlogChannel = interaction.guild.channels.cache.get(
			guildPreferences.modlogChannelId,
		);

		if (modlogChannel && modlogChannel.isTextBased()) {
			const modEmbed = new EmbedBuilder()
				.setTitle(`User Kicked | Case #${caseNumber}`)
				.setDescription(reason)
				.setColor(Colors.Red)
				.setAuthor({
					name: user.displayName,
					iconURL: user.displayAvatarURL(),
				})
				.addFields([
					{
						name: "User ID",
						value: user.id,
						inline: true,
					},
					{
						name: "Moderator",
						value: interaction.user.displayName,
						inline: true,
					},
				]);

			await modlogChannel.send({ embeds: [modEmbed] });
		}

		await interaction.reply({
			content: `Successfully kicked @${user.displayName}`,
			ephemeral: true,
		});
	}
}

import {
	Schema,
	Repository,
	type RedisConnection,
	type Entity,
} from "redis-om";
import type { IGuildPreferences } from "@/mongo";

type ICachedGuildPreferences = IGuildPreferences & Entity;

const schema = new Schema("GuildPreferences", {
	guildId: { type: "string" },
	repEnabled: { type: "boolean" },
	repDisabledChannelIds: { type: "string[]" },
	modlogChannelId: { type: "string" },
	behaviorlogChannelId: { type: "string" },
	warnlogChannelId: { type: "string" },
	botlogChannelId: { type: "string" },
	botNewsChannelId: { type: "string" },
	actionRequiredChannelId: { type: "string" },
	welcomeChannelId: { type: "string" },
	confessionsChannelId: { type: "string" },
	confessionApprovalChannelId: { type: "string" },
	countingChannelId: { type: "string" },
	hotmResultsChannelId: { type: "string" },
	studySessionChannelId: { type: "string" },
	modmailChannelId: { type: "string" },
	dmThreadsChannelId: { type: "string" },
	banAppealFormLink: { type: "string" },
	keywords: { type: "string[]" },
	emoji: { type: "string", path: "$.colorRoles[*]" },
	label: { type: "string", path: "$.colorRoles[*]" },
	id: { type: "string", path: "$.colorRoles[*]" },
	requirementRoleId: { type: "string", path: "$.colorRoles[*]" },
	roleId: { type: "string", path: "$.helperRoles[*]" },
	channelId: { type: "string", path: "$.helperRoles[*]" },
});

export class GuildPreferencesRepository extends Repository {
	constructor(clientOrConnection: RedisConnection) {
		super(schema, clientOrConnection);
	}

	async get(guildId: string) {
		const preferences = (await this.fetch(guildId)) as ICachedGuildPreferences;
		if (!preferences.guildId) {
			return null;
		}
		return preferences;
	}

	async set(guildId: string, preferences: ICachedGuildPreferences) {
		return (await this.save(guildId, preferences)) as ICachedGuildPreferences;
	}
}

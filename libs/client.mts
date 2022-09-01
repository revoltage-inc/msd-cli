import { WebClient as SlackClient } from "@slack/web-api"
import type { WebClient as SlackClientType } from "@slack/web-api"
import { Client as DiscordClient, GatewayIntentBits } from "discord.js"
import type { Guild as DiscordClientType } from "discord.js"

/**
 * Create slack client
 * @param slackBotToken
 */
export const createSlackClient = (slackBotToken: string): SlackClientType => {
  return new SlackClient(slackBotToken)
}

/**
 * Create discord client
 * @param discordBotToken: string
 * @param discordServerId: string
 */
export const createDiscordClient = async (
  discordBotToken: string,
  discordServerId: string
): Promise<DiscordClientType> => {
  const client = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  })

  await client.login(discordBotToken)
  await new Promise<void>((resolve) => client.on("ready", () => resolve()))

  const guild = client.guilds.cache.get(discordServerId)
  if (!guild) {
    throw new Error("Guild is not found")
  }
  return guild
}

import { WebClient as SlackClient } from '@slack/web-api'
import type { WebClient as SlackClientType } from '@slack/web-api'
import { Client as DiscordClient, GatewayIntentBits } from 'discord.js'
import type { Guild as DiscordClientType } from 'discord.js'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'

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

  // client.on("debug", console.log)
  client.on('error', (error) => {
    throw new Error(`Client error: ${error}`)
  })

  const controller = new AbortController()
  const { signal } = controller
  let retryCount = 0

  // HACK: Looping because ready event maybe not caught
  while (true) {
    if (client.isReady()) break
    try {
      if (await setTimeout(1000, true, { signal })) controller.abort()
      await once(client, 'ready', { signal: signal })
      controller.abort()
    } catch {
      if (retryCount > 5) {
        throw new Error('Client ready timeout')
      }
    }
    retryCount++
  }

  const guild = client.guilds.cache.get(discordServerId)
  if (!guild) {
    throw new Error('Guild is not found')
  }
  return guild
}

import { Command } from 'commander'
import dotenv from 'dotenv'
import type { Guild as DiscordClient } from 'discord.js'
import { Spinner } from '../../libs/util/spinner.mjs'
import { createDiscordClient } from '../../libs/client.mjs'
import { ChannelClient } from '../../libs/channel.mjs'

dotenv.config({ path: './.env' })
const spinner = new Spinner()

interface Options {
  discordBotToken: string
  discordServerId: string
}

;(async () => {
  const program = new Command()
  program
    .description('Deploy channel command')
    .requiredOption(
      '-dt, --discord-bot-token [string]',
      'DiscordBot OAuth Token',
      process.env.DISCORD_BOT_TOKEN
    )
    .requiredOption(
      '-ds, --discord-server-id [string]',
      'Discord Server ID',
      process.env.DISCORD_SERVER_ID
    )
    .parse(process.argv)

  const { discordBotToken, discordServerId }: Options = program.opts()

  spinner.loading('Create client')
  let channelClient: ChannelClient | undefined = undefined
  let discordClient: DiscordClient | undefined = undefined
  try {
    channelClient = new ChannelClient()
    discordClient = await createDiscordClient(discordBotToken, discordServerId)
  } catch (error) {
    spinner.failed(null, error)
    process.exit(1)
  }
  spinner.success()

  spinner.loading('Deploy channel')
  try {
    await channelClient.deployAllChannel(discordClient)
  } catch (error) {
    spinner.failed(null, error)
    process.exit(1)
  }
  spinner.success()

  spinner.loading('Deploy channel for hosting file')
  try {
    await channelClient.deployFileChannel(discordClient)
  } catch (error) {
    spinner.failed(null, error)
    process.exit(1)
  }
  spinner.success()

  process.exit(0)
})()

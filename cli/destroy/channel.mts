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
  yes?: true
}

;(async () => {
  const program = new Command()
  program
    .description('Destroy channel command')
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
    .option('-y, --yes', 'Skip Confirm')
    .parse(process.argv)

  const { discordBotToken, discordServerId, yes }: Options = program.opts()

  await spinner.confirm('Destroy channel?', yes ? true : false)

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

  spinner.loading('Destroy channel')
  try {
    await channelClient.destroyAllChannel(discordClient)
  } catch (error) {
    spinner.failed(null, error)
    process.exit(1)
  }
  spinner.success()

  spinner.loading('Destroy channel for hosting file')
  try {
    await channelClient.destroyFileChannel(discordClient)
  } catch (error) {
    spinner.failed(null, error)
    process.exit(1)
  }
  spinner.success()

  process.exit(0)
})()

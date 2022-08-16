import { Command } from "commander"
import dotenv from "dotenv"
import { readFile, access, constants } from "node:fs/promises"
import { resolve, join } from "node:path"
import { Spinner } from "../../libs/util/spinner.mjs"
import { createDiscordGuild } from "../../libs/util/client.mjs"
import { getChannelFile } from "../../libs/channel.mjs"
import { createMessage } from "../../libs/message.mjs"
import type { Message } from "../../libs/message.mjs"

const __dirname = new URL(import.meta.url).pathname
const distDirPath = resolve(__dirname, "../../../.dist/")
const distChannelFilePath = join(distDirPath, "channel.json")

dotenv.config({ path: "./.envrc" })
const spinner = new Spinner()

interface Options {
  discordBotToken?: string
  discordServerId?: string
}

;(async () => {
  const program = new Command()
  program
    .description("Deploy message command")
    .requiredOption(
      "-dt, --discord-bot-token [string]",
      "DiscordBot OAuth Token",
      process.env.DISCORD_BOT_TOKEN
    )
    .requiredOption(
      "-ds, --discord-server-id [string]",
      "Discord Server ID",
      process.env.DISCORD_SERVER_ID
    )
    .parse(process.argv)

  // パラメーターの取得
  spinner.loading("Check parameter")
  const options: Options = program.opts()
  const { discordBotToken, discordServerId } = options
  if (discordBotToken === undefined || discordServerId === undefined) {
    spinner.failed(null, "Required parameter is not found")
    process.exit(0)
  }
  spinner.success()

  // Discordのギルドを作成する
  spinner.loading("Create discord guild")
  const { discordGuild, ...createDiscordGuildResult } =
    await createDiscordGuild(discordBotToken, discordServerId)
  if (!discordGuild || createDiscordGuildResult.status === "failed") {
    spinner.failed(null, createDiscordGuildResult.message)
    process.exit(0)
  }
  spinner.success()

  // チャンネルファイルを取得する
  spinner.loading("Get channel file")
  const { channels, ...getChannelFileResult } = await getChannelFile(
    distChannelFilePath
  )
  if (getChannelFileResult.status === "failed") {
    spinner.failed(null, getChannelFileResult.message)
    process.exit(0)
  }
  spinner.success()

  // メッセージを作成する
  spinner.loading("Create message")
  try {
    for (const channel of channels) {
      for (const messageFilePath of channel.discord.message_file_paths) {
        await access(messageFilePath, constants.R_OK)
        const messages = JSON.parse(
          await readFile(messageFilePath, "utf8")
        ) as Message[]
        const newMessages = await createMessage(
          discordGuild,
          channel.discord.channel_id,
          messages
        )
      }
    }
  } catch (error) {
    spinner.failed(null, error)
    process.exit(0)
  }
  spinner.success()

  process.exit(0)
})()

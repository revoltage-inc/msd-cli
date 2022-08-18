import { Command } from "commander"
import dotenv from "dotenv"
import { resolve, join } from "node:path"
import { Spinner } from "../../libs/util/spinner.mjs"
import { getChannelFile } from "../../libs/channel.mjs"
import { buildAllMessageFile } from "../../libs/message.mjs"
import { getUserFile } from "../../libs/user.mjs"

const __dirname = new URL(import.meta.url).pathname
const distDirPath = resolve(__dirname, "../../../.dist/")
const distChannelFilePath = join(distDirPath, "channel.json")
const distUserFilePath = join(distDirPath, "user.json")

dotenv.config({ path: "./.envrc" })
const spinner = new Spinner()

;(async () => {
  const program = new Command()
  program.description("Build message file command").parse(process.argv)

  // チャンネルを取得する
  spinner.loading("Get channel")
  const { channels, ...getChannelFileResult } = await getChannelFile(
    distChannelFilePath
  )
  if (getChannelFileResult.status === "failed") {
    spinner.failed(null, getChannelFileResult.message)
    process.exit(0)
  }
  spinner.success()

  // ユーザーを取得する
  spinner.loading("Get user")
  const { users, ...getUserFileResult } = await getUserFile(distUserFilePath)
  if (getUserFileResult.status === "failed") {
    spinner.failed(null, getUserFileResult.message)
    process.exit(0)
  }
  spinner.success()

  // メッセージファイルを作成する
  spinner.loading("Build message file")
  const buildAllMessageFileResult = await buildAllMessageFile(channels, users)
  if (buildAllMessageFileResult.status === "failed") {
    spinner.failed(null, buildAllMessageFileResult.message)
    process.exit(0)
  }
  spinner.success()
  // メッセージに最大ファイルサイズを超えているファイルがある場合は警告を出力する
  if (buildAllMessageFileResult.isMaxFileSizeOver) {
    spinner.warning(
      "Message has attachments that exceed Discord's maximum file size.\nAttachments that exceed Discord's maximum file size will be appended to the message as a file URL.\nConsider releasing the maximum file upload size limit with Discord's server boost."
    )
  }

  process.exit(0)
})()

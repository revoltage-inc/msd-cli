import { readFile } from "node:fs/promises"
import { Message as SlackMessage } from "@slack/web-api/dist/response/ChatPostMessageResponse"
import { WebClient as Client } from "@slack/web-api"

export interface Bot {
  id: string
  app_id: string
  name: string
}

/**
 * Get BotId in message
 * @param srcMessageFilePath
 * @returns string[]
 */
export const getMessageBotIds = async (srcMessageFilePath: string) => {
  const srcMessageFile = await readFile(srcMessageFilePath, "utf8")
  const srcMessage: SlackMessage[] = JSON.parse(srcMessageFile)
  const botIds = srcMessage
    .filter((message) => message.bot_id)
    .map((message) => message.bot_id as string)

  // 重複は排除する
  return [...new Set(botIds)]
}

/**
 * Convert Bot
 * @param client
 * @param botIds
 * @returns Bot[]
 */
export const convertBots = async (client: Client, botIds: string[]) => {
  return await Promise.all(
    botIds.map(async (botId) => {
      const result = await client.bots.info({ bot: botId })
      return {
        id: result.bot?.id || "",
        app_id: result.bot?.app_id || "",
        name: result.bot?.name || "",
      } as Bot
    })
  )
}

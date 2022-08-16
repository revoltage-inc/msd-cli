import { access, mkdir, writeFile, constants, readFile } from "node:fs/promises"
import { dirname } from "node:path"
import { ChannelType, Client, GatewayIntentBits } from "discord.js"

export interface Category {
  id: string
  name: string
}

/**
 * Get category file
 * @param distCategoryFilePath
 */
export const getCategoryFile = async (
  distCategoryFilePath: string
): Promise<{
  categories: Category[]
  status: "success" | "failed"
  message?: any
}> => {
  try {
    await access(distCategoryFilePath, constants.R_OK)
    const categories = JSON.parse(
      await readFile(distCategoryFilePath, "utf8")
    ) as Category[]
    return { categories: categories, status: "success" }
  } catch (error) {
    return { categories: [], status: "failed", message: error }
  }
}

/**
 * Create category file
 * @param distCategoryFilePath
 * @param categories
 */
export const createCategoryFile = async (
  distCategoryFilePath: string,
  categories: Category[]
): Promise<{
  status: "success" | "failed"
  message?: any
}> => {
  try {
    await mkdir(dirname(distCategoryFilePath), {
      recursive: true,
    })
    await writeFile(distCategoryFilePath, JSON.stringify(categories, null, 2))
    return { status: "success" }
  } catch (error) {
    return { status: "failed", message: error }
  }
}

/**
 * Create category
 * @param discordBotToken
 * @param discordServerId
 * @param categories
 */
export const createCategory = async (
  discordBotToken: string,
  discordServerId: string,
  categories: Category[]
): Promise<{
  categories: Category[]
  status: "success" | "failed"
  message?: any
}> => {
  try {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    })
    await client.login(discordBotToken)

    const newCategories: Category[] = []
    for (const category of categories) {
      const rusult = await client.guilds.cache
        .get(discordServerId)
        ?.channels.create({
          name: category.name,
          type: ChannelType.GuildCategory,
        })
      newCategories.push({
        id: rusult?.id ? rusult.id : "",
        name: category.name,
      })
    }
    return { categories: newCategories, status: "success" }
  } catch (error) {
    return { categories: [], status: "failed", message: error }
  }
}

/**
 * Delete category
 * @param discordBotToken
 * @param discordServerId
 * @param categories
 */
export const deleteCategory = async (
  discordBotToken: string,
  discordServerId: string,
  categories: Category[]
): Promise<{
  categories: Category[]
  status: "success" | "failed"
  message?: any
}> => {
  const newCategories: Category[] = []
  try {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    })
    await client.login(discordBotToken)
    for (const category of categories) {
      if (category.id) {
        // カテゴリーを削除する
        await client.guilds.cache
          .get(discordServerId)
          ?.channels.delete(category.id)
        // カテゴリーのIDを削除する
        category.id = ""
      }
      newCategories.push(category)
    }
    return { categories: newCategories, status: "success" }
  } catch (error) {
    return { categories: [], status: "failed", message: error }
  }
}

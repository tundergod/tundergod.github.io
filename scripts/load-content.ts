import { readFile } from "node:fs/promises";

import {
  validatePortfolioData,
  type PortfolioData,
} from "../app/data/portfolio-schema.ts";

const files = {
  bio: "bio.json",
  links: "links.json",
  publications: "publications.json",
  conferences: "conferences.json",
  locations: "locations.json",
  researchTopics: "research-topics.json",
  travel: "travel.json",
} as const;

async function readJson(directory: URL, filename: string) {
  const fileUrl = new URL(filename, directory);
  const source = await readFile(fileUrl, "utf8");
  try {
    return JSON.parse(source) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`content/${filename}: invalid JSON\n${detail}`);
  }
}

export async function loadContent(
  contentDirectory = new URL("../content/", import.meta.url),
): Promise<PortfolioData> {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, filename]) => [
      key,
      await readJson(contentDirectory, filename),
    ]),
  );
  return validatePortfolioData(Object.fromEntries(entries));
}

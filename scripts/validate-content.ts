import { loadContent } from "./load-content.ts";

try {
  const data = await loadContent();
  console.log(
    `Content valid: ${data.publications.length} publications, ` +
      `${data.conferences.length} conference editions, ` +
      `${data.locations.length} locations.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

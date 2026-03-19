import { FusionClient } from "../src/index.js";

async function main(): Promise<void> {
  const client = new FusionClient({
    apiKey: process.env.FUSION_API_KEY,
  });

  const ttsResult = await client.doubaoTts.run({
    text: "你好，欢迎使用 Fusion API SDK。",
    voice: "zh_female_vv_uranus_bigtts",
  });

  console.log("TTS result:", ttsResult);

  const page = await client.jinaReader.read({
    URL: "https://example.com/article",
    format: "markdown",
  });

  console.log("Reader result:", page.data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

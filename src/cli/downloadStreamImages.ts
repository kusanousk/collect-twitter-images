import yargs from "yargs/yargs";
import { checkDir } from "../utils/checkDir";
import { downloadStreamImages } from "../usecase/downloadStreamImages";
import { ImageHashFileStorage } from "../utils/ImageHash";
import { startWebServer } from "../usecase/startWebServer";

function now() {
  return new Date().toString();
}

(async () => {
  const parser = yargs(process.argv.slice(2))
    .usage(
      "ツイートをリアルタイムで監視し、監視中にツイートされた画像をダウンロードする"
    )
    .option("word", {
      type: "string",
      description: '検索ワード (例: "#猫 OR #cat")',
      demandOption: true,
      group: "Required",
    })
    .option("download-dir", {
      type: "string",
      description: "画像ダウンロードディレクトリのパス (例: /home/hoge/tmp)",
      demandOption: true,
      group: "Required",
    })
    .option("web-port", {
      type: "number",
      description:
        "ダウンロードした画像をブラウザで確認したい場合はportを指定してください。 (例: 3000)",
      demandOption: false,
    })
    .version()
    .help();

  const { word, downloadDir, webPort } = await parser.argv;

  try {
    checkDir(downloadDir);

    if (webPort !== undefined) {
      startWebServer(downloadDir, webPort);
    }

    await downloadStreamImages(
      word,
      downloadDir,
      new ImageHashFileStorage(downloadDir)
    );
    console.log(`リアルタイム検索と画像ダウンロードを開始しました。\n${now()}`);
    console.log("検索中...");
    process.on("SIGINT", () => {
      console.log(`\n終了\n${now()}`);
      process.exit();
    });
  } catch (e) {
    console.error(e);
    console.error(
      `リアルタイム検索中にエラーが発生したため終了します。${now()}`
    );
    process.exit(1);
  }
})();

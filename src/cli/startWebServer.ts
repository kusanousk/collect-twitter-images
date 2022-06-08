import yargs from "yargs";
import { startWebServer } from "../usecase/startWebServer";

(async () => {
  const parser = yargs(process.argv.slice(2))
    .usage(
      "webサーバーを起動する。指定のディレクトリを監視し、画像ファイルが追加されたらブラウザに表示する"
    )
    .option("download-dir", {
      type: "string",
      description: "画像ダウンロードディレクトリのパス (例: /home/hoge/tmp)",
      demandOption: true,
      group: "Required",
    })
    .option("port", {
      type: "number",
      description: "portを指定してください。 (例: 3000)",
      demandOption: true,
      group: "Required",
    })
    .version()
    .help();

  const { downloadDir, port } = await parser.argv;
  startWebServer(downloadDir, port);
})();

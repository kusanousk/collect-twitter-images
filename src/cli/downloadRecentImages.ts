import yargs from "yargs/yargs";
import { checkDir } from "../utils/checkDir";
import { downloadRecentImages } from "../usecase/downloadRecentImages";
import { Time } from "../usecase/Time";
import { SearchRecentError } from "../twitter/SearchRecent";
import { ImageHashFileStorage } from "../utils/ImageHash";
import { startWebServer } from "../usecase/startWebServer";

const parser = yargs(process.argv.slice(2))
  .usage("過去7日以内のツイートを検索し、ツイート画像をダウンロードする")
  .option("word", {
    type: "string",
    description: '検索ワード (例: "#猫 OR #cat")',
    demandOption: true,
    group: "Required",
  })
  .option("start", {
    type: "string",
    description: '検索開始日時 (例: "2022-01-01 00:00:00")',
    demandOption: true,
    group: "Required",
  })
  .option("end", {
    type: "string",
    description: '検索終了日時 (例: "2022-01-07 00:00:00")',
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

(async () => {
  const { word, start, end, downloadDir, webPort } = await parser.argv;
  try {
    checkDir(downloadDir);

    if (webPort !== undefined) {
      startWebServer(downloadDir, webPort);
    }

    await downloadRecentImages(
      word,
      new Time(start),
      new Time(end),
      downloadDir,
      new ImageHashFileStorage(downloadDir)
    );

    console.log("画像のダウンロードが完了しました。");
    process.exit();
  } catch (e) {
    if (e instanceof SearchRecentError) {
      let message = e.message;
      const oldestTweetDate = e.oldestTweetDate();
      if (oldestTweetDate) {
        const retryEndTime = Time.fromDate(oldestTweetDate).toString();
        const retryOption =
          `--word="${word}" --start="${start}" ` +
          `--end="${retryEndTime}" --download-dir="${downloadDir}"`;
        message += `\n再実行用のオプション\n${retryOption}`;
      }
      console.error(message);
    } else if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
    process.exit(1);
  }
})();

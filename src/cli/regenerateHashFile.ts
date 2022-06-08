import { readdirSync, truncateSync } from "fs";
import yargs from "yargs";
import { checkDir } from "../utils/checkDir";
import { ImageHash, ImageHashFileStorage } from "../utils/ImageHash";

(async () => {
  const parser = yargs(process.argv.slice(2))
    .usage(
      "画像ハッシュファイルを空にして、ディレクトリにある画像から再生成する"
    )
    .option("download-dir", {
      type: "string",
      description: "画像ダウンロードディレクトリのパス (例: /home/hoge/tmp)",
      demandOption: true,
      group: "Required",
    })
    .help();

  const { downloadDir } = await parser.argv;
  checkDir(downloadDir);

  const hashStorage = new ImageHashFileStorage(downloadDir);
  truncateSync(hashStorage.filePath());

  const filePaths = readdirSync(downloadDir)
    .filter((filename) => !filename.startsWith("."))
    .map((filename) => {
      return `${downloadDir}/${filename}`;
    });

  for (const filePath of filePaths) {
    const hash = await ImageHash.createFromFile(filePath);
    await hashStorage.add(hash);
  }
})();

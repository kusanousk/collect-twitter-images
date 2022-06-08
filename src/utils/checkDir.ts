import fs from "fs";

export function checkDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`ディレクトリ ${dirPath} が存在しません。 `);
  }
}

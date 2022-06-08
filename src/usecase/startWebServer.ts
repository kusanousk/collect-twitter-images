import express from "express";
import path, { basename } from "path";
import { Server } from "socket.io";
import http from "http";
import chokidar from "chokidar";
import { checkDir } from "../utils/checkDir";

export function startWebServer(downloadDir: string, port: number) {
  checkDir(downloadDir);

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.use(express.static(downloadDir));

  app.get("/", (req, res) => {
    res.sendFile(path.join(path.join(__dirname, "../../web"), "index.html"));
  });

  // ダウンロードディレクトリを監視する
  const watcher = chokidar.watch(downloadDir);
  watcher.on("add", (filePath) => {
    if (!basename(filePath).startsWith(".")) {
      io.emit("add", { filename: path.basename(filePath) });
    }
  });

  server.listen(port, () => {
    console.log(`Webサーバーを起動しました。 http://localhost:${port}`);
    console.log(`${downloadDir} を監視中...`);
  });
}

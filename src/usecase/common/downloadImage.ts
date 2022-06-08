import axios from "axios";
import { existsSync, writeFileSync } from "fs";
import path from "path";
import { ImageHash, ImageHashStorage } from "../../utils/ImageHash";
export async function downloadImage(
  imageUrl: string,
  downloadDir: string,
  imageHashStorage: ImageHashStorage
): Promise<void> {
  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: "arraybuffer",
  });
  const img = response.data;
  const hash = await ImageHash.createFromArrayBuffer(img);

  console.log(`url=${imageUrl} hash=${hash.value()}`);

  const filename = path.basename(imageUrl);
  const filePath = `${downloadDir}/${filename}`;

  if (await imageHashStorage.exists(hash)) {
    console.log(
      `hash ${hash.value()} がすでに存在するため ${imageUrl} のダウンロードをスキップ`
    );
    return;
  }

  if (existsSync(filePath)) {
    return;
  }

  writeFileSync(filePath, Buffer.from(img));
  await imageHashStorage.add(hash);
}

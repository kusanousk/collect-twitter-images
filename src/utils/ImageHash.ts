import Image, { getImageData, imageFromBuffer } from "@canvas/image";
import { bmvbhash } from "blockhash-core";
import { appendFileSync, readFileSync } from "fs";
import path from "path";

export class ImageHash {
  private constructor(private hash: string) {}

  private static create(image: Image): ImageHash {
    const imageData = getImageData(image);
    if (imageData === undefined) {
      throw new Error("getImageDataがundefinedを返した");
    }
    return new ImageHash(bmvbhash(imageData, 16));
  }

  static async createFromFile(filePath: string): Promise<ImageHash> {
    const file = readFileSync(filePath);
    const image = await imageFromBuffer(file);
    return ImageHash.create(image);
  }

  static async createFromArrayBuffer(img: ArrayBuffer): Promise<ImageHash> {
    const image = await imageFromBuffer(new Uint8Array(img));
    return ImageHash.create(image);
  }

  value(): string {
    return this.hash;
  }
}

export type ImageHashStorage = {
  exists: (hash: ImageHash) => Promise<boolean>;
  add: (hash: ImageHash) => Promise<void>;
};

export class ImageHashFileStorage implements ImageHashStorage {
  private _filePath: string;

  constructor(dirPath: string) {
    this._filePath = path.join(dirPath, ".image_hash");
  }

  async exists(hash: ImageHash): Promise<boolean> {
    try {
      const hashList = readFileSync(this._filePath, "utf-8").split("\n");
      return hashList.includes(hash.value());
    } catch (e) {
      return false;
    }
  }

  async add(hash: ImageHash): Promise<void> {
    appendFileSync(this._filePath, hash.value() + "\n");
  }

  filePath(): string {
    return this._filePath;
  }
}

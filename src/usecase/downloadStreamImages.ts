import {
  TweetSearchV2StreamParams,
  TweetV2SingleStreamResult,
} from "twitter-api-v2";
import { TWITTER_API_TOKEN } from "../config";
import { SearchStream } from "../twitter/SearchStream";
import { checkDir } from "../utils/checkDir";
import { ImageHashStorage } from "../utils/ImageHash";
import { downloadImage } from "./common/downloadImage";

export async function downloadStreamImages(
  searchWord: string,
  downloadDir: string,
  imageHashStorage: ImageHashStorage
) {
  checkDir(downloadDir);

  // https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
  const rules = [`(${searchWord}) has:images -is:retweet`];

  const options: Partial<TweetSearchV2StreamParams> = {
    expansions: "attachments.media_keys",
    "media.fields": "url",
    "tweet.fields": "created_at",
  };

  const searchStream = new SearchStream(TWITTER_API_TOKEN);

  await searchStream.search(
    rules,
    options,
    async (data: TweetV2SingleStreamResult) => {
      const media = data.includes?.media;
      if (media === undefined) {
        return;
      }

      const imageUrls = media
        .filter((media) => media.type === "photo")
        .map((media) => media.url)
        .filter((imageUrl): imageUrl is string => {
          return typeof imageUrl === "string";
        });

      for (const imageUrl of imageUrls) {
        await downloadImage(imageUrl, downloadDir, imageHashStorage);
      }
    }
  );
}

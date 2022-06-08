import {
  TweetSearchRecentV2Paginator,
  Tweetv2SearchParams,
} from "twitter-api-v2";
import { TWITTER_API_TOKEN } from "../config";
import { Time } from "./Time";
import { SearchRecent } from "../twitter/SearchRecent";
import { checkDir } from "../utils/checkDir";
import { ImageHashStorage } from "../utils/ImageHash";
import { downloadImage } from "./common/downloadImage";

export async function downloadRecentImages(
  searchWord: string,
  startTime: Time,
  endTime: Time,
  downloadDir: string,
  imageHashStorage: ImageHashStorage
) {
  checkDir(downloadDir);

  const now = new Date();
  const currentTime = Time.fromDate(now);

  if (!startTime.isWithinPast7Days(now)) {
    throw new Error("検索開始日時は過去7日以内でなければなりません。");
  }

  if (endTime.isGreaterThan(currentTime)) {
    throw new Error("検索終了日時は現在日時より前でなければなりません。");
  }

  if (startTime.isGreaterThan(endTime)) {
    throw new Error("検索開始日時は終了日時より前でなければなりません。");
  }

  const query = `(${searchWord}) has:images -is:retweet`;

  const options: Partial<Tweetv2SearchParams> = {
    start_time: startTime.toISO(),
    end_time: endTime.toISO(),
    max_results: 100,
    expansions: "attachments.media_keys",
    "media.fields": "url",
    "tweet.fields": "created_at",
  };

  const searchRecent = new SearchRecent(TWITTER_API_TOKEN);

  await searchRecent.search(
    query,
    options,
    async (page: TweetSearchRecentV2Paginator) => {
      console.log(
        `TwitterAPI /2/search/recent レート制限 残り呼び出し回数: ${page.rateLimit.remaining}`
      );

      const imageUrls = page.includes.media
        .filter((media) => media.type === "photo")
        .map((media) => media.url)
        .filter((imageUrl): imageUrl is string => {
          return typeof imageUrl === "string";
        });

      for (const imageUrl of imageUrls) {
        await downloadImage(imageUrl, downloadDir, imageHashStorage);
      }

      return true;
    }
  );
}

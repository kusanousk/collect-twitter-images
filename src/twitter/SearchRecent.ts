import {
  TweetSearchRecentV2Paginator,
  Tweetv2SearchParams,
  TwitterApi,
  ApiResponseError,
} from "twitter-api-v2";

export class SearchRecentError extends Error {
  protected _oldestTweetDate?: string;

  constructor(message: string, oldestTweetDate: Date | undefined) {
    super();
    this.name = "SearchRecentError";
    this.message = message;
    this._oldestTweetDate = oldestTweetDate?.toString();
  }

  oldestTweetDate(): Date | undefined {
    return this._oldestTweetDate ? new Date(this._oldestTweetDate) : undefined;
  }
}

export class SearchRecentRateLimitError extends SearchRecentError {
  protected _resetDate: string;

  constructor(
    message: string,
    oldestTweetDate: Date | undefined,
    resetDate: Date
  ) {
    super(message, oldestTweetDate);
    this._resetDate = resetDate.toString();
  }

  resetDate(): Date {
    return new Date(this._resetDate);
  }
}

function getOldestTweetCreatedAt(page: TweetSearchRecentV2Paginator): Date {
  const lastTweetCreatedAt = page.tweets.slice(-1)[0].created_at;
  if (!lastTweetCreatedAt) {
    throw new Error(
      "ツイートのcreated_atが取得できませんでした。tweet.fieldsにcreated_atを追加してください。"
    );
  }

  return new Date(lastTweetCreatedAt);
}

export class SearchRecent {
  private client: TwitterApi;

  constructor(apiToken: string) {
    this.client = new TwitterApi(apiToken);
  }

  /**
   * ツイートを検索する
   * options.max_results (10～100)件ごとにツイートを取得していく
   *
   * @param query https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query
   * @param options https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent
   * @param handlePage
   * @link https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/paginators.md
   */
  async search(
    query: string,
    options: Partial<Tweetv2SearchParams>,
    handlePage: (page: TweetSearchRecentV2Paginator) => Promise<boolean>
  ) {
    let oldestTweetDate: Date | undefined = undefined;

    try {
      let page = await this.client.v2.search(query, options);
      if (!(await handlePage(page))) {
        return;
      }
      oldestTweetDate = getOldestTweetCreatedAt(page);

      while (!page.done) {
        page = await page.next();
        if (!(await handlePage(page))) {
          return;
        }
        oldestTweetDate = getOldestTweetCreatedAt(page);
      }
    } catch (e) {
      if (e instanceof ApiResponseError) {
        if (e.rateLimitError && e.rateLimit) {
          const { reset } = e.rateLimit;
          const resetDate = new Date(reset * 1000);

          throw new SearchRecentRateLimitError(
            `/2/search/recent APIの呼び出し回数がレート制限に達しました。\n${resetDate.toString()} 以降に再実行してください。`,
            oldestTweetDate,
            resetDate
          );
        } else {
          throw new SearchRecentError(
            `/2/search/recent APIがエラーレスポンスを返しました。 message=${e.message}`,
            oldestTweetDate
          );
        }
      } else if (e instanceof Error) {
        throw new SearchRecentError(
          `searchRecent処理中に例外が発生しました。 message=${e.message}`,
          oldestTweetDate
        );
      } else {
        throw e;
      }
    }
  }
}

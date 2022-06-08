import {
  ApiResponseError,
  ETwitterStreamEvent,
  TweetSearchV2StreamParams,
  TweetStream,
  TweetV2SingleStreamResult,
  TwitterApi,
} from "twitter-api-v2";

type HandleData = (data: TweetV2SingleStreamResult) => void;

type SearchStreamOptions = Partial<TweetSearchV2StreamParams>;

export class SearchStream {
  private client: TwitterApi;
  private stream?: TweetStream<TweetV2SingleStreamResult>;

  constructor(apiToken: string) {
    this.client = new TwitterApi(apiToken);
  }

  /**
   * @param rules
   * @param options
   * @param handleData
   */
  async search(
    rules: string[],
    options: SearchStreamOptions,
    handleData: HandleData
  ) {
    // ストリームの接続数の上限は1なので、検索を開始するたびにルールのリセットをしている
    await this.checkNoConnectionExists();
    await this.resetRules(rules);
    await this.streamConnect(options, handleData);
  }

  /**
   * ストリーミングAPIに接続できることを確認する
   */
  private async checkNoConnectionExists(): Promise<void> {
    try {
      // 接続を試みる
      const stream = await this.client.v2.searchStream({
        autoConnect: true,
      });
      stream.destroy();
    } catch (e) {
      if (e instanceof ApiResponseError && e.code === 429) {
        console.error(e);
        throw new Error(
          "このストリームは現在、許容される接続制限の最大値に達しています。古い接続を切断してください。"
        );
      }

      throw e;
    }
  }

  /**
   * 設定済みのルールをすべて削除して設定し直す
   * @param rules https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule
   * @link https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream-rules
   * @link https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/post-tweets-search-stream-rules
   */
  private async resetRules(rules: string[]) {
    const currentRules = await this.client.v2.streamRules();

    if ("data" in currentRules) {
      await this.client.v2.updateStreamRules({
        delete: {
          ids: currentRules.data.map((rule) => rule.id),
        },
      });
    }

    await this.client.v2.updateStreamRules({
      add: rules.map((rule) => {
        return { value: rule };
      }),
    });
  }

  /**
   * ストリーミングAPIに接続する
   * @param options https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream
   * @param handleData
   * @link https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream
   * @link https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/streaming.md
   */
  private async streamConnect(
    options: SearchStreamOptions,
    handleData: HandleData
  ) {
    const stream = await this.client.v2.searchStream({
      autoConnect: true,
      ...options,
    });
    stream.autoReconnect = true;
    stream.autoReconnectRetries = Infinity;
    stream.keepAliveTimeoutMs = Infinity;

    stream.on(ETwitterStreamEvent.Data, (data) => {
      handleData(data);
    });

    this.stream = stream;
  }

  stop() {
    if (this.stream) {
      this.stream.destroy();
      this.stream = undefined;
    }
  }
}

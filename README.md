ツイートを検索して画像をダウンロードします。直近 7 日以内の検索とリアルタイムの検索に対応しています。

# インストール

```bash
npm install -g yarn
yarn install
cp .env.example .env
```

## .env について

- `TWITTER_API_TOKEN`: Twitter Developer Portal の Bearer Token

# 使い方

## 検索ワードと期間を指定してツイート画像をダウンロードする

※期間は過去 7 日以内にのみ対応しています。

例

```bash
./bin/download-recent-images.sh \
  --word="#猫 OR #cat" \
  --start="2022-04-01 00:00:00" \
  --end="2022-04-05 00:00:00" \
  --download-dir="/tmp" \
  --web-port=3000
```

必須

- `word`: 検索ワード。詳細は[こちら](https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query)
- `start`: 検索開始日時。7 日前～現在日時
- `end`: 検索終了日時。開始日時～現在日時
- `download-dir`: 画像をダウンロードするディレクトリのパス

任意

- `web-port`: ポート番号。Web サーバーを起動します。download-dir を監視して、画像が追加されるたびにブラウザに表示します。

### レート制限時の再実行

使用している API [GET /2/tweets/search/recent](https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent) には 15 分につき 450 リクエストの制限があります（1 リクエストごとに取得できるツイート数の上限は 100）。リクエスト回数が制限に達した場合は以下のように出力されるメッセージの通りに再実行してください。`end`の値が実行時と異なります。

```
/2/search/recent APIの呼び出し回数がレート制限に達しました。
Mon Apr 18 2022 14:48:57 GMT+0900 (Japan Standard Time) 以降に再実行してください。
再実行用のオプション
--word="#猫 OR #cat" --start="2022-04-12 00:00:00" --end="2022-04-17 21:33:20" --download-dir="/tmp"
```

## 検索ワードが含まれるツイートをリアルタイムに監視して、ツイート画像をダウンロードする

例

```bash
./bin/download-stream-images.sh \
  --word="#猫 OR #cat" \
  --download-dir="/tmp" \
  --web-port=3000
```

必須

- `word`: 検索ワード。詳細は[こちら](https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query)
- `download-dir`: 画像をダウンロードするディレクトリのパス

任意

- `web-port`: ポート番号。Web サーバーを起動します。download-dir を監視して、画像が追加されるたびにブラウザに表示します。

検索対象は監視中に投稿されたツイートだけです。スクリプト実行中は監視し続けます。ストリーミング API の同時接続数の上限は 1 なので、複数のリアルタイム検索を同時に実行することはできません。

# 同一画像は重複してダウンロードしない

画像ダウンロード前にその画像のハッシュを作成します。ハッシュは画像ダウンロード完了後にダウンロードディレクトリの `.image_hash` というファイルに追記されます。`.image_hash` にすでに同じハッシュがあればダウンロードしません。

# 使用している Twitter API

## 過去 7 日以内の検索

- [GET /2/tweets/search/recent](https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent)

## リアルタイム検索

- [GET /2/tweets/search/stream/rules](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream-rules)
- [POST /2/tweets/search/stream/rules](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/post-tweets-search-stream-rules)
- [GET /2/tweets/search/stream](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream)

## 取得できるツイート数の上限

[公式](https://developer.twitter.com/en/docs/projects/overview)

1 か月に取得できるツイート数には上限があり、すべての API で取得したツイート数の合計が上限に達するとその月ではそれ以降取得できなくなります。

- Essential access: 50 万件
- Elevated access: 200 万件

今月の取得数は [Twitter Developer Portal の Dashboard](https://developer.twitter.com/en/portal/dashboard) で確認できます。

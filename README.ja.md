# http-jsonmock-server とは

JSONデータを応答するシンプルなモック用の Web サーバを動作させます。
1 つの javascript ファイルのみで動作します。

以下のような使い方ができます。

 - Web API の応答テスト用サーバ(正常系 / 異常系)

プロジェクトにはサンプルデータが入っていますので、まずは使ってみてください。

```
npm run start
```

これでモックサーバが起動し、http://localhost:9876/test1/ にブラウザでアクセスすると、
JSON データの中身が表示されます。
これはプロジェクト内の「./mockdata/test1.json」のデータを応答しています。

# 前提

利用にあたっては node.js が使用可能であること。
以下で動作確認済みです。
 ※もっと古いバージョンでも動作すると思います。

- node.js v19.9.0
- Ubuntu 20.04 LTS

# 利用方法

プロジェクト直下にて npm コマンドで起動します。

```
> npm run start
```

もしくは、直接 javscript を node から呼び出す方法で起動できます。

```
> node src
```

# プロジェクトの構成

以下のようなシンプルな構成となっています。
WebAPI のレスポンスとして応答したい静的データを mockdata 内に作成することで、
モック応答が可能となります。

なおモックデータの読み取り先は 起動オプションで `-docpath` を付与することで所定の相対パス/絶対パスへ変更できます。

```
Project
 |
 |- src
 |   |
 |   +-index.js   ... プログラム本体
 |
 +- mockdata  ... モックデータ格納先
```

例えば、docpath の切り替えは、モックする対象のWebサービスや
APIの複数バージョンをシミュレートすることにも使えます。

docpath 切り替え例：

```
> npm run start -- -docpath=appAAA-v1
> npm run start -- -docpath=appBBB-v1
```

# 正常系 モック用データの作成

サーバが応答する json 形式のモックデータはデフォルトで `mockdata` 内に作成します。

正常系のレスポンスデータの例として、

`http://localhost:9876/samplewebapp/v1/userdata/123456/` へのアクセスであれば、
プロジェクト内の `./mockdata/samplewebapp/v1/userdata/123456.json` のファイルを参照し、レスポンスコード 200 、ファイル内容をレスポンスデータとして応答します。

具体的には URL PATH で末尾に "/" があればトリムし拡張子「.json」を付けたファイルパスを参照します。

対象のモックファイルが存在すれば、モックファイルの中身が JSON 形式であることを確認したうえで
200 の正常応答であることを示すレスポンスコードおよび、モックファイルの内容を "JSON" のデータ形式であるレスポンスヘッダ※を付与して応答します。

※ レスポンスヘッダーの "Content-Type" に "application/json" を設定

正常系の応答をするモックデータの例：

```
{
    "no": 12345,
    "price" : 500,
    "name" : "1234567890ABCDEFあいうえお"
}
```

# 異常系 モック用データの作成

異常系のレスポンスデータの例として、

`http://localhost:9876/samplewebapp/v1/userdata/notfound/` へのアクセスで
プロジェクト内のパス `./mockdata/samplewebapp/v1/userdata/notfound.err.json` のファイルを参照し、レスポンスコード、レスポンスデータとして応答する仕組みとなっています。

この場合、正常系のファイル `/mockdata/samplewebapp/v1/userdata/notfound.json` があったとしても
無視されます。（異常系を優先）

異常系のモックファイルは以下のような構成で記載します。

```
{
    "code": 500,
    "contents" : {
        "errorcode" : "TESTERR500-0010",
        "message" : "500 TestError by Mockdata!"
    }
}
```

- キー値 `code` には異常系として想定するサーバ応答レスポンスコードを記載します。
- キー値 `contents` には異常系としてレスポンスボディにセットする内容を記載します。

# サーバ内エラー

http-jsonmock-server 自体のエラー応答には以下のようなパターンがあります。

| レスポンスコード | エラー内容 | エラー発生理由 |
| --- | --- | --- |
| 500 | Json file parse error. File=[{filepath}] | モックデータ内容を JSON 形式でパースすることに失敗した |
| 404 | File Not Found. File=[{filePath}] | 対応するモックデータファイルが存在しなかった |


# 起動オプション

http-jsonmock-server の起動オプションは以下のように引数から Key-Value 形式で指定できます。

npm run start 経由で起動する場合の例：

```
npm run start -- -port=1234 -docpath=./mockdatav2 -loglevel=INFO
```

node.js で直接起動する場合の例：

```
node src -port=1234 -docpath=./mockdatav2 -loglevel=INFO
```

| オプション | デフォルト値 | 概要 |
| --- | --- | --- |
| -port | 9876 | モックサーバが使用するポート |
| -docpath | ./mockdata | モックデータのパス。実行パスからの相対パスか、絶対パスで指定 | 
| -loglevel | DEBUG | ログ出力レベル。DEBUG, INFO, WARN, ERROR から選択 |

# プログラムの終了方法

コマンドライン上から `Ctrl + c` で終了できます。



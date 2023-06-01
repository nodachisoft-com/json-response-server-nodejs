const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// デフォルトパラメタを定義
const defaultKV = {
    port: 9876,
    docpath : "mockdata",
    loglevel : "DEBUG"
};

// '-' + key=value 形式で渡されるスクリプトの複数の引数を取得し、key-value の連想配列で返す
const getKeyValueFromParams = () => {
    const args = process.argv.slice(2);
    const argsKV = {};
    args.forEach(arg => {
        if ( arg.length == 0 || arg[0] !== '-' ) return;
        const [key, value] = arg.substring(1).split('=');
        argsKV[key] = value;
    });
    return argsKV;
}

// 引数で渡された重複パラメタを優先してパラメタ上書き
const argsKV = { ...defaultKV, ...getKeyValueFromParams()};

const debug = ( message ) => msg( "DEBUG", message );
const info = ( message ) => msg( "INFO", message );
const warn = ( message ) => msg( "WARN", message );
const error = ( message ) => msg( "ERROR", message );
const msg =  ( level, message ) => {
    if (( argsKV.loglevel === "INFO" ) && ( level === "DEBUG" )) return;
    if (( argsKV.loglevel === "WARN" ) 
        && ( level === "DEBUG" || level === "INFO"  )) return;
    if (( argsKV.loglevel === "ERROR" ) 
        && ( level === "DEBUG" || level === "INFO" || level === "WARN" )) return;
    const now = new Date();
    const hour = now.getHours().toString().padStart( 2, '0');
    const min = now.getMinutes().toString().padStart( 2, '0');
    const sec = now.getSeconds().toString().padStart( 2, '0');
    console.log( `[${level} ${hour}:${min}:${sec}] ${message}` );
}

/**
 * @description
 * http サーバを ポート 9876 で起動し、GET / POST メソッドを受け付け、
 * あらかじめ用意された JSON データをレスポンスデータとして応答する。
 * 処理：
 *  1. リクエストパスに応じたテキストファイルを mockdata フォルダ内から”レスポンスデータセット”として読み出す準備として、
 *     ローカルから参照するファイルパスを取得する。ファイルパスは mockdata + "/" + URLパス + ".json" とする。
 *     この時、パスの末尾が "/" であった場合はこの一文字はトリムする
 *        例1) https://api-mock-server/aaa/bbb/ccc → mockdata/aaa/bbb/ccc.json
 *        例2) https://api-mock-server/aaa/bbb/ccc/ → mockdata/aaa/bbb/ccc.json
 * 
 *  2. 参照するファイル末尾に ".err" が付与されたファイルが存在するかを確認し、存在する場合、その内容をレスポンスデータとして
 *     応答する。存在しない場合は、後続処理に続く。
 * 
 *  3. リクエストパスに応じた JSON ファイルが存在しない場合、"404 Mockdata Not Found." を応答する。
 * 
 *  4. 読みだしたレスポンスデータセット・テキストファイルの内容は JSON 形式を期待する。
 *     JSON でパース出来ない場合はレスポンスコードを 500 エラーとし、メッセージボディ部には「JSON MOCK DATA PARSE ERROR」文字列を応答する。
 * 
 *  5. レスポンスデータが JSON 形式であることが確認できた後、内容を JSON データとして応答する。
 * @param port サービス起動のポート番号(default : 9876)
 * @param docpath レスポンスデータセットの格納先ルートパスを指定
 */
const startHttpServer = ( {port, docpath} ) => {
    const server = http.createServer((req, res) => {
        const reqUrl = url.parse(req.url);
        const reqPath = reqUrl.pathname;
        const reqQuery = reqUrl.query;
       
        // リクエスト内容（req）の内容のうち、メソッド、リクエストヘッダ、リクエストボディをすべてDEBUGレベルで出力する
        debug(`Request remote IP: ${req.socket.remoteAddress}`);
        debug(`Request Method: ${req.method}`);
        debug(`Request Path: ${reqPath}`);
        debug(`Request Query: ${reqQuery}`);
        debug("Request Body: " + JSON.stringify( req.body) );
        debug("Request Headers: " + JSON.stringify( req.headers) );

        // 処理1. 参照するレスポンスデータセットのテキストファイルパスを取得
        let filePath = "";
        let errFilePath = "";
        if ( docpath.length > 0 && docpath[0] === '/' ) {
            // 絶対パスとしてモックデータ格納パスを設定する
            filePath = path.join("", docpath, reqPath.replace(/\/$/, '') + '.json');
            errFilePath = path.join("", docpath, reqPath.replace(/\/$/, '') + '.err.json');
        } else {
            // 相対パスとしてモックデータ格納パスを設定する
            filePath = path.join(process.cwd(), docpath, reqPath.replace(/\/$/, '') + '.json');
            errFilePath = path.join(process.cwd(), docpath, reqPath.replace(/\/$/, '') + '.err.json');
        }

        // 処理2. .err ファイルが存在する場合、レスポンスデータとして応答する
        if (fs.existsSync(errFilePath)) {
            const errFile = fs.readFileSync(errFilePath);
            // errFile を JSON として解析し、key名が code の内容を レスポンスコードとしてセットする
            // また、key名が contents の内容をレスポンスボディの値としてセットする
            try {
                const errData = JSON.parse(errFile);
                debug(`Mock Data File: ${errFile}`);
                res.statusCode = errData.code ?? "501"; // 該当データがなければ 501 ( Not Implemented )
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(errData.contents) ?? "undefined");
                info(`${errData.code} ${req.method} ${reqPath}`);
            } catch (e) {
                // エラー応答用 JSON ファイルが parse 不可だった場合
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                const errorMsg = `Json file parse error. File=[${errFilePath}]`;
                res.end(errorMsg);
                warn(`${res.statusCode} ${req.method} ${reqPath} ERROR:${errorMsg}`);
            }
            return;
        }

        // 処理3. リクエストパスに応じた JSON ファイルが存在しない場合、404 Not Found を応答する
        if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            const errorMsg = `File Not Found. File=[${filePath}]`;
            res.end(errorMsg);
            warn(`${res.statusCode} ${req.method} ${reqPath} ERROR:${errorMsg}`);
            return;
        }

        // 処理4. 読みだしたレスポンスデータセット・テキストファイルの内容は JSON 形式を期待する。
        //       JSON でパース出来ない場合はレスポンスコードを
        //       500 エラーとし、メッセージボディ部には「JSON MOCK DATA PARSE ERROR」文字列を応答する。
        const file = fs.readFileSync(filePath);
        try {
            JSON.parse(file);
        } catch (e) {
            // 対象がパース不可の JSON ファイルだった場合
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            const errorMsg = `Json file parse error. File=[${filePath}]`;
            res.end(errorMsg);
            warn(`${res.statusCode} ${req.method} ${reqPath} ERROR:${errorMsg}`);
            return;
        }

        // 処理 5. レスポンスデータが JSON 形式であることが確認できた後、内容を JSON データとして応答する。
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(file);
        warn(`${res.statusCode} ${req.method} ${reqPath}`);
    });

    // サービス起動し、リクエストを受け付ける
    server.listen(port, () => {
        info(`JSON-Simple-Mock-Server running at http://localhost:${port}/`);
    });
}

// サーバ起動
info("=======================================================================");
info(" JSON-Simple-Mock-Server");
info(" Usage) node index.js [-port=9876] [-docpath=./mockdata] [-loglevel=INFO]");
info("   option: -port ... mock server service port. default=9876");
info("           -docpath ... mock data path. default=.\/mockdata");
info("           -loglevel ... log level. \"DEBUG|INFO|WARN|ERROR\"");
info(" Exit ... Press Ctrl + C key.");
info("=======================================================================");
info("Param: -port=" + argsKV["port"]);
info("Param: -docpath=" + argsKV["docpath"]);
info("Param: -loglevel=" + argsKV["loglevel"]);
info("Start Mock Server Service...");
startHttpServer(argsKV);

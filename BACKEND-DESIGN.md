# 血圧記録アプリ バックエンド設計（P0）

## 1. 目的
Auth0で認証済みの利用者に対し、業務上の社員番号（0001, 0002, 0003...）を安全に自動採番し、Auth0 user_id と1対1で紐づける。

## 2. P0方針
初期実装は Google Apps Script + 専用Googleスプレッドシートを採用候補とする。

理由:
- 想定利用者数・登録頻度が小規模で、RDB導入は現時点では過剰。
- 既存のGoogle Workspace運用と相性がよい。
- LockService を使うことで同時登録時の二重採番を防止できる。
- 将来必要になればRDBへ移行できるよう、Auth0 user_idを恒久的な内部キーとして扱う。

## 3. データ構造
専用スプレッドシートに以下を持つ。

### USERS シート
- auth0_user_id: Auth0の `sub`。一意・変更不可。
- employee_no: 整数値。1, 2, 3... を保持。
- employee_code: 表示用。0001, 0002...。
- email: 復旧用メールアドレス。
- name: 氏名。
- department: 部署。
- status: ACTIVE / SUSPENDED / RETIRED。
- created_at: 作成日時（Asia/Tokyo）。
- updated_at: 更新日時（Asia/Tokyo）。

### SEQUENCE シート
- key: EMPLOYEE_NO
- current_value: 現在の最大採番値。

### AUDIT_LOG シート
- timestamp
- actor_auth0_user_id
- action
- target_auth0_user_id
- employee_code
- detail

## 4. 採番ルール
- 初回は 1 を採番し、表示は `0001`。
- 以降は current_value + 1。
- 採番処理は必ず `LockService.getScriptLock()` で排他制御する。
- 同一auth0_user_idに対しては既存番号を返し、再採番しない（冪等性）。
- employee_noは欠番を再利用しない。
- 9999を超えても内部数値はそのまま増加し、表示は最低4桁ゼロ埋めとする。例: 10000 → 10000。

## 5. 初回登録APIの処理順
1. SPAでAuth0ログイン成功。
2. SPAはAuth0 Access Tokenを添えてバックエンドAPIへ初回登録要求。
3. バックエンドはAccess Tokenを検証し、`sub` を取得。
4. ScriptLockを取得。
5. USERSに同じauth0_user_idが存在するか確認。
6. 存在する場合は既存employee_codeを返す。
7. 存在しない場合のみSEQUENCEを+1。
8. USERSへ新規行を追加。
9. AUDIT_LOGへ `USER_CREATED` を記録。
10. Lockを解放。
11. SPAへemployee_codeを返す。

## 6. 重要なセキュリティ要件
- SPAから社員番号を自己申告させない。
- SPAからAuth0 user_idを信頼して受け取らない。必ずAccess Tokenの検証結果から取得する。
- GoogleスプレッドシートIDや内部構造をフロントへ露出させない。
- 管理者用処理と一般利用者用処理を分離する。
- 血圧データ・権限情報はAuth0 metadataを正本にしない。
- Client SecretやManagement API tokenをGitHub Pagesへ置かない。

## 7. 注意点
GAS Web Appを単純に匿名公開し、フロントから任意のauth0_user_idをPOSTする構成は採用しない。
Auth0 Access Tokenの検証方法を確定してから本番接続する。

## 8. P0で確認すること
1. Auth0ログイン後のAccess TokenをSPAから取得できる。
2. GAS側でそのTokenを安全に検証できる方式を確定する。
3. 初回登録APIが同じユーザーに対し何度呼ばれても同じ社員番号を返す。
4. 同時2リクエストでも0001が二重発行されない。
5. 0001 → 0002 → 0003 と連番で採番される。
6. SPA画面の自動nickname表示を廃止し、社員番号を表示できる。

## 9. 次の判断ポイント
GASでAuth0 JWT検証を安全かつ保守可能に実装できるかを確認する。
難しい場合は、Cloudflare Workers / Supabase Edge Functions等のJWT検証が容易なバックエンドへ切り替える。

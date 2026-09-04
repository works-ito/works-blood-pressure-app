# WORKS 血圧記録アプリ - Phase 0

まず認証方式だけを実機検証するPoCです。血圧データやGoogle Sheetsにはまだ接続しません。

## 使い方
1. Clerkで新しいApplicationを作成。
2. Authentication settingsで Username / Password / Passkeys を有効化。
3. Publishable Key（`pk_...`）を取得。
4. このPoCをHTTPSで公開（GitHub Pages等）。
5. Clerk側に公開URLを許可Originとして設定。
6. 画面にPublishable Keyを入力。
7. テストユーザーでパスワードログイン→Passkey登録→ログアウト→Passkey再ログインを確認。
8. iPhone / Androidの双方で実機確認。

## セキュリティ
- Secret Keyはフロントエンドに置かない。
- このPoCはPublishable Keyのみ扱う。
- 本番ではClerkの認証結果をGAS側でも検証し、画面の表示制御だけを信用しない。

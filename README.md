# ToDo List App

フルスタック構成の ToDo リストアプリケーションです。
React でフロントエンド、Express + SQLite でバックエンドを構築し、タスク管理に必要な機能を一通り実装しています。

## 機能一覧

- **タスクのCRUD** - 追加・編集・削除・完了切り替え
- **優先度** - 高・中・低の3段階。色分けで視覚的に識別
- **期限管理** - 日付を設定可能。期限切れ・期限間近のタスクを警告表示
- **カテゴリ** - 自由にカテゴリを設定し、カテゴリ別にフィルタリング
- **ドラッグ&ドロップ** - タスクの並び替え（順序はDBに保存）
- **ダークモード** - ライト/ダークテーマの切り替え
- **フィルタリング** - 状態・優先度・カテゴリによる絞り込み
- **テスト** - Vitest + React Testing Library による自動テスト

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React 19, Vite |
| バックエンド | Express 5, better-sqlite3 |
| ドラッグ&ドロップ | @dnd-kit |
| テスト | Vitest, React Testing Library |
| スタイリング | CSS (CSS変数によるテーマ管理) |

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/iizy52/todo-app.git
cd todo-app

# 依存パッケージをインストール
npm install

# 開発サーバーを起動（フロント + バック同時起動）
npm run dev
```

ブラウザで http://localhost:5173 を開くとアプリが表示されます。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | フロントエンド + バックエンドを同時起動 |
| `npm run client` | フロントエンドのみ起動 |
| `npm run server` | バックエンドのみ起動 |
| `npm run build` | プロダクションビルド |
| `npm test` | テスト実行 |

## プロジェクト構成

```
todo-app/
├── server/
│   ├── index.js        # Express API サーバー
│   └── db.js           # SQLite データベース設定
├── src/
│   ├── App.jsx         # メインコンポーネント
│   ├── App.css         # スタイル
│   ├── api.js          # API 通信モジュール
│   ├── index.css       # グローバルスタイル・テーマ変数
│   └── __tests__/
│       └── App.test.jsx
├── package.json
└── vite.config.js
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/todos` | 全タスク取得 |
| POST | `/api/todos` | タスク追加 |
| PUT | `/api/todos/:id` | タスク更新 |
| DELETE | `/api/todos/:id` | タスク削除 |
| PUT | `/api/todos/reorder` | 並び替え保存 |

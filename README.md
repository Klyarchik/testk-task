# Pepe Hype Empire

## Core loop

POST PEPE → получаем Hype → покупаем улучшения → автоматизируем доход → открываем новый этап → в течение игры получаем Бонус/Кризис/Глитч → повторяем.

## Стек

- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt, MinIO
- Frontend: React + Vite
- Storage: PostgreSQL + MinIO
- Auth: JWT Bearer token

## Требования

- Node.js 20+
- Docker + Docker Compose

## Быстрый запуск

### 1. Инфраструктура

```bash
docker compose up -d
```

PostgreSQL:
- host: localhost
- port: 5432
- db: pepe_hype
- user: pepe
- password: pepe_password

MinIO:
- API: http://localhost:9000
- Console: http://localhost:9001
- user: minioadmin
- password: minioadmin

Bucket в MinIO создаётся через backend автоматически:
`pepe-hype-assets`

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend: http://localhost:3000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Тестовые пользователи

После `npm run seed`:

- `pepegod` / `pepe12345`
- `frogmaster` / `pepe12345`
- `memelord` / `pepe12345`

Они нужны только для демонстрации leaderboard.

## MinIO

Backend создаёт bucket `pepe-hype-assets` при старте и загружает встроенные PNG-файлы из `backend/assets/pepe`.

В production bucket лучше закрыть и выдавать presigned URLs. Для тестового пубтличный read-only bucket удобен.

## Монетизация без реальной оплаты

1. **Memecoins** — премиальная валюта.
2. **x3 Hype Booster** — временный премиальный бустер.
3. **Rewarded Ads** — mock-реклама за награду.
4. **Уникальный скины** — стимулируют пользователя к совершению доната.

Реальные платежи не подключены.

## AI

Я использовал AI (бесплатную версию ChatGPT) как вспомогательный инструмент при разработке: он помогал с написанием отдельных фрагментов кода, логикой некоторых механик и генерацией изображений Pepe и фонов для стадий. Также AI помогал быстрее находить решения и предлагал идеи, которые я уже адаптировал под проект и реализовывал самостоятельно.
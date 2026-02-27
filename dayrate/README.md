# DayRate

Avalie seu dia, todo dia. PWA mobile-first para dar nota diária (0–10) ao seu dia, com grupos e estatísticas.

## Stack

- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + PWA
- **Deploy:** Railway (backend) + Vercel (frontend)

---

## Setup local

### Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente (ou use Railway/Neon/Supabase)

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL e segredos JWT
npm install
npm run db:migrate     # Cria as tabelas no banco
npm run dev            # Inicia em http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edite VITE_API_URL se necessário
npm install
npm run dev            # Inicia em http://localhost:5173
```

---

## Deploy

### Backend no Railway

1. Crie uma conta em [railway.app](https://railway.app)
2. Novo projeto → Deploy from GitHub repo
3. Selecione a pasta `backend/` (ou use monorepo root com root directory configurado)
4. Adicione um serviço PostgreSQL no Railway
5. Configure as variáveis de ambiente:
   ```
   DATABASE_URL=<gerado pelo Railway PostgreSQL>
   JWT_SECRET=<string aleatória longa>
   JWT_REFRESH_SECRET=<outra string aleatória longa>
   NODE_ENV=production
   FRONTEND_URL=https://seu-app.vercel.app
   ```
6. O Railway vai detectar o `Dockerfile` e fazer o build automaticamente
7. O `prisma migrate deploy` roda automaticamente no start

### Frontend no Vercel

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Import Git Repository → selecione o repo
3. Configure **Root Directory** como `frontend`
4. Adicione a variável de ambiente:
   ```
   VITE_API_URL=https://seu-backend.railway.app
   ```
5. Deploy!

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `JWT_SECRET` | Segredo para assinar access tokens (15min) |
| `JWT_REFRESH_SECRET` | Segredo para refresh tokens (30 dias) |
| `PORT` | Porta do servidor (padrão: 3001) |
| `NODE_ENV` | `development` ou `production` |
| `FRONTEND_URL` | URL do frontend para CORS |

### Frontend (`frontend/.env`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API (sem `/api` no final) |

---

## Estrutura do projeto

```
dayrate/
├── backend/
│   ├── src/
│   │   ├── controllers/   # auth, ratings, groups
│   │   ├── middleware/    # JWT authenticate
│   │   ├── routes/        # express routers
│   │   ├── prisma/        # prisma client singleton
│   │   └── index.ts       # entry point
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── railway.json
├── frontend/
│   ├── src/
│   │   ├── api/           # fetch wrappers (auth, ratings, groups)
│   │   ├── components/    # NavBar, RatingInput, RatingColor
│   │   ├── hooks/         # useAuth (context)
│   │   ├── pages/         # Login, Home, Calendar, Groups, Profile
│   │   └── main.tsx
│   └── vercel.json
└── .gitignore
```

---

## Regras de negócio

- **Uma nota por dia** — enforçado na API e no banco (`@@unique([userId, date])`)
- **Sem notas futuras** — validado no backend em UTC
- **Notas são imutáveis** — o endpoint só faz INSERT, nunca UPDATE
- **Dias anteriores** — permitido dar nota retroativa sem limite
- **Grupos** — membros veem as notas uns dos outros (só o número)

## Cores das notas

| Faixa | Cor |
|-------|-----|
| 10 | Azul (`#0ea5e9`) |
| 8–9.9 | Verde escuro (`#16a34a`) |
| 6–7.9 | Verde claro (`#4ade80`) |
| 5–5.9 | Amarelo (`#eab308`) |
| 4–4.9 | Vermelho (`#ef4444`) |
| 0–3.9 | Roxo (`#7c3aed`) |

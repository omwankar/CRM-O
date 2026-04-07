## CRM

This repo now has a **separate frontend and backend**:

- **Frontend**: Next.js app (this folder)
- **Backend**: Express API in `backend/`

### Run (two terminals)

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Run both together (one command)

```bash
npm install
npm run dev:all
```

Backend will be on `http://localhost:4000` and frontend on `http://localhost:3000`.


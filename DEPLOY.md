# Deploy TÔNICO no Vercel

## 1 — Configure o OAuth do Google no Supabase

No painel Supabase (https://supabase.com/dashboard/project/wbahygrqilfqsdjvnwtd):
- Authentication → Providers → Google → Ativar
- Adicionar Client ID e Client Secret do Google Cloud Console
- Authorized redirect URI: `https://wbahygrqilfqsdjvnwtd.supabase.co/auth/v1/callback`

## 2 — Deploy no Vercel

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy (na pasta do projeto)
vercel --prod \
  -e NEXT_PUBLIC_SUPABASE_URL=https://wbahygrqilfqsdjvnwtd.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3 — Após o deploy

No Supabase → Authentication → URL Configuration:
- Site URL: `https://seu-app.vercel.app`
- Redirect URLs: `https://seu-app.vercel.app/auth/callback`

## Variáveis de Ambiente Vercel

| Variável | Valor |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | https://wbahygrqilfqsdjvnwtd.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbG... (anon key) |

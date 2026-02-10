# 🚀 Guia de Deploy Gratuito (Passo a Passo)

Este guia levará seu projeto do computador local para a internet, totalmente de graça.

## 📋 Pré-requisitos
Certifique-se de ter o código atualizado no seu GitHub.
1. Commit e Push das últimas alterações:
   ```bash
   git add .
   git commit -m "Preparando para deploy"
   git push origin main
   ```

---

## 1️⃣ Banco de Dados (Neon.tech)
O SQLite (arquivo local) não funciona na nuvem gratuita. Vamos usar Postgres.

1. Crie uma conta em [Neon.tech](https://neon.tech) (grátis).
2. Crie um novo projeto ("Create Project").
3. Copie a **Connection String** (Dashboard). Ela se parece com:
   `postgres://user:password@ep-xyz.aws.neon.tech/neondb...`
4. **Guarde essa URL**, vamos usá-la no passo 2.

---

## 2️⃣ Backend (Render.com)
Onde o Python vai rodar.

1. Crie uma conta em [Render.com](https://render.com).
2. Clique em **New +** -> **Web Service**.
3. Conecte seu repositório do GitHub.
4. **Configurações:**
   - **Name:** `api-aconselhamento` (ou o que preferir)
   - **Root Directory:** `backend` (⚠️ Importante! O Python está na pasta backend)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. **Environment Variables (Variáveis de Ambiente):**
   Role para baixo até "Environment Variables" e adicione:
   - `DATABASE_URL`: (Cole a URL do Neon que você copiou no passo 1)
   - `PYTHON_VERSION`: `3.11.0` (Opcional, mas recomendado)
   - `CLERK_ISSUER`: (O mesmo valor que está no seu `.env` local)
6. Clique em **Create Web Service**.
7. Espere o deploy terminar (leva uns minutos).
8. Copie a **URL do seu backend** (ex: `https://api-aconselhamento.onrender.com`).

---

## 3️⃣ Frontend (Vercel)
Onde o site vai rodar.

1. Crie uma conta em [Vercel.com](https://vercel.com).
2. Clique em **Add New...** -> **Project**.
3. Importe seu repositório do GitHub.
4. **Configurações:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Clique em "Edit" e selecione a pasta `frontend`.
5. **Environment Variables:**
   Abra a aba "Environment Variables" e adicione:
   - `VITE_API_URL`: (Cole a URL do Render do passo 2, SEM a barra no final. Ex: `https://api-aconselhamento.onrender.com`)
   - `VITE_CLERK_PUBLISHABLE_KEY`: (A mesma chave pública do seu `.env` local)
6. Clique em **Deploy**.

---

## 4️⃣ Toque Final (Conexão)
Agora que você tem o site no ar, precisamos avisar o Backend que esse site é confiável.

1. Vá na **Vercel** e copie a URL final do seu site (ex: `https://aconselhamento.vercel.app`).
2. Volte no **Render** -> Dashboard -> Seu serviço -> **Environment**.
3. Adicione uma nova variável:
   - `FRONTEND_URL`: (Cole a URL da Vercel)
4. O Render vai reiniciar automaticamente.

🎉 **Pronto! Seu sistema está online e acessível para qualquer pessoa.**

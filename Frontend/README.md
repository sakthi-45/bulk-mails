# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
 # BulkMail

 ## Run locally

 1. Start MongoDB locally.
 2. In `backend`, run `npm install` once, then `npm start`. The backend connects to `mongodb://127.0.0.1:27017/passkey` and listens on port `5000` by default.
 3. In `Frontend`, run `npm install` once, then `npm run dev`. The frontend uses `http://localhost:5000` by default.

 The MongoDB database must contain a `bulkmail` collection with a document containing a valid Gmail address in `user` or `name`, and its Gmail app password in `pass`. Revoke any app password that has been shared and replace it directly in MongoDB. Do not commit credentials.

 ## Deploy

 The deployed backend needs a MongoDB URI reachable from the hosting provider. Set `MONGODB_URI` to that URI, `FRONTEND_ORIGINS` to the allowed frontend origin(s), and `PORT` if required by the host. Set the frontend build variable `VITE_API_URL` to the deployed backend base URL. A MongoDB instance running on a developer's computer is not reachable from Vercel.

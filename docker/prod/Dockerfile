FROM node:26-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY src ./src
COPY public ./public
COPY tsconfig*.json ./

RUN npm run build


FROM node:26-alpine as production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY --from=builder /app/dist ./

USER node

EXPOSE 5001

CMD ["node", "./src/server.js"]

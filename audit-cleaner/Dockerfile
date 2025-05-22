FROM node:20-alpine AS builder

WORKDIR /app

COPY ./audit-cleaner/package*.json ./

RUN npm i

COPY ./audit-cleaner/src/index.ts ./
COPY ./audit-cleaner/tsconfig.json ./

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/dist /app/dist

ENV LOG_LEVEL=trace

CMD [ "node", "dist/index.js" ]

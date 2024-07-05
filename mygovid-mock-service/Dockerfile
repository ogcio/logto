FROM node:20-alpine as builder

WORKDIR /app

# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#node-gyp-alpine
RUN apk add --no-cache python3 make g++ rsync

COPY ./mygovid-mock-service/package*.json ./

RUN npm i

COPY ./mygovid-mock-service ./

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app /app/

ENV NODE_ENV=development
ENV LOG_LEVEL=trace

RUN npm prune --omit=dev

EXPOSE 4005

CMD [ "node", "dist/", "index.js" ]

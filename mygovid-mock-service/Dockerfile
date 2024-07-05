FROM base-deps as deps

WORKDIR /app

COPY ./mygovid-mock-service/ /app/mygovid-mock-service/
RUN pnpm ci

FROM deps AS builder

WORKDIR /app/mygovid-mock-service/
RUN pnpm run build

FROM base-deps AS runner
WORKDIR /app

COPY --from=builder /app/package*.json /app/

COPY --from=builder /app/mygovid-mock-service/dist /app/mygovid-mock-service/dist
COPY --from=builder /app/mygovid-mock-service/node_modules /app/mygovid-mock-service/node_modules
COPY --from=builder /app/mygovid-mock-service/package*.json /app/mygovid-mock-service/


ENV NODE_ENV=production
ENV LOG_LEVEL=trace

RUN npm prune --omit=dev

EXPOSE 4005

WORKDIR /app/mygovid-mock-service

CMD [ "node", "dist/", "index.js" ]
###### [STAGE] Build ######
FROM node:20-alpine as builder
WORKDIR /etc/logto
ENV CI=true

# No need for Docker build
ENV PUPPETEER_SKIP_DOWNLOAD=true

# OGCIO
ENV PORT=3301
# OGCIO
ENV ADMIN_PORT=3302

### Install toolchain ###
RUN npm add --location=global pnpm@^9.0.0
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#node-gyp-alpine
RUN apk add --no-cache python3 make g++ rsync

COPY . .

### Install dependencies and build ###
RUN pnpm i

### Set if dev features enabled ###
ARG dev_features_enabled
ENV DEV_FEATURES_ENABLED=${dev_features_enabled}

ARG applicationinsights_connection_string
ENV APPLICATIONINSIGHTS_CONNECTION_STRING=${applicationinsights_connection_string}
RUN pnpm -r build

### Add official connectors ###
ARG additional_connector_args
ENV ADDITIONAL_CONNECTOR_ARGS=${additional_connector_args}
RUN pnpm cli connector link $ADDITIONAL_CONNECTOR_ARGS -p .

### Prune dependencies for production ###
RUN rm -rf node_modules packages/**/node_modules
RUN NODE_ENV=production pnpm i

### Clean up ###
RUN rm -rf .scripts pnpm-*.yaml packages/cloud

###### [STAGE] Seal ######
FROM node:20-alpine as app
# OGCIO
ENV PORT=3301
# OGCIO
ENV ADMIN_PORT=3302
WORKDIR /etc/logto
COPY --from=builder /etc/logto .
# OGCIO
EXPOSE 3301
# OGCIO
EXPOSE 3302
#OGCIO
RUN apk add --no-cache jq && \
  chown -R node:root /etc/logto && \
  chmod -R 775 /etc/logto

#OGCIO
USER 1000

# OGCIO
CMD [ "sh", "-c", "export ENCODED_PASSWORD=$(jq --slurp --raw-input --raw-output @uri <(printf \"%s\" $POSTGRES_PASSWORD)) && export DB_URL=\"postgres://$POSTGRES_USER:$ENCODED_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB_NAME\" && export REDIS_URL=\"redis://$REDIS_HOST:$REDIS_PORT\" && npm run ogcio:start"]

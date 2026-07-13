ARG NODE_IMAGE="docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293"
ARG NUSQLITE3_DIR="/usr/local/lib/nusqlite3"
ARG NUSQLITE3_PATH="${NUSQLITE3_DIR}/libnusqlite3.so"

FROM ${NODE_IMAGE} AS build-client

WORKDIR /client
COPY client/package*.json ./
RUN npm ci && npm cache clean --force
COPY client/ ./
RUN npm run generate

FROM ${NODE_IMAGE} AS build-server

ARG NUSQLITE3_DIR
ARG TARGETARCH

ENV NODE_ENV=production

RUN apk add --no-cache \
  curl \
  g++ \
  make \
  python3 \
  unzip

WORKDIR /server
COPY index.js package*.json ./
COPY server ./server

RUN set -eu; \
  case "${TARGETARCH}" in \
    amd64) asset_arch=x64; expected_sha=6fdd092b6ba471d9bd1d5c3b01da4ca2bd84f41b03c91ccc0db6d75f1d97e52d ;; \
    arm64) asset_arch=arm64; expected_sha=91e2fc92e473f07c59df9b430e6ff120e1b56cd9a6317e61ea123259669788a7 ;; \
    *) echo "Unsupported architecture: ${TARGETARCH}" >&2; exit 1 ;; \
  esac; \
  curl --fail --location --show-error \
    --output /tmp/library.zip \
    "https://github.com/mikiher/nunicode-sqlite/releases/download/v1.2/libnusqlite3-linux-musl-${asset_arch}.zip"; \
  echo "${expected_sha}  /tmp/library.zip" | sha256sum -c -; \
  unzip /tmp/library.zip -d "${NUSQLITE3_DIR}"; \
  rm /tmp/library.zip

RUN npm ci --omit=dev && npm cache clean --force

FROM ${NODE_IMAGE} AS test-server

RUN apk add --no-cache \
  g++ \
  make \
  python3

WORKDIR /source
COPY index.js package*.json ./
RUN npm ci && npm cache clean --force
RUN npm audit --omit=dev --audit-level=critical
COPY server ./server
COPY test ./test
RUN npm test

FROM ${NODE_IMAGE} AS runtime

ARG BUILD_DATE="unknown"
ARG BUILD_VERSION="unknown"
ARG NUSQLITE3_DIR
ARG NUSQLITE3_PATH
ARG SOURCE_REVISION="unknown"

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
  org.opencontainers.image.description="Audiobookshelf custom build" \
  org.opencontainers.image.licenses="GPL-3.0" \
  org.opencontainers.image.revision="${SOURCE_REVISION}" \
  org.opencontainers.image.source="https://github.com/reynold-lariza/audiobookshelf" \
  org.opencontainers.image.title="Audiobookshelf Custom" \
  org.opencontainers.image.version="${BUILD_VERSION}"

RUN apk add --no-cache \
  ffmpeg \
  tini \
  tzdata

WORKDIR /app

COPY --from=build-client /client/dist ./client/dist
COPY --from=build-server /server ./
COPY --from=build-server ${NUSQLITE3_PATH} ${NUSQLITE3_PATH}

EXPOSE 80

ENV PORT=80 \
  NODE_ENV=production \
  CONFIG_PATH="/config" \
  METADATA_PATH="/metadata" \
  SOURCE="docker" \
  NUSQLITE3_DIR=${NUSQLITE3_DIR} \
  NUSQLITE3_PATH=${NUSQLITE3_PATH}

USER node

ENTRYPOINT ["tini", "--"]
CMD ["node", "index.js"]

FROM runtime AS smoke

USER root
RUN apk add --no-cache curl
USER node

ENV PORT=3333 \
  CONFIG_PATH="/tmp/audiobookshelf-smoke/config" \
  METADATA_PATH="/tmp/audiobookshelf-smoke/metadata"

RUN set -eu; \
  mkdir -p "${CONFIG_PATH}" "${METADATA_PATH}"; \
  node index.js >/tmp/audiobookshelf-smoke.log 2>&1 & \
  server_pid=$!; \
  trap 'kill "${server_pid}" 2>/dev/null || true' EXIT INT TERM; \
  ready=false; \
  for attempt in $(seq 1 60); do \
    if curl --fail --silent --show-error http://127.0.0.1:3333/healthcheck >/dev/null; then ready=true; break; fi; \
    if ! kill -0 "${server_pid}" 2>/dev/null; then cat /tmp/audiobookshelf-smoke.log; exit 1; fi; \
    sleep 1; \
  done; \
  if [ "${ready}" != true ]; then cat /tmp/audiobookshelf-smoke.log; exit 1; fi; \
  kill "${server_pid}"; \
  wait "${server_pid}" || true; \
  trap - EXIT INT TERM

FROM runtime AS production

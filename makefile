# This file has been added on OGCIO fork
TAG = local-logto:latest
GREEN=\033[0;32m
NC=\033[0m

build:
		docker build -t ${TAG} .
run:
		docker-compose -f docker-compose-local.yml up --detach
down:
		docker-compose -f docker-compose-local.yml down
run-native:
		@echo "${GREEN}Starting db...${NC}"
		docker compose -f docker-compose-ogcio-logto.yml up --detach postgres
		@echo "${GREEN}Db started!${NC}"
		@echo "${GREEN}Installing stuffs...${NC}"
		pnpm pnpm:devPreinstall && pnpm i && pnpm prepack
		@echo "${GREEN}Stuffs installed!${NC}"
		@echo "${GREEN}Seeding db...${NC}"
		npm run cli db seed -- --swe && npm run cli db alteration deploy latest && npm run cli db ogcio -- --seeder-filepath="./packages/cli/src/commands/database/ogcio/ogcio-seeder-local.json"
		@echo "${GREEN}Db ready!${NC}"
		@echo "${GREEN}Preparing connectors...${NC}"
		pnpm connectors build && pnpm cli connector link
		@echo "${GREEN}Connectors ready!${NC}"
		@echo "${GREEN}Starting Logto...${NC}"
		pnpm dev

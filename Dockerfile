FROM oven/bun:1-debian

ENV PORT=3001

COPY package.json ./
COPY bun.lockb ./
COPY src ./src

RUN bun install

EXPOSE 3001

CMD ["bun", "start"]
import { resolve } from 'path';

export type Config = ReturnType<typeof parseConfig>;

export const parseConfig = ({
  PORT = '3001',
  CACHE_FILES = 'false',
  CACHE_PAGES_TTL = '3600000', // 1 hour
  TEALIUM_BASE_URL = 'https://collect.tealiumiq.com',
  PUPPETEER_PATH = resolve(
    __dirname,
    '../.cache/puppeteer/chrome/mac-117.0.5938.92/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  ),
}: Record<string, string | undefined>) => ({
  server: {
    port: +PORT,
  },
  tealium: {
    collectUrl: TEALIUM_BASE_URL,
  },
  puppeteer: {
    path: PUPPETEER_PATH,
  },
  cache: {
    files: CACHE_FILES === 'true',
    pages: {
      ttl: +CACHE_PAGES_TTL,
    },
  },
});

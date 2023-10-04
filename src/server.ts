import express from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { TealiumClient } from './tealium/client';
import { parseConfig } from './config';

const config = parseConfig(process.env);
const tealium = new TealiumClient(config.tealium);
const app = new Elysia();

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: config.puppeteer.path,
  args: ['--no-sandbox'],
});

app.get('/', () => {
  return Bun.file(import.meta.dir + '/public/index.html');
});

app.get('/styles.css', async () => {
  return Bun.file(import.meta.dir + '/public/styles.css');
});

app.get('/client.js', async () => {
  const file = Bun.file(import.meta.dir + '/public/client.ts');
  return new Bun.Transpiler({
    loader: 'ts',
    target: 'browser',
  }).transform(await file.arrayBuffer());
});

app.get('/test', async (req) => {
  const page = await browser.newPage();
  const response = await page.goto(req.query.url as string);
  const html = await response.text();
  const $ = cheerio.load(html);
  const $head = $('head');
  const $body = $('body');

  const $console = $(`
    <div class="fp-tealium-console">
      <h1>FanPower:Tealium Console</h1>
      <menu>
        <li><button class="fp-tealium-clear-cookies">Clear Cookies</button></li>
      </menu>
      <ul class="fp-tealium-events"></ul>
    </div>
  `);

  const $content = $('<div class="fp-tealium-content" />');
  const $container = $('<div class="fp-tealium-container" />');

  $head.append(`<link rel="stylesheet" href="/styles.css" />`);
  $body.append($container.append($content.append($body.children()), $console));

  $body.append(`
    <script
      src="https://code.jquery.com/jquery-3.7.1.slim.min.js"
      integrity="sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8="
      crossorigin="anonymous"
    />
  `);

  $body.append(`<script src="/client.js" />`);

  return new Response($.html(), {
    headers: {
      'Content-Type': 'text/html',
    },
  });
});

process.on('SIGINT', async () => {
  await browser.close();
  process.exit(1);
});

app.listen(config.server.port, ({ hostname, port }) => {
  console.log(`Listening at http://${hostname}:${port}`);
});

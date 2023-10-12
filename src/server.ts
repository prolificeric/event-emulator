import * as cheerio from 'cheerio';
import { Elysia } from 'elysia';
import { parseConfig } from './config';
import DataLoader from 'dataloader';

const config = parseConfig(process.env);

const app = new Elysia();

const fileHandler = (fileName: string, cached = false) => {
  const load = () => {
    return Bun.file(import.meta.dir + '/public/' + fileName);
  };

  if (cached) {
    const cache = load();
    return () => cache;
  }

  return load;
};

const ts = new Bun.Transpiler({
  loader: 'ts',
  target: 'browser',
});

const tsHandler = (fileName: string, cached = false) => {
  const load = async () => {
    const data = await Bun.file(import.meta.dir + '/public/' + fileName).text();
    const js = ts.transformSync(data);

    return new Response(js, {
      headers: {
        'Content-Type': 'text/javascript',
      },
    });
  };

  if (cached) {
    const cache = load();
    return () => cache;
  }

  return load;
};

const pageLoader = new DataLoader(async (urls: string[]) => {
  return Promise.all(
    urls.map(async (url) => {
      setTimeout(() => pageLoader.clear(url), config.cache.pages.ttl);

      const cachedUrl = `https://webcache.googleusercontent.com/search?q=cache:${url}`;

      return fetch(cachedUrl, {
        headers: {
          // Mimic browser
          Host: 'webcache.googleusercontent.com',
          'User-Agent':
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          Referer:
            'https://webcache.googleusercontent.com/search?q=cache:https://fanpower.io',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      }).then((r) => r.text());
    }),
  );
});

app.get('/', fileHandler('index.html', config.cache.files));
app.get('/styles.css', fileHandler('styles.css', config.cache.files));
app.get('/console.js', tsHandler('console.ts', config.cache.files));
app.get('/intercept.js', tsHandler('intercept.ts', config.cache.files));

app.get('/proxy', async (req) => {
  const { url } = req.query;
  const html = await pageLoader.load(url);
  const $ = cheerio.load(html);
  const $body = $('body');

  // Remove base tag
  $('base').remove();

  // Remove google cache banner
  $body.find('> *:first').remove();

  // Make URLs absolute
  $('[href]').each((i, el) => {
    const $el = $(el);

    const absoluteUrl = new URL(
      $el.attr('href') as string,
      url.replace(/^\/\//, 'https://'),
    );

    $el.attr('href', absoluteUrl.toString());
  });

  $('[src]').each((i, el) => {
    const $el = $(el);
    const absoluteUrl = new URL($el.attr('src') as string, url);
    $el.attr('src', absoluteUrl.toString());
  });

  // Add our styles and scripts
  $body.append(`
    <script src="https://code.jquery.com/jquery-3.7.1.slim.min.js"></script>
    <script src="/intercept.js"></script>
  `);

  const modHtml = $.html();

  return new Response(modHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
});

app.listen(config.server.port, ({ hostname, port }) => {
  console.log(`Listening at http://${hostname}:${port}`);
});

// [
//   'SIGHUP',
//   'SIGINT',
//   'SIGQUIT',
//   'SIGILL',
//   'SIGTRAP',
//   'SIGABRT',
//   'SIGBUS',
//   'SIGFPE',
//   'SIGUSR1',
//   'SIGSEGV',
//   'SIGUSR2',
//   'SIGTERM',
// ].forEach((sig) => {
//   process.on(sig, () => {
//     browser.close();
//     app.stop();
//   });
// });

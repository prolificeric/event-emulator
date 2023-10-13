import { NextApiHandler } from 'next';
import * as cheerio from 'cheerio';

export const GET: NextApiHandler = async (req) => {
  const url = new URL(req.url || '').searchParams.get('url');

  if (!url) {
    return new Response('');
  }

  const cachedUrl = `https://webcache.googleusercontent.com/search?q=cache:${url}`;

  const response = await fetch(cachedUrl, {
    headers: {
      Host: 'webcache.googleusercontent.com',
      Referer: 'https://www.google.com/',
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Sec-Ch-Ua': `"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"`,
      'Upgrade-Insecure-Requests': '1',
    },
  });

  const $ = cheerio.load(await response.text());

  $('base, div:first').remove();

  $('[src]').each((_, el) => {
    const rel = $(el).attr('src') || '';
    const abs = new URL(rel, url).toString();
    $(el).attr('src', abs);
  });

  $('[href]:not(a)').each((_, el) => {
    const rel = $(el).attr('href') || '';
    const abs = new URL(rel, url).toString();
    $(el).attr('href', abs);
  });

  $('a[href]').each((_, el) => {
    const rel = $(el).attr('href') || '';
    const abs = new URL(rel, url).toString();
    const proxyUrl = '/proxy?url=' + encodeURIComponent(abs);
    $(el).attr('href', proxyUrl);
  });

  $('body').append(`
    <script src="https://code.jquery.com/jquery-3.7.1.slim.min.js"></script>
    <script src="/intercept.js"></script>
  `);

  return new Response($.html(), {
    headers: {
      'Content-Type': 'text/html',
    },
  });
};

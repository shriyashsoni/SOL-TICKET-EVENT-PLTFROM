import { NextRequest, NextResponse } from 'next/server';

type ScrapePayload = {
  url?: string;
};

type ScrapedEvent = {
  name: string;
  description: string;
  date: string;
  location: string;
  category: string;
  source_url: string;
};

function pickFirst(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

function extractMeta(content: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const altPattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
    'i'
  );

  return pickFirst(content.match(pattern)?.[1], content.match(altPattern)?.[1]);
}

function parseJsonLd(html: string): any[] {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  const result: any[] = [];

  for (const script of scripts) {
    const jsonText = script
      .replace(/<script[^>]*>/i, '')
      .replace(/<\/script>/i, '')
      .trim();

    if (!jsonText) continue;

    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        result.push(...parsed);
      } else {
        result.push(parsed);
      }
    } catch {
      continue;
    }
  }

  return result;
}

function findEventObject(objects: any[]): any | null {
  const queue = [...objects];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;

    const typeValue = current['@type'];
    if (
      typeValue === 'Event' ||
      (Array.isArray(typeValue) && typeValue.includes('Event'))
    ) {
      return current;
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        queue.push(...value);
      } else if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return null;
}

function inferCategory(text: string): string {
  const value = text.toLowerCase();

  if (/music|concert|dj|live/.test(value)) return 'Music';
  if (/conference|summit|meetup|workshop|tech/.test(value)) return 'Conference';
  if (/game|esports|tournament/.test(value)) return 'Gaming';
  if (/art|gallery|exhibition/.test(value)) return 'Art';

  return 'General';
}

function toDateOnly(input?: string): string {
  if (!input) return '';

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScrapePayload;
    const rawUrl = body.url?.trim();

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ success: false, error: 'Only HTTP/HTTPS links are supported' }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'BlinkTicketBot/1.0 (+event-scraper)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Could not fetch link (HTTP ${response.status})` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const jsonLd = parseJsonLd(html);
    const eventLd = findEventObject(jsonLd);

    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
    const ogTitle = extractMeta(html, 'og:title');
    const metaDescription = extractMeta(html, 'description');
    const ogDescription = extractMeta(html, 'og:description');

    const textSnapshot = stripHtml(html).slice(0, 2000);

    const name = pickFirst(
      eventLd?.name,
      ogTitle,
      titleTag,
      'Untitled Event'
    );

    const description = pickFirst(
      eventLd?.description,
      ogDescription,
      metaDescription,
      textSnapshot.slice(0, 240)
    );

    const location = pickFirst(
      eventLd?.location?.name,
      eventLd?.location?.address?.streetAddress,
      eventLd?.location?.address?.addressLocality,
      eventLd?.location?.address?.name,
      ''
    );

    const date = pickFirst(
      toDateOnly(eventLd?.startDate),
      toDateOnly(eventLd?.endDate)
    );

    const category = inferCategory(`${name} ${description} ${location}`);

    const scraped: ScrapedEvent = {
      name,
      description,
      date,
      location,
      category,
      source_url: parsedUrl.toString(),
    };

    return NextResponse.json({
      success: true,
      data: scraped,
      message: 'AI scrape complete. Please review fields before posting.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scrape event link';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

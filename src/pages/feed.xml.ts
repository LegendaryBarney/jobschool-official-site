import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '~/lib/seo';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const sorted = posts.sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime(),
  );

  return rss({
    title: `${SITE.name} 部落格`,
    description: `${SITE.name}（嘉義東區精英小班補習機構）的學習筆記：教學現場觀察、學科技巧、學測與分科測驗策略。`,
    site: context.site ?? SITE.url,
    items: sorted.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      link: `/posts/${p.id.replace(/\.(md|mdx)$/, '')}`,
      pubDate: p.data.published,
      categories: p.data.tags ?? [],
      author: p.data.author,
    })),
    customData: '<language>zh-Hant-TW</language>',
  });
}

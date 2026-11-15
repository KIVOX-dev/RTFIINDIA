import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { m, useScroll, useSpring } from 'framer-motion';
import { Button, EmptyState, Icon, Pill, Reveal, SkeletonCard, useToast, Skeleton } from '../ui/index.js';
import { NewsCard, PostCard, postUrl } from '../components/Cards.jsx';
import { ErrorCard } from '../components/Shell.jsx';
import { api, useFetch } from '../lib/api.js';
import { useSettings, useSeo, useDebounced, catColor } from '../lib/hooks.jsx';
import { dayLabel, istDay, fmtDate, waLink } from '../lib/format.js';

export function NewsPage() {
  useSeo('News', 'Daily updates from Recycle Textile Federation: market, cotton, meetings, events and policy.');
  const { s } = useSettings();
  const [sp, setSp] = useSearchParams();
  const category = sp.get('category') || '', date = sp.get('date') || '';
  const [qText, setQText] = useState(sp.get('q') || '');
  const q = useDebounced(qText, 350);
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState(null);
  const [fresh, setFresh] = useState(0);
  const newest = useRef(null);
  const sentinel = useRef(null);

  const qs = useCallback((before) => {
    const p = new URLSearchParams({ kind: 'news', limit: '12' });
    if (category) p.set('category', category);
    if (q) p.set('q', q);
    if (date) p.set('date', date);
    if (before) p.set('before', before);
    return `/posts?${p}`;
  }, [category, q, date]);

  useEffect(() => {
    setSp((o) => { const n = new URLSearchParams(o); q ? n.set('q', q) : n.delete('q'); return n; }, { replace: true });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoading(true); setError(null); setFresh(0);
    api.get(qs()).then((d) => {
      setItems(d.items); setNext(d.nextBefore);
      newest.current = d.items.filter((x) => !x.pinned)[0]?.publishAt || new Date().toISOString();
    }).catch(setError).finally(() => setLoading(false));
  }, [qs]);
  useEffect(load, [load]);

  const loadMore = useCallback(() => {
    if (!next || more) return;
    setMore(true);
    api.get(qs(next), { silent: true }).then((d) => { setItems((o) => [...o, ...d.items]); setNext(d.nextBefore); }).catch(setError).finally(() => setMore(false));
  }, [next, more, qs]);
  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: '400px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [loadMore]);

  // poll every 60s for new cards
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden || !newest.current) return;
      api.get(`/posts/new-count?kind=news&since=${encodeURIComponent(newest.current)}`, { silent: true }).then((d) => setFresh(d.count)).catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const setFilter = (k, v) => setSp((o) => { const n = new URLSearchParams(o); v ? n.set(k, v) : n.delete(k); return n; });
  const groups = useMemo(() => {
    const out = [];
    const pinned = items.filter((x) => x.pinned);
    if (pinned.length) out.push({ label: 'Pinned', items: pinned });
    items.filter((x) => !x.pinned).forEach((p) => {
      const key = istDay(p.publishAt);
      const g = out.find((x) => x.key === key);
      g ? g.items.push(p) : out.push({ key, label: dayLabel(p.publishAt), items: [p] });
    });
    return out;
  }, [items]);

  if (error && !items.length) return <ErrorCard onRetry={load} />;
  const cats = s.categories || [];
  return (
    <div className="container page-pad section">
      <Reveal><span className="eyebrow">News</span><h1 className="h1">Daily updates</h1><p className="muted lead-sm">Short cards from the RTF office, newest first.</p></Reveal>
      <div className="filters">
        <label className="search glass"><Icon name="search" size={18} /><span className="sr">Search news</span><input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Search updates" /></label>
        <label className="search glass datef"><Icon name="cal" size={18} /><span className="sr">Filter by date</span><input type="date" max={istDay(Date.now())} value={date} onChange={(e) => setFilter('date', e.target.value)} /></label>
        {(category || date || qText) && <Button variant="ghost" size="sm" onClick={() => { setQText(''); setSp({}); }}>Clear</Button>}
      </div>
      <div className="chips-row" role="group" aria-label="Categories">
        <button className={`cat-chip ${!category ? 'on' : ''}`} aria-pressed={!category} onClick={() => setFilter('category', '')}>All</button>
        {cats.map((c) => <button key={c.name} className={`cat-chip ${category === c.name ? 'on' : ''}`} aria-pressed={category === c.name} onClick={() => setFilter('category', c.name)}><i style={{ background: c.color }} />{c.name}</button>)}
      </div>

      {fresh > 0 && <button className="glass new-pill" onClick={load}><Icon name="refresh" size={16} /> {fresh} new update{fresh > 1 ? 's' : ''}</button>}

      {loading ? <div className="news-grid">{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}</div>
        : !items.length ? <div className="glass"><EmptyState title="No updates found" text="Try a different filter, or check today's rates." action={<Button to="/prices/yarn" arrow>View price lists</Button>} /></div>
          : groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="day-head">{g.label === 'Pinned' && <Icon name="pin" size={16} />}{g.label}</h2>
              <div className="news-grid">{g.items.map((p, i) => <Reveal key={p.id} i={i % 3}><NewsCard post={p} index={i} /></Reveal>)}</div>
            </section>
          ))}
      <div ref={sentinel} style={{ height: 1 }} />
      {more && <div className="news-grid" style={{ marginTop: 20 }}>{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>}
    </div>
  );
}

function PostList({ kind, title, eyebrow, lead, seo }) {
  useSeo(title, seo);
  const { data, loading, error, reload } = useFetch(`/posts?kind=${kind}&limit=50`);
  if (error) return <ErrorCard onRetry={reload} />;
  return (
    <div className="container page-pad section">
      <Reveal><span className="eyebrow">{eyebrow}</span><h1 className="h1">{title}</h1><p className="muted lead-sm">{lead}</p></Reveal>
      {loading ? <div className="post-grid">{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}</div>
        : !data.items.length ? <div className="glass"><EmptyState title={`No ${title.toLowerCase()} yet`} text="New posts from the RTF office will appear here." /></div>
          : <div className="post-grid">{data.items.map((p, i) => <Reveal key={p.id} i={i % 3}><PostCard post={p} /></Reveal>)}</div>}
    </div>
  );
}
export const BlogPage = () => <PostList kind="blog" title="Blog" eyebrow="Blog" lead="Articles and insights for open end spinning mills." seo="RTF blog" />;
export const EventsPage = () => <PostList kind="event" title="Events" eyebrow="Events" lead="Fairs, conclaves and shows relevant to RTF members." seo="Textile fairs and events" />;

export function PostDetail({ kind }) {
  const { slug } = useParams();
  const toast = useToast();
  const { s } = useSettings();
  const { data: p, loading, error, reload } = useFetch(`/posts/${slug}`);
  useSeo(p?.title, p?.summary, p?.imageUrl);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });
  const label = { news: 'News', blog: 'Blog', event: 'Events' }[kind];
  if (error) return error.status === 404 ? <ErrorCard title="Post not found" text="It may have been removed." /> : <ErrorCard onRetry={reload} />;
  const url = window.location.href;
  return (
    <>
      <m.div className="read-bar" style={{ scaleX: bar }} aria-hidden="true" />
      <article className="container page-pad section post-detail">
        <Link to={`/${{ news: 'news', blog: 'blog', event: 'events' }[kind]}`} className="more back"><Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} /> {label}</Link>
        {loading || !p ? <><Skeleton h={44} w="80%" style={{ marginTop: 20 }} /><Skeleton h={380} r={24} style={{ marginTop: 28 }} /></> : (
          <>
            <div className="row wrap" style={{ marginTop: 18 }}>
              {p.category && <Pill color={catColor(s, p.category)}>{p.category}</Pill>}
              <span className="muted small">{fmtDate(p.publishAt)} · {p.readMins} min read</span>
            </div>
            <h1 className="h1 pd-title">{p.title}</h1>
            {p.summary && <p className="lead-sm muted">{p.summary}</p>}
            {p.imageUrl && <img className="cover" src={p.imageUrl} alt={p.imageAlt || ''} width="1200" height="630" />}
            {p.body && <div className="prose">{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>}
            <div className="row wrap share-row no-print">
              <Button size="sm" icon="whatsapp" href={waLink(`${p.title}\n${url}`)}>Share on WhatsApp</Button>
              <Button size="sm" variant="glass" icon="link" onClick={async () => { try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.error('Could not copy'); } }}>Copy link</Button>
              {p.linkUrl && <Button size="sm" variant="glass" icon="link" href={p.linkUrl}>Open link</Button>}
              {p.attachmentUrl && <Button size="sm" variant="glass" icon="download" href={p.attachmentUrl}>Download PDF</Button>}
            </div>
            {p.related?.length > 0 && (
              <section className="related"><h2 className="h2">Related</h2>
                <div className="post-grid">{p.related.map((r) => <PostCard key={r.id} post={r} />)}</div>
              </section>)}
          </>
        )}
      </article>
    </>
  );
}
export { postUrl };

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Pill, GlassCard, Button, useToast } from '../ui/index.js';
import { useSettings, catColor } from '../lib/hooks.jsx';
import { isNew, relTime, fmtDate, waLink } from '../lib/format.js';

/** A photograph that fits the post's category, used when a post has no image of its own. */
function topicPhoto(cat = '') {
  const t = cat.toLowerCase();
  if (t.includes('market') || t.includes('price') || t.includes('rate')) return 'cones-white';
  if (t.includes('meeting') || t.includes('notice') || t.includes('committee')) return 'mill-supervisors';
  if (t.includes('cotton') || t.includes('raw') || t.includes('material')) return 'cotton-aerial';
  if (t.includes('event') || t.includes('fair') || t.includes('expo')) return 'export-container';
  if (t.includes('award')) return 'couple-yarn';
  if (t.includes('policy') || t.includes('govern')) return 'world-map';
  return 'mill-hall-green';
}
const PATH = { news: 'news', blog: 'blog', event: 'events' };
export const postUrl = (p) => `/${PATH[p.kind || 'news']}/${p.slug}`;

export function NewsCard({ post, preview = false, index = 0 }) {
  const { s } = useSettings();
  const toast = useToast();
  const [zoom, setZoom] = useState(false);
  const url = preview ? window.location.origin : window.location.origin + postUrl(post);
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.error('Could not copy'); } };
  const wa = waLink(`${post.title}\n${post.summary || ''}\n${url}`);
  const fresh = post.publishAt && isNew(post.publishAt);
  return (
    <GlassCard as="article" lift className={`news-card ${post.pinned ? 'is-pinned' : ''}`} data-i={index}>
      {post.imageUrl ? (
        <div className="news-img">
          <img src={post.imageUrl} alt={post.imageAlt || ''} loading="lazy" width="640" height="360" />
        </div>
      ) : !preview && (
        <div className="news-img topic"><img src={`/photos/${topicPhoto(post.category)}.webp`} alt="" loading="lazy" width="640" height="360" /></div>
      )}
      <div className="news-body">
        <div className="row wrap" style={{ gap: 8 }}>
          {post.category && <Pill color={catColor(s, post.category)}>{post.category}</Pill>}
          {fresh && <Pill tone="new"><span className="dot" />New</Pill>}
          {post.pinned && <span className="pin" title="Pinned"><Icon name="pin" size={16} /><span className="sr">Pinned</span></span>}
          <span className="spacer" />
          {post.publishAt && <time className="muted small" dateTime={post.publishAt}>{relTime(post.publishAt)}</time>}
        </div>
        <h3>{preview || !post.slug ? post.title || 'Headline appears here' : <Link to={postUrl(post)}>{post.title}</Link>}</h3>
        {(post.summary || preview) && <p className="muted">{post.summary || 'Short text appears here.'}</p>}
        <div className="news-actions">
          {post.hasBody && !preview && <Link className="more" to={postUrl(post)}>Read more <Icon name="arrow" size={16} className="arrow" /></Link>}
          {post.linkUrl && <a className="more" href={post.linkUrl} {...(/^https?:/.test(post.linkUrl) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>Open link <Icon name="link" size={16} /></a>}
          {post.attachmentUrl && <a className="more" href={post.attachmentUrl} target="_blank" rel="noopener noreferrer">PDF <Icon name="download" size={16} /></a>}
          <span className="spacer" />
          <a className="icon-btn" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><Icon name="whatsapp" /></a>
          <button className="icon-btn" onClick={copy} aria-label="Copy link"><Icon name="link" /></button>
        </div>
      </div>
    </GlassCard>
  );
}

export function PostCard({ post }) {
  const { s } = useSettings();
  return (
    <GlassCard as="article" lift className="post-card">
      <Link to={postUrl(post)} className="post-img" aria-label={post.title}>
        {post.imageUrl ? <img src={post.imageUrl} alt={post.imageAlt || post.title} loading="lazy" width="640" height="400" /> : <div className="post-ph"><Icon name={post.kind === 'event' ? 'cal' : 'doc'} size={36} /></div>}
      </Link>
      <div className="news-body">
        <div className="row wrap" style={{ gap: 8 }}>
          {post.category && <Pill color={catColor(s, post.category)}>{post.category}</Pill>}
          <span className="spacer" />
          <span className="muted small">{fmtDate(post.publishAt)} · {post.readMins} min read</span>
        </div>
        <h3><Link to={postUrl(post)}>{post.title}</Link></h3>
        {post.summary && <p className="muted">{post.summary}</p>}
      </div>
    </GlassCard>
  );
}

export const CopyButton = ({ text, label = 'Copy' }) => {
  const toast = useToast();
  return (
    <button className="icon-btn" aria-label={label} onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success('Copied'); } catch { toast.error('Could not copy'); } }}>
      <Icon name="copy" />
    </button>
  );
};
export { Button };

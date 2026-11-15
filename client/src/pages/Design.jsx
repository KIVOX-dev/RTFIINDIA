import { useState } from 'react';
import { Button, GlassCard, Pill, Skeleton, SkeletonCard, Input, Textarea, Select, Switch, Tabs, Dropdown, Modal, useToast, Sparkline, AnimatedNumber, Reveal, Marquee, EmptyState, Lightbox, DataTable, Logo, Icon } from '../ui/index.js';
import { PriceTable } from '../components/Prices.jsx';
import { NewsCard } from '../components/Cards.jsx';

const sample = [{ item: '10s', unit: '₹/kg', rate: 46, prev: 45, note: '' }, { item: '12s', unit: '₹/kg', rate: 49, prev: 50.5, note: '' }, { item: '16s', unit: '₹/kg', rate: 55, prev: 55, note: '' }];
const colors = [['--navy', '#072654'], ['--navy-deep', '#04173a'], ['--blue', '#3395FF'], ['--blue-hover', '#1f7fe8'], ['--blue-wash', '#EAF3FF'], ['--up', '#12B76A'], ['--down', '#F04438'], ['--amber', '#F5A524'], ['--cyan', '#38D4FF']];

const S = ({ title, children }) => <section className="block"><h2 className="h2" style={{ marginBottom: 16 }}>{title}</h2>{children}</section>;

export default function Design() {
  const toast = useToast();
  const [tab, setTab] = useState('a'), [dd, setDd] = useState('x'), [modal, setModal] = useState(false), [sw, setSw] = useState(true), [lb, setLb] = useState(null);
  return (
    <div className="container page-pad section">
      <h1 className="h1">Design system</h1>
      <p className="muted lead-sm">Dev-only review page. Tokens live in <code>src/styles/tokens.css</code>.</p>
      <S title="Colour tokens"><div className="swatches">{colors.map(([n, c]) => <div key={n} className="glass sw"><i style={{ background: `var(${n})` }} /><b>{n}</b><span className="muted small">{c}</span></div>)}</div></S>
      <S title="Typography"><div className="glass pad"><div style={{ fontSize: 'var(--h-hero)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Hero <span className="grad-text">headline</span></div><h2 className="h1">Heading 1</h2><h3>Heading 3</h3><p>Body copy in Inter 16px with 1.6 line height.</p></div></S>
      <S title="Buttons"><div className="row wrap" style={{ gap: 12 }}><Button arrow>Primary</Button><Button variant="glass">Glass</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button loading>Loading</Button><Button size="sm">Small</Button><Button size="lg" arrow>Large</Button></div></S>
      <S title="Pills & Logo"><div className="row wrap"><Pill>Default</Pill><Pill tone="up">Up</Pill><Pill tone="down">Down</Pill><Pill tone="new"><span className="dot" />New</Pill><Pill tone="amber">Amber</Pill><Logo size={44} showName /></div></S>
      <S title="Cards"><div className="post-grid"><GlassCard lift className="pad"><h3>GlassCard</h3><p className="muted">Hover to lift and glow.</p></GlassCard><GlassCard dark className="pad"><h3>Dark glass</h3><p>On a dark surface.</p></GlassCard><NewsCard post={{ title: 'News card preview', summary: 'Short update text sits here.', category: 'Market update', publishAt: new Date().toISOString(), pinned: true }} preview /></div></S>
      <S title="Price table"><PriceTable rows={sample} series={{ series: { '10s': [40, 41, 43, 42, 44, 45, 46], '12s': [52, 51, 50, 51, 50.5, 50, 49], '16s': [55, 55, 55, 55, 55, 55, 55] } }} /></S>
      <S title="Sparkline & number"><div className="glass pad"><Sparkline values={[3, 5, 4, 7, 6, 9, 8, 12]} /><div style={{ fontSize: 40, fontWeight: 700 }}><AnimatedNumber value={1250} from={0} /></div></div></S>
      <S title="Inputs"><div className="form-grid glass pad"><Input label="Text input" /><Input label="With error" error="This field is required" /><Select label="Select" options={['One', 'Two']} /><Textarea label="Textarea" hint="0 / 280" className="span2" /><Switch label="Switch" checked={sw} onChange={setSw} /></div></S>
      <S title="Tabs & Dropdown"><div className="row wrap" style={{ gap: 16 }}><Tabs label="demo" value={tab} onChange={setTab} tabs={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} /><Dropdown label="Pick" value={dd} onChange={setDd} options={[{ value: 'x', label: 'Option X' }, { value: 'y', label: 'Option Y' }]} /></div></S>
      <S title="Modal, toast, lightbox"><div className="row wrap" style={{ gap: 12 }}><Button variant="glass" onClick={() => setModal(true)}>Modal</Button><Button variant="glass" onClick={() => toast.success('Saved')}>Success toast</Button><Button variant="glass" onClick={() => toast.error('Something failed')}>Error toast</Button><Button variant="glass" onClick={() => setLb(0)}>Lightbox</Button></div>
        <Modal open={modal} onClose={() => setModal(false)} title="Glass modal" actions={<Button onClick={() => setModal(false)}>Done</Button>}><p className="muted">Focus is trapped, Esc closes.</p></Modal>
        <Lightbox index={lb} onIndex={setLb} onClose={() => setLb(null)} items={[{ src: '/favicon.svg', alt: 'Mark' }, { src: '/favicon.svg', alt: 'Mark 2' }]} /></S>
      <S title="Skeletons"><div className="post-grid"><SkeletonCard /><div className="glass pad" style={{ display: 'grid', gap: 10 }}><Skeleton h={20} /><Skeleton w="60%" h={20} /></div></div></S>
      <S title="Marquee & empty state"><Marquee gap={12}>{['Mill A', 'Mill B', 'Mill C', 'Mill D'].map((x) => <span key={x} className="glass mill">{x}</span>)}</Marquee><div className="glass" style={{ marginTop: 16 }}><EmptyState title="Empty state" text="Friendly message with an action." /></div></S>
      <S title="DataTable"><DataTable rows={[{ a: 1, b: 'x' }]} columns={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]} /></S>
      <Reveal><p className="muted"><Icon name="check" /> Reveal, PageTransition, TopLoader and Splash are used app-wide.</p></Reveal>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Button, GlassCard, Icon } from '../../ui/index.js';
import { memberApi } from '../../lib/api.js';

const IDEAS = ['Which yarn counts moved the most today?', 'Show the 30 day trend of the 30s count', 'How is CAI different from yesterday?'];
const MAX = 2000;

/** "Ask RTF": answers only from the latest published lists. The last 10 turns are kept in the browser. */
export default function AskPanel() {
  const [turns, setTurns] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [turns, busy]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    const history = turns.filter((t) => !t.error).slice(-10).map(({ role, content }) => ({ role, content }));
    setTurns((t) => [...t, { role: 'user', content: message }]);
    setQ(''); setBusy(true);
    try {
      const { reply } = await memberApi.post('/ai/chat', { message, history }, { silent: true });
      setTurns((t) => [...t, { role: 'assistant', content: reply }]);
    } catch (x) {
      setTurns((t) => [...t, { role: 'assistant', content: x.message, error: true }]);
    } finally { setBusy(false); }
  };

  return (
    <GlassCard className="pad ask">
      <div className="row" style={{ gap: 10 }}><span className="auth-ic sm"><Icon name="sparkle" size={18} /></span><h3 className="h3">Ask RTF</h3></div>
      <p className="muted small">Questions about today's yarn and CAI rates. Answers come only from the published lists.</p>
      <div className="ask-log" role="log" aria-live="polite">
        {!turns.length && <div className="ask-ideas">{IDEAS.map((i) => <button key={i} type="button" className="qchip" onClick={() => send(i)}>{i}</button>)}</div>}
        {turns.map((t, i) => <p key={i} className={`bubble ${t.role} ${t.error ? 'err' : ''}`}>{t.content}</p>)}
        {busy && <p className="bubble assistant muted">Thinking…</p>}
        <span ref={end} />
      </div>
      <form className="ask-form" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <label className="sr" htmlFor="ask-q">Your question</label>
        <input id="ask-q" value={q} maxLength={MAX} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a count or a trend" autoComplete="off" />
        <Button type="submit" loading={busy} disabled={!q.trim()}>Ask</Button>
      </form>
    </GlassCard>
  );
}

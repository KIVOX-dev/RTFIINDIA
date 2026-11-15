import { Component, lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Splash, TopLoader, PageTransition, ToastProvider, Skeleton } from './ui/index.js';
import { Announce, Header, Footer, ErrorCard } from './components/Shell.jsx';
import { SettingsProvider, useSettings } from './lib/hooks.jsx';
import Home from './pages/Home.jsx';

const Prices = lazy(() => import('./pages/Prices.jsx'));
const News = lazy(() => import('./pages/News.jsx'));
const Content = lazy(() => import('./pages/Content.jsx'));
const Design = lazy(() => import('./pages/Design.jsx'));
const Admin = lazy(() => import('./admin/Admin.jsx'));
const pick = (k) => lazy(() => import('./pages/Content.jsx').then((m) => ({ default: m[k] })));
const About = pick('About'), Gallery = pick('Gallery'), Awards = pick('Awards'), Reference = pick('Reference'), Contact = pick('Contact'), NotFound = pick('NotFound');
const pickN = (k) => lazy(() => import('./pages/News.jsx').then((m) => ({ default: m[k] })));
const NewsPage = pickN('NewsPage'), BlogPage = pickN('BlogPage'), EventsPage = pickN('EventsPage'), PostDetail = pickN('PostDetail');

class Boundary extends Component {
  state = { e: null };
  static getDerivedStateFromError(e) { return { e }; }
  componentDidUpdate(p) { if (p.k !== this.props.k && this.state.e) this.setState({ e: null }); }
  render() { return this.state.e ? <ErrorCard onRetry={() => this.setState({ e: null })} /> : this.props.children; }
}

const Fallback = () => <div className="container page-pad section" role="status" aria-label="Loading"><Skeleton h={44} w="50%" /><Skeleton h={260} r={24} style={{ marginTop: 24 }} /></div>;

function Public() {
  const { ready, err, reload } = useSettings();
  return (
    <>
      <Splash ready={ready} />
      <a className="skip" href="#main">Skip to content</a>
      <div className="bg-blobs" aria-hidden="true"><i /><i /></div>
      <Announce />
      <Header />
      <main id="main">
        {err ? <ErrorCard title="We could not reach the server" onRetry={reload} /> : (
          <PageTransition>
            {(loc) => (
              <Boundary k={loc.pathname}><Suspense fallback={<Fallback />}>
                <Routes location={loc}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/prices" element={<Navigate to="/prices/yarn" replace />} />
                  <Route path="/prices/:type" element={<Prices />} />
                  <Route path="/reference" element={<Reference />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:slug" element={<PostDetail kind="news" />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<PostDetail kind="blog" />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:slug" element={<PostDetail kind="event" />} />
                  <Route path="/awards" element={<Awards />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/members/grey-yarn" element={<Contact grey />} />
                  <Route path="/contact" element={<Contact />} />
                  {import.meta.env.DEV && <Route path="/design" element={<Design />} />}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense></Boundary>
            )}
          </PageTransition>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const loc = useLocation();
  const admin = loc.pathname.startsWith('/admin');
  return (
    <LazyMotion features={domAnimation}>
      <ToastProvider>
        <TopLoader />
        <SettingsProvider>
          {admin ? <Suspense fallback={<Fallback />}><Admin /></Suspense> : <Public />}
        </SettingsProvider>
      </ToastProvider>
    </LazyMotion>
  );
}
export { Content, News, Prices };

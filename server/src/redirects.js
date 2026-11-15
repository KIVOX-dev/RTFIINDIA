// Old Wix URL -> new route. Served as permanent 301s.
// Note: old "/news" held the Yarn Price List; the new "/news" is the news stream, so it is not redirected.
export const redirects = {
  '/about-us': '/about',
  '/news-1': '/news',
  '/copy-of-rtf-awards-2022-1': '/awards?year=2025',
  '/copy-of-rtf-awards-2022': '/awards?year=2024',
  '/projects-6': '/awards?year=2022',
  '/price-lists': '/prices',
  '/cai-spot-rate': '/prices/cai',
  '/copy-of-contact': '/members/grey-yarn',
};

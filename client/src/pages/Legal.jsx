import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings, useSeo } from '../lib/hooks.jsx';
import { useConsent } from '../lib/consent.jsx';

/*
 * Legal pages. The wording follows what this site actually does (member registration, contact form,
 * the "Ask RTF" AI assistant, tokens kept in the browser, the footer map). It is a thorough starting
 * text, not legal advice: have a lawyer review it before relying on it, and keep it in step with the
 * site if features change.
 */
const UPDATED = '23 November 2026';

/** A section's body is a list of blocks: a string is a paragraph, { ul } a bullet list, { table } a table. */
function Block({ b }) {
  if (typeof b === 'string') return <p>{b}</p>;
  if (b.ul) return <ul>{b.ul.map((t) => <li key={t}>{t}</li>)}</ul>;
  if (b.table) {
    return (
      <div className="lg-table" role="region" tabIndex={0} aria-label={b.label || 'Table'}>
        <table>
          <thead><tr>{b.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{b.table.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} data-label={b.table.head[i]}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  return null;
}

function LegalPage({ eyebrow, title, intro, photo, sections, children }) {
  const { s } = useSettings();
  const c = s.contact || {};
  const [active, setActive] = useState(sections[0].id);
  const consent = useConsent();

  // highlight the section being read
  useEffect(() => {
    const els = sections.map((x) => document.getElementById(x.id)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !els.length) return undefined;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: '-110px 0px -65% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <div className="container page-pad section">
      <header className="page-hero">
        <img src={`/photos/${photo}.webp`} alt="" aria-hidden="true" />
        <div className="page-hero-in">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="h1">{title}</h1>
          <p className="lead-sm">{intro}</p>
        </div>
      </header>

      <div className="lg-wrap">
        <aside className="lg-toc" aria-label="On this page">
          <details open>
            <summary>On this page</summary>
            <ol>{sections.map((x, i) => <li key={x.id}><a href={`#${x.id}`} className={active === x.id ? 'on' : ''}><span>{String(i + 1).padStart(2, '0')}</span>{x.title}</a></li>)}</ol>
          </details>
          <nav className="lg-other" aria-label="Other policies">
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
            <button type="button" onClick={consent.openSettings}>Cookie settings</button>
          </nav>
        </aside>

        <article className="lg-body">
          <p className="lg-meta">Last updated: <b>{UPDATED}</b></p>
          {children}
          {sections.map((x, i) => (
            <section key={x.id} id={x.id} className="lg-sec">
              <h2><span>{String(i + 1).padStart(2, '0')}</span>{x.title}</h2>
              {x.body.map((b, k) => <Block key={k} b={b} />)}
            </section>
          ))}
          <section className="lg-contact">
            <h2>Contact us</h2>
            <p>Questions about this page, or a request about your information? Write to the RTF office.</p>
            <ul>
              <li><b>{s.site?.name || 'Recycle Textile Federation'}</b></li>
              {c.address && <li style={{ whiteSpace: 'pre-line' }}>{c.address}</li>}
              {c.email && <li><a href={`mailto:${c.email}`}>{c.email}</a></li>}
              {c.phone && <li><a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></li>}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}

const NAME = 'Recycle Textile Federation';

/* ------------------------------------------------------------------ Terms */
const TERMS = [
  { id: 'acceptance', title: 'Acceptance of these terms', body: [
    `These Terms & Conditions ("Terms") govern your use of this website and everything on it (the "Site"), which is operated by ${NAME} ("RTF", "we", "us", "our"), an association of Open End spinning mills based in Coimbatore, Tamil Nadu, India.`,
    'By using the Site, creating a member account, or sending us a message through it, you agree to these Terms and to our Privacy Policy and Cookie Policy. If you do not agree, please do not use the Site.',
    'You must be at least 18 years old, and able to enter a binding contract, to register as a member. If you register on behalf of a mill or firm, you confirm that you are authorised to do so.',
  ] },
  { id: 'about', title: 'What the Site is for', body: [
    'The Site shares information about RTF and its committee, publishes daily news, events and awards, and gives approved members access to the daily Yarn Price List and the CAI spot rates.',
    'Some parts of the Site are open to everyone: the home page, about page, news, blog, events, awards, gallery, reference charts and contact page. The daily Yarn and CAI rates are for registered and approved members only.',
  ] },
  { id: 'membership', title: 'Membership and your account', body: [
    'Membership of RTF through the Site is free. There is no fee for registering and no charge for any member benefit described on the Site.',
    { ul: [
      'You register with your name, email address, phone or WhatsApp number, mill or firm name, city and a password.',
      'The RTF office reviews each request and may approve, decline or ask for more information. Until a request is approved, rates are not shown.',
      'We may decide who is eligible. Membership is intended for Open End spinning mills and the people who work for them.',
      'The information you give us must be true and up to date. Please tell us if it changes.',
    ] },
    'We may suspend or close an account that gives false information, is shared with others, or breaks these Terms.',
  ] },
  { id: 'security', title: 'Keeping your account secure', body: [
    'You are responsible for your password and for everything done through your account. Choose a strong password, do not share it, and sign out on shared devices.',
    'Tell us straight away if you think someone else has used your account. We cannot be responsible for loss that results from you not keeping your details safe.',
  ] },
  { id: 'rates', title: 'Rates, prices and information', body: [
    'The Yarn Price List, the CAI spot rates, reference charts, news and other information on the Site are published by the RTF office for general information. They are prepared with care but are not guaranteed to be complete, current or error-free.',
    { ul: [
      'Rates can change during the day. A published rate is not an offer to buy or sell, and RTF is not a party to any deal between members or with anyone else.',
      'Nothing on the Site is financial, investment, legal or trading advice. Check rates with your own sources before you rely on them.',
      'Members may use the rates for their own business. You may not copy the lists in bulk, resell them, or publish them to non-members without our written permission.',
    ] },
  ] },
  { id: 'ai', title: 'The "Ask RTF" assistant', body: [
    'Approved members can use an AI assistant that answers questions using the latest published lists. It is a convenience, and it can make mistakes.',
    { ul: [
      'Answers are generated automatically and may be incomplete or wrong. Always check the published list itself before acting on an answer.',
      'Do not type passwords, bank or card details, or other sensitive personal information into the assistant.',
      'Your questions are sent to an AI service provider so that an answer can be produced. See the Privacy Policy for details.',
    ] },
  ] },
  { id: 'use', title: 'Acceptable use', body: [
    'You agree to use the Site lawfully and fairly. You must not:',
    { ul: [
      'break any law, or use the Site to cheat, defraud or mislead anyone;',
      'try to get into accounts, the admin area, servers or data that are not yours, or test the Site\'s security without our written permission;',
      'upload viruses or harmful code, overload the Site, or use bots, scrapers or other automated tools to collect content or rates;',
      'send spam, abusive, defamatory or unlawful messages through the contact form;',
      'pretend to be someone else, or misuse another person\'s name, photograph or details; or',
      'use the Site in any way that harms RTF, its members or other visitors.',
    ] },
  ] },
  { id: 'content', title: 'What you send us', body: [
    'When you send us a message or other content, you confirm that you have the right to do so and that it does not break the law or anyone else\'s rights.',
    'You allow us to use what you send only to deal with your request, to run the membership and to improve RTF\'s services. We do not publish your messages.',
  ] },
  { id: 'ip', title: 'Our content and intellectual property', body: [
    'The name and logo of RTF, the text, design, charts, photographs and other material on the Site belong to RTF or to the people who allowed us to use them, and are protected by law.',
    'You may view the Site, print or save pages for your own use, and share links to public pages. Any other use, including copying, adapting or republishing our material, needs our written permission.',
    'Some photographs on the Site are illustrations or stand-in images and may not show real mills, products or people. Photographs of committee members are used with their knowledge.',
  ] },
  { id: 'third', title: 'Third-party links and services', body: [
    'The Site may link to or show content from other services, such as WhatsApp, social media pages and Google Maps. We do not control them and are not responsible for their content, privacy practices or availability. Their own terms and policies apply when you use them.',
    'Third-party content such as the footer map is loaded only if you allow it in your cookie settings.',
  ] },
  { id: 'availability', title: 'Availability and changes to the Site', body: [
    'We try to keep the Site running but do not promise it will always be available, uninterrupted or free of errors. We may change, pause or withdraw any part of it, for example for maintenance, without notice.',
  ] },
  { id: 'warranty', title: 'No warranties', body: [
    'To the fullest extent the law allows, the Site and everything on it are provided "as is" and "as available", without warranties of any kind, whether express or implied, including fitness for a particular purpose, accuracy and non-infringement.',
  ] },
  { id: 'liability', title: 'Limit of our liability', body: [
    'To the fullest extent the law allows, RTF, its office bearers, committee members, staff and service providers are not liable for any indirect, incidental, special or consequential loss, or for loss of profit, business, goodwill or data, arising from your use of, or inability to use, the Site or from relying on any rate, price or information on it.',
    'Where liability cannot be excluded, it is limited to the extent the law permits. Nothing in these Terms limits liability that cannot lawfully be limited.',
  ] },
  { id: 'indemnity', title: 'Your responsibility', body: [
    'You agree to be responsible for any loss, claim or cost RTF suffers because you broke these Terms or misused the Site, to the extent the law allows.',
  ] },
  { id: 'termination', title: 'Suspension and ending your account', body: [
    'You can stop using the Site, or ask us to close your account, at any time by writing to the RTF office. We may suspend or end your access if you break these Terms or if we must do so by law.',
    'Sections that by their nature should continue, such as those on intellectual property, liability and governing law, continue after your account ends.',
  ] },
  { id: 'changes', title: 'Changes to these Terms', body: [
    'We may update these Terms from time to time. The date at the top of this page shows when they were last changed. If a change is significant we will give notice on the Site. Using the Site after a change means you accept the updated Terms.',
  ] },
  { id: 'law', title: 'Governing law and disputes', body: [
    'These Terms are governed by the laws of India. Subject to any rights you have under law, the courts at Coimbatore, Tamil Nadu have exclusive jurisdiction over any dispute about them or about the Site.',
    'We would like to hear a concern first. Please write to the RTF office so that we can try to sort it out informally.',
  ] },
  { id: 'general', title: 'General', body: [
    'If any part of these Terms is found to be unenforceable, the rest stays in force. If we do not enforce a right straight away, we have not given it up. These Terms, with the Privacy Policy and Cookie Policy, are the whole agreement between you and RTF about the Site.',
  ] },
];

/* ---------------------------------------------------------------- Privacy */
const PRIVACY = [
  { id: 'who', title: 'Who we are', body: [
    `This Privacy Policy explains how ${NAME} ("RTF", "we", "us") collects, uses, shares and protects personal information when you use this website. We decide why and how your information is used, so we are the "data fiduciary" under India's Digital Personal Data Protection Act, 2023 (the "DPDP Act").`,
    'This policy should be read together with our Cookie Policy and Terms & Conditions.',
  ] },
  { id: 'collect', title: 'Information we collect', body: [
    'We keep this to what the Site needs. It depends on how you use it:',
    { table: { label: 'Information we collect', head: ['When', 'What we collect'], rows: [
      ['You browse the Site', 'Technical details your browser sends: IP address, browser and device type, pages requested and the time. Our servers use these to deliver the Site and to guard against misuse.'],
      ['You register as a member', 'Name, email address, phone or WhatsApp number, mill or firm name, city, and a password. Your password is stored only as a one-way hash, so nobody at RTF can read it.'],
      ['You sign in', 'Your email and password to check them, and a sign-in token that is kept in your browser so you stay signed in.'],
      ['You use the contact form', 'Name, phone number, mill or firm name, your message, and the IP address it was sent from (to prevent spam and abuse).'],
      ['You use the "Ask RTF" assistant (members)', 'The questions you type and the last few messages of the conversation, so the assistant can answer in context.'],
      ['You choose your cookie settings', 'Your choice and the date you made it, stored in your browser.'],
      ['You are an RTF office bearer, zonal secretary or committee member', 'Your name, role, firm, photograph and, if you provide it, a professional profile link, shown on the Site.'],
    ] } },
    'We do not collect payment card details, because membership is free. We do not knowingly collect sensitive personal information, and we ask you not to send any through the contact form or the assistant.',
  ] },
  { id: 'use', title: 'How and why we use it', body: [
    { ul: [
      'To create and manage your member account, check your request and approve access to the daily rates.',
      'To show you the Yarn Price List and CAI spot rates, and to answer your questions through the assistant.',
      'To reply to your messages and to contact you about your membership, the WhatsApp group, notices and events.',
      'To keep the Site secure, prevent spam and fraud, limit abuse and fix faults.',
      'To publish information about RTF\'s committee and members.',
      'To meet legal duties and to protect RTF\'s rights.',
    ] },
    'We do not use your information for advertising, and we do not sell it.',
  ] },
  { id: 'basis', title: 'Your consent and other lawful grounds', body: [
    'We process your personal information on the basis of your consent, which you give when you register, send a message or choose your cookie settings, and for the "legitimate uses" the DPDP Act allows, such as responding to a request you made, meeting a legal obligation, or keeping the service safe.',
    'You may withdraw consent at any time (see Your rights). Withdrawing does not affect what we did before, and some features, such as member access to rates, may stop working without the information they need.',
  ] },
  { id: 'share', title: 'Who we share it with', body: [
    'We share information only where it is needed, and only with:',
    { ul: [
      'RTF\'s office bearers and staff who run the membership and answer messages;',
      'service providers who help us run the Site, such as hosting and database providers, who act on our instructions;',
      'an AI service provider, which receives the questions you type into the "Ask RTF" assistant, together with published rate data, so it can produce an answer;',
      'Google, if you choose to load the footer map (see the Cookie Policy); and',
      'the authorities or other people where the law requires it, or to protect rights, safety or the Site.',
    ] },
    'Your name, firm and phone number are not shown to other members. Committee and office-bearer details are shown on the Site as described above.',
  ] },
  { id: 'ai', title: 'The AI assistant', body: [
    'When you ask a question, the text of your question, up to the last few messages of the conversation, and the latest published rates are sent to an AI provider, which returns an answer. The provider may process this information on servers outside India.',
    'Please do not include personal, confidential or sensitive details in your questions. The last few turns of your conversation are also kept in your own browser so you can scroll back to them.',
  ] },
  { id: 'transfers', title: 'Transfers outside India', body: [
    'Some of our service providers, including the AI service and Google Maps, may handle information in other countries. Where we send personal information abroad, we do so as the DPDP Act allows, and we choose providers who protect information appropriately.',
  ] },
  { id: 'retention', title: 'How long we keep it', body: [
    'We keep personal information only for as long as it is needed for the purpose it was collected for, or as the law requires, and then delete or anonymise it.',
    { ul: [
      'Member account details are kept while your account is active and for a reasonable time afterwards, for example to deal with a dispute or a legal duty.',
      'Contact messages are kept for as long as we need to deal with them and to keep a record of our dealings.',
      'Server logs are kept for a limited period for security and fault-finding.',
      'Your cookie choice stays in your browser until you clear it or change it.',
    ] },
    'You can ask us to delete your information sooner (see Your rights).',
  ] },
  { id: 'security', title: 'How we protect it', body: [
    'We use reasonable safeguards for the size of our service: passwords are stored as one-way hashes; access to the admin area is protected by sign-in; requests to the Site are rate-limited to slow abuse; and we limit who can see member information.',
    'No system is perfectly secure. If a personal data breach happens that affects you, we will tell you and the Data Protection Board of India as the law requires.',
  ] },
  { id: 'rights', title: 'Your rights', body: [
    'Under the DPDP Act you have the right to:',
    { ul: [
      'get a summary of the personal information we hold about you and how we use it;',
      'ask us to correct, complete or update it;',
      'ask us to erase it, unless we must keep it by law;',
      'withdraw your consent at any time;',
      'have your concerns dealt with through our grievance process; and',
      'nominate another person to exercise these rights for you if you die or cannot act for yourself.',
    ] },
    'To use any of these rights, write to the RTF office using the details at the bottom of this page. We may ask you to prove who you are first. If you are not satisfied with our reply, you may complain to the Data Protection Board of India.',
  ] },
  { id: 'children', title: 'Children', body: [
    'The Site is for businesses and is not meant for anyone under 18. We do not knowingly collect information from children. If you think a child has given us information, please tell us and we will delete it.',
  ] },
  { id: 'cookies', title: 'Cookies and similar storage', body: [
    'We use a small amount of browser storage to keep you signed in and to remember your choices. You decide whether optional storage and third-party content are allowed. See our Cookie Policy for the full list, and use "Cookie settings" at any time to change your choice.',
  ] },
  { id: 'links', title: 'Other websites', body: [
    'The Site links to other websites, such as WhatsApp and social media pages. We are not responsible for their privacy practices. Please read their policies.',
  ] },
  { id: 'changes', title: 'Changes to this policy', body: [
    'We may update this policy as the Site or the law changes. The date at the top shows the latest version. If a change matters to you, such as a new use of your information, we will tell you on the Site or by message.',
  ] },
  { id: 'grievance', title: 'Grievances and contact', body: [
    'If you have a question or complaint about how your personal information is handled, write to the RTF office using the details at the bottom of this page, and mark your message "Privacy". We will acknowledge it promptly and aim to resolve it within a reasonable time.',
  ] },
];

/* ---------------------------------------------------------------- Cookies */
const COOKIES = [
  { id: 'what', title: 'What cookies and similar storage are', body: [
    'Cookies are small files that a website stores on your device. Similar technologies, such as "local storage" and "session storage", do the same job inside your browser. They let a site remember who you are and what you chose.',
    'This Site mainly uses browser storage rather than traditional cookies. In this policy we call all of these "cookies".',
  ] },
  { id: 'why', title: 'Why we use them', body: [
    { ul: [
      'To keep approved members signed in while they use the Site.',
      'To remember your cookie choice so we do not ask every time.',
      'To remember small preferences, if you allow it.',
      'To show content from other services, such as a map, if you allow it.',
    ] },
    'We do not use advertising cookies, and at the time of writing we do not use analytics or tracking tools that follow you across other websites.',
  ] },
  { id: 'types', title: 'The kinds we use', body: [
    { table: { label: 'Kinds of cookies', head: ['Kind', 'What it does', 'Can you switch it off?'], rows: [
      ['Strictly necessary', 'Needed for the Site to work: keeping you signed in, remembering your cookie choice and basic security.', 'No. These are always on. You can block them in your browser, but sign-in and parts of the Site will then stop working.'],
      ['Preferences', 'Remembers small choices, such as not repeating the welcome animation in the same visit.', 'Yes. They are off until you allow them.'],
      ['Third-party content', 'Lets other services show their content on our pages, such as the Google Map in the footer. The service may set its own cookies.', 'Yes. They are off until you allow them. The map is not loaded until you choose to load it.'],
    ] } },
  ] },
  { id: 'list', title: 'The full list', body: [
    { table: { label: 'Cookies and storage items on this Site', head: ['Name', 'Where', 'Kind', 'Purpose', 'How long'], rows: [
      ['rtf_consent', 'Browser local storage', 'Necessary', 'Stores the cookie choice you made, and the date.', 'Until you clear your browser data or change your choice'],
      ['rtf_user_token', 'Browser local storage', 'Necessary', 'Keeps an approved member signed in.', 'Until you sign out or the token expires'],
      ['rtf_admin_token', 'Browser local storage', 'Necessary', 'Keeps RTF office staff signed in to the admin area. Only used by staff.', 'Until sign-out or expiry'],
      ['rtf_splash', 'Browser session storage', 'Preferences', 'Remembers that you have seen the welcome animation so it is not repeated in the same visit.', 'Until you close the tab or window'],
      ['Google Maps (google.com)', 'Cookies set by Google', 'Third-party', 'Shows the map of our address in the footer. Only loaded if you allow it. Google sets its own cookies; see Google\'s policies.', 'Set by Google'],
    ] } },
    'The names above are the exact names used in your browser, so you can find and delete them if you wish.',
  ] },
  { id: 'consent', title: 'Your choices', body: [
    'When you first visit, a pop-up asks you to Accept all, Reject optional, or Customise. You can change your mind at any time using "Cookie settings" in the footer of every page.',
    { ul: [
      '"Accept all" turns on preferences and third-party content.',
      '"Reject optional" leaves only the strictly necessary items.',
      '"Customise" lets you choose each kind.',
    ] },
    'If you reject optional cookies the Site still works. The map is replaced with a link that opens it on Google Maps.',
  ] },
  { id: 'browser', title: 'Controlling cookies in your browser', body: [
    'Most browsers let you see, block and delete cookies and site data. Look for "Cookies" or "Site data" in your browser\'s privacy or security settings. Clearing site data signs you out and removes your cookie choice, so the pop-up will appear again.',
  ] },
  { id: 'third', title: 'Third-party services', body: [
    'If you allow third-party content, the provider (for example Google for the map) can see your IP address and device details when it loads, and may set cookies under its own policy. We do not control those cookies. We recommend that you read the provider\'s privacy policy.',
  ] },
  { id: 'changes', title: 'Changes to this policy', body: [
    'We will update this policy if we add or change how we use cookies. If a change needs your consent, we will ask for it again.',
  ] },
];

export function Terms() {
  useSeo('Terms & Conditions', `The terms for using the ${NAME} website and member area.`);
  return <LegalPage eyebrow="Legal" title="Terms & Conditions" photo="mill-hall-green" sections={TERMS}
    intro="The rules for using this website and the member area, in plain language. Please read them before you register." />;
}

export function Privacy() {
  useSeo('Privacy Policy', `How ${NAME} collects, uses and protects your personal information.`);
  return <LegalPage eyebrow="Legal" title="Privacy Policy" photo="cotton-team" sections={PRIVACY}
    intro="What we collect, why, who sees it, how long we keep it, and what you can do about it." />;
}

export function Cookies() {
  useSeo('Cookie Policy', `The cookies and browser storage used on the ${NAME} website.`);
  return <LegalPage eyebrow="Legal" title="Cookie Policy" photo="cotton-aerial" sections={COOKIES}
    intro="The few cookies and browser storage items this site uses, and how you stay in control of them." />;
}

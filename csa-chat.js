/* ============================================================
   CSA Helper - "Ziggy"
   A guided, multiple-choice helper for csa.global, with a
   free-text fallback. Self-contained: injects its own styles +
   markup, no deps, no backend.
   All classes namespaced zig-* and scoped to #zig-root so
   nothing touches the hand-coded site design.
   Copy is drawn from the live site's own language.
   ============================================================ */
(function () {
  "use strict";
  if (window.__ziggyLoaded) return;
  window.__ziggyLoaded = true;

  var NAME = "Ziggy"; // <- change here to rename the helper everywhere
  var FEEDBACK_KEY = ""; // Web3Forms access key for a DEDICATED feedback form. Empty = log locally only.
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---- tiny safe localStorage helpers ---- */
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { if (v === null) window.sessionStorage.removeItem(k); else window.sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---- thumbs feedback: logs locally; optionally posts to a dedicated Web3Forms form ---- */
  function sendFeedback(rating, question, answer, reason) {
    var data = { rating: rating, reason: reason || "", question: question || "(opened a menu option)", answer: (answer || "").slice(0, 300), page: location.pathname, when: new Date().toISOString() };
    try { var arr = JSON.parse(lsGet("zig_fb") || "[]"); arr.push(data); lsSet("zig_fb", JSON.stringify(arr.slice(-80))); } catch (e) {}
    if (!FEEDBACK_KEY) return;
    try {
      fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: FEEDBACK_KEY, subject: "Ziggy feedback: " + rating, from_name: "Ziggy helper",
          rating: data.rating, reason: data.reason, question: data.question, answer: data.answer, page: data.page })
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---- friendly labels for the "welcome back" resume ---- */
  var LABEL = {
    services: "what we do", s_brand: "Brand Communications", s_talent: "Talent",
    s_events: "Events & Activations", s_napkin: "Napkin Sport", work: "working with us",
    w_talent: "booking talent", w_project: "a project brief", wire: "The Wire",
    w_chart: "Chart Pulse", w_sub: "subscribing", human: "getting in touch",
    ci: "Cultural Index", ci_talent: "Cultural Index", ci_casting: "Cultural Index",
    ci_campaigns: "Cultural Index", ci_contact: "Cultural Index"
  };

  /* ---- free-text keyword routing (guided underneath) ---- */
  var MATCH = [
    { re: /\b(cultural\s*index|culturalindex|\bci\b|marketplace|market\s*place|creator\s*(index|score|scoring)|influencer\s*(index|pricing))\b/i, go: "ci" },
    { re: /\b(naomi|djimon|bonang|sho\s*madjozi|madjozi|zinhle|dj\s*zinhle|aka|akon|moonchild|zakes)\b/i, go: "w_talent" },
    { re: /\b(book|booking|talent|celebrit|ambassador|roster|artist|host|hosting|mc|emcee|model|influenc)\b/i, go: "w_talent" },
    { re: /\b(pr|press|media|brand|comms|communicat|campaign|publicity|earned)\b/i, go: "s_brand" },
    { re: /\b(event|activation|festival|pop.?up|experience|launch|party|stage)\b/i, go: "s_events" },
    { re: /\b(napkin|sport|athlete|tournament|football|soccer|rugby)\b/i, go: "s_napkin" },
    { re: /\b(wire|newsletter|subscribe|insight|intelligence)\b/i, go: "wire" },
    { re: /\b(chart|pulse|stream|top\s*10|most.?streamed)\b/i, go: "w_chart" },
    { re: /\b(contact|e.?mail|call|reach|speak|talk|human|person|enquir|inquir|quote|cost|price|budget|brief)\b/i, go: "human" },
    { re: /\b(work|project|hire|help|service|what do you|who are you)\b/i, go: "services" }
  ];

  /* ---- answers Ziggy gives directly (CSA's own words). Checked before routing. ---- */
  var FAQ = [
    {
      re: /\b(what(’|')?s csa|what is csa|what (do|does) (you|u|csa)|what do you offer|what services|who (are you|is csa)|tell me about (csa|you|yourself)|about csa|what you do|what u do|what do you guys)\b/i,
      node: {
        bot: "CSA is one of Africa's leading and award-winning entertainment, marketing and talent agencies. We connect brands with the storytellers shaping the next chapter of culture, producing powerful, authentic content and delivering it to the people they influence most, building culture and brand relevance in the process. We don't follow culture, we shape it.",
        opts: [{ t: "See what we do", go: "services" }, { t: "Work with us", go: "work" }],
        foot: null
      }
    },
    {
      re: /\b(office|offices|head\s*office|\bhq\b|headquarter|hubs?|located|location|based|cit(?:y|ies)|where are you|where is csa|where'?s csa|where are your|where do you)\b/i,
      node: {
        bot: "We work out of six cities: Cape Town, our Africa HQ, plus Johannesburg, Los Angeles, our Americas HQ, London, Lagos and Paris.",
        opts: [{ t: "Get in touch", go: "human" }, { t: "What we do", go: "services" }],
        foot: null
      }
    },
    {
      re: /\b(job|jobs|career|careers|hiring|vacanc|intern|join (the|your)|work for (you|csa))\b/i,
      node: {
        bot: "We're always glad to hear from great people. The quickest way in is a short note to the team, tell us who you are and what you do.",
        opts: [{ t: "Open the contact form", link: "/index.html#contact" }, { t: "Email us instead", email: true }],
        foot: null
      }
    }
  ];

  /* ---- small talk: Ziggy with a pulse. Checked first. opts filled in after TREE. ---- */
  var SMALL = [
    { re: /^(hi+|hey+|hello+|yo|hiya|howzit|heita|sup|good (morning|afternoon|evening|day))[\s!.,’'?]*$/i,
      bot: "Hey. I'm Ziggy, your guide to CSA. Ask me what we do, who we represent, or how to work with us." },
    { re: /^(thanks|thank you|thank u|thanks so much|thanks ziggy|cheers|ty|much appreciated|appreciate it|dankie)[\s!.,’'?]*$/i,
      bot: "Anytime. Want me to point you anywhere else?" },
    { re: /\b(how are you|how'?s it going|how are things|how you doing|you doing (ok|well|good)|you good)\b/i,
      bot: "Running smooth, thanks for asking. Ready when you are, what can I help you find on CSA?" },
    { re: /\b(your name|are you (a |an )?(bot|robot|ai|a\.i\.|real|human|person)|are you human|what are you)\b/i,
      bot: "I'm Ziggy, CSA's guide. Not a human, but I know my way around the site. Where can I take you?" },
    { re: /^(bye|goodbye|see you|see ya|later|that'?s all|that is all|nothing|no thanks|nope|i'?m good)[\s!.,’'?]*$/i,
      bot: "Cheers. I'll be right here in the corner whenever you need a hand." }
  ];

  /* ---- clearly outside CSA's lane: deflect with character, then steer back. ---- */
  var OUT = {
    re: /\b(time|o'?clock|what day|today|tomorrow|weather|temperature|forecast|rain|snow|joke|sing|rap me|poem|capital of|president|who won|meaning of life|calculate|how old are you|your age|where do you live|\d+\s*[\+\-\*xX]\s*\d+)\b/i,
    bot: "Ha, that one's outside my lane. I stick to CSA, what we do, our talent, The Wire and getting you to the right person. Tap Quick options below and I'll point you there."
  };

  /* ---- The question tree (CSA voice, spaced hyphens, no em dashes) ---- */
  var TREE = {
    start: {
      bot: "Hi, I'm " + NAME + ". Ask me anything about CSA, or tap Quick options below for the shortcuts.",
      opts: [
        { t: "What we do", go: "services" },
        { t: "Work with us", go: "work" },
        { t: "The Wire", go: "wire" },
        { t: "Cultural Index", go: "ci" },
        { t: "Get in touch", go: "human" }
      ]
    },

    services: {
      bot: "We work across four areas. Which one can I show you?",
      think: "One sec",
      opts: [
        { t: "Brand Communications", go: "s_brand" },
        { t: "Talent", go: "s_talent" },
        { t: "Events & Activations", go: "s_events" },
        { t: "Napkin Sport", go: "s_napkin" }
      ],
      foot: "start"
    },
    s_brand: {
      bot: "PR, earned media and creative campaigns built for cultural traction. We don't follow culture, we shape it.",
      opts: [
        { t: "See Brand Communications", link: "/brand-communications.html" },
        { t: "Brief us on a project", go: "w_project" }
      ],
      foot: "back:services"
    },
    s_talent: {
      bot: "Roster management, casting and long-term ambassador partnerships, connecting the world's biggest names with the brands that matter.",
      opts: [
        { t: "See the Talent roster", link: "/talent.html" },
        { t: "I want to book talent", go: "w_talent" }
      ],
      foot: "back:services"
    },
    s_events: {
      bot: "Festivals, pop-ups and money-can't-buy moments, staged where culture actually happens.",
      opts: [
        { t: "See Events & Activations", link: "/events-activations.html" },
        { t: "Brief us on a project", go: "w_project" }
      ],
      foot: "back:services"
    },
    s_napkin: {
      bot: "Napkin Sport is our sport arm: athlete strategy, property activation and tournament partnerships. It has its own home online.",
      opts: [
        { t: "Visit Napkin Sport", link: "https://napkin-sport.com/#top" }
      ],
      foot: "back:services"
    },

    work: {
      bot: "Love that. What's the brief?",
      opts: [
        { t: "Book talent for a campaign or event", go: "w_talent" },
        { t: "Brief us on a brand, PR or events project", go: "w_project" },
        { t: "Something else", go: "human" }
      ],
      foot: "start"
    },
    w_talent: {
      bot: "We represent and book world-class talent, from Naomi Campbell and Djimon Hounsou to Bonang Matheba, Sho Madjozi and DJ Zinhle. Tell us who you have in mind and we'll make the introduction.",
      think: "Pulling the roster",
      cards: {
        kind: "faces", link: "/talent.html",
        items: [
          { img: "/roster/naomi-campbell.jpg", name: "Naomi Campbell" },
          { img: "/roster/djimon-hounsou.jpg", name: "Djimon Hounsou" },
          { img: "/roster/bonang-matheba.jpg", name: "Bonang Matheba" },
          { img: "/roster/sho-madjozi.jpg", name: "Sho Madjozi" },
          { img: "/roster/dj-zinhle.jpg", name: "DJ Zinhle" }
        ]
      },
      opts: [
        { t: "Browse the roster", link: "/talent.html" },
        { t: "Start your enquiry", link: "/index.html#contact" }
      ],
      foot: "start"
    },
    w_project: {
      bot: "Perfect. Tell us the brand, the scope and the timing, and the right lead will come straight back to you.",
      opts: [
        { t: "See our work", link: "/index.html#work" },
        { t: "Start your enquiry", link: "/index.html#contact" }
      ],
      foot: "start"
    },

    wire: {
      bot: "The Wire is CSA's culture intelligence newsletter, helping marketing leaders understand what's shifting in culture, and what to do about it before everyone else. What are you after?",
      think: "Getting The Wire",
      opts: [
        { t: "Read the latest", link: "/the-wire.html" },
        { t: "This month's Chart Pulse", go: "w_chart" },
        { t: "Subscribe", go: "w_sub" }
      ],
      foot: "start"
    },
    w_chart: {
      bot: "Chart Pulse is our monthly read on South Africa's most-streamed artists, scored across streaming, airplay and discovery. One number, the whole picture.",
      cards: {
        kind: "cover", link: "/the-wire.html",
        img: "/chart-pulse/sa-2026-10.jpg", title: "Chart Pulse", sub: "This month's Top 10"
      },
      opts: [
        { t: "See this month's Top 10", link: "/the-wire.html" }
      ],
      foot: "back:wire"
    },
    w_sub: {
      bot: "Get The Wire in your inbox, and the latest issue is always on the site.",
      opts: [
        { t: "Open The Wire", link: "/the-wire.html" }
      ],
      foot: "back:wire"
    },

    human: {
      bot: "Happy to put you in front of a real person. The quickest way is the contact form, it lands straight with the team.",
      opts: [
        { t: "Open the contact form", link: "/index.html#contact" },
        { t: "Email us instead", email: true }
      ],
      foot: "start"
    },

    ci: {
      bot: "Cultural Index is CSA's cultural intelligence platform for creator selection, pricing and campaign performance. It scores talent on cultural relevance rather than follower count, prices campaigns against real value, and tracks delivery once creators are live. What would you like to know?",
      think: "One sec",
      opts: [
        { t: "What does it measure?", go: "ci_talent" },
        { t: "How does pricing work?", go: "ci_casting" },
        { t: "Tracking live campaigns", go: "ci_campaigns" },
        { t: "Who do I contact about it?", go: "ci_contact" }
      ],
      foot: "start"
    },
    ci_talent: {
      bot: "At its heart is a living score of cultural relevance, not a follower count. Talent is scored across industry standing, reach, engagement, media power, talkability, brand readiness and momentum, informed by social, streaming, press and search data. Profiles update as new information arrives, so you see both their cultural weight and how fast they are moving.",
      opts: [
        { t: "How does pricing work?", go: "ci_casting" },
        { t: "Who do I contact about it?", go: "ci_contact" }
      ],
      foot: "back:ci"
    },
    ci_casting: {
      bot: "Casting turns cultural intelligence into a commercial decision. We assess audience fit and brand safety, then weigh asking fees against projected value, so brands can pick the right partners and qualify the ROI before committing budget.",
      opts: [
        { t: "Tracking live campaigns", go: "ci_campaigns" },
        { t: "Who do I contact about it?", go: "ci_contact" }
      ],
      foot: "back:ci"
    },
    ci_campaigns: {
      bot: "Once a campaign is live, we track contracted delivery and spot the content that is actually performing. Learnings on formats, writing style and audience response feed back in to improve the work, keeping it authentic to the creator and aligned to the brand.",
      opts: [
        { t: "What does it measure?", go: "ci_talent" },
        { t: "Who do I contact about it?", go: "ci_contact" }
      ],
      foot: "back:ci"
    },
    ci_contact: {
      bot: "Cultural Index is a CSA platform, and the team can give you a proper walkthrough. The quickest way in is the contact form, or email us and mention Cultural Index.",
      opts: [
        { t: "Open the contact form", link: "/index.html#contact" },
        { t: "Email us instead", email: true }
      ],
      foot: "back:ci"
    }
  };

  /* ---- top-level shortcuts shown in the collapsible tray ---- */
  var QUICK = [
    { t: "What we do", go: "services" },
    { t: "Work with us", go: "work" },
    { t: "The Wire", go: "wire" },
    { t: "Cultural Index", go: "ci" },
    { t: "Get in touch", go: "human" }
  ];

  var GRAIN = "data:image/svg+xml;base64," + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
  );

  /* ---- Styles (scoped to #zig-root, reuse the site's own CSS tokens) ---- */
  var CSS = `
  /* keep the site's custom cursor above Ziggy so it never disappears behind her */
  .cursor,.cursor-dot{z-index:10002}
  #zig-launch{position:fixed;z-index:9998;right:max(20px,env(safe-area-inset-right,0px));bottom:max(20px,env(safe-area-inset-bottom,0px));
    display:flex;align-items:center;gap:10px;cursor:pointer;border:none;
    background:var(--accent,#FFA10C);color:var(--on-accent,#0A0A0A);
    border-radius:999px;padding:13px 19px 13px 15px;font-weight:600;font-size:14.5px;
    font-family:var(--font-body,"Geist",system-ui,sans-serif);
    box-shadow:0 14px 40px rgba(0,0,0,.45),0 2px 0 rgba(255,255,255,.1) inset;
    transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .25s,box-shadow .35s}
  #zig-launch:hover{transform:translateY(-2px);box-shadow:0 18px 50px rgba(255,161,12,.4),0 2px 0 rgba(255,255,255,.12) inset}
  #zig-launch svg{flex:none}
  #zig-launch .zig-bolt{animation:zigFloat 3.4s ease-in-out infinite}
  #zig-launch.zig-hide{opacity:0;transform:translateY(12px) scale(.9);pointer-events:none}
  #zig-launch .zig-pulse{position:absolute;top:-3px;right:-3px;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid var(--accent,#FFA10C)}
  #zig-launch .zig-pulse::after{content:"";position:absolute;inset:-5px;border-radius:50%;border:2px solid #fff;opacity:.7;animation:zigRing 2.4s ease-out infinite}
  @keyframes zigRing{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.8);opacity:0}}
  @keyframes zigFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-1.5px) rotate(-4deg)}}

  #zig-nudge{position:fixed;z-index:9997;right:max(20px,env(safe-area-inset-right,0px));bottom:calc(max(20px,env(safe-area-inset-bottom,0px)) + 62px);
    max-width:230px;background:var(--bg-2,#161616);color:var(--text,#F5F1EA);
    border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:14px;border-bottom-right-radius:5px;
    padding:12px 34px 12px 14px;font-family:var(--font-body,"Geist",system-ui,sans-serif);font-size:13px;line-height:1.45;
    box-shadow:0 18px 50px rgba(0,0,0,.5);cursor:pointer;
    opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;transition:opacity .4s,transform .4s cubic-bezier(.16,1,.3,1)}
  #zig-nudge.zig-show{opacity:1;transform:none;pointer-events:auto}
  #zig-nudge b{color:var(--accent,#FFA10C);font-weight:700}
  #zig-nudge .zig-nx{position:absolute;top:6px;right:6px;background:none;border:none;color:var(--text-faint,rgba(245,241,234,.5));cursor:pointer;padding:3px;border-radius:6px;line-height:0}
  #zig-nudge .zig-nx:hover{background:var(--line,rgba(245,241,234,.1));color:var(--text,#F5F1EA)}

  #zig-panel{position:fixed;z-index:9999;display:flex;flex-direction:column;overflow:hidden;
    right:max(20px,env(safe-area-inset-right,0px));bottom:max(20px,env(safe-area-inset-bottom,0px));
    width:min(392px,calc(100vw - 32px));height:min(600px,calc(100dvh - 120px));
    background:var(--bg-1,#111);color:var(--text,#F5F1EA);
    border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:20px;
    box-shadow:0 30px 80px rgba(0,0,0,.6);
    transform:translateY(16px) scale(.97);opacity:0;pointer-events:none;
    transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .3s;transform-origin:bottom right;
    font-family:var(--font-body,"Geist",system-ui,sans-serif)}
  @supports((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
    #zig-panel{background:rgba(14,14,14,.82);-webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%)}}
  #zig-panel::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:6;
    background-image:url(${GRAIN});background-size:160px;opacity:.045;mix-blend-mode:overlay}
  #zig-panel.zig-open{transform:none;opacity:1;pointer-events:auto}
  @media(max-width:460px){#zig-panel{width:calc(100vw - 20px);height:calc(100dvh - 86px);right:10px}}

  #zig-root *{box-sizing:border-box}
  .zig-head{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:15px 13px 14px 15px;border-bottom:1px solid var(--line,rgba(245,241,234,.1));background:var(--bg-2,#161616)}
  .zig-ava{position:relative;width:40px;height:40px;border-radius:12px;background:var(--accent,#FFA10C);color:var(--on-accent,#0A0A0A);display:grid;place-items:center;flex:none;transition:transform .3s cubic-bezier(.16,1,.3,1)}
  .zig-ava svg{width:22px;height:22px}
  .zig-ava img{width:100%;height:100%;object-fit:contain;padding:7px 6px}
  .zig-ava.zig-think{animation:zigPop .9s ease-in-out infinite}
  @keyframes zigPop{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.08) rotate(-6deg)}}
  .zig-head h2{margin:0;font-family:var(--font-display,"Inter Tight",system-ui,sans-serif);font-size:16px;font-weight:800;letter-spacing:0;color:var(--text,#F5F1EA)}
  .zig-head p{margin:2px 0 0;font-size:11.5px;color:var(--text-dim,rgba(245,241,234,.62));display:flex;align-items:center;gap:6px}
  .zig-dot{width:7px;height:7px;border-radius:50%;background:#43d17a;box-shadow:0 0 0 3px rgba(67,209,122,.18)}
  .zig-tools{margin-left:auto;display:flex;align-items:center;gap:2px}
  .zig-ic{background:none;border:none;color:var(--text-dim,rgba(245,241,234,.62));cursor:pointer;padding:6px;border-radius:8px;line-height:0}
  .zig-ic:hover{background:var(--line,rgba(245,241,234,.1));color:var(--text,#F5F1EA)}
  .zig-ic.zig-on{color:var(--accent,#FFA10C)}

  .zig-log{position:relative;z-index:2;flex:1;min-height:0;overflow-y:auto;padding:18px 15px 8px;display:flex;flex-direction:column;gap:11px;scroll-behavior:smooth}
  .zig-log>*{flex:none}
  .zig-log::-webkit-scrollbar{width:8px}.zig-log::-webkit-scrollbar-thumb{background:var(--line-strong,rgba(245,241,234,.22));border-radius:8px}
  .zig-msg{max-width:88%;font-size:13.8px;line-height:1.5;padding:11px 14px;border-radius:15px;animation:zigRise .4s cubic-bezier(.16,1,.3,1) both}
  .zig-msg.zig-bot{align-self:flex-start;background:var(--bg-2,#161616);border:1px solid var(--line,rgba(245,241,234,.1));border-bottom-left-radius:5px;color:var(--text,#F5F1EA)}
  .zig-msg.zig-me{align-self:flex-end;background:var(--accent,#FFA10C);color:var(--on-accent,#0A0A0A);font-weight:500;border-bottom-right-radius:5px}
  .zig-msg .zig-caret{display:inline-block;width:2px;height:1em;margin-left:1px;background:var(--accent,#FFA10C);vertical-align:-2px;animation:zigBlink .7s steps(1) infinite}
  @keyframes zigBlink{50%{opacity:0}}
  @keyframes zigRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .zig-typing{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;padding:11px 14px;background:var(--bg-2,#161616);border:1px solid var(--line,rgba(245,241,234,.1));border-radius:15px;border-bottom-left-radius:5px}
  .zig-typing .zig-tlabel{font-size:12px;color:var(--text-dim,rgba(245,241,234,.62))}
  .zig-typing .zig-dots{display:inline-flex;gap:4px}
  .zig-typing i{width:6px;height:6px;border-radius:50%;background:var(--text-faint,rgba(245,241,234,.38));animation:zigBob 1s infinite}
  .zig-typing i:nth-child(2){animation-delay:.15s}.zig-typing i:nth-child(3){animation-delay:.3s}
  @keyframes zigBob{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}

  .zig-dock{position:relative;z-index:2;display:flex;flex-direction:column;flex:none;max-height:46%;overflow-y:auto;overscroll-behavior:contain}
  .zig-opts{display:flex;flex-direction:column;gap:8px;padding:4px 15px 12px}
  .zig-opt{text-align:left;width:100%;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:500;color:var(--text,#F5F1EA);
    background:var(--bg-2,#161616);border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:12px;
    padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;
    transition:border-color .2s,background .2s,transform .15s;animation:zigRise .38s cubic-bezier(.16,1,.3,1) both}
  .zig-opt:hover{border-color:var(--accent,#FFA10C);background:var(--accent-soft,rgba(255,161,12,.14));transform:translateX(2px)}
  .zig-opt .zig-arr{color:var(--accent,#FFA10C);flex:none;opacity:.85}
  .zig-opt.zig-ghost{background:transparent;border-color:var(--line,rgba(245,241,234,.1));color:var(--text-dim,rgba(245,241,234,.62));font-weight:500}
  .zig-opt.zig-ghost:hover{color:var(--text,#F5F1EA);border-color:var(--line-strong,rgba(245,241,234,.22));background:var(--bg-2,#161616)}
  .zig-row{display:flex;gap:8px;padding:0 15px 13px}
  .zig-chips{display:flex;flex-wrap:wrap;gap:7px;padding:2px 15px 12px}
  .zig-chip{font-family:var(--font-mono,"Geist Mono",monospace);font-size:11px;letter-spacing:.02em;color:var(--text-dim,rgba(245,241,234,.62));
    border:1px solid var(--line,rgba(245,241,234,.1));border-radius:999px;padding:6px 11px;background:var(--bg-2,#161616)}

  .zig-log .zig-opts,.zig-log .zig-cards{padding:0}
  .zig-log .zig-cover{margin:0}
  .zig-inl{width:100%;animation:zigRise .38s cubic-bezier(.16,1,.3,1) both}
  .zig-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px 9px;padding:2px 15px 13px;animation:zigRise .4s cubic-bezier(.16,1,.3,1) both}
  .zig-cards::-webkit-scrollbar{display:none}
  .zig-face{min-width:0;width:100%;cursor:pointer;border:none;background:none;padding:0;font-family:inherit;text-align:left}
  .zig-face img{width:100%;height:auto;aspect-ratio:92/112;object-fit:cover;border-radius:12px;display:block;border:1px solid var(--line,rgba(245,241,234,.1));transition:transform .25s,border-color .25s;background:var(--bg-2,#161616)}
  .zig-face:hover img{transform:translateY(-3px);border-color:var(--accent,#FFA10C)}
  .zig-face span{display:block;margin-top:7px;font-size:11px;line-height:1.25;overflow-wrap:anywhere;color:var(--text-dim,rgba(245,241,234,.62))}
  .zig-cover{display:block;margin:2px 15px 13px;cursor:pointer;border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:14px;overflow:hidden;background:var(--bg-2,#161616);text-decoration:none;animation:zigRise .4s cubic-bezier(.16,1,.3,1) both;transition:border-color .25s}
  .zig-cover:hover{border-color:var(--accent,#FFA10C)}
  .zig-cover img{width:100%;height:150px;object-fit:cover;display:block}
  .zig-cover .zig-cmeta{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 14px}
  .zig-cover .zig-cmeta b{font-family:var(--font-display,"Inter Tight",system-ui,sans-serif);font-size:14px;color:var(--text,#F5F1EA)}
  .zig-cover .zig-cmeta i{font-style:normal;font-size:11.5px;color:var(--text-dim,rgba(245,241,234,.62))}

  .zig-email{margin:0 15px 13px;padding:13px 14px;background:var(--bg-2,#161616);border:1px dashed var(--line-strong,rgba(245,241,234,.22));border-radius:12px;display:flex;align-items:center;gap:10px}
  .zig-email code{font-family:var(--font-mono,"Geist Mono",monospace);font-size:13px;color:var(--accent,#FFA10C);flex:1;word-break:break-all}
  .zig-copy{background:var(--line,rgba(245,241,234,.1));border:none;color:var(--text,#F5F1EA);cursor:pointer;font-family:inherit;font-weight:600;font-size:12px;padding:7px 12px;border-radius:8px;flex:none}
  .zig-copy:hover{background:var(--line-strong,rgba(245,241,234,.22))}.zig-copy.zig-done{background:var(--accent,#FFA10C);color:var(--on-accent,#0A0A0A)}

  .zig-fb{display:flex;align-items:center;gap:2px;align-self:flex-start;margin:-5px 0 1px 3px;animation:zigRise .3s cubic-bezier(.16,1,.3,1) both}
  .zig-fb-btn{background:none;border:none;cursor:pointer;color:var(--text-faint,rgba(245,241,234,.38));padding:4px;border-radius:7px;line-height:0;transition:color .2s,background .2s,transform .12s}
  .zig-fb-btn:hover{color:var(--text,#F5F1EA);background:var(--line,rgba(245,241,234,.1))}
  .zig-fb-btn:active{transform:scale(.86)}
  .zig-fb-btn.zig-on.zig-up{color:#43d17a}
  .zig-fb-btn.zig-on.zig-down{color:#ff6b6b}
  .zig-fb.zig-done .zig-fb-btn:not(.zig-on){opacity:.32;pointer-events:none}
  .zig-fb-thanks{font-size:11px;color:var(--text-faint,rgba(245,241,234,.38));margin-left:4px;font-family:var(--font-body,"Geist",system-ui,sans-serif)}
  .zig-fb-reason{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;margin:1px 0 3px 3px}
  .zig-fb-chip{cursor:pointer;font-family:var(--font-mono,"Geist Mono",monospace);font-size:10.5px;letter-spacing:.02em;color:var(--text-dim,rgba(245,241,234,.62));background:var(--bg-2,#161616);border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:999px;padding:5px 11px;transition:border-color .2s,color .2s}
  .zig-fb-chip:hover{border-color:#ff6b6b;color:var(--text,#F5F1EA)}

  .zig-case{width:100%;flex:none;margin:1px 0 2px;border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:14px;overflow:hidden;background:var(--bg-2,#161616);animation:zigRise .4s cubic-bezier(.16,1,.3,1) both}
  .zig-case-fig{position:relative;line-height:0}
  .zig-case-fig img{width:100%;height:132px;object-fit:cover;display:block}
  .zig-case-cap{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 11px;line-height:1.18;
    background:linear-gradient(to top,rgba(8,8,8,.93),rgba(8,8,8,.45) 55%,transparent)}
  .zig-case-cap .zig-kick{display:block;font-family:var(--font-mono,"Geist Mono",monospace);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent,#FFA10C);margin-bottom:4px}
  .zig-case-cap b{font-family:var(--font-display,"Inter Tight",system-ui,sans-serif);font-weight:800;font-size:15.5px;color:#fff;letter-spacing:-.01em}
  .zig-rlabel{font-family:var(--font-mono,"Geist Mono",monospace);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent,#FFA10C);padding:12px 14px 0}
  .zig-stats{display:flex;flex-wrap:wrap;gap:8px;padding:9px 14px 13px}
  .zig-stat{flex:1 1 calc(50% - 8px);min-width:104px;background:var(--bg-1,#111);border:1px solid var(--line,rgba(245,241,234,.1));border-radius:10px;padding:11px 12px}
  .zig-stat b{display:block;font-family:var(--font-display,"Inter Tight",system-ui,sans-serif);font-size:20px;font-weight:800;line-height:1.05;color:var(--text,#F5F1EA)}
  .zig-stat span{display:block;margin-top:3px;font-size:10.5px;letter-spacing:.02em;color:var(--text-dim,rgba(245,241,234,.62))}

  .zig-brief{width:100%;flex:none;margin:1px 0 2px;background:var(--bg-2,#161616);border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:14px;padding:3px 14px 5px;animation:zigRise .4s cubic-bezier(.16,1,.3,1) both}
  .zig-brief-row{padding:11px 0;border-bottom:1px solid var(--line,rgba(245,241,234,.1))}
  .zig-brief-row:last-child{border-bottom:none}
  .zig-brief-l{font-family:var(--font-mono,"Geist Mono",monospace);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent,#FFA10C);margin-bottom:5px}
  .zig-brief-t{margin:0;font-size:13px;line-height:1.5;color:var(--text,#F5F1EA)}

  .zig-mic{flex:none;width:40px;border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:11px;cursor:pointer;background:var(--bg-1,#111);color:var(--text-dim,rgba(245,241,234,.62));display:grid;place-items:center;transition:color .2s,border-color .2s,transform .15s}
  .zig-mic:hover{color:var(--text,#F5F1EA);border-color:var(--accent,#FFA10C)}
  .zig-mic:active{transform:scale(.92)}
  .zig-mic.zig-live{color:var(--on-accent,#0A0A0A);background:var(--accent,#FFA10C);border-color:var(--accent,#FFA10C);animation:zigMic 1.1s ease-in-out infinite}
  @keyframes zigMic{0%,100%{box-shadow:0 0 0 0 rgba(255,161,12,.5)}50%{box-shadow:0 0 0 7px rgba(255,161,12,0)}}

  .zig-quick{position:relative;z-index:7;border-top:1px solid var(--line,rgba(245,241,234,.1));background:var(--bg-2,#161616)}
  .zig-handle{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;
    background:none;border:none;padding:9px 12px;font-family:var(--font-mono,"Geist Mono",monospace);
    font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim,rgba(245,241,234,.62));transition:color .2s}
  .zig-handle:hover{color:var(--text,#F5F1EA)}
  .zig-handle svg{transition:transform .3s cubic-bezier(.16,1,.3,1)}
  .zig-handle.zig-open svg{transform:rotate(180deg)}
  .zig-handle.zig-hint{animation:zigNudgePulse 2s ease-in-out 3}
  @keyframes zigNudgePulse{0%,100%{color:var(--text-dim,rgba(245,241,234,.62))}50%{color:var(--accent,#FFA10C)}}
  .zig-tray{position:absolute;left:0;right:0;bottom:100%;display:flex;flex-wrap:wrap;gap:7px;
    padding:13px 12px;max-height:230px;overflow-y:auto;background:var(--bg-2,#161616);
    border-top:1px solid var(--line,rgba(245,241,234,.1));box-shadow:0 -18px 36px rgba(0,0,0,.5);
    animation:zigTrayUp .3s cubic-bezier(.16,1,.3,1) both}
  .zig-tray[hidden]{display:none}
  @keyframes zigTrayUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .zig-qp{cursor:pointer;font-family:var(--font-body,"Geist",system-ui,sans-serif);font-size:12.5px;font-weight:500;color:var(--text,#F5F1EA);
    background:var(--bg-1,#111);border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:999px;padding:8px 14px;
    transition:border-color .2s,background .2s,transform .15s;animation:zigRise .32s cubic-bezier(.16,1,.3,1) both}
  .zig-qp:hover{border-color:var(--accent,#FFA10C);background:var(--accent-soft,rgba(255,161,12,.14));transform:translateY(-1px)}

  .zig-form{position:relative;z-index:2;display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line,rgba(245,241,234,.1));background:var(--bg-2,#161616)}
  .zig-form input{flex:1;min-width:0;background:var(--bg-1,#111);border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:11px;
    color:var(--text,#F5F1EA);font-family:inherit;font-size:13.5px;padding:10px 13px;outline:none;transition:border-color .2s}
  .zig-form input::placeholder{color:var(--text-faint,rgba(245,241,234,.38))}
  .zig-form input:focus{border-color:var(--accent,#FFA10C)}
  .zig-send{flex:none;width:40px;border:none;border-radius:11px;cursor:pointer;background:var(--accent,#FFA10C);color:var(--on-accent,#0A0A0A);display:grid;place-items:center;transition:opacity .2s,transform .15s}
  .zig-send:hover{transform:translateY(-1px)}
  .zig-send:disabled{opacity:.4;cursor:default;transform:none}

  /* ---- brief builder UI (inside the panel) ---- */
  .zig-step{align-self:flex-start;margin:4px 0 -5px 3px;font-family:var(--font-mono,"Geist Mono",monospace);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent,#FFA10C)}
  .zig-pick{display:flex;flex-wrap:wrap;gap:6px;padding:0 15px 8px}
  .zig-pk{cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:var(--text-dim,rgba(245,241,234,.62));background:var(--bg-1,#111);
    border:1px solid var(--line-strong,rgba(245,241,234,.22));border-radius:999px;padding:6px 11px;transition:border-color .2s,background .2s,color .2s;animation:zigRise .32s cubic-bezier(.16,1,.3,1) both}
  .zig-pk:hover{border-color:var(--accent,#FFA10C);color:var(--text,#F5F1EA)}
  .zig-pk[aria-pressed="true"]{background:var(--accent,#FFA10C);border-color:var(--accent,#FFA10C);color:var(--on-accent,#0A0A0A)}
  .zig-go:disabled{opacity:.45;cursor:default;transform:none}
  .zig-go:disabled:hover{border-color:var(--line-strong,rgba(245,241,234,.22));background:var(--bg-2,#161616);transform:none}

  /* ---- Ziggy out in the page: quiet text links, nothing louder than the page around it ---- */
  .zig-link{display:inline-flex;align-items:center;gap:8px;background:none;border:0;padding:4px 0;margin:0;cursor:pointer;color:inherit;opacity:.62;
    font-family:var(--font-body,"Geist",system-ui,sans-serif);font-size:13px;line-height:1.4;text-align:left;text-decoration:none;transition:opacity .2s}
  .zig-link::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent,#FFA10C)}
  .zig-link:hover{opacity:1}
  .zig-link:hover{text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
  .zig-link:focus-visible{outline:2px solid var(--accent,#FFA10C);outline-offset:3px;opacity:1}
  .zig-formhelp{align-self:flex-start;margin-top:-4px}
  .zig-strip-wrap{display:flex;justify-content:center}
  .zig-filled{border-color:var(--accent,#FFA10C)!important;transition:border-color .4s}
  .zig-dot-a{flex:none;display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent,#FFA10C)}
  .zig-ideahint{display:flex;align-items:baseline;gap:10px;max-width:640px;margin:12px auto 0;text-align:left;font-family:var(--font-body,"Geist",system-ui,sans-serif);
    font-size:13px;line-height:1.5;color:var(--text-faint,rgba(245,241,234,.45));opacity:0;transition:opacity .35s}
  .zig-ideahint.zig-show{opacity:1}
  .zig-ideahint b{color:var(--text-dim,rgba(245,241,234,.62));font-weight:500}
  .zig-ideahint a,.zig-ideahint button{background:none;border:none;padding:0;cursor:pointer;font:inherit;color:var(--text-dim,rgba(245,241,234,.62));text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(245,241,234,.25)}
  .zig-ideahint a:hover,.zig-ideahint button:hover{color:var(--text,#F5F1EA)}
  .talent-card[data-zig]{cursor:pointer}
  #zig-sel{position:fixed;z-index:9996;display:flex;align-items:center;gap:7px;padding:5px 10px;border-radius:999px;cursor:pointer;
    background:#161616;color:rgba(245,241,234,.8);border:1px solid rgba(245,241,234,.16);box-shadow:0 8px 24px rgba(0,0,0,.35);
    font-family:var(--font-body,"Geist",system-ui,sans-serif);font-size:11.5px;font-weight:500;opacity:0;transform:translateY(4px);pointer-events:none;transition:opacity .18s,transform .18s}
  #zig-sel:hover{color:#F5F1EA}
  #zig-sel.zig-show{opacity:1;transform:none;pointer-events:auto}
  @media(prefers-reduced-motion:reduce){#zig-root *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `;

  var ARR_LINK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  var ARR_GO = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>';
  var BOLT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H11l-1 8L19.5 10H13l0-8z" fill="currentColor" stroke="none"/></svg>';
  var THUMB_UP = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
  var THUMB_DOWN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>';
  var MIC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>';
  var SND_ON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>';
  var SND_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m23 9-6 6M17 9l6 6"/></svg>';

  function build() {
    var style = document.createElement("style");
    style.id = "zig-style";
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "zig-root";
    root.innerHTML =
      '<button id="zig-launch" aria-label="Open the CSA helper">' +
        '<span class="zig-pulse"></span>' +
        '<span class="zig-bolt"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.1A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg></span>' +
        'Need a hand?' +
      '</button>' +
      '<div id="zig-nudge" role="button" tabindex="0">' +
        '<button class="zig-nx" aria-label="Dismiss"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '<span class="zig-ntext">Hi, I\'m <b>' + NAME + '</b>. Looking for something? I can point you the right way.</span>' +
      '</div>' +
      '<section id="zig-panel" aria-live="polite" aria-label="' + NAME + ', the CSA helper">' +
        '<div class="zig-head">' +
          '<div class="zig-ava" id="zig-ava" aria-hidden="true"><img src="/brand/CSA_Script_Logo_Black.png" alt="CSA"></div>' +
          '<div><h2>' + NAME + '</h2><p><span class="zig-dot"></span> Your guide to CSA</p></div>' +
          '<div class="zig-tools">' +
            '<button class="zig-ic" id="zig-new" aria-label="New chat" title="New chat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>' +
            '<button class="zig-ic" id="zig-sound" aria-label="Toggle sound" title="Sound"></button>' +
            '<button class="zig-ic" id="zig-close" aria-label="Close helper"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="zig-log" id="zig-log"></div>' +
        '<div class="zig-dock" id="zig-dock"></div>' +
        '<div class="zig-quick">' +
          '<button class="zig-handle" id="zig-handle" type="button" aria-expanded="false" aria-controls="zig-tray">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>' +
            'Quick options' +
          '</button>' +
          '<div class="zig-tray" id="zig-tray" hidden></div>' +
        '</div>' +
        '<form class="zig-form" id="zig-form" autocomplete="off">' +
          '<input id="zig-input" type="text" placeholder="Ask me anything..." aria-label="Ask ' + NAME + ' a question" maxlength="140">' +
          '<button class="zig-send" type="submit" id="zig-send" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11 12 6l5 5M12 6v13"/></svg></button>' +
        '</form>' +
      '</section>';
    document.body.appendChild(root);

    var log = root.querySelector("#zig-log");
    var dock = root.querySelector("#zig-dock");
    var panel = root.querySelector("#zig-panel");
    var launch = root.querySelector("#zig-launch");
    var nudge = root.querySelector("#zig-nudge");
    var ava = root.querySelector("#zig-ava");
    var form = root.querySelector("#zig-form");
    var input = root.querySelector("#zig-input");
    var sendBtn = root.querySelector("#zig-send");
    var sndBtn = root.querySelector("#zig-sound");

    var started = false, opened = false, busy = false, nudged = false, lastUserMsg = "";
    var awaiting = null, DEF_PH = "Ask me anything...", LOGO = "/brand/CSA_Script_Logo_Black.png";

    /* ---- live site data (real case studies, built into /ziggy-data.json) ---- */
    var DATA = null;
    function loadData() {
      if (DATA) return Promise.resolve(DATA);
      return fetch("/ziggy-data.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { DATA = j; return j; })
        .catch(function () { return null; });
    }
    function normStr(s) { return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
    var STOP = {};
    ("hey hi hello ziggy please give get got me my mine us the and for our your you yours with from into this that these those what which was were are can could would should their they them its result results campaign campaigns case cases study studies stats numbers number metric metrics data portfolio work working some any examples example performance outcome outcomes breakdown more all pull show showme tell about want need see know how did does run ran about around just like").split(" ").forEach(function (w) { STOP[w] = 1; });
    function findCase(q) {
      if (!DATA || !DATA.caseStudies) return null;
      var nq = normStr(q), keys = {};
      nq.split(" ").forEach(function (w) { if (w.length > 2 && !STOP[w]) keys[w] = 1; });
      var ks = Object.keys(keys); if (!ks.length) return null;
      var best = null, bestScore = 0, bestM = 0;
      DATA.caseStudies.forEach(function (c) {
        var hay = normStr(c.title + " " + c.client), htok = {};
        hay.split(" ").forEach(function (w) { htok[w] = 1; });
        var m = 0, sc = 0;
        ks.forEach(function (w) { if (htok[w]) { m++; sc += 2; } else if (hay.indexOf(w) >= 0) { sc += 1; } });
        if (nq.length > 4 && (hay.indexOf(nq) >= 0 || nq.indexOf(normStr(c.title)) >= 0)) { sc += 3; if (m < 2) m = 2; }
        if (sc > bestScore) { bestScore = sc; bestM = m; best = c; }
      });
      return best ? { c: best, matched: bestM, score: bestScore } : null;
    }
    function showCase(c) {
      var area = (c.area || "").split("·")[0].trim();
      var who = (c.client && c.client.toLowerCase() !== c.title.toLowerCase())
        ? (", our " + (area ? area.toLowerCase() + " " : "") + "work for " + c.client)
        : (area ? ", a " + area.toLowerCase() + " campaign" : "");
      var brief = [];
      if (c.challenge) brief.push({ l: "The brief", t: c.challenge });
      if (c.idea) brief.push({ l: "The big idea", t: c.idea });
      if (c.execution) brief.push({ l: "What we did", t: c.execution });
      if (!brief.length && c.summary) brief.push({ l: "Overview", t: c.summary });
      var opts = [];
      if (c.stats && c.stats.length) opts.push({ t: "Show the results", results: c });
      opts.push({ t: "Read the full case study", link: c.url });
      opts.push({ t: "See more of our work", link: "/index.html#work" });
      render({ bot: c.title + who + ". Here's the breakdown.", brief: brief, opts: opts, foot: "start" });
    }
    function showResults(c) {
      var area = (c.area || "").split("·")[0].trim();
      var has = c.stats && c.stats.length;
      if (!has) {
        render({ bot: "The full numbers for " + c.title + " are in the case study, here's the link.",
          opts: [{ t: "Read the full case study", link: c.url }, { t: "See more of our work", link: "/index.html#work" }], foot: "start" });
        return;
      }
      render({
        bot: "Here are the headline results for " + c.title + ":",
        caseCard: { image: c.image, title: c.title, area: area, stats: c.stats },
        scrollCard: true,
        opts: [{ t: "Read the full case study", link: c.url }, { t: "See more of our work", link: "/index.html#work" }],
        foot: "start"
      });
    }
    function workPickerNode() {
      var top = ((DATA && DATA.caseStudies) || []).slice(0, 4);
      return {
        bot: "Sure. I can pull up any of our campaigns and give you the headline results right here. Name one, or start with a recent highlight.",
        opts: top.map(function (c) { return { t: c.title, show: c }; }).concat([{ t: "See all our work", link: "/index.html#work" }]),
        foot: "start"
      };
    }
    function buildBrief(sections) {
      var wrap = document.createElement("div"); wrap.className = "zig-brief";
      sections.forEach(function (s) {
        var row = document.createElement("div"); row.className = "zig-brief-row";
        var l = document.createElement("div"); l.className = "zig-brief-l"; l.textContent = s.l;
        var t = document.createElement("p"); t.className = "zig-brief-t"; t.textContent = s.t;
        row.appendChild(l); row.appendChild(t); wrap.appendChild(row);
      });
      return wrap;
    }
    function buildCaseCard(cc) {
      var wrap = document.createElement("div"); wrap.className = "zig-case";
      if (cc.image) {
        var fig = document.createElement("div"); fig.className = "zig-case-fig";
        var im = document.createElement("img"); im.src = cc.image; im.alt = cc.title || ""; im.loading = "eager"; fig.appendChild(im);
        var cap = document.createElement("div"); cap.className = "zig-case-cap";
        if (cc.area) { var k = document.createElement("span"); k.className = "zig-kick"; k.textContent = cc.area; cap.appendChild(k); }
        var tt = document.createElement("b"); tt.textContent = cc.title || ""; cap.appendChild(tt);
        fig.appendChild(cap); wrap.appendChild(fig);
      }
      if (cc.stats && cc.stats.length) {
        var lab = document.createElement("div"); lab.className = "zig-rlabel"; lab.textContent = "Results"; wrap.appendChild(lab);
        var grid = document.createElement("div"); grid.className = "zig-stats";
        cc.stats.forEach(function (s) {
          var cell = document.createElement("div"); cell.className = "zig-stat";
          var b = document.createElement("b"); b.textContent = s.value;
          var sp = document.createElement("span"); sp.textContent = s.label;
          cell.appendChild(b); cell.appendChild(sp); grid.appendChild(cell);
        });
        wrap.appendChild(grid);
      }
      return wrap;
    }
    var idleTimer = null, ac = null;
    var soundOn = lsGet("zig_sound") === "1";

    /* ---- sound ---- */
    function paintSound() { sndBtn.innerHTML = soundOn ? SND_ON : SND_OFF; sndBtn.classList.toggle("zig-on", soundOn); }
    paintSound();
    function blip(kind) {
      if (!soundOn) return;
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === "suspended") ac.resume();
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = kind === "send" ? 680 : 500;
        g.gain.value = 0.035; o.connect(g); g.connect(ac.destination);
        var t = ac.currentTime; o.start(t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13); o.stop(t + 0.14);
      } catch (e) {}
    }
    sndBtn.onclick = function () { soundOn = !soundOn; lsSet("zig_sound", soundOn ? "1" : "0"); paintSound(); if (soundOn) blip("send"); };

    /* ---- collapsible quick-options tray ---- */
    var handle = root.querySelector("#zig-handle");
    var tray = root.querySelector("#zig-tray");
    QUICK.forEach(function (o) {
      var b = document.createElement("button");
      b.className = "zig-qp"; b.type = "button"; b.textContent = o.t;
      b.onclick = function () { setTray(false); choose({ t: o.t, go: o.go }); };
      tray.appendChild(b);
    });
    function setTray(show) {
      tray.hidden = !show;
      handle.classList.toggle("zig-open", show);
      handle.setAttribute("aria-expanded", show ? "true" : "false");
      if (show) { handle.classList.remove("zig-hint"); blip("bot"); log.style.paddingBottom = (tray.offsetHeight + 10) + "px"; scroll(); }
      else { log.style.paddingBottom = ""; }
    }
    handle.onclick = function () { setTray(tray.hidden); };

    /* ---- voice input (browser-native, free; hidden where unsupported) ---- */
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      var mic = document.createElement("button");
      mic.type = "button"; mic.className = "zig-mic"; mic.setAttribute("aria-label", "Speak to " + NAME);
      mic.innerHTML = MIC;
      form.insertBefore(mic, input);
      var rec = null, listening = false, gotText = false;
      function stopListen() { listening = false; mic.classList.remove("zig-live"); }
      mic.onclick = function () {
        if (listening) { try { rec && rec.stop(); } catch (e) {} return; }
        try { rec = new SR(); } catch (e) { return; }
        try { rec.lang = navigator.language || "en-GB"; } catch (e) {}
        rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1; gotText = false;
        rec.onstart = function () { listening = true; gotText = false; mic.classList.add("zig-live"); input.placeholder = "Listening…"; try { input.focus(); } catch (e) {} };
        rec.onresult = function (e) {
          var txt = ""; for (var i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
          input.value = txt; if (txt.trim()) gotText = true;
        };
        rec.onerror = function (ev) {
          stopListen();
          input.placeholder = (ev && ev.error === "not-allowed") ? "Allow mic access to talk to " + NAME
            : (ev && ev.error === "no-speech") ? "Didn't catch that, try again" : "Ask me anything…";
        };
        rec.onend = function () {
          stopListen();
          if (input.placeholder.indexOf("Listening") === 0) input.placeholder = "Ask me anything…";
          var v = input.value.trim(); if (v && gotText) { input.value = ""; ask(v); }
        };
        try { rec.start(); } catch (e) { stopListen(); }
      };
    }

    /* ---- building blocks ---- */
    function scroll() { log.scrollTop = log.scrollHeight; }
    function clearDock() { dock.innerHTML = ""; var g = log.querySelectorAll(".zig-inl"); for (var i = 0; i < g.length; i++) g[i].remove(); }
    function follow(anchor) {
      if (!anchor || !anchor.isConnected) { scroll(); return; }
      var sb = log.style.scrollBehavior; log.style.scrollBehavior = "auto";
      log.scrollTop = log.scrollHeight;
      var lr = log.getBoundingClientRect(), r = anchor.getBoundingClientRect();
      if (r.top < lr.top + 10) log.scrollTop += r.top - lr.top - 10;
      log.style.scrollBehavior = sb;
    }
    function scrollToTop(el) { log.scrollTop += el.getBoundingClientRect().top - log.getBoundingClientRect().top - 12; }
    function bubble(text, who) {
      if (who === "me") lastUserMsg = text;
      var d = document.createElement("div");
      d.className = "zig-msg zig-" + who;
      d.textContent = text; log.appendChild(d); scroll(); return d;
    }

    function addFeedback(node) {
      var qtext = lastUserMsg, atext = node.bot;
      var row = document.createElement("div"); row.className = "zig-fb";
      function mk(kind) {
        var b = document.createElement("button"); b.className = "zig-fb-btn zig-" + kind; b.type = "button";
        b.setAttribute("aria-label", kind === "up" ? "Helpful" : "Not helpful");
        b.innerHTML = kind === "up" ? THUMB_UP : THUMB_DOWN; return b;
      }
      var up = mk("up"), down = mk("down");
      row.appendChild(up); row.appendChild(down); log.appendChild(row);
      function lock() { up.disabled = down.disabled = true; row.classList.add("zig-done"); }
      up.onclick = function () {
        up.classList.add("zig-on"); lock(); sendFeedback("up", qtext, atext, "");
        var t = document.createElement("span"); t.className = "zig-fb-thanks"; t.textContent = "Thanks"; row.appendChild(t); scroll();
      };
      down.onclick = function () {
        down.classList.add("zig-on"); lock();
        var r = document.createElement("div"); r.className = "zig-fb-reason"; var sent = false;
        function send(reason) {
          if (sent) return; sent = true; sendFeedback("down", qtext, atext, reason);
          r.innerHTML = ""; var t = document.createElement("span"); t.className = "zig-fb-thanks"; t.textContent = "Thanks, noted"; r.appendChild(t); scroll();
        }
        ["Not accurate", "Not helpful", "Wrong topic"].forEach(function (x) {
          var c = document.createElement("button"); c.className = "zig-fb-chip"; c.type = "button"; c.textContent = x; c.onclick = function () { send(x); }; r.appendChild(c);
        });
        log.appendChild(r); scroll();
        setTimeout(function () { send(""); }, 6000);
      };
    }
    function typing(label) {
      var t = document.createElement("div");
      t.className = "zig-typing";
      t.innerHTML = (label ? '<span class="zig-tlabel">' + label + '</span>' : "") +
        '<span class="zig-dots"><i></i><i></i><i></i></span>';
      log.appendChild(t); scroll(); return t;
    }
    function ghost(text, fn) {
      var b = document.createElement("button");
      b.className = "zig-opt zig-ghost"; b.textContent = text; b.onclick = fn; return b;
    }
    function stream(el, text, done, anchor) {
      anchor = anchor || el;
      if (REDUCE) { el.textContent = text; follow(anchor); done(); return; }
      var words = text.split(/(\s+)/), i = 0;
      var caret = document.createElement("span"); caret.className = "zig-caret";
      el.appendChild(caret);
      (function step() {
        if (i >= words.length) { if (caret.parentNode) caret.remove(); done(); return; }
        el.insertBefore(document.createTextNode(words[i++]), caret); follow(anchor);
        setTimeout(step, 16 + Math.random() * 30);
      })();
    }

    /* ---- render a node (TREE id, or a synthetic object) ---- */
    function render(ref) {
      var node = typeof ref === "string" ? TREE[ref] : ref;
      var id = typeof ref === "string" ? ref : null;
      if (id && id !== "start" && LABEL[id]) lsSet("zig_topic", id);
      busy = true; sendBtn.disabled = true; clearDock();
      ava.classList.add("zig-think");
      var t = typing(node.think);
      setTimeout(function () {
        t.remove();
        var stp = null;
        if (node.step) { stp = document.createElement("div"); stp.className = "zig-step"; stp.textContent = node.step; log.appendChild(stp); }
        var msg = document.createElement("div");
        msg.className = "zig-msg zig-bot"; log.appendChild(msg);
        blip("bot");
        stream(msg, node.bot, function () {
          ava.classList.remove("zig-think");
          var cardEl = null;
          if (node.brief) log.appendChild(buildBrief(node.brief));
          if (node.caseCard) { cardEl = buildCaseCard(node.caseCard); log.appendChild(cardEl); }
          if (id !== "start" && !node.greeting && !node.noFb) addFeedback(node);
          fillDock(node, id);
          busy = false; sendBtn.disabled = false;
          var anchor = stp || msg;
          follow(anchor);
          requestAnimationFrame(function () { follow(anchor); setTimeout(function () { follow(anchor); }, 450); });
        }, stp);
      }, node.think ? 560 : 440);
    }

    function fillDock(node, id) {
      if (id === "start" || node.hint) { handle.classList.add("zig-hint"); return; }
      var stagger = 0;
      if (node.chips) {
        var c = document.createElement("div"); c.className = "zig-chips";
        node.chips.forEach(function (x) {
          var s = document.createElement("span"); s.className = "zig-chip"; s.textContent = x; c.appendChild(s);
        });
        dock.appendChild(c);
      }
      /* content (faces, covers) lives in the conversation, not the button area */
      if (node.cards) log.appendChild(buildCards(node.cards));
      /* big button sets sit inside the conversation too, so the chat area never gets squeezed */
      var inline = !!(node.brief || node.caseCard || node.cards || (node.opts || []).length > 4);
      var host = dock;
      if (inline && (node.opts || []).length) { host = document.createElement("div"); host.className = "zig-inl"; log.appendChild(host); }
      if (node.multi) {
        var mw = document.createElement("div"); mw.className = "zig-pick"; var M = node.multi; M.sel = M.pre.slice();
        var go = document.createElement("button"); go.type = "button"; go.className = "zig-opt zig-go";
        var paintGo = function () { go.disabled = !M.sel.length; go.innerHTML = "<span>" + (M.sel.length ? "Continue with " + M.sel.length + " selected" : "Pick at least one") + "</span><span class=\"zig-arr\">" + ARR_GO + "</span>"; };
        M.opts.forEach(function (o) {
          var c = document.createElement("button"); c.type = "button"; c.className = "zig-pk"; c.textContent = o;
          c.setAttribute("aria-pressed", M.sel.indexOf(o) >= 0 ? "true" : "false");
          c.onclick = function () { var k = M.sel.indexOf(o); if (k >= 0) M.sel.splice(k, 1); else M.sel.push(o); c.setAttribute("aria-pressed", k >= 0 ? "false" : "true"); paintGo(); blip("bot"); };
          mw.appendChild(c);
        });
        go.onclick = function () { if (!M.sel.length || busy) return; bubble(M.sel.join(", "), "me"); blip("send"); clearDock(); awaiting = null; input.placeholder = DEF_PH; M.done(M.sel.slice()); };
        paintGo(); dock.appendChild(mw);
        var gw = document.createElement("div"); gw.className = "zig-opts"; gw.appendChild(go); dock.appendChild(gw);
      }
      var wrap = document.createElement("div"); wrap.className = "zig-opts";
      (node.opts || []).forEach(function (o) {
        var b = document.createElement("button"); b.className = "zig-opt";
        b.style.animationDelay = (stagger += 55) + "ms";
        var label = document.createElement("span"); label.textContent = o.t;
        var arr = document.createElement("span"); arr.className = "zig-arr"; arr.innerHTML = o.link ? ARR_LINK : ARR_GO;
        b.appendChild(label); b.appendChild(arr); b.onclick = function () { choose(o); }; wrap.appendChild(b);
      });
      host.appendChild(wrap);
      var foot = document.createElement("div"); foot.className = "zig-row";
      if (node.foot && node.foot.indexOf("back:") === 0) foot.appendChild(ghost("← Back", function () { render(node.foot.split(":")[1]); }));

      if (foot.children.length) dock.appendChild(foot);
      scroll();
    }

    function buildCards(cards) {
      if (cards.kind === "cover") {
        var a = document.createElement("a");
        a.className = "zig-cover"; a.href = cards.link;
        a.innerHTML = '<img src="' + cards.img + '" alt="" loading="lazy">' +
          '<div class="zig-cmeta"><b>' + cards.title + '</b><i>' + cards.sub + '</i></div>';
        a.onclick = function () { blip("send"); };
        return a;
      }
      var row = document.createElement("div"); row.className = "zig-cards";
      cards.items.forEach(function (it) {
        var b = document.createElement("button"); b.className = "zig-face"; b.type = "button";
        b.innerHTML = '<img src="' + it.img + '" alt="" loading="lazy"><span>' + it.name + '</span>';
        b.onclick = it.fn ? function () { if (!busy) it.fn(); } : function () { blip("send"); window.location.href = cards.link; };
        row.appendChild(b);
      });
      return row;
    }

    function choose(o) {
      if (busy) return;
      bubble(o.t, "me"); blip("send"); clearDock();
      awaiting = null; input.placeholder = DEF_PH;
      if (o.fn) { o.fn(); return; }
      if (o.article) { showArticle(o.article); return; }
      if (o.show) { showCase(o.show); return; }
      if (o.results) { showResults(o.results); return; }
      if (o.go) { render(o.go); return; }
      if (o.link) {
        if (o.link.indexOf("http") === 0) { window.open(o.link, "_blank", "noopener"); reoffer(); }
        else { window.location.href = o.link; }
        return;
      }
      if (o.email) emailCard();
    }

    function emailCard() {
      busy = true; sendBtn.disabled = true;
      var t = typing();
      setTimeout(function () {
        t.remove();
        var msg = document.createElement("div"); msg.className = "zig-msg zig-bot"; log.appendChild(msg); blip("bot");
        stream(msg, "Drop us a line and we'll come straight back to you:", function () {
          var card = document.createElement("div"); card.className = "zig-email";
          card.innerHTML = '<code>contact@csa.global</code>';
          var cp = document.createElement("button"); cp.className = "zig-copy"; cp.textContent = "Copy";
          cp.onclick = function () {
            if (navigator.clipboard) {
              navigator.clipboard.writeText("contact@csa.global").then(function () {
                cp.textContent = "Copied"; cp.classList.add("zig-done");
              }).catch(function () { cp.textContent = "Select it"; });
            } else { cp.textContent = "Select it"; }
          };
          card.appendChild(cp); dock.appendChild(card);
          var foot = document.createElement("div"); foot.className = "zig-row";
          foot.appendChild(ghost("↺ Start over", function () { restart(); }));
          dock.appendChild(foot); follow(msg); requestAnimationFrame(function () { follow(msg); });
          busy = false; sendBtn.disabled = false;
        });
      }, 420);
    }

    function reoffer() {
      var foot = document.createElement("div"); foot.className = "zig-row";
      foot.appendChild(ghost("↺ Start over", function () { restart(); }));
      foot.appendChild(ghost("Talk to the team", function () { bubble("Talk to the team", "me"); render("human"); }));
      dock.appendChild(foot); scroll();
    }

    /* ============================================================
       SITE-WIDE ZIGGY: page awareness, Wire + talent search,
       the brief builder, and helpers that live in the page itself.
       ============================================================ */
    function whenFree(fn) { if (!busy) fn(); else setTimeout(function () { whenFree(fn); }, 120); }
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function samePath(u) { var a = (u || "").replace(/index\.html$/, "").replace(/\/?$/, "/"), b = location.pathname.replace(/index\.html$/, "").replace(/\/?$/, "/"); return a === b; }

    /* ---- which page are we on? ---- */
    function pageKind() {
      var p = location.pathname.replace(/index\.html$/, "");
      if (document.querySelector(".e__code")) return "404";
      if (p === "/" || p === "") return "home";
      if (/^\/the-wire(\.html|\/)?$/.test(p)) return "wire";
      if (p.indexOf("/the-wire/") === 0) return "article";
      if (p.indexOf("/work/") === 0) return "case";
      if (/^\/talent(\.html|\/)?$/.test(p)) return "talent";
      if (/^\/about/.test(p)) return "about";
      if (/brand-communications/.test(p)) return "brand";
      if (/events-activations/.test(p)) return "events";
      if (/^\/labs/.test(p)) return "labs";
      return "other";
    }
    var CTXK = pageKind();
    function hereCase() { return ((DATA && DATA.caseStudies) || []).filter(function (c) { return samePath(c.url); })[0] || null; }
    function hereArticle() { return ((DATA && DATA.articles) || []).filter(function (a) { return samePath(a.url); })[0] || null; }
    function pageTitle() { var h = document.querySelector("h1"); return h ? h.textContent.replace(/\s+/g, " ").trim() : ""; }

    var CTXS = {
      home: { delay: 15000 },
      wire: {
        delay: 12000,
        nudge: "Looking for something specific on <b>The Wire</b>? Ask me, I'll find the read.",
        opener: function () {
          return { bot: "Looking for something specific? Name a topic, a brand or an artist and I'll find the right read on The Wire.",
            opts: [{ t: "The latest read", fn: function () { var a = (DATA && DATA.articles || [])[0]; if (a) showArticle(a); else render("wire"); } },
                   { t: "This month's Chart Pulse", go: "w_chart" }, { t: "Subscribe", go: "w_sub" }], foot: "start", noFb: true };
        }
      },
      article: {
        delay: 12000,
        nudge: "Want the short version of this read, or <b>more like it</b>? Ask me.",
        opener: function () {
          var a = hereArticle(); if (!a) return null;
          return { bot: "You're reading “" + a.title + "”. Want the short version, or more like it?",
            opts: [{ t: "The short version", fn: function () { render({ bot: a.summary || "It's all in the piece itself.", opts: [{ t: "More like this", fn: function () { showRelated(a); } }], foot: "start", noFb: true }); } },
                   { t: "More like this", fn: function () { showRelated(a); } },
                   { t: "Search The Wire", fn: wireSearchPrompt }], foot: "start", noFb: true };
        }
      },
      "case": {
        delay: 7000,
        nudge: "Want the <b>headline results</b> for this campaign? I can pull them up.",
        opener: function () {
          var c = hereCase(); if (!c) return null;
          var o = [];
          if (c.stats && c.stats.length) o.push({ t: "Show the results", results: c });
          o.push({ t: "Brief us on something similar", fn: function () { startBrief({ notes: "Something like " + c.title + "." }); } });
          o.push({ t: "See more of our work", fn: function () { render(workPickerNode()); } });
          return { bot: "You're looking at " + c.title + ". Want the headline results right here?", opts: o, foot: "start", noFb: true };
        }
      },
      talent: {
        delay: 14000,
        nudge: "Looking for <b>someone specific</b>? Ask me, I know the roster.",
        opener: function () {
          return { bot: "Looking for someone specific? Name them, or tell me what you need, a host, a musician, an actor, and I'll help you find the right fit.",
            opts: [{ t: "I want to book talent", fn: function () { startBrief({ need: "Book talent" }); } }, { t: "Show me the featured roster", go: "w_talent" }], foot: "start", noFb: true };
        }
      },
      about: {
        delay: 9000,
        nudge: "Want to know <b>where we work</b> or what we do? Ask away.",
        opener: function () {
          return { bot: "Want to know more about CSA? Ask me where we work, what we do, or how to get in touch.",
            opts: [{ t: "What does CSA do?", fn: function () { render(FAQ[0].node); } }, { t: "Where are your offices?", fn: function () { render(FAQ[1].node); } }, { t: "Get in touch", go: "human" }], foot: "start", noFb: true };
        }
      },
      brand: { delay: 9000, nudge: "Got a <b>Brand Communications</b> brief? I can help you put it together.", opener: function () { return svcOpener("Brand Communications", "A brand, PR or comms campaign"); } },
      events: { delay: 9000, nudge: "Planning an <b>event or activation</b>? I can help you put the brief together.", opener: function () { return svcOpener("Events & Activations", "An event or activation"); } },
      labs: {
        delay: 9000,
        nudge: "Got an idea for <b>the lab</b>? I can help you shape it.",
        opener: function () {
          return { bot: "Welcome to CSA Labs. Want to explore the Cultural Index, or shape an idea for the lab?",
            opts: [{ t: "Tell me about Cultural Index", go: "ci" }, { t: "Help me shape an idea", fn: function () { startBrief({ need: "A website, app or digital build" }); } }, { t: "Show me some campaign results", fn: function () { render(workPickerNode()); } }], foot: "start", noFb: true };
        }
      },
      "404": {
        delay: 1200, force: true,
        nudge: "That page isn't here. Tell me what you were after and <b>I'll find it</b>.",
        opener: function () {
          return { bot: "That page has moved or doesn't exist. Tell me what you were looking for and I'll find it, or pick a starting point.",
            opts: QUICK.map(function (q) { return { t: q.t, go: q.go }; }), foot: null, noFb: true };
        }
      },
      other: { delay: 9000 }
    };
    var CTX = CTXS[CTXK] || CTXS.other;
    function svcOpener(area, need) {
      return { bot: "Got a " + area + " brief? Answer a few quick questions and I'll write it up for the contact form.",
        opts: [{ t: "Build my brief", fn: function () { startBrief({ need: need }); } }, { t: "See some of our work", fn: function () { render(workPickerNode()); } }], foot: "start", noFb: true };
    }

    /* ---- The Wire: search, show, related ---- */
    var WSTOP = {}; ("article articles read reads wire piece pieces story stories written write writeup insight insights find looking something specific anything on in of a an to is it about any have has latest new").split(" ").forEach(function (w) { WSTOP[w] = 1; });
    function keyWords(q) { var o = []; normStr(q).split(" ").forEach(function (w) { if (w.length > 1 && !STOP[w] && !WSTOP[w] && o.indexOf(w) < 0) o.push(w); }); return o; }
    function findArticles(q) {
      var arts = (DATA && DATA.articles) || [], ks = keyWords(q); if (!ks.length) return [];
      var scored = arts.map(function (a) {
        var tt = " " + normStr(a.title) + " ", tg = " " + normStr((a.tags || []).join(" ") + " " + a.category) + " ", sm = " " + normStr(a.summary + " " + a.author) + " ", bd = " " + normStr(a.text || "") + " ", sc = 0;
        ks.forEach(function (w) {
          var stem = w.length > 4 ? w.replace(/(s|es|ing|ed)$/, "") : w;
          if (tt.indexOf(" " + w + " ") >= 0) sc += 4; else if (stem.length > 3 && tt.indexOf(" " + stem) >= 0) sc += 3;
          if (tg.indexOf(" " + w + " ") >= 0 || (stem.length > 3 && tg.indexOf(" " + stem) >= 0)) sc += 2;
          if (sm.indexOf(" " + w + " ") >= 0 || (stem.length > 3 && sm.indexOf(" " + stem) >= 0)) sc += 1;
          else if (w.length > 3 && bd.indexOf(" " + (stem.length > 3 ? stem : w)) >= 0) sc += 2;
        });
        return { a: a, sc: sc };
      }).filter(function (x) { return x.sc >= 2; });
      scored.sort(function (x, y) { return y.sc - x.sc; });
      return scored.slice(0, 3).map(function (x) { return x.a; });
    }
    function showArticles(list, q) {
      render({ bot: list.length === 1 ? "Here's the read I'd start with:" : "Here's what I found on The Wire:",
        opts: list.map(function (a) { return { t: a.title, article: a }; }).concat([{ t: "Browse all of The Wire", link: "/the-wire.html" }]), foot: "start" });
    }
    function showArticle(a) {
      var by = a.author ? ", by " + a.author : "";
      render({ bot: "“" + a.title + "”" + by + ". " + (a.summary || ""),
        opts: [{ t: "Read it", link: a.url }, { t: "More like this", fn: function () { showRelated(a); } }, { t: "Search for something else", fn: wireSearchPrompt }], foot: "start" });
    }
    function showRelated(a) {
      var arts = (DATA && DATA.articles) || [], mine = (a.tags || []).concat((a.category || "").split(/[·,]/)).map(function (x) { return normStr(x); }).filter(Boolean);
      var rel = arts.filter(function (b) { return b.url !== a.url; }).map(function (b) {
        var theirs = (b.tags || []).concat((b.category || "").split(/[·,]/)).map(function (x) { return normStr(x); }), sc = 0;
        mine.forEach(function (m) { if (theirs.indexOf(m) >= 0) sc++; }); return { b: b, sc: sc };
      }).filter(function (x) { return x.sc > 0; }).sort(function (x, y) { return y.sc - x.sc; }).slice(0, 3).map(function (x) { return x.b; });
      if (!rel.length) rel = arts.filter(function (b) { return b.url !== a.url; }).slice(0, 3);
      render({ bot: "If you liked that, try these:", opts: rel.map(function (b) { return { t: b.title, article: b }; }).concat([{ t: "Browse all of The Wire", link: "/the-wire.html" }]), foot: "start" });
    }
    function wireSearchPrompt() {
      var k = CTXK; CTXK = "wire";
      render({ bot: "Sure. What are you looking for? A topic, a brand or an artist.", opts: [], foot: null, noFb: true });
      awaiting = function (q) { CTXK = k; var r = findArticles(q); if (r.length) showArticles(r, q); else render({ bot: "I couldn't find a read on that yet. Try another topic, or browse everything on The Wire.", opts: [{ t: "Browse The Wire", link: "/the-wire.html" }, { t: "Try another search", fn: wireSearchPrompt }], foot: "start" }); };
      input.placeholder = "e.g. Gen Alpha";
    }

    /* ---- Talent: the cards on this page plus the CMS roster ---- */
    function talentList() {
      var out = [], seen = {};
      document.querySelectorAll(".talent-card").forEach(function (c) {
        var n = c.querySelector(".talent-card__name"), m = c.querySelector(".talent-card__meta span"), im = c.querySelector("img");
        if (!n) return; var name = n.textContent.trim(); if (seen[name.toLowerCase()]) return; seen[name.toLowerCase()] = 1;
        out.push({ name: name, discipline: m ? m.textContent.trim() : "", image: im ? im.getAttribute("src").replace(/^\.\//, "/") : "" });
      });
      ((DATA && DATA.talent) || []).forEach(function (t) { if (!seen[t.name.toLowerCase()]) { seen[t.name.toLowerCase()] = 1; out.push(t); } });
      return out;
    }
    var DISC = /\b(musician|music|singer|rapper|artist|dj|producer|actor|actress|presenter|host|mc|tv|model|designer|fashion|comedian|athlete|creator|influencer|photographer|songwriter)s?\b/i;
    function findTalent(q) {
      var list = talentList(), nq = " " + normStr(q) + " ", hit = null;
      list.forEach(function (t) {
        var nn = normStr(t.name), parts = nn.split(" ");
        if (nq.indexOf(" " + nn + " ") >= 0) hit = { one: t };
        else if (!hit && parts.length > 1 && parts[parts.length - 1].length > 3 && nq.indexOf(" " + parts[parts.length - 1] + " ") >= 0) hit = { one: t };
      });
      if (hit) return hit;
      var dm = q.match(DISC);
      if (dm && (CTXK === "talent" || /\b(book|need|find|looking|want|who|any|got|have)\b/i.test(q))) {
        var w = dm[1].toLowerCase(); if (w === "music") w = "music"; if (w === "actress") w = "act"; if (w === "tv" || w === "host" || w === "mc") w = "present";
        var many = list.filter(function (t) { return t.discipline.toLowerCase().indexOf(w.replace(/s$/, "")) >= 0; });
        if (many.length) return { many: many.slice(0, 8), word: dm[1] };
      }
      return null;
    }
    function talentAsk(t) {
      var first = t.name.split(" ")[0];
      render({ bot: t.name + (t.discipline ? " (" + t.discipline + ")" : "") + " is on the CSA roster. Want to work with " + first + "? I'll help you put the brief together.",
        cards: t.image ? { kind: "faces", link: "/talent.html", items: [{ img: t.image, name: t.name, fn: function () {} }] } : null,
        opts: [{ t: "Start a brief for " + t.name, fn: function () { startBrief({ need: "Book talent", talent: t.name }); } }, { t: "See the full roster", link: "/talent.html" }], foot: "start", noFb: true });
    }
    function showTalent(r) {
      if (r.one) { talentAsk(r.one); return; }
      render({ bot: "Here's who we've got for that. Tap anyone and I'll help you take it further.",
        cards: { kind: "faces", link: "/talent.html", items: r.many.map(function (t) { return { img: t.image, name: t.name, fn: function () { bubble(t.name, "me"); talentAsk(t); } }; }) },
        opts: [{ t: "Help me find the right fit", fn: function () { startBrief({ need: "Book talent" }); } }, { t: "See the full roster", link: "/talent.html" }], foot: "start" });
    }

    /* ---- the brief builder: a proper CSA brief, modelled on how our case studies are told
           (client, the challenge, objectives, audience, markets, services, timing, budget) ---- */
    var SERVICES = ["Brand Communications", "Talent", "Events & Activations", "Sport", "Digital & interactive", "Cultural Index", "Not sure yet"];
    var NEED_MAP = { "Book talent": "Talent", "A brand, PR or comms campaign": "Brand Communications", "An event or activation": "Events & Activations", "A website, app or digital build": "Digital & interactive" };
    var BR = null;
    function has(svc) { return BR && BR.services && BR.services.indexOf(svc) >= 0; }
    var STEPS = [
      { k: "brand", label: "Client / brand", type: "text", ph: "Brand or company",
        q: function () { return "Let's build your brief properly, the way we'd scope it in the room. First, who's the client or brand?"; } },
      { k: "services", label: "Services", type: "multi", opts: SERVICES,
        q: function () { return "What do you need from us? Pick everything that applies."; } },
      { k: "challenge", label: "The challenge", type: "text", when: function () { return !BR.preChallenge || BR.edit; }, ph: "In your own words", skip: "Not sure yet",
        q: function () { var ex = caseExample(); return "What's the challenge? The business problem or opportunity, in a sentence or two." + (ex ? " For example, on " + ex.title + " the brief was: “" + ex.text + "”" : ""); } },
      { k: "goals", label: "Objectives", type: "multi", opts: ["Awareness and reach", "A launch moment", "Sales or conversion", "Cultural credibility", "Community and engagement", "Earned media and PR"],
        q: function () { return "What does success look like? Pick any that fit, or type your own."; } },
      { k: "audience", label: "Audience", type: "text", ph: "Who you want to reach", skip: "Skip for now",
        q: function () { return "Who are you trying to reach? Age, interests, where they live, what they care about."; } },
      { k: "markets", label: "Markets", type: "multi", opts: ["South Africa", "Nigeria", "Rest of Africa", "United Kingdom", "Europe", "United States", "Global"],
        q: function () { return "Which markets is this for?"; } },
      { k: "talent", label: "Talent", type: "text", ph: "A name or type of talent", skip: "Open to recommendations", when: function () { return has("Talent") && !BR.data.talent; },
        q: function () { return "Do you have talent in mind? Name them, or describe who you're after and what they'd do, appearances, content, an ambassadorship."; } },
      { k: "event", label: "Event / activation", type: "text", ph: "Format, city, guests", skip: "Still shaping it", when: function () { return has("Events & Activations"); },
        q: function () { return "Tell us about the event or activation. The format, the city, rough guest numbers, any venue in mind."; } },
      { k: "digital", label: "Digital build", type: "text", ph: "What it needs to do", skip: "Still shaping it", when: function () { return has("Digital & interactive"); },
        q: function () { return "What are we building? A site, an app, a tool, an interactive experience. What does it need to do?"; } },
      { k: "timing", label: "Timing", type: "single", ph: "Or type a date", opts: ["As soon as possible", "In the next 1 to 3 months", "3 to 6 months out", "Later this year", "Just exploring"],
        q: function () { return "When does it need to happen? Pick one, or type a launch date."; } },
      { k: "budget", label: "Budget", type: "single", ph: "Or type a figure", opts: ["Under R250k", "R250k to R1m", "R1m to R5m", "Over R5m", "Prefer to discuss"],
        q: function () { return "What's the budget range? A ballpark helps us shape the right idea. Rand or the equivalent is fine."; } },
      { k: "notes", label: "Anything else", type: "text", ph: "Anything else", skip: "That's everything",
        q: function () { return "Last one. Anything else we should know? Mandatories, KPIs, existing assets, or the big idea if you already have one."; } }
    ];
    function activeSteps() { return STEPS.filter(function (s) { return !s.when || s.when(); }); }
    function caseExample() {
      var cs = (DATA && DATA.caseStudies) || [], want = (BR.services || [])[0] || "Brand Communications", pick = null;
      if (want === "Talent") pick = cs.filter(function (c) { return /talent|ambassador|artist/i.test(c.challenge + c.idea); })[0];
      if (!pick) pick = cs.filter(function (c) { return c.challenge && (c.area || "").indexOf(want) >= 0; })[0];
      if (!pick) pick = cs.filter(function (c) { return c.challenge; })[0];
      if (!pick) return null;
      var mm = pick.challenge.match(/^[\s\S]*?[.!?](?=\s|$)/), t = (mm ? mm[0] : pick.challenge).replace(/\s+([,.])/g, "$1").replace(/[\u201D"]+$/, ""); if (t.length > 170) t = t.slice(0, 167).replace(/\s+\S*$/, "") + "...";
      return { title: pick.title, text: t };
    }
    function similarWork() {
      var cs = (DATA && DATA.caseStudies) || [], sv = BR.services || [];
      return cs.filter(function (c) { return sv.some(function (s) { return (c.area || "").indexOf(s) >= 0; }); }).slice(0, 2);
    }
    function startBrief(p) {
      p = p || {}; awaiting = null; input.placeholder = DEF_PH;
      var pre = NEED_MAP[p.need] ? [NEED_MAP[p.need]] : (p.need === "Cultural Index" ? ["Cultural Index"] : []);
      if (p.talent && pre.indexOf("Talent") < 0) pre.push("Talent");
      BR = { data: { talent: p.talent || "", notes: p.notes || "", challenge: p.challenge || "" }, services: pre, pre: pre.slice(), i: 0, edit: false, preChallenge: !!p.challenge, active: true };
      loadData().then(function () { askStep(0); });
    }
    function askStep(i) {
      var list = activeSteps(); if (i >= list.length) { briefDone(); return; }
      BR.i = i; var st = list[i], n = i + 1, total = list.length;
      var done = function (v) {
        if (st.k === "services") { BR.services = v.length ? v : ["Not sure yet"]; BR.svcKnown = true; }
        else if (st.k === "notes" && BR.data.notes && v && !BR.edit) BR.data.notes += " " + v;
        else if (!(st.k === "notes" && !v && BR.data.notes)) BR.data[st.k] = Array.isArray(v) ? v.join(", ") : v;
        if (BR.edit) { BR.edit = false; briefDone(); return; }
        askStep(activeSteps().indexOf(st) + 1);
      };
      var lead = BR.again ? "Hey. We're in the middle of your brief. Say \u201Cstart over\u201D any time to stop. " : ""; BR.again = false;
      var node = { bot: lead + st.q(), step: "Brief · " + (BR.svcKnown ? n + " of " + total : "Question " + n), noFoot: true, foot: null, noFb: true, opts: [] };
      if (st.type === "multi") {
        var pre = st.k === "services" ? BR.services.slice() : (BR.data[st.k] ? BR.data[st.k].split(", ") : []);
        node.multi = { opts: st.opts, pre: pre, done: done };
      } else if (st.type === "single") {
        node.opts = st.opts.map(function (o) { return { t: o, fn: function () { done(o); } }; });
      } else if (st.skip) {
        node.opts = [{ t: st.skip, fn: function () { done(""); } }];
      }
      render(node);
      awaiting = function (v) { if (node.multi) done((node.multi.sel || []).concat([v])); else done(v); };
      input.placeholder = st.ph || "Type your answer";
      setTimeout(function () { if (window.innerWidth > 460) try { input.focus({ preventScroll: true }); } catch (e) {} }, 700);
    }
    function briefRows() {
      var rows = [{ l: "Client / brand", t: BR.data.brand }, { l: "Services", t: (BR.services || []).join(", ") }];
      STEPS.forEach(function (s) { if (s.k !== "brand" && s.k !== "services" && BR.data[s.k]) rows.push({ l: s.label, t: BR.data[s.k] }); });
      if (BR.data.talent && !rows.some(function (r) { return r.l === "Talent"; })) rows.push({ l: "Talent", t: BR.data.talent });
      return rows.filter(function (r) { return r.t; });
    }
    function briefText() {
      return "NEW BRIEF\n\n" + briefRows().map(function (r) { return r.l + ": " + r.t; }).join("\n\n") + "\n\n(Brief put together with " + NAME + " on csa.global)";
    }
    function briefSubject() { return "New brief via " + NAME + ": " + (BR.data.brand || "a new client") + " (" + (BR.services || []).join(", ") + ")"; }
    function briefDone() {
      awaiting = null; input.placeholder = DEF_PH; BR.active = false;
      var onForm = !!document.querySelector(".contact__form textarea"), sim = similarWork(), o = [];
      o.push({ t: onForm ? "Put it in the contact form" : "Send it to the contact form", fn: sendBrief });
      o.push({ t: "Change an answer", fn: editMenu });
      sim.forEach(function (c) { o.push({ t: "Similar work: " + c.title, link: c.url }); });
      o.push({ t: "Start again", fn: function () { startBrief(); } });
      render({ bot: "Here's your brief" + (BR.data.brand ? " for " + BR.data.brand : "") + ". Have a read, change anything that's off, then send it to the team.", brief: briefRows(), opts: o, foot: null, noFb: true, noFoot: true });
    }
    function editMenu() {
      BR.active = true;
      render({ bot: "Which part do you want to change?", foot: null, noFb: true, noFoot: true,
        opts: activeSteps().map(function (s, i) { return { t: s.label, fn: function () { BR.edit = true; askStep(i); } }; }).concat([{ t: "Back to my brief", fn: briefDone }]) });
    }
    function sendBrief() {
      var txt = briefText(), subj = briefSubject(), ta = document.querySelector(".contact__form textarea");
      if (ta) { fillForm(ta, txt, subj); close(); render({ bot: "Done. It's in the form, just add your name and email and hit send.", opts: [], hint: true, noFb: true }); return; }
      ssSet("zig_brief", JSON.stringify({ t: txt, s: subj }));
      render({ bot: "Taking you to the contact form now, your brief will be waiting.", opts: [], hint: true, noFb: true });
      setTimeout(function () { location.href = "/index.html#contact"; }, 900);
    }
    function fillForm(ta, txt, subj) {
      ta.value = txt; ta.rows = Math.max(ta.rows || 4, 10);
      try { ta.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
      var f = ta.form || ta.parentNode, sj = f.querySelector("input[name=subject]");
      if (sj && subj) sj.value = subj;
      f.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
      ta.classList.add("zig-filled"); setTimeout(function () { ta.classList.remove("zig-filled"); }, 2600);
      var nm = f.querySelector("input[name=name]");
      setTimeout(function () { try { (nm && !nm.value ? nm : ta).focus({ preventScroll: true }); } catch (e) {} }, 700);
    }

    /* ---- public hook: any element can call Ziggy with data-ziggy="ask:..." | "go:node" | "brief" | "brief:Need" | "results" ---- */
    function act(v, el) {
      v = v || ""; var i = v.indexOf(":"), k = i < 0 ? v : v.slice(0, i), arg = i < 0 ? "" : v.slice(i + 1);
      open(true);
      whenFree(function () {
        if (k === "ask" && arg) { ask(arg); return; }
        if (k === "go" && TREE[arg]) { bubble(el && el.textContent.trim() || "Tell me more", "me"); render(arg); return; }
        if (k === "brief") { bubble("Help me with a brief", "me"); startBrief(arg ? { need: arg } : null); return; }
        if (k === "wiresearch") { bubble("Help me find a read", "me"); loadData().then(wireSearchPrompt); return; }
        if (k === "related") { loadData().then(function () { var a = hereArticle(); bubble("More like this", "me"); if (a) showRelated(a); else render("wire"); }); return; }
        if (k === "about" && arg) { bubble(arg.length > 60 ? arg.slice(0, 57) + "..." : arg, "me"); clearDock(); loadData().then(function () { lookup(arg); }); return; }
        if (k === "results") { loadData().then(function () { var c = hereCase(); bubble("Show me the results", "me"); if (c) showResults(c); else render(workPickerNode()); }); return; }
        if (!busy && !log.children.length) render(greeting());
      });
    }
    window.Ziggy = {
      open: function () { open(); }, ask: function (q) { act("ask:" + q); }, go: function (id) { act("go:" + id); },
      brief: function (need) { act(need ? "brief:" + need : "brief"); }, results: function () { act("results"); }
    };
    function enhancePage() {
      document.addEventListener("click", function (e) {
        var el = e.target.closest && e.target.closest("[data-ziggy]"); if (!el) return;
        e.preventDefault(); act(el.getAttribute("data-ziggy"), el);
      });

      /* contact form: offer the brief builder, and pick up a brief sent from another page */
      var cf = document.querySelector(".contact__form"), ta = cf && cf.querySelector("textarea");
      if (cf && ta && !cf.querySelector(".zig-formhelp")) {
        var h = document.createElement("button"); h.type = "button"; h.className = "zig-link zig-formhelp";
        h.textContent = "Not sure what to write? " + NAME + " can help you build the brief";
        h.onclick = function () { act("brief"); };
        ta.parentNode.insertBefore(h, ta.nextSibling);
        var pend = ssGet("zig_brief");
        if (pend) {
          ssSet("zig_brief", null);
          var pj = null; try { pj = JSON.parse(pend); } catch (e) {}
          setTimeout(function () { fillForm(ta, pj ? pj.t : pend, pj ? pj.s : ""); nudge.querySelector(".zig-ntext").innerHTML = "Your brief is in the form. Add your <b>name and email</b>, then send."; nudged = false; showNudge(true); }, 700);
        }
      }

      /* Labs idea box: Ziggy reacts as you type */
      var ii = document.getElementById("ideaInput"), ifm = document.getElementById("ideaForm");
      if (ii && ifm && !document.querySelector(".zig-ideahint")) {
        var hint = document.createElement("div"); hint.className = "zig-ideahint"; hint.setAttribute("aria-live", "polite");
        ifm.parentNode.insertBefore(hint, ifm.nextSibling);
        var RULES = [
          { re: /\b(cultural index|creator|creators|influencer|influencers|talent|casting|cast|score|scoring)\b/i, txt: "That's <b>Cultural Index</b> territory. It scores talent on cultural relevance rather than follower count.", link: ["See how it works", "#index"] },
          { re: /\b(web|website|websites|site|microsite|app|apps|tool|tools|platform|portal|dashboard|interactive|experience|game|ar|vr|digital|redesign)\b/i, txt: "Sounds like <b>Interactive & digital</b>. Websites, apps, tools and interactive experiences, designed and built in-house.", link: null },
          { re: /\b(chart|charts|music|stream|streaming|artist|artists|newsletter|wire|trend|trends)\b/i, txt: "<b>The Wire and Chart Pulse</b> might help here, our read on South Africa's most-streamed artists.", link: ["Open The Wire", "/the-wire.html"] },
          { re: /\b(event|events|activation|activations|festival|pop.?up|launch|stage)\b/i, txt: "We stage <b>festivals, pop-ups and money-can't-buy moments</b> too.", link: ["See Events & Activations", "/events-activations.html"] }
        ];
        var tmr = null, lastKey = "";
        function paint() {
          var v = ii.value.trim(), r = null, k;
          for (k = 0; k < RULES.length; k++) if (RULES[k].re.test(v)) { r = RULES[k]; break; }
          var key = r ? String(k) : (v.length > 40 ? "long" : "");
          if (key === lastKey) return; lastKey = key;
          if (!key) { hint.classList.remove("zig-show"); return; }
          var txt = r ? r.txt : "Love it. Add your email and send it, a real person comes back to you.";
          hint.innerHTML = '<span class="zig-dot-a"></span><div>' + txt + ' ' +
            (r && r.link ? '<a href="' + r.link[1] + '">' + esc(r.link[0]) + '</a> \u00B7 ' : "") +
            '<button type="button" class="zig-ih-talk">Shape it with ' + NAME + '</button></div>';
          hint.querySelector(".zig-ih-talk").onclick = function () { open(true); whenFree(function () { bubble("Help me shape this idea", "me"); startBrief({ need: "A website, app or digital build", challenge: ii.value.trim() }); }); };
          hint.classList.remove("zig-show"); void hint.offsetWidth; hint.classList.add("zig-show");
        }
        ii.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(paint, 450); });
      }

      /* case studies: results on tap */
      if (CTXK === "case") {
        loadData().then(function () {
          var c = hereCase(), host = document.querySelector(".cs__hero-main");
          if (!c || !c.stats || !c.stats.length || !host || host.querySelector(".zig-link")) return;
          var b = document.createElement("button"); b.type = "button"; b.className = "zig-inline"; b.setAttribute("data-ziggy", "results");
          b.className = "zig-link"; b.style.marginTop = "18px"; b.textContent = "Ask " + NAME + " for the headline results";
          host.appendChild(b);
        });
      }

      /* talent cards: tap anyone and Ziggy takes it from there */
      document.querySelectorAll(".talent-card").forEach(function (c) {
        if (c.getAttribute("href") || c.hasAttribute("data-zig")) return;
        var n = c.querySelector(".talent-card__name"); if (!n) return;
        c.setAttribute("data-zig", "1"); c.setAttribute("role", "button"); c.setAttribute("tabindex", "0");
        c.setAttribute("aria-label", "Ask " + NAME + " about working with " + n.textContent.trim());
        function go() {
          var t = talentList().filter(function (x) { return x.name === n.textContent.trim(); })[0]; if (!t) return;
          open(true); whenFree(function () { bubble("Tell me about working with " + t.name, "me"); talentAsk(t); });
        }
        c.addEventListener("click", go);
        c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });

      function strip(html, verb) {
        var b = document.createElement("button"); b.type = "button"; b.className = "zig-link"; b.setAttribute("data-ziggy", verb);
        b.textContent = html; return b;
      }
      /* The Wire: Ziggy sits in the filter bar */
      var wf = document.getElementById("wireFilter");
      if (wf && !document.querySelector(".zig-strip-wrap")) {
        var w1 = strip("Looking for something specific? Ask " + NAME, "wiresearch"); w1.classList.add("zig-strip-wrap"); w1.style.marginLeft = "auto"; w1.style.alignSelf = "center";
        wf.appendChild(w1);
      }
      /* Articles: more like this, at the end of every read */
      var sub = document.querySelector(".post__subscribe");
      if (CTXK === "article" && sub && !document.querySelector(".zig-strip-wrap")) {
        var w2 = document.createElement("div"); w2.className = "zig-strip-wrap"; w2.style.padding = "0 0 36px";
        w2.appendChild(strip("Want more like this? " + NAME + " has related reads", "related"));
        sub.parentNode.insertBefore(w2, sub);
      }
      /* Service pages: a brief, right where you finish reading */
      /* any contact section without a form (service pages, about, talent): Ziggy sits under the email address */
      var csec = document.querySelector("section.contact"), foot = document.querySelector("footer.footer");
      if (csec && !csec.querySelector("form") && !document.querySelector(".zig-strip-wrap")) {
        var need = CTXK === "brand" ? "A brand, PR or comms campaign" : CTXK === "events" ? "An event or activation" : CTXK === "talent" ? "Book talent" : "";
        var w3 = document.createElement("div"); w3.className = "zig-strip-wrap"; w3.style.padding = "22px 0 0";
        w3.appendChild(strip("Got a brief in mind? " + NAME + " can help you build it", need ? "brief:" + need : "brief"));
        var em = csec.querySelector(".contact__email");
        if (em) em.parentNode.insertBefore(w3, em.nextSibling); else csec.appendChild(w3);
      } else if ((CTXK === "brand" || CTXK === "events") && foot && !document.querySelector(".zig-strip-wrap")) {
        var w4 = document.createElement("div"); w4.className = "zig-strip-wrap zig-pad";
        w4.appendChild(strip("Got a brief in mind? " + NAME + " can help you build it", "brief"));
        foot.parentNode.insertBefore(w4, foot);
      }
      /* Anywhere: highlight text and Ziggy offers to explain */
      if (window.matchMedia && window.matchMedia("(pointer:fine)").matches) {
        var pill = document.createElement("button"); pill.id = "zig-sel"; pill.type = "button";
        pill.innerHTML = '<span class="zig-dot-a"></span>Ask ' + NAME;
        document.body.appendChild(pill); var selTxt = "";
        pill.addEventListener("mousedown", function (e) { e.preventDefault(); });
        pill.onclick = function () { pill.classList.remove("zig-show"); if (selTxt) act("about:" + selTxt); try { window.getSelection().removeAllRanges(); } catch (e) {} };
        document.addEventListener("mouseup", function (e) {
          if (e.target.closest && (e.target.closest("#zig-root") || e.target.closest("#zig-sel"))) return;
          setTimeout(function () {
            var sel = window.getSelection(), t = sel ? String(sel).replace(/\s+/g, " ").trim() : "";
            var inField = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
            if (!t || t.length < 3 || t.length > 90 || inField || !sel.rangeCount) { pill.classList.remove("zig-show"); return; }
            var r = sel.getRangeAt(0).getBoundingClientRect(); if (!r.width) { pill.classList.remove("zig-show"); return; }
            selTxt = t;
            pill.style.left = Math.max(8, Math.min(window.innerWidth - 120, r.left + r.width / 2 - 50)) + "px";
            pill.style.top = Math.max(8, r.top - 40) + "px";
            pill.classList.add("zig-show");
          }, 10);
        });
        document.addEventListener("scroll", function () { pill.classList.remove("zig-show"); }, { passive: true });
      }

      if (CTX.force) setTimeout(function () { showNudge(true); }, CTX.delay);
    }
    /* what Ziggy says about a highlighted phrase: talent, a campaign, a read, or a topic route */
    function lookup(q) {
      var tl = findTalent(q); if (tl && tl.one) { talentAsk(tl.one); return; }
      var cs = findCase(q); if (cs && cs.matched >= 1 && cs.score >= 2) { showCase(cs.c); return; }
      for (var s = 0; s < FAQ.length; s++) { if (FAQ[s].re.test(q)) { render(FAQ[s].node); return; } }
      var wa = findArticles(q); if (wa.length) { render({ bot: "Here's where we've written about that on The Wire:", opts: wa.map(function (a) { return { t: a.title, article: a }; }).concat([{ t: "Browse all of The Wire", link: "/the-wire.html" }]), foot: "start" }); return; }
      for (s = 0; s < MATCH.length; s++) { if (MATCH[s].re.test(q)) { render(MATCH[s].go); return; } }
      render({ bot: "I don't have more on that one, but I can point you around CSA. Ask me something else, or tap Quick options below.", hint: true });
    }

    /* ---- free-text routing ---- */
    /* ---- facts: numbers and "latest" answers, counted live from the site's own content ---- */
    function cases() { return (DATA && DATA.caseStudies) || []; }
    function caseYear(c) { return parseInt(c.year, 10) || 0; }
    function plural(n, one, many) { return n + "+ " + (n === 1 ? one : many); }
    var AREAS = [
      { re: /\b(events?|activations?|experiential|festivals?|pop.?ups?)\b/i, area: "Events & Activations" },
      { re: /\b(sport|sports|sporting|athletes?)\b/i, area: "Sport" },
      { re: /\b(pr|brand comm|brand communications|comms|earned media|publicity)\b/i, area: "Brand Communications" }
    ];
    function facts(q) {
      var now = new Date().getFullYear(), cs = cases(), m, yr;
      var howMany = /\b(how many|number of|how much work|count|tally|total)\b/i.test(q);
      var latest = /\b(latest|newest|most recent|recent|last|new)\b/i.test(q);
      var workWord = /\b(campaigns?|case stud(y|ies)|projects?|jobs?|work|activations?|events?|brands?)\b/i.test(q);
      var readWord = /\b(articles?|reads?|pieces?|stories|posts?|wire|insights?)\b/i.test(q);

      /* how many campaigns (this year / a given year / by type / all time) */
      if (howMany && workWord && !readWord) {
        m = q.match(/\b(19|20)\d{2}\b/); yr = m ? parseInt(m[0], 10) : (/\b(this year|so far|year to date|ytd)\b/i.test(q) ? now : (/\blast year\b/i.test(q) ? now - 1 : 0));
        var area = null; AREAS.forEach(function (a) { if (!area && a.re.test(q)) area = a.area; });
        var pool = area ? cs.filter(function (c) { return (c.area || "").indexOf(area) >= 0; }) : cs;
        var kind = area ? area + " " : "";
        if (yr) {
          var n = pool.filter(function (c) { return caseYear(c) === yr; }).length;
          if (!n && yr === now) {
            var prev = pool.filter(function (c) { return caseYear(c) === now - 1; }).length;
            return { bot: "We haven't added " + now + "'s " + kind + "campaigns to the site yet. Last year we delivered " + plural(prev, kind + "campaign", kind + "campaigns") + ", and " + plural(pool.length, "", "") .trim() + " across the full portfolio.", opts: [{ t: "See a recent highlight", fn: function () { render(workPickerNode()); } }, { t: "See all our work", link: "/index.html#work" }], foot: "start" };
          }
          return { bot: (yr === now ? "So far in " + now + " we've delivered " : "In " + yr + " we delivered ") + plural(n, kind + "campaign", kind + "campaigns") + ", and " + pool.length + "+ " + kind + "campaigns across our portfolio on the site.",
            opts: [{ t: "Show me the latest one", fn: function () { var c = pool.filter(function (c) { return caseYear(c) === yr; })[0] || pool[0]; if (c) showCase(c); } }, { t: "See all our work", link: "/index.html#work" }], foot: "start" };
        }
        var by = {}; cs.forEach(function (c) { var a = (c.area || "Other").split("·")[0].trim(); by[a] = (by[a] || 0) + 1; });
        var thisYear = pool.filter(function (c) { return caseYear(c) === now; }).length;
        var split = area ? "" : " That's " + Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (a) { return by[a] + " in " + a; }).join(", ").replace(/, ([^,]*)$/, " and $1") + ".";
        return { bot: "Our portfolio on the site covers " + pool.length + "+ " + kind + "campaigns" + (thisYear ? ", " + thisYear + "+ of them this year" : "") + "." + split,
          opts: [{ t: "Show me a recent highlight", fn: function () { render(workPickerNode()); } }, { t: "See all our work", link: "/index.html#work" }], foot: "start" };
      }

      /* how many Wire articles */
      if (howMany && readWord) {
        var arts = (DATA && DATA.articles) || [], ay = arts.filter(function (a) { return (a.date || "").slice(0, 4) === String(now); }).length;
        return { bot: "There are " + arts.length + "+ reads on The Wire" + (ay ? (ay === arts.length ? ", all published this year" : ", " + ay + "+ of them published this year") : "") + ". Want the latest, or something on a specific topic?",
          opts: [{ t: "The latest read", fn: function () { if (arts[0]) showArticle(arts[0]); } }, { t: "Search The Wire", fn: wireSearchPrompt }], foot: "start" };
      }

      /* how many talent on the roster */
      if (howMany && /\b(talent|artists?|celebrit|names|people|stars|roster|ambassadors?)\b/i.test(q)) {
        var tl = talentList().length;
        return { bot: "We represent and book " + tl + "+ names on our featured roster, from Naomi Campbell and Djimon Hounsou to Bonang Matheba, Sho Madjozi and DJ Zinhle. Tell me who you have in mind.",
          opts: [{ t: "See the roster", link: "/talent.html" }, { t: "I want to book talent", fn: function () { startBrief({ need: "Book talent" }); } }], foot: "start" };
      }

      /* how many offices / cities */
      if (howMany && /\b(offices?|cities|city|hubs?|countries|locations?)\b/i.test(q)) return FAQ[1].node;

      /* latest campaign */
      if (latest && workWord && !readWord && cs.length) { showCase(cs[0]); return true; }

      /* latest Wire read */
      if (latest && readWord) { var a0 = ((DATA && DATA.articles) || [])[0]; if (a0) { showArticle(a0); return true; } }

      /* which brands / clients */
      if (/\b(clients?|brands?) (have you|you've|did you|do you) (worked|work|partnered)|\bwho (have you|do you) work(ed)? (with|for)\b|\byour clients\b|\bwhich brands\b/i.test(q)) {
        var seen = {}, list = [];
        cs.forEach(function (c) { var n = (c.client || "").trim(); if (n && !seen[n.toLowerCase()]) { seen[n.toLowerCase()] = 1; list.push(n); } });
        var show = list.slice(0, 8);
        return { bot: "We've worked with brands like " + show.slice(0, -1).join(", ") + " and " + show[show.length - 1] + ", across " + cs.length + "+ campaigns on the site. Want to see one?",
          opts: [{ t: "Show me a recent highlight", fn: function () { render(workPickerNode()); } }, { t: "See all our work", link: "/index.html#work" }], foot: "start" };
      }
      return null;
    }

    function routeQ(q) {
      var s, intent = /\b(result|results|campaign|case|portfolio|stats|numbers|outcome|performance|show me|tell me about|what was|how did|breakdown)\b/i.test(q);
      for (s = 0; s < SMALL.length; s++) { if (SMALL[s].re.test(q)) { render({ bot: SMALL[s].bot, hint: true }); return; } }
      var fx = facts(q); if (fx) { if (fx !== true) render(fx); return; }
      for (s = 0; s < FAQ.length; s++) { if (FAQ[s].re.test(q)) { render(FAQ[s].node); return; } }
      if (/\b(brief|help me (write|put|plan)|write (a|my|up)|start a (project|brief))\b/i.test(q)) { startBrief(); return; }
      if (CTXK === "wire" || CTXK === "article") { var wa = findArticles(q); if (wa.length) { showArticles(wa, q); return; } }
      var tl = findTalent(q); if (tl) { showTalent(tl, q); return; }
      if (/\b(article|articles|read|reads|wire|piece|story|stories|written about|write.?up|insight)\b/i.test(q)) { var wb = findArticles(q); if (wb.length) { showArticles(wb, q); return; } }
      var cs = findCase(q);
      if (cs && (cs.matched >= 2 || (intent && cs.matched >= 1))) { showCase(cs.c); return; }
      if (DATA && /\b(case stud(y|ies)|campaigns?|portfolio|your work|see your work|examples?|results)\b/i.test(q)) { render(workPickerNode()); return; }
      for (s = 0; s < MATCH.length; s++) { if (MATCH[s].re.test(q)) { render(MATCH[s].go); return; } }
      if (OUT.re.test(q)) { render({ bot: OUT.bot, hint: true }); return; }
      if (CTXK === "wire" || CTXK === "article") { render({ bot: "I couldn't find a read on that yet. Try another topic, a brand or an artist, or browse everything on The Wire.", opts: [{ t: "Browse The Wire", link: "/the-wire.html" }, { t: "This month's Chart Pulse", go: "w_chart" }], foot: "start" }); return; }
      render({ bot: "Good question. I can point you around CSA, tap Quick options below and pick a starting point, or ask me something else.", hint: true });
    }
    function restart() {
      awaiting = null; BR = null; input.placeholder = DEF_PH;
      try { setTray(false); } catch (e) {}
      log.innerHTML = ""; clearDock();
      render("start");
    }
    var RE_RESTART = /^\W*(?:(?:hey|ok|okay|please)\W+)?(?:ziggy\W+)?(?:can (?:we|you)\W+)?(?:start over|start again|start from scratch|restart|reset|begin again|from the top|main menu)\b|^\W*(?:ziggy\W+)?(?:cancel|stop|quit|exit|never ?mind|forget it|menu)\W*(?:it|that|this|please|ziggy)?\W*(?:please|ziggy)?\W*$/i;
    var RE_BACK = /^\W*(?:ziggy\W+)?(go back|back|previous|undo)\W*(?:ziggy)?\W*$/i;
    var RE_HELLO = /^\W*(hi+|hey+|hello+|yo|hiya|howzit|ziggy)\W*(ziggy)?\W*$/i;
    function ask(q) {
      if (busy || !q) return;
      if (RE_RESTART.test(q)) { restart(); return; }
      if (BR && BR.active && RE_BACK.test(q)) { awaiting = null; bubble(q, "me"); clearDock(); askStep(Math.max(0, BR.i - 1)); return; }
      if (BR && BR.active && awaiting && RE_HELLO.test(q)) { awaiting = null; bubble(q, "me"); clearDock(); BR.again = true; askStep(BR.i); return; }
      if (awaiting) { var cb = awaiting; awaiting = null; input.placeholder = DEF_PH; bubble(q, "me"); blip("send"); clearDock(); cb(q); return; }
      bubble(q, "me"); blip("send"); clearDock();
      if (DATA) routeQ(q); else loadData().then(function () { routeQ(q); });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q || busy) return;
      input.value = ""; ask(q);
    });

    /* ---- welcome back ---- */
    function greeting() {
      var seen = lsGet("zig_seen"), last = lsGet("zig_topic");
      lsSet("zig_seen", "1");
      if (seen && last && LABEL[last]) {
        return { bot: "Welcome back. Want to pick up where you left off, or start fresh?", foot: null, greeting: true,
          opts: [{ t: "Pick up: " + LABEL[last], go: last }, { t: "Start fresh", go: "start" }] };
      }
      return "start";
    }

    /* ---- nudge ---- */
    function showNudge(force) {
      if (opened || nudged) return;
      if (force !== true && (ssGet("zig_nudge_off") === "1" || ssGet("zig_n_" + CTXK) === "1")) return;
      nudged = true; ssSet("zig_n_" + CTXK, "1"); nudge.classList.add("zig-show");
      setTimeout(function () { nudge.classList.remove("zig-show"); }, force === true ? 9000 : 7000);
    }
    nudge.addEventListener("click", function () { nudge.classList.remove("zig-show"); open(); });
    nudge.querySelector(".zig-nx").addEventListener("click", function (e) {
      e.stopPropagation(); nudge.classList.remove("zig-show"); ssSet("zig_nudge_off", "1");
    });
    if (CTX.nudge) nudge.querySelector(".zig-ntext").innerHTML = CTX.nudge;
    var NUDGE_ON = { home: 1, wire: 1, talent: 1, "404": 1 };
    if (!CTX.force && NUDGE_ON[CTXK]) idleTimer = setTimeout(showNudge, CTX.delay || 15000);
    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && e.clientY <= 0 && NUDGE_ON[CTXK]) showNudge(false);
    });

    /* ---- open / close ---- */
    function open(skipOpener) {
      nudge.classList.remove("zig-show");
      if (opened) { panel.classList.add("zig-open"); launch.classList.add("zig-hide"); return; }
      opened = true; clearTimeout(idleTimer);
      panel.classList.add("zig-open"); launch.classList.add("zig-hide");
      try { if (soundOn) { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); } } catch (e) {}
      blip("send");
      if (!started) {
        started = true;
        if (skipOpener) loadData();
        else { busy = true; loadData().then(function () { busy = false; var o = CTX.opener && CTX.opener(); render(o || greeting()); }); }
      }
      setTimeout(function () { if (window.innerWidth > 460) input.focus(); }, 500);
    }
    function close() { panel.classList.remove("zig-open"); launch.classList.remove("zig-hide"); }
    launch.onclick = function () { open(); };
    root.querySelector("#zig-close").onclick = close;
    root.querySelector("#zig-new").onclick = function () { whenFree(function () { blip("send"); restart(); }); };
    enhancePage();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

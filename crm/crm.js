(function () {
  var doc = document;
  var STORE = 'fwc-leaddesk-v1';
  var STAGES = ['New', 'Contacted', 'Engaged', 'Booked', 'Patient'];
  var STAGE_HINT = {
    New: 'Just arrived. First-touch text goes out automatically within 60 seconds.',
    Contacted: 'We reached out. Waiting on a reply; follow-up email and call task are queued.',
    Engaged: 'They replied. Answer questions, screen fit, and offer the booking link.',
    Booked: 'First visit is on the calendar in SKED. Confirm the day before.',
    Patient: 'Handed off to ChiroHD. The lead journey ends here; the patient journey continues in SKED.'
  };
  var SOURCES = {
    meta: { name: 'Meta Lead Ads', short: 'Meta' },
    google: { name: 'Google Ads', short: 'Google' },
    website: { name: 'Website form', short: 'Website' },
    referral: { name: 'Referral / walk-in', short: 'Referral' }
  };
  var OWNERS = ['Front desk', 'Dr. Carter', 'Dr. Corey'];
  var INTERESTS = ['Wellness and preventative care', 'Nervous system function', 'Back pain', 'Neck pain', 'Family care', 'Pregnancy', 'Infants & children', 'Athletic performance', 'Headaches/Migraines', 'Mobility', 'Stress resilience'];
  var CAMPAIGNS = {
    meta: ['Winter Opening Waitlist', 'Pediatric Care · Video', 'Pregnancy Support · Carousel'],
    google: ['Search · chiropractor melbourne fl', 'Search · pediatric chiropractor', 'Search · gonstead near me'],
    website: ['flowwellnesschiro.com · Reserve form'],
    referral: ['Community event', 'Patient referral']
  };
  var TEMPLATES = {
    welcome: "Hi {first}, this is Flow Wellness Chiropractic. Thanks for reaching out about {interest}. We open this winter and you're on our first-appointment list. Reply here with any questions, or text STOP to opt out.",
    followup: "Hi {first}, just checking in from Flow Wellness. Would a quick 10-minute call this week help answer any questions about care for {who}?",
    booking: "Hi {first}, here's your link to reserve a first visit with Dr. Carter or Dr. Corey: sked.link/flowwellness. Pick a time that works and we'll take it from there.",
    reminder: "Hi {first}, a reminder about your first visit at Flow Wellness tomorrow. Reply Y to confirm or call (321) 555-0139 to reschedule."
  };

  var state = load() || seed();
  var ui = { search: '', stage: 'all', source: 'all', feedFilter: 'all', composerTab: 'sms' };

  /* ---------- storage ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.leads || !s.activities) return null;
      return s;
    } catch (e) { return null; }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- seed data ---------- */

  function seed() {
    var now = Date.now();
    var H = 3600000, D = 86400000, M = 60000;
    var leads = [];
    var acts = [];
    var n = 1000;

    function lead(o) {
      o.id = 'L' + (++n);
      o.consent = o.consent || { sms: true, at: o.createdAt };
      o.owner = o.owner || 'Front desk';
      o.interests = o.interests || [];
      o.lastActivityAt = o.createdAt;
      leads.push(o);
      return o;
    }
    function act(leadId, type, dir, body, at, extra) {
      var a = { id: 'A' + (++n), leadId: leadId, type: type, dir: dir, body: body, at: at, by: extra && extra.by || 'Front desk' };
      if (extra) for (var k in extra) a[k] = extra[k];
      acts.push(a);
      var l = leads.filter(function (x) { return x.id === leadId; })[0];
      if (l && at > l.lastActivityAt) l.lastActivityAt = at;
      return a;
    }
    function ingest(l, at) {
      act(l.id, 'system', null, 'Lead received from ' + SOURCES[l.source].name + ' · ' + l.campaign, at, { by: 'System' });
      if (l.consent.sms) act(l.id, 'sms', 'out', fill(TEMPLATES.welcome, l), at + 40000, { auto: true, by: 'Automation' });
    }

    var a = lead({ first: 'Maria', last: 'Delgado', phone: '(321) 555-0142', email: 'maria.delgado@example.com', preferred: 'Text', who: 'My child', interests: ['Infants & children', 'Nervous system function'], source: 'meta', campaign: 'Pediatric Care · Video', stage: 'New', createdAt: now - 14 * M, nextAction: 'Awaiting first reply' });
    ingest(a, a.createdAt);

    var b = lead({ first: 'Jordan', last: 'Pike', phone: '(321) 555-0177', email: 'jpike@example.com', preferred: 'Call', who: 'Myself', interests: ['Back pain', 'Mobility'], source: 'google', campaign: 'Search · chiropractor melbourne fl', stage: 'New', createdAt: now - 2 * H, nextAction: 'Call attempt 1 due today' });
    ingest(b, b.createdAt);
    act(b.id, 'email', 'out', 'Following up on your request', b.createdAt + H, { auto: true, by: 'Automation', subject: 'A little more about Flow Wellness', body: 'Hi Jordan,\n\nThanks for reaching out about back pain and mobility. We are a Gonstead chiropractic office opening this winter on the Space Coast, and you are on our first-appointment list.\n\nIf a short call would help, reply with a good time and we will ring you.\n\nWarmly,\nThe Flow Wellness team' });

    var c = lead({ first: 'Ashley', last: 'Tran', phone: '(321) 555-0118', email: 'ashley.tran@example.com', preferred: 'Text', who: 'Myself', interests: ['Pregnancy', 'Wellness and preventative care'], source: 'meta', campaign: 'Pregnancy Support · Carousel', stage: 'Engaged', createdAt: now - D - 3 * H, nextAction: 'Send booking link' });
    ingest(c, c.createdAt);
    act(c.id, 'sms', 'in', "Hi! Yes I'm 22 weeks and looking for someone who works with pregnancy. Do you take my insurance?", c.createdAt + 25 * M);
    act(c.id, 'sms', 'out', "Congratulations, Ashley! Both Dr. Carter and Dr. Corey work with expecting moms. We're a self-pay practice with a clear visit price, and many patients use HSA/FSA. Want me to text you the booking link?", c.createdAt + 41 * M);
    act(c.id, 'sms', 'in', 'Yes please!', c.createdAt + 58 * M);
    act(c.id, 'note', null, 'Prefers mornings. Due in February, wants to start before the holidays.', c.createdAt + 62 * M);

    var d = lead({ first: 'Marcus', last: 'Reed', phone: '(321) 555-0163', email: 'marcus.reed@example.com', preferred: 'Email', who: 'Myself and my family', interests: ['Family care', 'Headaches/Migraines'], source: 'website', campaign: 'flowwellnesschiro.com · Reserve form', stage: 'Contacted', createdAt: now - 2 * D - 5 * H, nextAction: 'Call attempt 2 due tomorrow' });
    ingest(d, d.createdAt);
    act(d.id, 'email', 'out', '', d.createdAt + H, { auto: true, by: 'Automation', subject: 'A little more about Flow Wellness', body: 'Hi Marcus,\n\nThanks for reaching out about family care. We are opening this winter and you are on our first-appointment list. Reply with a good time to talk and we will call.\n\nThe Flow Wellness team' });
    act(d.id, 'call', 'out', 'No answer. Left voicemail.', d.createdAt + D, { outcome: 'Voicemail' });

    var e = lead({ first: 'Priya', last: 'Natarajan', phone: '(321) 555-0191', email: 'priya.n@example.com', preferred: 'Text', who: 'My child', interests: ['Infants & children'], source: 'google', campaign: 'Search · pediatric chiropractor', stage: 'Booked', createdAt: now - 4 * D, nextAction: 'First visit Thu 9:00 AM', owner: 'Dr. Carter' });
    ingest(e, e.createdAt);
    act(e.id, 'sms', 'in', 'My 4 month old has torticollis, does Dr. Carter see infants that young?', e.createdAt + 12 * M);
    act(e.id, 'sms', 'out', 'She does, Priya. Infants are a big part of what we do and adjustments are very gentle at that age. Here is the booking link: sked.link/flowwellness', e.createdAt + 20 * M);
    act(e.id, 'system', null, 'Booked first visit in SKED · Thu 9:00 AM with Dr. Carter', e.createdAt + 3 * H, { by: 'System' });

    var f = lead({ first: 'Danielle', last: 'Okafor', phone: '(321) 555-0128', email: 'd.okafor@example.com', preferred: 'Text', who: 'Myself', interests: ['Neck pain', 'Stress resilience'], source: 'meta', campaign: 'Winter Opening Waitlist', stage: 'Patient', createdAt: now - 9 * D, nextAction: '', owner: 'Dr. Corey', chirohdRef: 'FWC-1042', convertedAt: now - 3 * D });
    ingest(f, f.createdAt);
    act(f.id, 'sms', 'in', 'Great, thank you! Booked for next Tuesday.', f.createdAt + 2 * H);
    act(f.id, 'system', null, 'Booked first visit in SKED · Tue 2:30 PM with Dr. Corey', f.createdAt + 2 * H + 10 * M, { by: 'System' });
    act(f.id, 'convert', null, 'Sent to ChiroHD as new patient · FWC-1042', now - 3 * D, { by: 'Front desk' });

    var g = lead({ first: 'Tom', last: 'Whitaker', phone: '(321) 555-0155', email: 'tom.whitaker@example.com', preferred: 'Call', who: 'Myself', interests: ['Athletic performance', 'Mobility'], source: 'referral', campaign: 'Community event', stage: 'Contacted', createdAt: now - 3 * D - 2 * H, nextAction: 'Call attempt 3 due Fri' });
    act(g.id, 'system', null, 'Lead added manually · Community event (Satellite Beach farmers market)', g.createdAt, { by: 'Front desk' });
    act(g.id, 'call', 'out', 'No answer.', g.createdAt + 3 * H, { outcome: 'No answer' });
    act(g.id, 'call', 'out', 'Rang through, no voicemail set up.', g.createdAt + D + 4 * H, { outcome: 'No answer' });

    var h = lead({ first: 'Elena', last: 'Rossi', phone: '(321) 555-0104', email: 'elena.rossi@example.com', preferred: 'Email', who: 'Myself and my family', interests: ['Family care', 'Wellness and preventative care'], source: 'website', campaign: 'flowwellnesschiro.com · Reserve form', stage: 'Engaged', createdAt: now - 5 * D, nextAction: 'Answer insurance question' });
    ingest(h, h.createdAt);
    act(h.id, 'email', 'in', '', h.createdAt + 6 * H, { subject: 'Re: A little more about Flow Wellness', body: 'Thanks for the quick note. We are a family of four. Do you offer a family plan or package pricing?' });

    var i = lead({ first: 'Kevin', last: 'Marsh', phone: '(321) 555-0136', email: 'kmarsh@example.com', preferred: 'Text', who: 'Myself', interests: ['Back pain'], source: 'google', campaign: 'Search · gonstead near me', stage: 'Lost', createdAt: now - 12 * D, nextAction: '', lostReason: 'Went with another office' });
    ingest(i, i.createdAt);
    act(i.id, 'sms', 'in', 'Found someone closer, thanks anyway', i.createdAt + 2 * D);
    act(i.id, 'system', null, 'Marked lost · Went with another office', i.createdAt + 2 * D + 5 * M);

    var j = lead({ first: 'Sofia', last: 'Alvarez', phone: '(321) 555-0170', email: 'sofia.alvarez@example.com', preferred: 'Text', who: 'My child', interests: ['Infants & children', 'Family care'], source: 'meta', campaign: 'Pediatric Care · Video', stage: 'Contacted', createdAt: now - 7 * H, nextAction: 'Awaiting first reply' });
    ingest(j, j.createdAt);
    act(j.id, 'email', 'out', '', j.createdAt + H, { auto: true, by: 'Automation', subject: 'A little more about Flow Wellness', body: 'Hi Sofia,\n\nThanks for reaching out about care for your child. We are opening this winter and you are on our first-appointment list.\n\nThe Flow Wellness team' });

    var k = lead({ first: 'Brian', last: 'Cole', phone: '(321) 555-0149', email: 'brian.cole@example.com', preferred: 'Call', who: 'Myself', interests: ['Neck pain', 'Headaches/Migraines'], source: 'google', campaign: 'Search · chiropractor melbourne fl', stage: 'Booked', createdAt: now - 6 * D, nextAction: 'First visit Mon 11:30 AM', owner: 'Dr. Corey' });
    ingest(k, k.createdAt);
    act(k.id, 'call', 'out', 'Spoke for 8 min. Migraines 2-3x/week, desk job. Wants Monday morning.', k.createdAt + 4 * H, { outcome: 'Connected' });
    act(k.id, 'sms', 'out', fill(TEMPLATES.booking, k), k.createdAt + 4 * H + 10 * M);
    act(k.id, 'system', null, 'Booked first visit in SKED · Mon 11:30 AM with Dr. Corey', k.createdAt + D, { by: 'System' });

    var l = lead({ first: 'Hannah', last: 'Brooks', phone: '(321) 555-0187', email: 'hannah.b@example.com', preferred: 'Text', who: 'Myself', interests: ['Pregnancy'], source: 'website', campaign: 'flowwellnesschiro.com · Reserve form', stage: 'Patient', createdAt: now - 16 * D, nextAction: '', owner: 'Dr. Carter', chirohdRef: 'FWC-1037', convertedAt: now - 10 * D });
    ingest(l, l.createdAt);
    act(l.id, 'system', null, 'Booked first visit in SKED · Wed 10:00 AM with Dr. Carter', l.createdAt + D, { by: 'System' });
    act(l.id, 'convert', null, 'Sent to ChiroHD as new patient · FWC-1037', now - 10 * D, { by: 'Front desk' });

    var s = {
      leads: leads,
      activities: acts,
      automations: {
        meta: { on: true },
        google: { on: true },
        website: { on: true },
        referral: { on: false }
      },
      tpl: TEMPLATES.welcome,
      seq: n
    };
    return s;
  }

  var POOL = [
    { first: 'Lauren', last: 'Kim', who: 'My child', interests: ['Infants & children'], preferred: 'Text' },
    { first: 'Derek', last: 'Hughes', who: 'Myself', interests: ['Back pain', 'Mobility'], preferred: 'Call' },
    { first: 'Amira', last: 'Hassan', who: 'Myself', interests: ['Pregnancy', 'Wellness and preventative care'], preferred: 'Text' },
    { first: 'Chris', last: 'Bauer', who: 'Myself and my family', interests: ['Family care', 'Stress resilience'], preferred: 'Email' },
    { first: 'Nicole', last: 'Ferreira', who: 'Myself', interests: ['Headaches/Migraines', 'Neck pain'], preferred: 'Text' },
    { first: 'Andre', last: 'Silva', who: 'Myself', interests: ['Athletic performance'], preferred: 'Text' }
  ];

  /* ---------- helpers ---------- */

  function fill(t, l) {
    return t.replace(/\{first\}/g, l.first)
      .replace(/\{interest\}/g, (l.interests[0] || 'care').toLowerCase())
      .replace(/\{who\}/g, l.who === 'My child' ? 'your child' : l.who === 'Myself and my family' ? 'your family' : 'yourself');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function byId(id) { return state.leads.filter(function (l) { return l.id === id; })[0]; }
  function nextId(p) { return p + (++state.seq); }
  function acts(leadId) { return state.activities.filter(function (a) { return a.leadId === leadId; }).sort(function (a, b) { return b.at - a.at; }); }
  function fullName(l) { return l.first + ' ' + l.last; }
  function initials(l) { return (l.first[0] || '') + (l.last[0] || ''); }

  function rel(t) {
    var d = Date.now() - t;
    if (d < 60000) return 'Just now';
    if (d < 3600000) return Math.round(d / 60000) + 'm ago';
    if (d < 86400000) return Math.round(d / 3600000) + 'h ago';
    if (d < 172800000) return 'Yesterday';
    if (d < 7 * 86400000) return Math.round(d / 86400000) + 'd ago';
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function clock(t) { return new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function dayLabel(t) {
    var d = new Date(t), today = new Date();
    var y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function isToday(t) { return new Date(t).toDateString() === new Date().toDateString(); }

  function needsAttention(l) {
    if (l.stage !== 'New' && l.stage !== 'Contacted') return false;
    var last = acts(l.id)[0];
    return !last || Date.now() - last.at > 86400000 || (last.dir === 'in');
  }

  function addActivity(leadId, a) {
    a.id = nextId('A');
    a.leadId = leadId;
    a.at = a.at || Date.now();
    a.by = a.by || 'Front desk';
    state.activities.push(a);
    var l = byId(leadId);
    if (l && a.at > l.lastActivityAt) l.lastActivityAt = a.at;
    save();
    return a;
  }

  function toast(msg, cls) {
    var root = doc.getElementById('toasts');
    var el = doc.createElement('div');
    el.className = 'toast' + (cls ? ' ' + cls : '');
    el.innerHTML = msg;
    root.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 3600);
    setTimeout(function () { el.remove(); }, 4100);
  }

  /* ---------- routing ---------- */

  function route() {
    var h = location.hash.replace(/^#\/?/, '') || 'leads';
    var parts = h.split('/');
    var view = parts[0];
    doc.querySelectorAll('[data-view]').forEach(function (a) {
      a.classList.toggle('current', a.getAttribute('data-view') === view);
    });
    doc.getElementById('nav-leads-count').textContent = state.leads.filter(function (l) { return l.stage !== 'Patient' && l.stage !== 'Lost'; }).length;
    var main = doc.getElementById('main');
    if (view === 'leads' && parts[1]) renderLead(main, parts[1]);
    else if (view === 'activity') renderActivity(main);
    else if (view === 'automations') renderAutomations(main);
    else if (view === 'sources') renderSources(main);
    else renderLeads(main);
    main.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  /* ---------- Leads list ---------- */

  function renderLeads(main) {
    var open = state.leads.filter(function (l) { return l.stage !== 'Patient' && l.stage !== 'Lost'; });
    var newToday = state.leads.filter(function (l) { return isToday(l.createdAt); }).length;
    var awaiting = state.leads.filter(function (l) { return l.stage === 'New' || l.stage === 'Contacted'; }).length;
    var booked = state.leads.filter(function (l) { return l.stage === 'Booked'; }).length;
    var converted = state.leads.filter(function (l) { return l.stage === 'Patient' && Date.now() - (l.convertedAt || 0) < 30 * 86400000; }).length;

    main.innerHTML =
      '<div class="page-head"><div><p class="eyebrow">Lead desk</p><h1>Leads</h1><p class="lede">' + open.length + ' open · every new lead gets a first-touch text within 60 seconds.</p></div>' +
      '<div class="actions"><button class="btn ghost sm" id="lv-simulate" type="button">Simulate incoming lead</button><button class="btn sm" id="lv-new" type="button">New lead</button></div></div>' +
      '<div class="stats">' +
      stat(newToday, 'New today') + stat(awaiting, 'Awaiting reply') + stat(booked, 'Booked') + stat(converted, 'To ChiroHD · 30d') +
      '</div>' +
      '<div class="filters">' +
      '<input class="search" id="lv-search" type="search" placeholder="Search name, phone, email" value="' + esc(ui.search) + '">' +
      '<div class="chips" id="lv-stages">' + ['all', 'attention'].concat(STAGES).concat(['Lost']).map(function (s) {
        var label = s === 'all' ? 'All' : s === 'attention' ? 'Needs attention' : s;
        return '<button type="button" class="chip' + (ui.stage === s ? ' on' : '') + '" data-stage="' + s + '">' + label + '</button>';
      }).join('') + '</div>' +
      '<select class="mini-select" id="lv-source"><option value="all">All sources</option>' + Object.keys(SOURCES).map(function (k) {
        return '<option value="' + k + '"' + (ui.source === k ? ' selected' : '') + '>' + SOURCES[k].name + '</option>';
      }).join('') + '</select>' +
      '</div>' +
      '<div class="table-wrap" id="lv-table"></div>';

    function stat(n, label) { return '<div class="stat"><div class="n">' + n + '</div><span class="micro">' + label + '</span></div>'; }

    doc.getElementById('lv-simulate').addEventListener('click', function () { simulateLead(); });
    doc.getElementById('lv-new').addEventListener('click', openNewLead);
    doc.getElementById('lv-search').addEventListener('input', function (e) { ui.search = e.target.value; drawTable(); });
    doc.getElementById('lv-source').addEventListener('change', function (e) { ui.source = e.target.value; drawTable(); });
    doc.getElementById('lv-stages').addEventListener('click', function (e) {
      var b = e.target.closest('[data-stage]');
      if (!b) return;
      ui.stage = b.getAttribute('data-stage');
      doc.querySelectorAll('#lv-stages .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      drawTable();
    });
    drawTable();
  }

  function drawTable() {
    var wrap = doc.getElementById('lv-table');
    if (!wrap) return;
    var q = ui.search.trim().toLowerCase();
    var rows = state.leads.filter(function (l) {
      if (ui.stage === 'attention') { if (!needsAttention(l)) return false; }
      else if (ui.stage !== 'all' && l.stage !== ui.stage) return false;
      if (ui.stage === 'all' && (l.stage === 'Lost')) return false;
      if (ui.source !== 'all' && l.source !== ui.source) return false;
      if (q && (fullName(l) + ' ' + l.phone + ' ' + l.email).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return b.lastActivityAt - a.lastActivityAt; });

    if (!rows.length) { wrap.innerHTML = '<div class="empty">No leads match.</div>'; return; }

    wrap.innerHTML = '<table class="table"><thead><tr><th>Lead</th><th>Source</th><th>Stage</th><th class="hide-m">Interested in</th><th>Next action</th><th class="hide-m">Owner</th><th class="r">Last activity</th></tr></thead><tbody>' +
      rows.map(function (l) {
        var last = acts(l.id)[0];
        return '<tr data-id="' + l.id + '" tabindex="0">' +
          '<td><span class="name">' + (needsAttention(l) ? '<span class="dot"></span>' : '') + esc(fullName(l)) + '</span><span class="sub">' + esc(l.phone) + ' · ' + esc(l.who) + '</span></td>' +
          '<td><span class="pill src src-' + l.source + '">' + SOURCES[l.source].short + '</span><span class="sub">' + esc(l.campaign) + '</span></td>' +
          '<td><span class="pill stage-' + l.stage + '">' + l.stage + '</span></td>' +
          '<td class="hide-m small">' + esc(l.interests.slice(0, 2).join(', ')) + '</td>' +
          '<td class="small">' + (l.nextAction ? esc(l.nextAction) : '<span class="muted">—</span>') + '</td>' +
          '<td class="hide-m small">' + esc(l.owner) + '</td>' +
          '<td class="r small nowrap"><span class="muted">' + rel(l.lastActivityAt) + '</span><span class="sub">' + (last ? actShort(last) : '') + '</span></td>' +
          '</tr>';
      }).join('') + '</tbody></table>';

    wrap.querySelectorAll('tr[data-id]').forEach(function (tr) {
      function go() { location.hash = '#/leads/' + tr.getAttribute('data-id'); }
      tr.addEventListener('click', go);
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    });
  }

  function actShort(a) {
    if (a.type === 'sms') return (a.dir === 'in' ? 'Text received' : 'Text sent');
    if (a.type === 'email') return (a.dir === 'in' ? 'Email received' : 'Email sent');
    if (a.type === 'call') return 'Call · ' + (a.outcome || 'logged');
    if (a.type === 'note') return 'Note';
    if (a.type === 'convert') return 'Sent to ChiroHD';
    return 'System';
  }

  /* ---------- Lead detail ---------- */

  function renderLead(main, id) {
    var l = byId(id);
    if (!l) { location.hash = '#/leads'; return; }
    var lost = l.stage === 'Lost';
    var idx = STAGES.indexOf(l.stage);
    var converted = l.stage === 'Patient';

    main.innerHTML =
      '<a class="back" href="#/leads">&larr; Leads</a>' +
      '<div class="lead-head"><div>' +
      '<h1>' + esc(fullName(l)) + '</h1>' +
      '<div class="meta"><span class="pill src src-' + l.source + '">' + SOURCES[l.source].name + '</span><span>' + esc(l.campaign) + '</span><span>Prefers <strong>' + esc(l.preferred) + '</strong></span><span>Added ' + rel(l.createdAt) + '</span>' +
      (l.chirohdRef ? '<span>ChiroHD <strong>' + esc(l.chirohdRef) + '</strong></span>' : '') + '</div>' +
      '</div><div class="actions">' +
      (converted
        ? '<button class="btn ghost sm" type="button" id="ld-view-chirohd">Open in ChiroHD</button>'
        : lost
          ? '<button class="btn ghost sm" type="button" id="ld-reopen">Reopen lead</button>'
          : '<button class="link-btn danger" type="button" id="ld-lost">Mark lost</button><button class="btn sm" type="button" id="ld-convert">Convert &rarr; ChiroHD</button>') +
      '</div></div>' +

      '<div class="path' + (lost ? ' is-lost' : '') + '" role="group" aria-label="Lead journey">' +
      STAGES.map(function (s, i) {
        var cls = lost ? '' : i < idx ? 'done' : i === idx ? 'current' : '';
        var dis = converted || lost || s === 'Patient';
        return '<button type="button" class="' + cls + '" data-stage="' + s + '"' + (dis ? ' disabled' : '') + ' title="' + esc(STAGE_HINT[s]) + '">' + s + '<small>' + stageSub(s, l) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="path-note"><span>' + (lost ? '<strong>Lost.</strong> ' + esc(l.lostReason || '') : '<strong>' + l.stage + '.</strong> ' + STAGE_HINT[l.stage]) + '</span>' +
      (l.nextAction && !lost && !converted ? '<span>Next: <strong>' + esc(l.nextAction) + '</strong></span>' : '') + '</div>' +

      '<div class="lead-grid"><div>' +
      '<div class="card"><h3>Details</h3>' +
      field('First name', 'first', l.first) + field('Last name', 'last', l.last) +
      field('Phone', 'phone', l.phone, 'tel') + field('Email', 'email', l.email, 'email') +
      select('Preferred contact', 'preferred', ['Text', 'Call', 'Email'], l.preferred) +
      select('Who is seeking care', 'who', ['Myself', 'My child', 'Myself and my family'], l.who) +
      '<label class="field"><span>Interested in</span></label><div class="tags">' + l.interests.map(function (i) { return '<span class="tag">' + esc(i) + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="card"><h3>Working it</h3>' +
      select('Owner', 'owner', OWNERS, l.owner) +
      field('Next action', 'nextAction', l.nextAction || '', 'text', 'e.g. Call attempt 2 due Fri') +
      '<dl class="kv"><dt>Source</dt><dd>' + SOURCES[l.source].name + '</dd><dt>Campaign</dt><dd>' + esc(l.campaign) + '</dd><dt>Lead ID</dt><dd>' + l.id + '</dd></dl>' +
      '<div class="consent" style="margin-top:1rem">' + (l.consent.sms ? '<span class="ok">&#10003;</span><span>SMS consent captured ' + new Date(l.consent.at).toLocaleDateString() + ' via ' + SOURCES[l.source].short + ' form</span>' : '<span class="dot red"></span><span>No SMS consent · text is off for this lead</span>') + '</div>' +
      '</div>' +
      '</div><div>' +
      composer(l) +
      '<div class="feed"><div class="feed-head"><h3>Activity</h3><div class="chips" id="ld-feed-filter">' + feedChips() + '</div></div><ul class="feed-list" id="ld-feed"></ul></div>' +
      '</div></div>';

    function stageSub(s, l) {
      if (s === 'Patient' && l.chirohdRef) return l.chirohdRef;
      if (s === 'New') return rel(l.createdAt);
      return '';
    }
    function field(label, key, val, type, ph) {
      return '<label class="field"><span>' + label + '</span><input type="' + (type || 'text') + '" data-key="' + key + '" value="' + esc(val) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></label>';
    }
    function select(label, key, opts, val) {
      return '<label class="field"><span>' + label + '</span><select data-key="' + key + '">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></label>';
    }

    main.querySelectorAll('[data-key]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        l[inp.getAttribute('data-key')] = inp.value;
        save();
        if (inp.getAttribute('data-key') === 'first' || inp.getAttribute('data-key') === 'last') main.querySelector('h1').textContent = fullName(l);
        toast('Saved');
      });
    });

    main.querySelectorAll('.path button[data-stage]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-stage');
        if (s === l.stage) return;
        setStage(l, s, 'Front desk');
        renderLead(main, l.id);
      });
    });

    var convertBtn = doc.getElementById('ld-convert');
    if (convertBtn) convertBtn.addEventListener('click', function () { openConvert(l); });
    var lostBtn = doc.getElementById('ld-lost');
    if (lostBtn) lostBtn.addEventListener('click', function () { openLost(l); });
    var reopenBtn = doc.getElementById('ld-reopen');
    if (reopenBtn) reopenBtn.addEventListener('click', function () {
      l.stage = 'Contacted'; l.lostReason = '';
      addActivity(l.id, { type: 'system', body: 'Lead reopened' });
      renderLead(main, l.id);
    });
    var viewBtn = doc.getElementById('ld-view-chirohd');
    if (viewBtn) viewBtn.addEventListener('click', function () { toast('Would open ' + l.chirohdRef + ' in ChiroHD (deep link once confirmed with vendor).'); });

    doc.getElementById('ld-feed-filter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]');
      if (!b) return;
      ui.feedFilter = b.getAttribute('data-f');
      doc.querySelectorAll('#ld-feed-filter .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      drawFeed('ld-feed', acts(l.id), false);
    });

    wireComposer(l, main);
    drawFeed('ld-feed', acts(l.id), false);
  }

  function setStage(l, s, by) {
    var from = l.stage;
    l.stage = s;
    if (s === 'New') l.nextAction = 'Awaiting first reply';
    else if (s === 'Contacted' && from === 'New') l.nextAction = 'Awaiting first reply';
    else if (s === 'Engaged') l.nextAction = 'Send booking link';
    else if (s === 'Booked') l.nextAction = 'Confirm first visit';
    addActivity(l.id, { type: 'system', body: 'Stage ' + from + ' → ' + s, by: by || 'System' });
  }

  function feedChips() {
    return [['all', 'All'], ['sms', 'Texts'], ['email', 'Emails'], ['call', 'Calls'], ['note', 'Notes'], ['system', 'System']].map(function (p) {
      return '<button type="button" class="chip' + (ui.feedFilter === p[0] ? ' on' : '') + '" data-f="' + p[0] + '">' + p[1] + '</button>';
    }).join('');
  }

  /* ---------- Composer ---------- */

  function composer(l) {
    var tabs = [['sms', 'Text'], ['email', 'Email'], ['call', 'Log call'], ['note', 'Note']];
    return '<div class="composer" id="composer"><div class="composer-tabs">' + tabs.map(function (t) {
      return '<button type="button" data-tab="' + t[0] + '" class="' + (ui.composerTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
    }).join('') + '</div><div class="composer-body" id="composer-body"></div></div>';
  }

  function wireComposer(l, main) {
    var body = doc.getElementById('composer-body');
    var tabsEl = main.querySelector('.composer-tabs');
    tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      ui.composerTab = b.getAttribute('data-tab');
      tabsEl.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      draw();
    });
    draw();

    function draw() {
      var t = ui.composerTab;
      var disabled = l.stage === 'Lost';
      if (t === 'sms') {
        var noConsent = !l.consent.sms;
        body.innerHTML =
          '<textarea id="c-body" placeholder="Write a text to ' + esc(l.first) + '…"' + (noConsent ? ' disabled' : '') + '></textarea>' +
          '<div class="composer-foot"><div class="left"><span class="to">To <strong>' + esc(l.phone) + '</strong></span>' +
          '<select class="mini-select" id="c-tpl"><option value="">Templates</option><option value="welcome">Welcome</option><option value="followup">Follow-up</option><option value="booking">Booking link</option><option value="reminder">Visit reminder</option></select>' +
          '<span class="count" id="c-count">0 / 160</span></div>' +
          '<button class="btn sm" type="button" id="c-send"' + (noConsent || disabled ? ' disabled' : '') + '>Send text</button></div>' +
          (noConsent ? '<p class="small muted" style="margin-top:.6rem">This lead has not consented to texts. Use email or a call.</p>' : '');
        var ta = doc.getElementById('c-body');
        var count = doc.getElementById('c-count');
        ta.addEventListener('input', function () {
          var n = ta.value.length;
          count.textContent = n + ' / 160' + (n > 160 ? ' · ' + Math.ceil(n / 153) + ' segments' : '');
          count.classList.toggle('over', n > 160);
        });
        doc.getElementById('c-tpl').addEventListener('change', function (e) {
          if (!e.target.value) return;
          ta.value = fill(TEMPLATES[e.target.value], l);
          ta.dispatchEvent(new Event('input'));
          e.target.value = '';
          ta.focus();
        });
        doc.getElementById('c-send').addEventListener('click', function () {
          var v = ta.value.trim();
          if (!v) { ta.focus(); return; }
          addActivity(l.id, { type: 'sms', dir: 'out', body: v });
          if (l.stage === 'New') setStage(l, 'Contacted', 'Front desk');
          toast('Text sent to ' + esc(l.first), 'teal');
          renderLead(main, l.id);
        });
      } else if (t === 'email') {
        body.innerHTML =
          '<input class="subject" id="c-subject" type="text" placeholder="Subject">' +
          '<textarea id="c-body" placeholder="Write an email to ' + esc(l.first) + '…"></textarea>' +
          '<div class="composer-foot"><div class="left"><span class="to">To <strong>' + esc(l.email) + '</strong></span>' +
          '<select class="mini-select" id="c-tpl"><option value="">Templates</option><option value="intro">About Flow Wellness</option><option value="pricing">Pricing &amp; first visit</option></select></div>' +
          '<button class="btn sm" type="button" id="c-send"' + (disabled ? ' disabled' : '') + '>Send email</button></div>';
        var sub = doc.getElementById('c-subject'), eb = doc.getElementById('c-body');
        doc.getElementById('c-tpl').addEventListener('change', function (e) {
          if (e.target.value === 'intro') {
            sub.value = 'A little more about Flow Wellness';
            eb.value = 'Hi ' + l.first + ',\n\nThanks for reaching out. We are a Gonstead chiropractic office focused on nervous-system health for families, opening this winter on the Space Coast.\n\nIf a short call would help, reply with a good time and we will ring you.\n\nWarmly,\nThe Flow Wellness team';
          } else if (e.target.value === 'pricing') {
            sub.value = 'Your first visit at Flow Wellness';
            eb.value = 'Hi ' + l.first + ',\n\nYour first visit includes a consultation, a full Gonstead exam, and X-rays if needed. We are self-pay with one clear price, and HSA/FSA cards are welcome.\n\nReserve a time here: sked.link/flowwellness\n\nThe Flow Wellness team';
          }
          e.target.value = '';
          eb.focus();
        });
        doc.getElementById('c-send').addEventListener('click', function () {
          var v = eb.value.trim();
          if (!v) { eb.focus(); return; }
          addActivity(l.id, { type: 'email', dir: 'out', subject: sub.value.trim() || '(no subject)', body: v });
          if (l.stage === 'New') setStage(l, 'Contacted', 'Front desk');
          toast('Email sent to ' + esc(l.first), 'teal');
          renderLead(main, l.id);
        });
      } else if (t === 'call') {
        body.innerHTML =
          '<div class="call-row"><label class="field"><span>Outcome</span><select id="c-outcome"><option>Connected</option><option>Voicemail</option><option>No answer</option><option>Wrong number</option></select></label>' +
          '<textarea id="c-body" placeholder="What was said, what is next…"></textarea></div>' +
          '<div class="composer-foot"><div class="left"><span class="to">Called <strong>' + esc(l.phone) + '</strong></span><span class="count">' + callCount(l) + ' of 3 attempts used</span></div>' +
          '<button class="btn sm" type="button" id="c-send"' + (disabled ? ' disabled' : '') + '>Log call</button></div>';
        doc.getElementById('c-send').addEventListener('click', function () {
          var o = doc.getElementById('c-outcome').value;
          var v = doc.getElementById('c-body').value.trim();
          addActivity(l.id, { type: 'call', dir: 'out', outcome: o, body: v || (o + '.') });
          if (o === 'Connected' && (l.stage === 'New' || l.stage === 'Contacted')) setStage(l, 'Engaged', 'Front desk');
          else if (l.stage === 'New') setStage(l, 'Contacted', 'Front desk');
          var n = callCount(l);
          if (n >= 3 && o !== 'Connected') { l.nextAction = 'Call cap reached · send final email'; save(); }
          else if (o !== 'Connected') { l.nextAction = 'Call attempt ' + (n + 1); save(); }
          toast('Call logged');
          renderLead(main, l.id);
        });
      } else {
        body.innerHTML =
          '<textarea id="c-body" placeholder="Internal note (not sent to the lead)"></textarea>' +
          '<div class="composer-foot"><div class="left"><span class="to">Visible to the team only</span></div><button class="btn ghost sm" type="button" id="c-send">Save note</button></div>';
        doc.getElementById('c-send').addEventListener('click', function () {
          var v = doc.getElementById('c-body').value.trim();
          if (!v) return;
          addActivity(l.id, { type: 'note', body: v });
          renderLead(main, l.id);
        });
      }
    }
  }

  function callCount(l) { return acts(l.id).filter(function (a) { return a.type === 'call'; }).length; }

  /* ---------- Feed ---------- */

  var ICONS = {
    sms: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/></svg>',
    email: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>',
    call: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/></svg>',
    system: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    convert: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  function feedTitle(a, withLead) {
    var l = byId(a.leadId);
    var who = withLead && l ? '<a class="lead-link" href="#/leads/' + l.id + '">' + esc(fullName(l)) + '</a>' : '';
    var t;
    if (a.type === 'sms') t = a.dir === 'in' ? '<strong>Text</strong> from ' + (who || esc(l ? l.first : '')) : '<strong>Text</strong> to ' + (who || esc(l ? l.first : '')) + ' <span class="muted">by ' + esc(a.by) + '</span>';
    else if (a.type === 'email') t = a.dir === 'in' ? '<strong>Email</strong> from ' + (who || esc(l ? l.first : '')) : '<strong>Email</strong> to ' + (who || esc(l ? l.first : '')) + ' <span class="muted">by ' + esc(a.by) + '</span>';
    else if (a.type === 'call') t = '<strong>Call</strong> ' + (who ? 'with ' + who + ' ' : '') + '<span class="muted">' + esc(a.outcome || '') + ' · ' + esc(a.by) + '</span>';
    else if (a.type === 'note') t = '<strong>Note</strong> ' + (who ? 'on ' + who + ' ' : '') + '<span class="muted">by ' + esc(a.by) + '</span>';
    else if (a.type === 'convert') t = '<strong>Converted</strong> ' + (who ? who + ' ' : '') + '<span class="muted">by ' + esc(a.by) + '</span>';
    else t = '<strong>System</strong>' + (who ? ' · ' + who : '');
    if (a.auto) t += ' <span class="auto">Automated</span>';
    return t;
  }

  function drawFeed(elId, list, withLead) {
    var el = doc.getElementById(elId);
    if (!el) return;
    var f = ui.feedFilter;
    var rows = list.filter(function (a) {
      if (f === 'all') return true;
      if (f === 'system') return a.type === 'system' || a.type === 'convert';
      return a.type === f;
    });
    if (!rows.length) { el.innerHTML = '<li class="empty">Nothing here yet.</li>'; return; }
    var html = '', day = '';
    rows.forEach(function (a) {
      var d = dayLabel(a.at);
      if (d !== day) { day = d; html += '<li class="day-sep">' + d + '</li>'; }
      var body = '';
      if (a.type === 'email') body = '<div class="body">' + (a.subject ? '<span class="subj">' + esc(a.subject) + '</span>' : '') + esc(a.body) + '</div>';
      else if (a.body) body = '<div class="body">' + esc(a.body) + '</div>';
      html += '<li class="feed-item type-' + a.type + (a.dir ? ' dir-' + a.dir : '') + '"><div class="ico">' + ICONS[a.type] + '</div><div><div class="title">' + feedTitle(a, withLead) + '</div>' + body + '</div><div class="when">' + clock(a.at) + '<small>' + rel(a.at) + '</small></div></li>';
    });
    el.innerHTML = html;
  }

  /* ---------- Activity view ---------- */

  function renderActivity(main) {
    main.innerHTML =
      '<div class="page-head"><div><p class="eyebrow">Lead desk</p><h1>Activity</h1><p class="lede">Every text, email, call and note across all leads, newest first.</p></div>' +
      '<div class="chips" id="av-filter">' + feedChips() + '</div></div>' +
      '<ul class="feed-list" id="av-feed"></ul>';
    var all = state.activities.slice().sort(function (a, b) { return b.at - a.at; });
    doc.getElementById('av-filter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]');
      if (!b) return;
      ui.feedFilter = b.getAttribute('data-f');
      doc.querySelectorAll('#av-filter .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      drawFeed('av-feed', all, true);
    });
    drawFeed('av-feed', all, true);
  }

  /* ---------- Automations view ---------- */

  function renderAutomations(main) {
    var tpl = state.tpl || TEMPLATES.welcome;
    main.innerHTML =
      '<div class="page-head"><div><p class="eyebrow">Lead desk</p><h1>Automations</h1><p class="lede">One first-touch sequence runs the moment a lead lands. Any reply from the lead stops it and hands the conversation to a person.</p></div></div>' +
      '<div class="auto-grid"><div>' +
      '<div class="card"><div class="seq-head"><div><h3 style="margin-bottom:0">First touch</h3><p>Same sequence for every source, so a lead looks the same no matter where it came from.</p></div></div>' +
      '<ol class="steps">' +
      '<li class="step"><div class="n">I</div><div><div class="t"><strong>Welcome text</strong><span class="micro">Immediately · within 60 s</span></div><div class="d">Confirms we got the request, names their interest, sets expectations.</div>' +
      '<textarea id="au-sms">' + esc(tpl) + '</textarea><div class="hint" id="au-hint">Merge fields: {first} {interest} {who}. ' + tpl.length + ' characters.</div></div></li>' +
      '<li class="step"><div class="n">II</div><div><div class="t"><strong>Intro email</strong><span class="micro">+1 hour · if no reply</span></div><div class="d">"A little more about Flow Wellness": who we are, what the first visit looks like, how to reach us.</div></div></li>' +
      '<li class="step"><div class="n">III</div><div><div class="t"><strong>Call task for the desk</strong><span class="micro">+1 day · if no reply</span></div><div class="d">Creates a call task and sets Next action on the lead. Repeats at +3 days and +7 days, then stops.</div></div></li>' +
      '<li class="step"><div class="n">IV</div><div><div class="t"><strong>Final text + rest</strong><span class="micro">+10 days · if no reply</span></div><div class="d">"We\'ll be here when you\'re ready" with the booking link. Lead stays open, no further automation.</div></div></li>' +
      '</ol></div>' +
      '<div class="card"><h3>Runs for<span class="micro">Per source</span></h3><ul class="rules">' +
      Object.keys(SOURCES).map(function (k) {
        return '<li><div><strong>' + SOURCES[k].name + '</strong><span>' + (k === 'referral' ? 'Usually already spoke to us, so off by default.' : 'Every lead that arrives from ' + SOURCES[k].name + '.') + '</span></div>' +
          '<input class="switch" type="checkbox" data-auto="' + k + '"' + (state.automations[k].on ? ' checked' : '') + ' aria-label="Run for ' + SOURCES[k].name + '"></li>';
      }).join('') + '</ul></div>' +
      '</div><div>' +
      '<div class="card"><h3>Guardrails<span class="micro">Apply to every lead</span></h3><ul class="rules">' +
      rule('Text first, email last', 'Welcome text within 60 seconds; email only after the text has had an hour.') +
      rule('Stop on reply', 'Any inbound text, email or connected call ends the automation and moves the lead to Engaged.') +
      rule('Three calls, then stop', 'Call tasks are created for the team, not dialed automatically. After the third unanswered attempt the lead gets one final email and rests.') +
      rule('Quiet hours 8 pm – 8 am', 'Anything due overnight sends at 8:00 am Eastern.') +
      rule('Consent required', 'Texts only go to leads whose form captured SMS consent. STOP replies flip consent off and end texting immediately.') +
      rule('One conversation per lead', 'Automated and human messages share the same thread so nothing is sent twice.') +
      '</ul></div>' +
      '<div class="card"><h3>Handoff to ChiroHD<span class="micro">What Convert does</span></h3><p class="small" style="color:var(--ink-2)">ChiroHD has no public API today, so the desk converts a lead by creating the new-patient record through ChiroHD\'s Zapier connector and texting the SKED booking link. Booking and visit events flow back once the ChiroHD webhook is confirmed with the vendor; until then the front desk marks Booked here.</p></div>' +
      '</div></div>';

    function rule(t, d) { return '<li><div><strong>' + t + '</strong><span>' + d + '</span></div></li>'; }

    main.querySelectorAll('[data-auto]').forEach(function (sw) {
      sw.addEventListener('change', function () {
        state.automations[sw.getAttribute('data-auto')].on = sw.checked;
        save();
        toast('First touch ' + (sw.checked ? 'on' : 'off') + ' for ' + SOURCES[sw.getAttribute('data-auto')].name);
      });
    });
    var ta = doc.getElementById('au-sms');
    ta.addEventListener('change', function () {
      state.tpl = ta.value;
      save();
      doc.getElementById('au-hint').textContent = 'Merge fields: {first} {interest} {who}. ' + ta.value.length + ' characters.';
      toast('Template saved');
    });
  }

  /* ---------- Sources view ---------- */

  function renderSources(main) {
    var thirty = Date.now() - 30 * 86400000;
    main.innerHTML =
      '<div class="page-head"><div><p class="eyebrow">Lead desk</p><h1>Sources</h1><p class="lede">Where leads come from and how they get in. Each connection posts straight into the desk; nothing is polled or exported by hand.</p></div></div>' +
      '<div class="src-grid">' +
      Object.keys(SOURCES).map(function (k) {
        var ls = state.leads.filter(function (l) { return l.source === k; });
        var recent = ls.filter(function (l) { return l.createdAt > thirty; });
        var booked = ls.filter(function (l) { return l.stage === 'Booked' || l.stage === 'Patient'; });
        var last = ls.slice().sort(function (a, b) { return b.createdAt - a.createdAt; })[0];
        var on = k !== 'referral';
        return '<div class="card src-card"><div class="top"><div><h3 style="margin-bottom:0"><span class="pill src src-' + k + '"></span>' + SOURCES[k].name + '</h3></div><span class="status' + (on ? '' : ' off') + '">' + (on ? '<span class="dot teal"></span>Connected' : '<span class="dot grey"></span>Manual entry') + '</span></div>' +
          '<p class="desc">' + srcDesc(k) + '</p>' +
          '<div class="nums"><div><div class="n">' + recent.length + '</div><span class="micro">Leads · 30d</span></div><div><div class="n">' + booked.length + '</div><span class="micro">Booked</span></div><div><div class="n">' + (recent.length ? Math.round(booked.length / ls.length * 100) : 0) + '%</div><span class="micro">Book rate</span></div></div>' +
          '<div class="foot"><span class="small">' + (last ? 'Last lead ' + rel(last.createdAt) + ' · ' + esc(fullName(last)) : 'No leads yet') + '</span>' +
          '<div style="display:flex;gap:.5rem">' + (on ? '<button class="btn ghost sm" type="button" data-test="' + k + '">Test connection</button>' : '') + '<button class="btn ghost sm" type="button" data-sim="' + k + '">Simulate lead</button></div></div></div>';
      }).join('') + '</div>' +
      '<div class="card flow-note"><h3>How a lead gets in<span class="micro">Ingestion path</span></h3><div class="flow-line"><b>Ad form submitted</b><i>&rarr;</i><b>Meta / Google webhook</b><i>&rarr;</i><b>Lead desk (seconds)</b><i>&rarr;</i><b>Consent check</b><i>&rarr;</i><b>Welcome text (&lt; 60 s)</b><i>&rarr;</i><b>Desk works the lead</b><i>&rarr;</i><b>Convert &rarr; ChiroHD</b></div>' +
      '<p class="small" style="color:var(--ink-2);margin-top:1rem">Duplicates are matched on phone first, then email. A returning lead gets its existing record re-opened with a new source line instead of a second record.</p></div>';

    function srcDesc(k) {
      return {
        meta: 'Instant Forms on Facebook and Instagram ads. Fields map 1:1 to the desk (name, phone, email, who is seeking care, interests). Consent checkbox is on the form.',
        google: 'Lead form extensions on Search campaigns. Delivered by webhook with the campaign and keyword that produced the lead.',
        website: 'The Reserve form on flowwellnesschiro.com. Same field set as the ad forms so every lead looks the same in the desk.',
        referral: 'Walk-ins, community events and patient referrals. Added by the desk with the New lead button.'
      }[k];
    }

    main.querySelectorAll('[data-test]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true; b.textContent = 'Testing…';
        setTimeout(function () { b.disabled = false; b.textContent = 'Test connection'; toast(SOURCES[b.getAttribute('data-test')].name + ' webhook responded · 212 ms', 'teal'); }, 900);
      });
    });
    main.querySelectorAll('[data-sim]').forEach(function (b) {
      b.addEventListener('click', function () { simulateLead(b.getAttribute('data-sim')); });
    });
  }

  /* ---------- Simulate ingestion ---------- */

  function simulateLead(source) {
    var src = source || (Math.random() < 0.5 ? 'meta' : 'google');
    var p = POOL[Math.floor(Math.random() * POOL.length)];
    var taken = state.leads.some(function (l) { return l.first === p.first && l.last === p.last; });
    if (taken) p = { first: p.first, last: p.last + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.', who: p.who, interests: p.interests, preferred: p.preferred };
    var camps = CAMPAIGNS[src];
    var now = Date.now();
    var l = {
      id: nextId('L'), first: p.first, last: p.last,
      phone: '(321) 555-0' + (100 + Math.floor(Math.random() * 899)),
      email: (p.first + '.' + p.last.replace(/[^a-z]/gi, '')).toLowerCase() + '@example.com',
      preferred: p.preferred, who: p.who, interests: p.interests.slice(),
      source: src, campaign: camps[Math.floor(Math.random() * camps.length)],
      stage: 'New', createdAt: now, lastActivityAt: now, owner: 'Front desk',
      nextAction: 'Awaiting first reply',
      consent: { sms: src !== 'referral', at: now }
    };
    state.leads.push(l);
    addActivity(l.id, { type: 'system', body: 'Lead received from ' + SOURCES[src].name + ' · ' + l.campaign, by: 'System' });
    toast('<strong>New lead</strong> · ' + esc(fullName(l)) + ' from ' + SOURCES[src].name, 'teal');
    refreshIfList(l.id);

    var auto = state.automations[src];
    if (auto.on && l.consent.sms) {
      setTimeout(function () {
        addActivity(l.id, { type: 'sms', dir: 'out', body: fill(state.tpl || TEMPLATES.welcome, l), auto: true, by: 'Automation' });
        l.stage = 'Contacted';
        save();
        toast('Welcome text sent to ' + esc(l.first) + ' automatically');
        refreshIfList(l.id);
        var h = location.hash;
        if (h === '#/leads/' + l.id) renderLead(doc.getElementById('main'), l.id);
        else if (h === '#/activity') renderActivity(doc.getElementById('main'));
      }, 2500);
    }
  }

  function refreshIfList(id) {
    var h = location.hash.replace(/^#\/?/, '') || 'leads';
    if (h === 'leads') {
      route();
      var tr = doc.querySelector('tr[data-id="' + id + '"]');
      if (tr) tr.classList.add('flash');
    } else if (h === 'activity' || h === 'sources') route();
    doc.getElementById('nav-leads-count').textContent = state.leads.filter(function (l) { return l.stage !== 'Patient' && l.stage !== 'Lost'; }).length;
  }

  /* ---------- Modals ---------- */

  function openModal(html) {
    var root = doc.getElementById('modal-root');
    root.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    root.hidden = false;
    function close(e) { if (e.target === root) closeModal(); }
    root.addEventListener('click', close);
    doc.addEventListener('keydown', esc);
    function esc(e) { if (e.key === 'Escape') closeModal(); }
    root._cleanup = function () { root.removeEventListener('click', close); doc.removeEventListener('keydown', esc); };
    var first = root.querySelector('input, select, textarea, button');
    if (first) first.focus();
    return root;
  }
  function closeModal() {
    var root = doc.getElementById('modal-root');
    if (root._cleanup) root._cleanup();
    root.hidden = true;
    root.innerHTML = '';
  }

  function openConvert(l) {
    var root = openModal(
      '<p class="eyebrow">Convert</p><h2>Send ' + esc(l.first) + ' to ChiroHD</h2>' +
      '<p class="lede">This ends the lead journey here and starts the patient journey in ChiroHD and SKED.</p>' +
      '<fieldset class="group"><legend class="micro" style="margin-bottom:.4rem">First visit with</legend><div class="choices">' +
      '<label><input type="radio" name="cv-doc" value="Dr. Carter Matteson"' + (l.owner !== 'Dr. Corey' ? ' checked' : '') + '><span>Dr. Carter</span></label>' +
      '<label><input type="radio" name="cv-doc" value="Dr. Corey Matteson"' + (l.owner === 'Dr. Corey' ? ' checked' : '') + '><span>Dr. Corey</span></label>' +
      '<label><input type="radio" name="cv-doc" value="Either"><span>Either</span></label></div></fieldset>' +
      '<ul class="handoff">' +
      '<li><span class="n">I</span><div><strong>Create new-patient lead in ChiroHD</strong><span>Name, phone, email, who is seeking care, and interests are pushed through ChiroHD\'s Zapier connector. Reference number comes back on the record.</span></div></li>' +
      '<li><span class="n">II</span><div><strong>Text the SKED booking link</strong><span>' + (l.consent.sms ? 'Sent to ' + esc(l.phone) + ' from this conversation so the reply lands here.' : 'Skipped: no SMS consent. Link goes by email instead.') + '</span></div></li>' +
      '<li><span class="n">III</span><div><strong>Mark the lead as Patient</strong><span>Automations stop, the record stays searchable, and the activity feed keeps the full history.</span></div></li>' +
      '</ul>' +
      '<div class="callout"><strong>Note on ChiroHD.</strong> ChiroHD has no public API. Conversion is a one-way push via its Zapier connector. Whether the first visit was booked is learned from the ChiroHD webhook once the vendor confirms the payload; until then the desk marks Booked by hand.</div>' +
      '<div class="foot"><button class="btn ghost sm" type="button" id="cv-cancel">Cancel</button><button class="btn sm" type="button" id="cv-go">Convert &amp; send</button></div>'
    );
    doc.getElementById('cv-cancel').addEventListener('click', closeModal);
    doc.getElementById('cv-go').addEventListener('click', function () {
      var go = doc.getElementById('cv-go');
      go.disabled = true; go.textContent = 'Sending to ChiroHD…';
      var docName = root.querySelector('input[name="cv-doc"]:checked').value;
      setTimeout(function () {
        var ref = 'FWC-' + (1043 + state.leads.filter(function (x) { return x.chirohdRef; }).length);
        l.chirohdRef = ref;
        l.convertedAt = Date.now();
        l.stage = 'Patient';
        l.nextAction = '';
        if (docName.indexOf('Carter') >= 0) l.owner = 'Dr. Carter';
        else if (docName.indexOf('Corey') >= 0) l.owner = 'Dr. Corey';
        addActivity(l.id, { type: 'convert', body: 'Sent to ChiroHD as new patient · ' + ref + ' · first visit with ' + docName });
        if (l.consent.sms) addActivity(l.id, { type: 'sms', dir: 'out', body: fill(TEMPLATES.booking, l), at: Date.now() + 1 });
        else addActivity(l.id, { type: 'email', dir: 'out', subject: 'Reserve your first visit', body: 'Hi ' + l.first + ',\n\nHere is your link to reserve a first visit: sked.link/flowwellness\n\nThe Flow Wellness team', at: Date.now() + 1 });
        closeModal();
        toast('<strong>' + esc(fullName(l)) + '</strong> sent to ChiroHD · ' + ref, 'teal');
        renderLead(doc.getElementById('main'), l.id);
      }, 1100);
    });
  }

  function openLost(l) {
    openModal(
      '<p class="eyebrow">Close out</p><h2>Mark ' + esc(l.first) + ' as lost</h2>' +
      '<p class="lede">Automations stop. The record stays and can be reopened any time.</p>' +
      '<fieldset class="group"><legend class="micro" style="margin-bottom:.4rem">Reason</legend><div class="choices">' +
      ['No response', 'Went with another office', 'Not a fit', 'Too far', 'Price', 'Other'].map(function (r, i) {
        return '<label><input type="radio" name="lost-r" value="' + r + '"' + (i === 0 ? ' checked' : '') + '><span>' + r + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<div class="foot"><button class="btn ghost sm" type="button" id="lost-cancel">Cancel</button><button class="btn sm" type="button" id="lost-go">Mark lost</button></div>'
    );
    doc.getElementById('lost-cancel').addEventListener('click', closeModal);
    doc.getElementById('lost-go').addEventListener('click', function () {
      var r = doc.querySelector('input[name="lost-r"]:checked').value;
      l.stage = 'Lost'; l.lostReason = r; l.nextAction = '';
      addActivity(l.id, { type: 'system', body: 'Marked lost · ' + r });
      closeModal();
      renderLead(doc.getElementById('main'), l.id);
    });
  }

  function openNewLead() {
    openModal(
      '<p class="eyebrow">Manual entry</p><h2>New lead</h2><p class="lede">For walk-ins, phone calls and referrals. Ad and website leads arrive on their own.</p>' +
      '<div class="row-2"><label class="field"><span>First name</span><input id="nl-first" type="text" required></label><label class="field"><span>Last name</span><input id="nl-last" type="text" required></label></div>' +
      '<div class="row-2"><label class="field"><span>Phone</span><input id="nl-phone" type="tel" placeholder="(321) 555-0100" required></label><label class="field"><span>Email</span><input id="nl-email" type="email"></label></div>' +
      '<div class="row-2"><label class="field"><span>Preferred contact</span><select id="nl-pref"><option>Text</option><option>Call</option><option>Email</option></select></label>' +
      '<label class="field"><span>Who is seeking care</span><select id="nl-who"><option>Myself</option><option>My child</option><option>Myself and my family</option></select></label></div>' +
      '<label class="field"><span>Source</span><select id="nl-src"><option value="referral">Referral / walk-in</option><option value="website">Website form</option><option value="meta">Meta Lead Ads</option><option value="google">Google Ads</option></select></label>' +
      '<fieldset class="group"><legend class="micro" style="margin-bottom:.4rem">Interested in</legend><div class="choices" id="nl-int">' + INTERESTS.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '"><span>' + esc(i) + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<label class="consent" style="margin-bottom:.4rem"><input type="checkbox" id="nl-consent" checked> Lead agreed to receive texts</label>' +
      '<div class="foot"><button class="btn ghost sm" type="button" id="nl-cancel">Cancel</button><button class="btn sm" type="button" id="nl-go">Add lead</button></div>'
    );
    doc.getElementById('nl-cancel').addEventListener('click', closeModal);
    doc.getElementById('nl-go').addEventListener('click', function () {
      var ok = true;
      ['nl-first', 'nl-last', 'nl-phone'].forEach(function (id) {
        var inp = doc.getElementById(id);
        var valid = inp.value.trim() !== '' && (id !== 'nl-phone' || /\d{7,}/.test(inp.value.replace(/\D/g, '')));
        inp.closest('.field').classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) return;
      var src = doc.getElementById('nl-src').value;
      var now = Date.now();
      var l = {
        id: nextId('L'),
        first: doc.getElementById('nl-first').value.trim(), last: doc.getElementById('nl-last').value.trim(),
        phone: doc.getElementById('nl-phone').value.trim(), email: doc.getElementById('nl-email').value.trim(),
        preferred: doc.getElementById('nl-pref').value, who: doc.getElementById('nl-who').value,
        interests: Array.prototype.map.call(doc.querySelectorAll('#nl-int input:checked'), function (c) { return c.value; }),
        source: src, campaign: src === 'referral' ? 'Added by the desk' : CAMPAIGNS[src][0],
        stage: 'New', createdAt: now, lastActivityAt: now, owner: 'Front desk', nextAction: 'Awaiting first reply',
        consent: { sms: doc.getElementById('nl-consent').checked, at: now }
      };
      state.leads.push(l);
      addActivity(l.id, { type: 'system', body: 'Lead added manually · ' + SOURCES[src].name });
      closeModal();
      location.hash = '#/leads/' + l.id;
      toast('Lead added');
    });
  }

  /* ---------- Sidebar wiring ---------- */

  doc.getElementById('btn-new-lead').addEventListener('click', openNewLead);
  doc.getElementById('btn-simulate').addEventListener('click', function () { simulateLead(); });
  doc.getElementById('btn-reset').addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    state = seed();
    save();
    location.hash = '#/leads';
    route();
    toast('Demo data reset');
  });

  route();
})();

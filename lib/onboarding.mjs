export const STORAGE_KEY = 'blipTips_v1';

export const WELCOME = [
  {
    icon: 'shield',
    title: 'Welcome to TheBlip',
    body: 'Cards and apps are built to make you spend. TheBlip helps you make smarter money decisions, spot scams, and eat well on a student budget. You earn points for safe habits, and nothing here asks you to spend.',
  },
  {
    icon: 'star',
    title: 'Five things you can do here',
    list: [
      'Check what a card offer really costs, or upload your statement',
      'Test a suspicious message and report scams',
      'Earn points and level up with safe money habits',
      'Compare grocery stores on price and health',
      'Find free food near campus on a map',
    ],
  },
  {
    icon: 'lock',
    title: 'How points work',
    body: 'Points come from real habits your bank reports, like paying on time, and from reporting scams. There are no points for opening cards or spending. Nothing you paste or upload is saved.',
    note: 'Look for the ? button any time for a quick explanation of the page you are on.',
  },
];

export const INTROS = {
  check: {
    path: '/check',
    icon: 'sliders',
    title: 'Reward reality check',
    lead: 'See what a card offer really costs you before you sign up.',
    list: ['Upload a statement or offer, or move the sliders yourself', 'Compare the rewards you would earn with the interest you would pay', 'Write a payoff plan to earn your first points'],
  },
  scam: {
    path: '/scam',
    icon: 'shield',
    title: 'Scam message check',
    lead: 'Got a strange text or email? Paste it here.',
    list: ['We point out the warning signs in plain words', 'Report a real scam to earn points and help other students', 'Your message is checked and not stored'],
  },
  recovery: {
    path: '/recovery',
    icon: 'lifebuoy',
    title: 'If you think you got scammed',
    lead: 'No shame. This walks you through what to do next.',
    list: ['Tell us what happened, and we guide you step by step', 'Finish the checklist and a short quiz to unlock the app', 'You earn points for reporting, and never lose points for a wrong answer'],
  },
  quests: {
    path: '/quests',
    icon: 'star',
    title: 'Quests and points',
    lead: 'Small safe habits that add up to points and levels.',
    list: ['Your bank reports habits like paying on time, and points arrive automatically', 'Answer a few quiz questions for bonus points, up to three a day', 'Save up for a gift card. Points never come from spending'],
  },
  groceries: {
    path: '/groceries',
    icon: 'basket',
    title: 'Compare groceries',
    lead: 'Build a list and see where it costs least, and how to make it healthier.',
    list: ['Describe what you need, pick a starter list, or add items', 'See each store\'s price, and what a healthier version costs there', 'Scan a receipt to replace the sample prices with real ones'],
  },
  food: {
    path: '/food',
    icon: 'basket',
    title: 'Free food nearby',
    lead: 'Pantries and food programs around campus, on a map.',
    list: ['Tap a pin or a card for hours, rules and directions', 'Use "Open now" and "Use my location" to find the closest one', 'Some hours are not confirmed, so check the source before you go'],
  },
  console: {
    path: '/console',
    icon: 'chart',
    title: 'Bank view: the console',
    lead: 'This is what a bank sees when it runs TheBlip for its students.',
    list: ['Overview shows how many students are active and what they are doing', 'Program and Integration need the admin password', 'Turn on simulated students to see the charts filled in'],
  },
  bank: {
    path: '/bank',
    icon: 'terminal',
    title: 'Bank simulator',
    lead: 'A stand-in for a bank, so you can see how points arrive.',
    list: ['Each button sends an event, like a bank would', 'Open the student app in another tab to watch the points update', 'Use the link on this page to connect your phone to the same student'],
  },
  docs: {
    path: '/docs',
    icon: 'book',
    title: 'Partner API',
    lead: 'How a company connects its own app to TheBlip.',
    list: ['Send events, read a student, or embed the rewards widget', 'Every call is shown with a working example', 'No names or account numbers are needed'],
  },
};

export function introFor(path) {
  const p = String(path || '/');
  if (p === '/' || p === '') return null;
  const id = Object.keys(INTROS).find((k) => p === INTROS[k].path || p.startsWith(INTROS[k].path + '/'));
  return id ? { id, ...INTROS[id] } : null;
}

// What to show on this page: 'welcome', an intro id, or null.
export function pickTip(path, seen, tipsOff) {
  if (tipsOff) return null;
  const s = seen || {};
  if ((path === '/' || path === '') && !s.welcome) return 'welcome';
  const intro = introFor(path);
  if (intro && !s[intro.id]) return intro.id;
  return null;
}

export function readStore(raw) {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? { seen: v.seen && typeof v.seen === 'object' ? v.seen : {}, tipsOff: v.tipsOff === true } : { seen: {}, tipsOff: false };
  } catch {
    return { seen: {}, tipsOff: false };
  }
}

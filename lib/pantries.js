export const CHECKED = 'September 19, 2026';

export const PLACES = [
  {
    id: 'pitt',
    name: 'Pitt Pantry',
    group: 'campus',
    who: 'Pitt students, faculty and staff',
    address: "O'Hara Student Center, 4024 O'Hara Street, Pittsburgh, PA 15213",
    hours: ['Fall hours: Monday 11 a.m. to 2 p.m.', 'Tuesday and Wednesday 11 a.m. to 7 p.m.', 'Closed on university holidays and breaks'],
    notes: 'Walk-ins welcome, no appointment. Bring a valid Pitt ID. Up to two visits a month, and you can bring one other person.',
    contact: { label: 'pantry@pitt.edu', href: 'mailto:pantry@pitt.edu' },
    source: { label: 'Pitt Student Affairs', href: 'https://www.studentaffairs.pitt.edu/care-and-resources/pitt-pantry' },
    confirmed: true,
  },
  {
    id: 'cmu',
    name: 'CMU Pantry',
    group: 'campus',
    who: 'Carnegie Mellon students (no need to prove need)',
    address: 'Residence on Fifth, 4700 Fifth Avenue, First Floor, Pittsburgh, PA 15213',
    hours: ['Open in blocks most days except Sunday', 'Book a time through the Pantry Shopping Form in TartanConnect'],
    notes: 'Reported: one shopping visit a week. Check the FAQ for the current rules.',
    contact: { label: 'cmu-pantry@andrew.cmu.edu', href: 'mailto:cmu-pantry@andrew.cmu.edu' },
    source: { label: 'CMU Student Affairs FAQ', href: 'https://www.cmu.edu/student-affairs/resources/cmu-pantry/faqs.html' },
    confirmed: false,
  },
  {
    id: 'chs',
    name: 'CHS Oakland Food Pantry',
    group: 'community',
    who: 'Community food pantry. Ask about any ID or sign-up when you call.',
    address: '370 Lawn Street, Pittsburgh, PA 15213',
    hours: ['Wednesday 11 a.m. to 6 p.m.', 'Thursday 3 p.m. to 6 p.m.'],
    notes: 'Another listing shows different hours, so call before you go.',
    contact: { label: '(412) 246-1688', href: 'tel:+14122461688' },
    source: { label: 'Greater Pittsburgh Community Food Bank', href: 'https://pittsburghfoodbank.org/resources/chs-oakland-food-pantry/' },
    confirmed: false,
  },
  {
    id: 'schenley',
    name: 'Schenley Plaza food distribution',
    group: 'community',
    who: 'Open to the public',
    address: 'Schenley Plaza, Oakland, Pittsburgh, PA',
    hours: ['Reported: first Wednesday of each month, 3:30 p.m. to 5:30 p.m.'],
    notes: 'Fresh produce and frozen meat, reported. Confirm the date on the Food Bank site before you go.',
    contact: null,
    source: { label: 'Greater Pittsburgh Community Food Bank', href: 'https://pittsburghfoodbank.org' },
    confirmed: false,
  },
];

export const MORE_HELP = [
  { label: 'Greater Pittsburgh Community Food Bank: find food by ZIP code', href: 'https://pittsburghfoodbank.org' },
  { label: 'Dial 2-1-1 (United Way) for food and other local help', href: 'tel:211' },
];

const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h5v-6h4v6h5V9.5" /></>,
  sliders: <><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>,
  shield: <><path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z" /><path d="m9 12 2 2 4-4" /></>,
  star: <path d="m12 3.5 2.6 5.5 5.9.7-4.4 4 1.2 5.8L12 16.6l-5.3 2.9 1.2-5.8-4.4-4 5.9-.7z" />,
  lifebuoy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" /></>,
  bank: <><path d="M3 9.5 12 4l9 5.5H3z" /><path d="M5.5 12v6M10 12v6M14 12v6M18.5 12v6M3.5 20h17" /></>,
  chart: <><path d="M4 4v16h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  terminal: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m8 10 3 2-3 2M13 15h3" /></>,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  check: <path d="m5 12 5 5 9-10" />,
  lock: <><rect x="5.5" y="11" width="13" height="9" rx="2" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.8-1.1 1.6" /><path d="M12 17h.01" /></>,
  book: <><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" /><path d="M9 8h5M9 12h5" /></>,
  basket: <><path d="M4 9h16l-1.5 9a2 2 0 0 1-2 1.7h-9A2 2 0 0 1 5.5 18z" /><path d="m9 9 3-5 3 5M9.5 13v3M14.5 13v3" /></>,
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

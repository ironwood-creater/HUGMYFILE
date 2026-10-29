// Shared interface text. The site launches in English; adding a language means
// adding another dictionary with the same keys and routing it under /<lang>/.

export const DEFAULT_LANG = 'en' as const;
export type Lang = typeof DEFAULT_LANG;

export const ui = {
  en: {
    tagline: 'Pro features. Free forever. No signup. No watermark. Your files never leave your device.',
    shortTagline: 'Free file tools that hug your files and never keep them.',
    badge: ['Runs on your device', 'Free', 'No signup', 'No watermark'],
    skipToContent: 'Skip to content',
    menu: 'Menu',
    closeMenu: 'Close menu',
    themeToggle: 'Switch light or dark theme',
    allTools: 'All tools',
    searchPlaceholder: 'Search tools… e.g. “merge”, “50kb”, “wifi”',
    searchLabel: 'Search all tools',
    noResults: 'No tools match that search yet. Try a shorter word.',
    howToUse: 'How to use',
    features: 'What you get',
    faq: 'Frequently asked questions',
    relatedTools: 'Related tools',
    privacyNoteTitle: 'Your files stay with you',
    privacyNote:
      'Everything happens inside this browser tab. Your files are never uploaded, stored or seen by anyone, and when you close the tab they are gone.',
    trademarks: 'All trademarks belong to their respective owners. HugMyFile is not affiliated with them.',
    footerAbout: 'Free, private file tools. Made with care, powered by your own device.',
    home: 'Home',
  },
} as const;

export function t(lang: Lang = DEFAULT_LANG) {
  return ui[lang];
}

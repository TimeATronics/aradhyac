export const V = `?t=${Date.now()}`;

export const THEMES = [
  { name: 'Default', accent: '#6C63FF', bg: '#eaeef5', image: `/zetla/theme-default.png${V}` },
  { name: 'Gruvbox', accent: '#D79921', bg: '#f5f0e6', image: `/zetla/theme-gruvbox.png${V}` },
  { name: 'Solarized', accent: '#268BD2', bg: '#e8f5ee', image: `/zetla/theme-solarized.png${V}` },
  { name: 'Nord', accent: '#88C0D0', bg: '#eaf5f5', image: `/zetla/theme-nord.png${V}` },
  { name: 'Catppuccin', accent: '#CBA6F7', bg: '#f5eef5', image: `/zetla/theme-catppuccin.png${V}` },
];

export const FEATURES = [
  {
    title: 'Any model. Your keys.',
    desc: 'Connect to OpenCode Zen, DeepSeek, or NVIDIA NIM. Pick your model, send your prompt, and you are off.',
    detail: 'OpenAI API Support · Token Limiting Support · System Prompt Support',
    image: `/zetla/feature-chat.png${V}`,
    bg: '#f0eef8',
  },
  {
    title: 'Talk to it. It talks back.',
    desc: 'Offline voice recognition powered by Vosk. Chat hands-free while cooking, driving, or walking the dog.',
    detail: 'Bundled Model · Multiple TTS Voices · Configurable Speed',
    image: `/zetla/feature-voice.gif${V}`,
    bg: '#f5f0e6',
  },
  {
    title: 'Grounded in reality.',
    desc: 'The LLM searches the web and reads full pages; great for planning trips, comparing products, or fact-checking on the fly.',
    detail: 'Exa AI MCP · Search + URL Fetch · web_search Tool',
    image: `/zetla/feature-search.png${V}`,
    bg: '#e8f5ee',
  },
  {
    title: 'Feed it anything.',
    desc: 'Upload PDFs, Images, Word Docs, Excel Sheets, Presentations, or Text Files. Zetla reads them all - class notes, instruction PDFs, you name it.',
    detail: 'PDF · DOCX · XLSX · PPTX · CSV · Images · Limit: 10 MB',
    image: `/zetla/feature-files.png${V}`,
    bg: '#f5eaea',
  },
  {
    title: 'Pick your palette.',
    desc: 'Five handcrafted color schemes: Default, Gruvbox, Solarized, Nord and Catppuccin. Make the app feel like yours.',
    detail: '5 themes · Dark & Light Modes · Match Your Vibe',
    image: `/zetla/theme-default.png${V}`,
    bg: THEMES[0].bg,
    carousel: true,
  },
  {
    title: 'Hear it your way.',
    desc: "Multiple English voices from your device's TTS engine, with playback speed from slow to fast.",
    detail: 'Android TTS · Voice Picker · 0.25x-2.0x Speed',
    image: `/zetla/feature-tts.png${V}`,
    bg: '#f5eaee',
  },
  {
    title: 'Code runs here.',
    desc: 'A standalone Python 3.14 built with all stdlib modules. No cloud sandbox needed. Ask the LLM to run math, simulations, or data analysis right on your phone.',
    detail: 'Sandboxed · Standalone · run_code Tool',
    image: `/zetla/feature-python.png${V}`,
    bg: '#faf0e6',
  },
];

export const ALL_FEATURES = [
  { name: 'LLM Chat', detail: 'Multi-provider SSE streaming' },
  { name: 'Voice Chat', detail: 'Vosk offline + Android TTS' },
  { name: 'Web Search', detail: 'Exa AI MCP integration' },
  { name: 'On-device Python', detail: 'CPython with standard library modules' },
  { name: 'Tool Calling', detail: 'Agent loop, up to 10 iterations' },
  { name: 'File Upload', detail: 'PDF, DOCX, XLSX, PPTX, CSV, images, text files' },
  { name: 'Color Themes', detail: '5 schemes · dark & light' },
  { name: 'TTS Voices', detail: 'Multi-voice · 0.25x-2.0x speed' },
];

export const FAQS = [
  {
    q: 'What API keys does Zetla need?',
    a: 'Zetla was built with BYOK (Bring Your Own Key) in mind. It currently supports OpenCode Zen, DeepSeek, or NVIDIA NIM. You as a user have to create your account with the respective providers and provide the key to use this application. No vendor lock-in. Your keys stay on your device.',
  },
  {
    q: 'Can I save my conversations?',
    a: 'Yes. Sessions save automatically on your device. Rename, star, or delete them anytime. Come back later and pick up exactly where you left off.',
  },
  {
    q: 'Does the Python runtime work offline?',
    a: 'Yes. CPython 3.14.6 is bundled as a static binary with 93 stdlib modules. Code execution is sandboxed by Android itself.',
  },
  {
    q: 'How does voice chat work?',
    a: 'Speech recognition uses Vosk, an offline engine bundled in the app. Text-to-speech uses Android native TTS with selectable voices and adjustable speed.',
  },
  {
    q: 'Is my data private?',
    a: 'Session storage, file processing, and code execution all happen on your device. Chat queries go only to the LLM provider you choose with your own API key. Zetla itself never phones home.',
  },
  {
    q: 'What can I use Zetla for?',
    a: 'Plan trips with researched web results, brainstorm projects, understand long PDFs or lecture notes in seconds, run live calculations with Python, or just chat. The agentic loop combines web search and code execution for complex tasks.',
  },
  {
    q: 'What files can I upload?',
    a: 'Images, PDFs, Word docs, Excel sheets, PowerPoints, CSVs, and code files (max 10 MB). Processing is on-device - PDFBox for PDFs, built-in parsers for Office documents.',
  },
  {
    q: 'Which Android versions are supported?',
    a: 'Android 8.0 (API 26) and above. Both arm64-v8a and armeabi-v7a APKs are provided.',
  },
  {
    q: 'Can it generate images or handle multimodal output?',
    a: 'Zetla supports multimodal input as of today, to upload images and ask questions about them. Output-side multimodality is not yet supported but planned for the future.',
  },
];

export const GITHUB_BASE = 'https://github.com/TimeATronics/Zetla';

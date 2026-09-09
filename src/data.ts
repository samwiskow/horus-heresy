export type BookKind = 'novel' | 'anthology' | 'novella'
export type ArcId = 'opening' | 'legions' | 'calth' | 'warmaster' | 'siege'
export type EdgeKind = 'recommended' | 'sequel' | 'parallel' | 'optional' | 'prerequisite'

export type Book = {
  id: string
  title: string
  shortTitle: string
  kind: BookKind
  seriesNumber?: number
  arc: ArcId
  faction: string
  spoilerLevel: 'low' | 'medium' | 'high'
  summary: string
  reason: string
  x: number
  y: number
  accent: string
}

export type Connection = {
  from: string
  to: string
  kind: EdgeKind
  explanation: string
}

export const arcMeta: Record<ArcId, { label: string; blurb: string; colour: string }> = {
  opening: {
    label: 'The opening campaign',
    blurb: 'The expedition, the first betrayals, and the moment the Great Crusade fractures.',
    colour: '#55b8b0',
  },
  legions: {
    label: 'Legions in collision',
    blurb: 'Prospero, the Alpha Legion, the Iron Hands, and the wars that spread the fire.',
    colour: '#7da9d6',
  },
  calth: {
    label: 'Calth & the Word Bearers',
    blurb: 'A focused route through faith, betrayal, and the battle that remakes the XIII.',
    colour: '#a98dd6',
  },
  warmaster: {
    label: 'The Warmaster ascendant',
    blurb: 'The rebellion gathers its strength while loyalist resistance hardens around it.',
    colour: '#e0815d',
  },
  siege: {
    label: 'The road to Terra',
    blurb: 'The final approach: broken alliances, the Ruinstorm, and the doors of the Palace.',
    colour: '#d2a85e',
  },
}

export const books: Book[] = [
  {
    id: 'horus-rising', title: 'Horus Rising', shortTitle: 'Horus Rising', kind: 'novel', seriesNumber: 1,
    arc: 'opening', faction: 'Luna Wolves', spoilerLevel: 'low', accent: '#55b8b0', x: 70, y: 100,
    summary: 'The Great Crusade at its height, seen through the eyes of the Luna Wolves and their new Warmaster.',
    reason: 'The cleanest entry point into the series and the first marker on the main route.',
  },
  {
    id: 'false-gods', title: 'False Gods', shortTitle: 'False Gods', kind: 'novel', seriesNumber: 2,
    arc: 'opening', faction: 'Luna Wolves', spoilerLevel: 'low', accent: '#55b8b0', x: 290, y: 100,
    summary: 'Horus is wounded, and the path from brotherhood to rebellion begins to turn.',
    reason: 'Direct continuation of the opening campaign.',
  },
  {
    id: 'galaxy-in-flames', title: 'Galaxy in Flames', shortTitle: 'Galaxy in Flames', kind: 'novel', seriesNumber: 3,
    arc: 'opening', faction: 'Sons of Horus', spoilerLevel: 'medium', accent: '#55b8b0', x: 510, y: 100,
    summary: 'The rebellion reveals itself in full as the Isstvan atrocity reshapes the war.',
    reason: 'The third movement of the core opening trilogy.',
  },
  {
    id: 'flight-eisenstein', title: 'The Flight of the Eisenstein', shortTitle: 'Flight of the Eisenstein', kind: 'novel', seriesNumber: 4,
    arc: 'opening', faction: 'Death Guard', spoilerLevel: 'medium', accent: '#55b8b0', x: 735, y: 100,
    summary: 'A loyalist escape carries the truth of the rebellion toward Terra.',
    reason: 'A natural follow-on from Isstvan and an important loyalist perspective.',
  },
  {
    id: 'fulgrim', title: 'Fulgrim', shortTitle: 'Fulgrim', kind: 'novel', seriesNumber: 5,
    arc: 'opening', faction: 'Emperor’s Children', spoilerLevel: 'medium', accent: '#55b8b0', x: 960, y: 100,
    summary: 'The Emperor’s Children descend into excess as the wider rebellion gains momentum.',
    reason: 'The first major parallel route after the opening trilogy.',
  },
  {
    id: 'first-heretic', title: 'The First Heretic', shortTitle: 'The First Heretic', kind: 'novel', seriesNumber: 14,
    arc: 'calth', faction: 'Word Bearers', spoilerLevel: 'medium', accent: '#a98dd6', x: 70, y: 325,
    summary: 'The Word Bearers’ fall becomes the spiritual engine of the wider rebellion.',
    reason: 'The best launch point for the Calth route and the Word Bearers’ story.',
  },
  {
    id: 'thousand-sons', title: 'A Thousand Sons', shortTitle: 'A Thousand Sons', kind: 'novel', seriesNumber: 12,
    arc: 'legions', faction: 'Thousand Sons', spoilerLevel: 'medium', accent: '#7da9d6', x: 280, y: 325,
    summary: 'Prospero’s scholars confront the cost of knowledge, warning, and Imperial mistrust.',
    reason: 'Pairs with Prospero Burns to show both sides of the same catastrophe.',
  },
  {
    id: 'prospero-burns', title: 'Prospero Burns', shortTitle: 'Prospero Burns', kind: 'novel', seriesNumber: 15,
    arc: 'legions', faction: 'Space Wolves', spoilerLevel: 'medium', accent: '#7da9d6', x: 500, y: 325,
    summary: 'The Wolves’ view of the Prospero campaign and the stories told around it.',
    reason: 'Read beside A Thousand Sons for a fuller view of Prospero.',
  },
  {
    id: 'legion', title: 'Legion', shortTitle: 'Legion', kind: 'novel', seriesNumber: 7,
    arc: 'legions', faction: 'Alpha Legion', spoilerLevel: 'medium', accent: '#7da9d6', x: 720, y: 325,
    summary: 'The Alpha Legion enters the war with a plan whose loyalties are deliberately difficult to read.',
    reason: 'A parallel intelligence route that widens the rebellion beyond its first battles.',
  },
  {
    id: 'mechanicum', title: 'Mechanicum', shortTitle: 'Mechanicum', kind: 'novel', seriesNumber: 9,
    arc: 'legions', faction: 'Mechanicum', spoilerLevel: 'medium', accent: '#7da9d6', x: 945, y: 325,
    summary: 'The war reaches Mars, where the Mechanicum fractures and ancient power wakes.',
    reason: 'A self-contained branch that adds the industrial scale of the Heresy.',
  },
  {
    id: 'know-no-fear', title: 'Know No Fear', shortTitle: 'Know No Fear', kind: 'novel', seriesNumber: 19,
    arc: 'calth', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#a98dd6', x: 70, y: 550,
    summary: 'The Battle of Calth becomes an intimate, high-speed disaster for the XIII Legion.',
    reason: 'The direct continuation of the First Heretic route.',
  },
  {
    id: 'betrayer', title: 'Betrayer', shortTitle: 'Betrayer', kind: 'novel', seriesNumber: 24,
    arc: 'calth', faction: 'World Eaters', spoilerLevel: 'high', accent: '#a98dd6', x: 290, y: 550,
    summary: 'The shadow of Calth follows the World Eaters and Word Bearers into a brutal campaign.',
    reason: 'The next major Calth branch after Know No Fear.',
  },
  {
    id: 'scars', title: 'Scars', shortTitle: 'Scars', kind: 'novel', seriesNumber: 27,
    arc: 'legions', faction: 'White Scars', spoilerLevel: 'medium', accent: '#7da9d6', x: 510, y: 550,
    summary: 'The White Scars choose their road through a war that refuses simple allegiance.',
    reason: 'A major parallel legion route with consequences for the wider war.',
  },
  {
    id: 'path-of-heaven', title: 'The Path of Heaven', shortTitle: 'The Path of Heaven', kind: 'novel', seriesNumber: 36,
    arc: 'legions', faction: 'White Scars', spoilerLevel: 'high', accent: '#7da9d6', x: 730, y: 550,
    summary: 'The White Scars race toward the final war while the traitor fleet closes in.',
    reason: 'Direct continuation of the White Scars route.',
  },
  {
    id: 'vengeful-spirit', title: 'Vengeful Spirit', shortTitle: 'Vengeful Spirit', kind: 'novel', seriesNumber: 29,
    arc: 'warmaster', faction: 'Sons of Horus', spoilerLevel: 'high', accent: '#e0815d', x: 960, y: 550,
    summary: 'The Warmaster’s campaign reaches Molech and the rebellion gathers dangerous momentum.',
    reason: 'The primary Warmaster route after the early rebellion has spread.',
  },
  {
    id: 'praetorian-dorn', title: 'The Praetorian of Dorn', shortTitle: 'Praetorian of Dorn', kind: 'novel', seriesNumber: 39,
    arc: 'warmaster', faction: 'Imperial Fists', spoilerLevel: 'high', accent: '#e0815d', x: 960, y: 325,
    summary: 'The Imperial Fists meet the Alpha Legion in the tightening approach to Terra.',
    reason: 'A loyalist counter-route that connects the legion war to the Siege.',
  },
  {
    id: 'unremembered-empire', title: 'The Unremembered Empire', shortTitle: 'Unremembered Empire', kind: 'novel', seriesNumber: 27,
    arc: 'warmaster', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#e0815d', x: 510, y: 775,
    summary: 'Survivors gather around Ultramar as the galaxy’s wider disaster becomes impossible to ignore.',
    reason: 'A convergence point for several loyalist and refugee routes.',
  },
  {
    id: 'ruinstorm', title: 'Ruinstorm', shortTitle: 'Ruinstorm', kind: 'novel', seriesNumber: 46,
    arc: 'siege', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#d2a85e', x: 730, y: 775,
    summary: 'The loyalist legions navigate the impossible storm between survival and Terra.',
    reason: 'Carries the Ultramar route toward the final phase of the Heresy.',
  },
  {
    id: 'master-of-mankind', title: 'Master of Mankind', shortTitle: 'Master of Mankind', kind: 'novel', seriesNumber: 41,
    arc: 'siege', faction: 'Adeptus Mechanicus', spoilerLevel: 'high', accent: '#d2a85e', x: 960, y: 775,
    summary: 'The war inside the Webway reveals the scale of the cost paid for the Imperial project.',
    reason: 'The most direct route into the Emperor’s hidden war before the Siege.',
  },
  {
    id: 'wolfsbane', title: 'Wolfsbane', shortTitle: 'Wolfsbane', kind: 'novel', seriesNumber: 49,
    arc: 'warmaster', faction: 'Space Wolves', spoilerLevel: 'high', accent: '#e0815d', x: 290, y: 775,
    summary: 'The Wolves strike at the Warmaster while time, fate, and the road to Terra collapse.',
    reason: 'A late-war branch that belongs immediately before the final approach.',
  },
  {
    id: 'slaves-to-darkness', title: 'Slaves to Darkness', shortTitle: 'Slaves to Darkness', kind: 'novel', seriesNumber: 51,
    arc: 'warmaster', faction: 'Traitor Legions', spoilerLevel: 'high', accent: '#e0815d', x: 70, y: 775,
    summary: 'The traitor armada assembles for the final assault, but unity proves temporary.',
    reason: 'The traitor-side bridge into the Siege of Terra.',
  },
  {
    id: 'buried-dagger', title: 'The Buried Dagger', shortTitle: 'The Buried Dagger', kind: 'novel', seriesNumber: 54,
    arc: 'siege', faction: 'Death Guard', spoilerLevel: 'high', accent: '#d2a85e', x: 70, y: 1000,
    summary: 'The Heresy’s numbered series closes as the Death Guard make their final transformation.',
    reason: 'The final numbered Heresy novel before the Siege sequence.',
  },
]

export const connections: Connection[] = [
  { from: 'horus-rising', to: 'false-gods', kind: 'sequel', explanation: 'The direct continuation of the opening campaign.' },
  { from: 'false-gods', to: 'galaxy-in-flames', kind: 'sequel', explanation: 'Completes the opening trilogy.' },
  { from: 'galaxy-in-flames', to: 'flight-eisenstein', kind: 'recommended', explanation: 'Carries the Isstvan news toward Terra.' },
  { from: 'galaxy-in-flames', to: 'fulgrim', kind: 'parallel', explanation: 'Expands the Isstvan catastrophe through another legion.' },
  { from: 'galaxy-in-flames', to: 'first-heretic', kind: 'recommended', explanation: 'Follows the rebellion back to its spiritual origin.' },
  { from: 'galaxy-in-flames', to: 'thousand-sons', kind: 'parallel', explanation: 'Opens the major legion branches beyond Isstvan.' },
  { from: 'first-heretic', to: 'know-no-fear', kind: 'recommended', explanation: 'The Word Bearers’ route reaches Calth.' },
  { from: 'know-no-fear', to: 'betrayer', kind: 'recommended', explanation: 'The consequences of Calth move into the Shadow Crusade.' },
  { from: 'thousand-sons', to: 'prospero-burns', kind: 'recommended', explanation: 'Read the paired Prospero perspectives together.' },
  { from: 'prospero-burns', to: 'scars', kind: 'parallel', explanation: 'The White Scars’ position becomes central to the wider war.' },
  { from: 'galaxy-in-flames', to: 'legion', kind: 'parallel', explanation: 'A covert route into the rebellion’s hidden strategies.' },
  { from: 'legion', to: 'praetorian-dorn', kind: 'recommended', explanation: 'The Alpha Legion route collides with the Imperial Fists.' },
  { from: 'galaxy-in-flames', to: 'mechanicum', kind: 'optional', explanation: 'A self-contained branch showing the war on Mars.' },
  { from: 'scars', to: 'path-of-heaven', kind: 'sequel', explanation: 'Direct continuation of the White Scars route.' },
  { from: 'betrayer', to: 'unremembered-empire', kind: 'parallel', explanation: 'The war’s survivors converge around Ultramar.' },
  { from: 'path-of-heaven', to: 'unremembered-empire', kind: 'recommended', explanation: 'Connects the White Scars to the loyalist convergence.' },
  { from: 'fulgrim', to: 'vengeful-spirit', kind: 'parallel', explanation: 'The traitor campaign grows into a wider strategic war.' },
  { from: 'praetorian-dorn', to: 'vengeful-spirit', kind: 'parallel', explanation: 'A loyalist and traitor route through the middle war.' },
  { from: 'vengeful-spirit', to: 'master-of-mankind', kind: 'recommended', explanation: 'Moves the story toward the hidden war beneath Terra.' },
  { from: 'unremembered-empire', to: 'ruinstorm', kind: 'sequel', explanation: 'The loyalist convergence reaches the Ruinstorm.' },
  { from: 'ruinstorm', to: 'master-of-mankind', kind: 'parallel', explanation: 'A bridge from the wider war to the Emperor’s hidden front.' },
  { from: 'vengeful-spirit', to: 'wolfsbane', kind: 'recommended', explanation: 'A late-war strike against the Warmaster.' },
  { from: 'wolfsbane', to: 'slaves-to-darkness', kind: 'recommended', explanation: 'Both sides prepare for the final assault.' },
  { from: 'master-of-mankind', to: 'slaves-to-darkness', kind: 'parallel', explanation: 'The hidden war and the traitor armada converge.' },
  { from: 'slaves-to-darkness', to: 'buried-dagger', kind: 'recommended', explanation: 'Closes the numbered Heresy sequence before the Siege.' },
]

export const bookById = Object.fromEntries(books.map((book) => [book.id, book])) as Record<string, Book>

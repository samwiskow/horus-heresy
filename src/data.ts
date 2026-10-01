export type BookKind = 'novel' | 'anthology' | 'novella'
export type ArcId = 'opening' | 'dark-angels' | 'legions' | 'calth' | 'salamanders' | 'shattered' | 'imperial' | 'warmaster' | 'siege'
export type EdgeKind = 'reference' | 'sequence'

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
  x: number
  y: number
  accent: string
}

type BookSeed = Omit<Book, 'x' | 'y'> & Partial<Pick<Book, 'x' | 'y'>>

export type Connection = {
  from: string
  to: string
  kind: EdgeKind
  explanation: string
  sourceUrl: string
  sourceId: string
}

export const arcMeta: Record<ArcId, { label: string; blurb: string; colour: string }> = {
  opening: {
    label: 'The opening campaign',
    blurb: 'The expedition, the first betrayals, and the moment the Great Crusade fractures.',
    colour: '#246f68',
  },
  legions: {
    label: 'Legions in collision',
    blurb: 'Prospero, the Alpha Legion, the Iron Hands, and the wars that spread the fire.',
    colour: '#375f94',
  },
  'dark-angels': {
    label: 'The Lion & Caliban',
    blurb: 'The First Legion’s divided loyalties, the fall of Caliban, and the return of the Lion.',
    colour: '#4d6f57',
  },
  calth: {
    label: 'Calth & the Word Bearers',
    blurb: 'A focused route through faith, betrayal, and the battle that remakes the XIII.',
    colour: '#775495',
  },
  salamanders: {
    label: 'Vulkan & the Salamanders',
    blurb: 'Vulkan’s survival, the XVIII Legion’s long road, and the cost of endurance after Isstvan.',
    colour: '#5c7136',
  },
  shattered: {
    label: 'The Shattered Legions',
    blurb: 'Iron Hands, Raven Guard, and Salamanders fight a war of survival behind enemy lines.',
    colour: '#935849',
  },
  imperial: {
    label: 'Loyalist convergence',
    blurb: 'The loyalist legions gather, regroup, and find the routes that can still reach Terra.',
    colour: '#4b6395',
  },
  warmaster: {
    label: 'The Warmaster ascendant',
    blurb: 'The rebellion gathers its strength while loyalist resistance hardens around it.',
    colour: '#a55130',
  },
  siege: {
    label: 'The road to Terra',
    blurb: 'The final approach: broken alliances, the Ruinstorm, and the doors of the Palace.',
    colour: '#80621f',
  },
}

const bookSeeds: BookSeed[] = [
  {
    id: 'horus-rising', title: 'Horus Rising', shortTitle: 'Horus Rising', kind: 'novel', seriesNumber: 1,
    arc: 'opening', faction: 'Luna Wolves', spoilerLevel: 'low', accent: '#55b8b0', x: 70, y: 100,
    summary: 'The Great Crusade at its height, seen through the eyes of the Luna Wolves and their new Warmaster.',
  },
  {
    id: 'false-gods', title: 'False Gods', shortTitle: 'False Gods', kind: 'novel', seriesNumber: 2,
    arc: 'opening', faction: 'Luna Wolves', spoilerLevel: 'low', accent: '#55b8b0', x: 290, y: 100,
    summary: 'Horus is wounded, and the path from brotherhood to rebellion begins to turn.',
  },
  {
    id: 'galaxy-in-flames', title: 'Galaxy in Flames', shortTitle: 'Galaxy in Flames', kind: 'novel', seriesNumber: 3,
    arc: 'opening', faction: 'Sons of Horus', spoilerLevel: 'medium', accent: '#55b8b0', x: 510, y: 100,
    summary: 'The rebellion reveals itself in full as the Isstvan atrocity reshapes the war.',
  },
  {
    id: 'flight-eisenstein', title: 'The Flight of the Eisenstein', shortTitle: 'Flight of the Eisenstein', kind: 'novel', seriesNumber: 4,
    arc: 'opening', faction: 'Death Guard', spoilerLevel: 'medium', accent: '#55b8b0', x: 735, y: 100,
    summary: 'A loyalist escape carries the truth of the rebellion toward Terra.',
  },
  {
    id: 'fulgrim', title: 'Fulgrim', shortTitle: 'Fulgrim', kind: 'novel', seriesNumber: 5,
    arc: 'opening', faction: 'Emperor’s Children', spoilerLevel: 'medium', accent: '#55b8b0', x: 960, y: 100,
    summary: 'The Emperor’s Children descend into excess as the wider rebellion gains momentum.',
  },
  {
    id: 'first-heretic', title: 'The First Heretic', shortTitle: 'The First Heretic', kind: 'novel', seriesNumber: 14,
    arc: 'calth', faction: 'Word Bearers', spoilerLevel: 'medium', accent: '#a98dd6', x: 70, y: 325,
    summary: 'The Word Bearers’ fall becomes the spiritual engine of the wider rebellion.',
  },
  {
    id: 'thousand-sons', title: 'A Thousand Sons', shortTitle: 'A Thousand Sons', kind: 'novel', seriesNumber: 12,
    arc: 'legions', faction: 'Thousand Sons', spoilerLevel: 'medium', accent: '#7da9d6', x: 280, y: 325,
    summary: 'Prospero’s scholars confront the cost of knowledge, warning, and Imperial mistrust.',
  },
  {
    id: 'prospero-burns', title: 'Prospero Burns', shortTitle: 'Prospero Burns', kind: 'novel', seriesNumber: 15,
    arc: 'legions', faction: 'Space Wolves', spoilerLevel: 'medium', accent: '#7da9d6', x: 500, y: 325,
    summary: 'The Wolves’ view of the Prospero campaign and the stories told around it.',
  },
  {
    id: 'legion', title: 'Legion', shortTitle: 'Legion', kind: 'novel', seriesNumber: 7,
    arc: 'legions', faction: 'Alpha Legion', spoilerLevel: 'medium', accent: '#7da9d6', x: 720, y: 325,
    summary: 'The Alpha Legion enters the war with a plan whose loyalties are deliberately difficult to read.',
  },
  {
    id: 'mechanicum', title: 'Mechanicum', shortTitle: 'Mechanicum', kind: 'novel', seriesNumber: 9,
    arc: 'legions', faction: 'Mechanicum', spoilerLevel: 'medium', accent: '#7da9d6', x: 945, y: 325,
    summary: 'The war reaches Mars, where the Mechanicum fractures and ancient power wakes.',
  },
  {
    id: 'know-no-fear', title: 'Know No Fear', shortTitle: 'Know No Fear', kind: 'novel', seriesNumber: 19,
    arc: 'calth', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#a98dd6', x: 70, y: 550,
    summary: 'The Battle of Calth becomes an intimate, high-speed disaster for the XIII Legion.',
  },
  {
    id: 'betrayer', title: 'Betrayer', shortTitle: 'Betrayer', kind: 'novel', seriesNumber: 24,
    arc: 'calth', faction: 'World Eaters', spoilerLevel: 'high', accent: '#a98dd6', x: 290, y: 550,
    summary: 'The shadow of Calth follows the World Eaters and Word Bearers into a brutal campaign.',
  },
  {
    id: 'scars', title: 'Scars', shortTitle: 'Scars', kind: 'novel', seriesNumber: 27,
    arc: 'legions', faction: 'White Scars', spoilerLevel: 'medium', accent: '#7da9d6', x: 510, y: 550,
    summary: 'The White Scars choose their road through a war that refuses simple allegiance.',
  },
  {
    id: 'path-of-heaven', title: 'The Path of Heaven', shortTitle: 'The Path of Heaven', kind: 'novel', seriesNumber: 36,
    arc: 'legions', faction: 'White Scars', spoilerLevel: 'high', accent: '#7da9d6', x: 730, y: 550,
    summary: 'The White Scars race toward the final war while the traitor fleet closes in.',
  },
  {
    id: 'vengeful-spirit', title: 'Vengeful Spirit', shortTitle: 'Vengeful Spirit', kind: 'novel', seriesNumber: 29,
    arc: 'warmaster', faction: 'Sons of Horus', spoilerLevel: 'high', accent: '#e0815d', x: 960, y: 550,
    summary: 'The Warmaster’s campaign reaches Molech and the rebellion gathers dangerous momentum.',
  },
  {
    id: 'praetorian-dorn', title: 'The Praetorian of Dorn', shortTitle: 'Praetorian of Dorn', kind: 'novel', seriesNumber: 39,
    arc: 'imperial', faction: 'Imperial Fists', spoilerLevel: 'high', accent: '#899fc5', x: 960, y: 425,
    summary: 'The Imperial Fists meet the Alpha Legion in the tightening approach to Terra.',
  },
  {
    id: 'unremembered-empire', title: 'The Unremembered Empire', shortTitle: 'Unremembered Empire', kind: 'novel', seriesNumber: 27,
    arc: 'imperial', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#899fc5', x: 510, y: 775,
    summary: 'Survivors gather around Ultramar as the galaxy’s wider disaster becomes impossible to ignore.',
  },
  {
    id: 'ruinstorm', title: 'Ruinstorm', shortTitle: 'Ruinstorm', kind: 'novel', seriesNumber: 46,
    arc: 'siege', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#d2a85e', x: 730, y: 775,
    summary: 'The loyalist legions navigate the impossible storm between survival and Terra.',
  },
  {
    id: 'master-of-mankind', title: 'Master of Mankind', shortTitle: 'Master of Mankind', kind: 'novel', seriesNumber: 41,
    arc: 'siege', faction: 'Adeptus Mechanicus', spoilerLevel: 'high', accent: '#d2a85e', x: 960, y: 775,
    summary: 'The war inside the Webway reveals the scale of the cost paid for the Imperial project.',
  },
  {
    id: 'wolfsbane', title: 'Wolfsbane', shortTitle: 'Wolfsbane', kind: 'novel', seriesNumber: 49,
    arc: 'warmaster', faction: 'Space Wolves', spoilerLevel: 'high', accent: '#e0815d', x: 290, y: 775,
    summary: 'The Wolves strike at the Warmaster while time, fate, and the road to Terra collapse.',
  },
  {
    id: 'slaves-to-darkness', title: 'Slaves to Darkness', shortTitle: 'Slaves to Darkness', kind: 'novel', seriesNumber: 51,
    arc: 'warmaster', faction: 'Traitor Legions', spoilerLevel: 'high', accent: '#e0815d', x: 70, y: 775,
    summary: 'The traitor armada assembles for the final assault, but unity proves temporary.',
  },
  {
    id: 'buried-dagger', title: 'The Buried Dagger', shortTitle: 'The Buried Dagger', kind: 'novel', seriesNumber: 54,
    arc: 'siege', faction: 'Death Guard', spoilerLevel: 'high', accent: '#d2a85e', x: 70, y: 1000,
    summary: 'The Heresy’s numbered series closes as the Death Guard make their final transformation.',
  },
  {
    id: 'descent-of-angels', title: 'Descent of Angels', shortTitle: 'Descent of Angels', kind: 'novel', seriesNumber: 6,
    arc: 'dark-angels', faction: 'Dark Angels', spoilerLevel: 'medium', accent: '#879f91',
    summary: 'The First Legion’s history on Caliban becomes inseparable from the wider coming rebellion.',
  },
  {
    id: 'battle-for-the-abyss', title: 'Battle for the Abyss', shortTitle: 'Battle for the Abyss', kind: 'novel', seriesNumber: 8,
    arc: 'legions', faction: 'Multiple Legions', spoilerLevel: 'medium', accent: '#7da9d6',
    summary: 'A mixed crew of loyalists races to stop a Word Bearers weapon before it can reach Calth.',
  },
  {
    id: 'tales-of-heresy', title: 'Tales of Heresy', shortTitle: 'Tales of Heresy', kind: 'anthology', seriesNumber: 10,
    arc: 'opening', faction: 'Multiple Legions', spoilerLevel: 'medium', accent: '#55b8b0',
    summary: 'Short stories widen the first movements of the Heresy beyond the core novels.',
  },
  {
    id: 'fallen-angels', title: 'Fallen Angels', shortTitle: 'Fallen Angels', kind: 'novel', seriesNumber: 11,
    arc: 'dark-angels', faction: 'Dark Angels', spoilerLevel: 'medium', accent: '#879f91',
    summary: 'The Dark Angels face a rebellion on Caliban while the wider galaxy moves toward war.',
  },
  {
    id: 'nemesis', title: 'Nemesis', shortTitle: 'Nemesis', kind: 'novel', seriesNumber: 13,
    arc: 'legions', faction: 'Officio Assassinorum', spoilerLevel: 'medium', accent: '#7da9d6',
    summary: 'An assassination mission reveals how the new war is being fought in the shadows.',
  },
  {
    id: 'age-of-darkness', title: 'Age of Darkness', shortTitle: 'Age of Darkness', kind: 'anthology', seriesNumber: 16,
    arc: 'opening', faction: 'Multiple Legions', spoilerLevel: 'medium', accent: '#55b8b0',
    summary: 'A collection of short routes showing the Heresy spreading beyond its first theatres.',
  },
  {
    id: 'outcast-dead', title: 'The Outcast Dead', shortTitle: 'The Outcast Dead', kind: 'novel', seriesNumber: 17,
    arc: 'legions', faction: 'Thunder Warriors', spoilerLevel: 'medium', accent: '#7da9d6',
    summary: 'A hidden prison and an impossible escape expose the pressure inside Terra itself.',
  },
  {
    id: 'deliverance-lost', title: 'Deliverance Lost', shortTitle: 'Deliverance Lost', kind: 'novel', seriesNumber: 18,
    arc: 'shattered', faction: 'Raven Guard', spoilerLevel: 'high', accent: '#b88778',
    summary: 'The Raven Guard rebuilds after Isstvan while Corax searches for a way to answer the traitors.',
  },
  {
    id: 'the-primarchs', title: 'The Primarchs', shortTitle: 'The Primarchs', kind: 'anthology', seriesNumber: 20,
    arc: 'legions', faction: 'Primarchs', spoilerLevel: 'high', accent: '#7da9d6',
    summary: 'Four linked perspectives make the primarchs’ personal stakes visible inside the wider war.',
  },
  {
    id: 'fear-to-tread', title: 'Fear to Tread', shortTitle: 'Fear to Tread', kind: 'novel', seriesNumber: 21,
    arc: 'imperial', faction: 'Blood Angels', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'The Blood Angels confront a trap designed to break the legion and its primarch.',
  },
  {
    id: 'shadows-of-treachery', title: 'Shadows of Treachery', shortTitle: 'Shadows of Treachery', kind: 'anthology', seriesNumber: 22,
    arc: 'shattered', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'Stories from the Legions caught between the first betrayals and the war’s middle years.',
  },
  {
    id: 'angel-exterminatus', title: 'Angel Exterminatus', shortTitle: 'Angel Exterminatus', kind: 'novel', seriesNumber: 23,
    arc: 'shattered', faction: 'Iron Warriors', spoilerLevel: 'high', accent: '#b88778',
    summary: 'The Iron Warriors and Emperor’s Children pursue a weapon buried in an older war.',
  },
  {
    id: 'the-mark-of-calth', title: 'The Mark of Calth', shortTitle: 'The Mark of Calth', kind: 'anthology', seriesNumber: 25,
    arc: 'calth', faction: 'Ultramarines / Word Bearers', spoilerLevel: 'high', accent: '#a98dd6',
    summary: 'Calth’s aftermath continues through stories of survivors, memory, and underground war.',
  },
  {
    id: 'vulkan-lives', title: 'Vulkan Lives', shortTitle: 'Vulkan Lives', kind: 'novel', seriesNumber: 26,
    arc: 'salamanders', faction: 'Salamanders', spoilerLevel: 'high', accent: '#9aaf73',
    summary: 'Vulkan’s captivity becomes a test of endurance, identity, and the XVIII Legion’s future.',
  },
  {
    id: 'damnation-of-pythos', title: 'The Damnation of Pythos', shortTitle: 'Damnation of Pythos', kind: 'novel', seriesNumber: 30,
    arc: 'shattered', faction: 'Shattered Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'A stranded Shattered Legions force discovers that survival can be its own kind of corruption.',
  },
  {
    id: 'legacies-of-betrayal', title: 'Legacies of Betrayal', shortTitle: 'Legacies of Betrayal', kind: 'anthology', seriesNumber: 31,
    arc: 'shattered', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'A broad set of short stories fills in the pressure between the major campaign novels.',
  },
  {
    id: 'deathfire', title: 'Deathfire', shortTitle: 'Deathfire', kind: 'novel', seriesNumber: 32,
    arc: 'salamanders', faction: 'Salamanders', spoilerLevel: 'high', accent: '#9aaf73',
    summary: 'The Salamanders search for a way to restore Vulkan while the legion pays for its survival.',
  },
  {
    id: 'war-without-end', title: 'War Without End', shortTitle: 'War Without End', kind: 'anthology', seriesNumber: 33,
    arc: 'imperial', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'The Heresy’s many fronts continue through linked stories of loyalty, loss, and reprisal.',
  },
  {
    id: 'pharos', title: 'Pharos', shortTitle: 'Pharos', kind: 'novel', seriesNumber: 34,
    arc: 'imperial', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'The refugees of Sotha become a beacon and a target as the Ruinstorm closes around them.',
  },
  {
    id: 'eye-of-terra', title: 'Eye of Terra', shortTitle: 'Eye of Terra', kind: 'anthology', seriesNumber: 35,
    arc: 'imperial', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'Stories of the loyalist response as the war moves closer to Terra.',
  },
  {
    id: 'silent-war', title: 'The Silent War', shortTitle: 'The Silent War', kind: 'anthology', seriesNumber: 37,
    arc: 'legions', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#7da9d6',
    summary: 'Covert operations and hidden loyalties reveal the war being fought outside the main armies.',
  },
  {
    id: 'angels-of-caliban', title: 'Angels of Caliban', shortTitle: 'Angels of Caliban', kind: 'novel', seriesNumber: 38,
    arc: 'dark-angels', faction: 'Dark Angels', spoilerLevel: 'high', accent: '#879f91',
    summary: 'The Lion’s path and Caliban’s wound collide while the First Legion turns toward Terra.',
  },
  {
    id: 'corax', title: 'Corax', shortTitle: 'Corax', kind: 'anthology', seriesNumber: 40,
    arc: 'shattered', faction: 'Raven Guard', spoilerLevel: 'high', accent: '#b88778',
    summary: 'Corax’s stories trace the Raven Guard’s struggle to turn defeat into a weapon.',
  },
  {
    id: 'garro', title: 'Garro', shortTitle: 'Garro', kind: 'anthology', seriesNumber: 42,
    arc: 'imperial', faction: 'Knights-Errant', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'Garro’s missions carry loyalist resolve across the scattered fronts of the Heresy.',
  },
  {
    id: 'shattered-legions', title: 'Shattered Legions', shortTitle: 'Shattered Legions', kind: 'anthology', seriesNumber: 43,
    arc: 'shattered', faction: 'Shattered Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'The survivors of Isstvan wage a distributed war against the forces that broke them.',
  },
  {
    id: 'crimson-king', title: 'The Crimson King', shortTitle: 'The Crimson King', kind: 'novel', seriesNumber: 44,
    arc: 'legions', faction: 'Thousand Sons', spoilerLevel: 'high', accent: '#7da9d6',
    summary: 'Magnus and the Thousand Sons face the consequences of Prospero across the web of the warp.',
  },
  {
    id: 'tallarn', title: 'Tallarn', shortTitle: 'Tallarn', kind: 'anthology', seriesNumber: 45,
    arc: 'warmaster', faction: 'Iron Warriors', spoilerLevel: 'high', accent: '#e0815d',
    summary: 'A desert war becomes a proving ground for armour, endurance, and the traitor advance.',
  },
  {
    id: 'old-earth', title: 'Old Earth', shortTitle: 'Old Earth', kind: 'novel', seriesNumber: 47,
    arc: 'salamanders', faction: 'Salamanders', spoilerLevel: 'high', accent: '#9aaf73',
    summary: 'The Salamanders’ long route reaches Terra’s edge while Vulkan’s legacy is tested again.',
  },
  {
    id: 'solar-war', title: 'The Solar War', shortTitle: 'The Solar War', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Sons of Horus', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The Siege of Terra begins as the traitor armada enters the Solar System.',
  },
  {
    id: 'lost-and-damned', title: 'The Lost and the Damned', shortTitle: 'The Lost and the Damned', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The outer defences fail and the war closes around the walls of Terra.',
  },
  {
    id: 'first-wall', title: 'The First Wall', shortTitle: 'The First Wall', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The first great breach turns the Palace’s defences into a battlefield of its own.',
  },
  {
    id: 'saturnine', title: 'Saturnine', shortTitle: 'Saturnine', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Sons of Horus', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'A desperate defence and a hidden plan shape the next decisive turn of the Siege.',
  },
  {
    id: 'sons-of-selenar', title: 'The Sons of Selenar', shortTitle: 'The Sons of Selenar', kind: 'novella',
    arc: 'siege', faction: 'Luna / Imperial Fists', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'A focused Siege novella about the genetic legacy behind the Legions.',
  },
  {
    id: 'fury-of-magnus', title: 'The Fury of Magnus', shortTitle: 'The Fury of Magnus', kind: 'novella',
    arc: 'siege', faction: 'Thousand Sons', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'Magnus makes one last attempt to change the shape of the coming confrontation.',
  },
  {
    id: 'mortis', title: 'Mortis', shortTitle: 'Mortis', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The war around the Palace becomes a contest of engines, attrition, and failing certainty.',
  },
  {
    id: 'warhawk', title: 'Warhawk', shortTitle: 'Warhawk', kind: 'novel',
    arc: 'siege', faction: 'White Scars', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The White Scars make their decisive counterstroke as the Siege enters its final phase.',
  },
  {
    id: 'echoes-of-eternity', title: 'Echoes of Eternity', shortTitle: 'Echoes of Eternity', kind: 'novel',
    arc: 'siege', faction: 'Blood Angels', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The Blood Angels hold the final line as the war reaches the Eternity Gate.',
  },
  {
    id: 'end-and-death-i', title: 'The End and the Death: Volume I', shortTitle: 'The End and the Death I', kind: 'novel',
    arc: 'siege', faction: 'Imperium / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The final confrontation begins as the Palace and the Vengeful Spirit become one battlefield.',
  },
  {
    id: 'end-and-death-ii', title: 'The End and the Death: Volume II', shortTitle: 'The End and the Death II', kind: 'novel',
    arc: 'siege', faction: 'Imperium / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The final choices of the primarchs and the Emperor narrow toward their inevitable meeting.',
  },
  {
    id: 'end-and-death-iii', title: 'The End and the Death: Volume III', shortTitle: 'The End and the Death III', kind: 'novel',
    arc: 'siege', faction: 'Imperium / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The Heresy reaches its final exchange and the age that follows begins to take shape.',
  },
]

let overflowIndex = 0
export const books: Book[] = bookSeeds.map((book) => {
  const index = book.x === undefined || book.y === undefined ? overflowIndex++ : -1
  return {
    ...book,
    x: book.x ?? 1210 + (index % 5) * 235,
    y: book.y ?? 100 + Math.floor(index / 5) * 150,
  }
})

export const bookById = Object.fromEntries(books.map((book) => [book.id, book])) as Record<string, Book>

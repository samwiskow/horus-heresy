import additions from './sources/reference-additions.json'

export type BookKind = 'novel' | 'anthology' | 'novella' | 'short-story' | 'audio-drama' | 'graphic-novel'
export type EdgeKind = 'reference' | 'sequence'

export type Book = {
  id: string
  title: string
  shortTitle: string
  kind: BookKind
  seriesNumber?: number
  sourceId?: string
  collectionNumber?: number
  publication?: string
  metadataSourceUrl?: string
  faction: string
  spoilerLevel: 'low' | 'medium' | 'high'
  summary: string
  x: number
  y: number
}

type BookSeed = Omit<Book, 'x' | 'y'>

export type Connection = {
  from: string
  to: string
  kind: EdgeKind
  explanation: string
  sourceUrl: string
  sourceId: string
}

const bookSeeds: BookSeed[] = [
  {
    id: 'horus-rising', title: 'Horus Rising', shortTitle: 'Horus Rising', kind: 'novel', seriesNumber: 1,
    faction: 'Luna Wolves', spoilerLevel: 'low',
    summary: 'The Great Crusade at its height, seen through the eyes of the Luna Wolves and their new Warmaster.',
  },
  {
    id: 'false-gods', title: 'False Gods', shortTitle: 'False Gods', kind: 'novel', seriesNumber: 2,
    faction: 'Luna Wolves', spoilerLevel: 'low',
    summary: 'Horus is wounded, and the path from brotherhood to rebellion begins to turn.',
  },
  {
    id: 'galaxy-in-flames', title: 'Galaxy in Flames', shortTitle: 'Galaxy in Flames', kind: 'novel', seriesNumber: 3,
    faction: 'Sons of Horus', spoilerLevel: 'medium',
    summary: 'The rebellion reveals itself in full as the Isstvan atrocity reshapes the war.',
  },
  {
    id: 'flight-eisenstein', title: 'The Flight of the Eisenstein', shortTitle: 'Flight of the Eisenstein', kind: 'novel', seriesNumber: 4,
    faction: 'Death Guard', spoilerLevel: 'medium',
    summary: 'A loyalist escape carries the truth of the rebellion toward Terra.',
  },
  {
    id: 'fulgrim', title: 'Fulgrim', shortTitle: 'Fulgrim', kind: 'novel', seriesNumber: 5,
    faction: 'Emperor’s Children', spoilerLevel: 'medium',
    summary: 'The Emperor’s Children descend into excess as the wider rebellion gains momentum.',
  },
  {
    id: 'first-heretic', title: 'The First Heretic', shortTitle: 'The First Heretic', kind: 'novel', seriesNumber: 14,
    faction: 'Word Bearers', spoilerLevel: 'medium',
    summary: 'The Word Bearers’ fall becomes the spiritual engine of the wider rebellion.',
  },
  {
    id: 'thousand-sons', title: 'A Thousand Sons', shortTitle: 'A Thousand Sons', kind: 'novel', seriesNumber: 12,
    faction: 'Thousand Sons', spoilerLevel: 'medium',
    summary: 'Prospero’s scholars confront the cost of knowledge, warning, and Imperial mistrust.',
  },
  {
    id: 'prospero-burns', title: 'Prospero Burns', shortTitle: 'Prospero Burns', kind: 'novel', seriesNumber: 15,
    faction: 'Space Wolves', spoilerLevel: 'medium',
    summary: 'The Wolves’ view of the Prospero campaign and the stories told around it.',
  },
  {
    id: 'legion', title: 'Legion', shortTitle: 'Legion', kind: 'novel', seriesNumber: 7,
    faction: 'Alpha Legion', spoilerLevel: 'medium',
    summary: 'The Alpha Legion enters the war with a plan whose loyalties are deliberately difficult to read.',
  },
  {
    id: 'mechanicum', title: 'Mechanicum', shortTitle: 'Mechanicum', kind: 'novel', seriesNumber: 9,
    faction: 'Mechanicum', spoilerLevel: 'medium',
    summary: 'The war reaches Mars, where the Mechanicum fractures and ancient power wakes.',
  },
  {
    id: 'know-no-fear', title: 'Know No Fear', shortTitle: 'Know No Fear', kind: 'novel', seriesNumber: 19,
    faction: 'Ultramarines', spoilerLevel: 'high',
    summary: 'The Battle of Calth becomes an intimate, high-speed disaster for the XIII Legion.',
  },
  {
    id: 'betrayer', title: 'Betrayer', shortTitle: 'Betrayer', kind: 'novel', seriesNumber: 24,
    faction: 'World Eaters', spoilerLevel: 'high',
    summary: 'The shadow of Calth follows the World Eaters and Word Bearers into a brutal campaign.',
  },
  {
    id: 'scars', title: 'Scars', shortTitle: 'Scars', kind: 'novel', seriesNumber: 27,
    faction: 'White Scars', spoilerLevel: 'medium',
    summary: 'The White Scars choose their road through a war that refuses simple allegiance.',
  },
  {
    id: 'path-of-heaven', title: 'The Path of Heaven', shortTitle: 'The Path of Heaven', kind: 'novel', seriesNumber: 36,
    faction: 'White Scars', spoilerLevel: 'high',
    summary: 'The White Scars race toward the final war while the traitor fleet closes in.',
  },
  {
    id: 'vengeful-spirit', title: 'Vengeful Spirit', shortTitle: 'Vengeful Spirit', kind: 'novel', seriesNumber: 29,
    faction: 'Sons of Horus', spoilerLevel: 'high',
    summary: 'The Warmaster’s campaign reaches Molech and the rebellion gathers dangerous momentum.',
  },
  {
    id: 'praetorian-dorn', title: 'The Praetorian of Dorn', shortTitle: 'Praetorian of Dorn', kind: 'novel', seriesNumber: 39,
    faction: 'Imperial Fists', spoilerLevel: 'high',
    summary: 'The Imperial Fists meet the Alpha Legion in the tightening approach to Terra.',
  },
  {
    id: 'unremembered-empire', title: 'The Unremembered Empire', shortTitle: 'Unremembered Empire', kind: 'novel', seriesNumber: 27,
    faction: 'Ultramarines', spoilerLevel: 'high',
    summary: 'Survivors gather around Ultramar as the galaxy’s wider disaster becomes impossible to ignore.',
  },
  {
    id: 'ruinstorm', title: 'Ruinstorm', shortTitle: 'Ruinstorm', kind: 'novel', seriesNumber: 46,
    faction: 'Ultramarines', spoilerLevel: 'high',
    summary: 'The loyalist legions navigate the impossible storm between survival and Terra.',
  },
  {
    id: 'master-of-mankind', title: 'Master of Mankind', shortTitle: 'Master of Mankind', kind: 'novel', seriesNumber: 41,
    faction: 'Adeptus Mechanicus', spoilerLevel: 'high',
    summary: 'The war inside the Webway reveals the scale of the cost paid for the Imperial project.',
  },
  {
    id: 'wolfsbane', title: 'Wolfsbane', shortTitle: 'Wolfsbane', kind: 'novel', seriesNumber: 49,
    faction: 'Space Wolves', spoilerLevel: 'high',
    summary: 'The Wolves strike at the Warmaster while time, fate, and the road to Terra collapse.',
  },
  {
    id: 'slaves-to-darkness', title: 'Slaves to Darkness', shortTitle: 'Slaves to Darkness', kind: 'novel', seriesNumber: 51,
    faction: 'Traitor Legions', spoilerLevel: 'high',
    summary: 'The traitor armada assembles for the final assault, but unity proves temporary.',
  },
  {
    id: 'buried-dagger', title: 'The Buried Dagger', shortTitle: 'The Buried Dagger', kind: 'novel', seriesNumber: 54,
    faction: 'Death Guard', spoilerLevel: 'high',
    summary: 'The Heresy’s numbered series closes as the Death Guard make their final transformation.',
  },
  {
    id: 'descent-of-angels', title: 'Descent of Angels', shortTitle: 'Descent of Angels', kind: 'novel', seriesNumber: 6,
    faction: 'Dark Angels', spoilerLevel: 'medium',
    summary: 'The First Legion’s history on Caliban becomes inseparable from the wider coming rebellion.',
  },
  {
    id: 'battle-for-the-abyss', title: 'Battle for the Abyss', shortTitle: 'Battle for the Abyss', kind: 'novel', seriesNumber: 8,
    faction: 'Multiple Legions', spoilerLevel: 'medium',
    summary: 'A mixed crew of loyalists races to stop a Word Bearers weapon before it can reach Calth.',
  },
  {
    id: 'tales-of-heresy', title: 'Tales of Heresy', shortTitle: 'Tales of Heresy', kind: 'anthology', seriesNumber: 10,
    faction: 'Multiple Legions', spoilerLevel: 'medium',
    summary: 'Short stories widen the first movements of the Heresy beyond the core novels.',
  },
  {
    id: 'fallen-angels', title: 'Fallen Angels', shortTitle: 'Fallen Angels', kind: 'novel', seriesNumber: 11,
    faction: 'Dark Angels', spoilerLevel: 'medium',
    summary: 'The Dark Angels face a rebellion on Caliban while the wider galaxy moves toward war.',
  },
  {
    id: 'nemesis', title: 'Nemesis', shortTitle: 'Nemesis', kind: 'novel', seriesNumber: 13,
    faction: 'Officio Assassinorum', spoilerLevel: 'medium',
    summary: 'An assassination mission reveals how the new war is being fought in the shadows.',
  },
  {
    id: 'age-of-darkness', title: 'Age of Darkness', shortTitle: 'Age of Darkness', kind: 'anthology', seriesNumber: 16,
    faction: 'Multiple Legions', spoilerLevel: 'medium',
    summary: 'A collection of short routes showing the Heresy spreading beyond its first theatres.',
  },
  {
    id: 'outcast-dead', title: 'The Outcast Dead', shortTitle: 'The Outcast Dead', kind: 'novel', seriesNumber: 17,
    faction: 'Thunder Warriors', spoilerLevel: 'medium',
    summary: 'A hidden prison and an impossible escape expose the pressure inside Terra itself.',
  },
  {
    id: 'deliverance-lost', title: 'Deliverance Lost', shortTitle: 'Deliverance Lost', kind: 'novel', seriesNumber: 18,
    faction: 'Raven Guard', spoilerLevel: 'high',
    summary: 'The Raven Guard rebuilds after Isstvan while Corax searches for a way to answer the traitors.',
  },
  {
    id: 'the-primarchs', title: 'The Primarchs', shortTitle: 'The Primarchs', kind: 'anthology', seriesNumber: 20,
    faction: 'Primarchs', spoilerLevel: 'high',
    summary: 'Four linked perspectives make the primarchs’ personal stakes visible inside the wider war.',
  },
  {
    id: 'fear-to-tread', title: 'Fear to Tread', shortTitle: 'Fear to Tread', kind: 'novel', seriesNumber: 21,
    faction: 'Blood Angels', spoilerLevel: 'high',
    summary: 'The Blood Angels confront a trap designed to break the legion and its primarch.',
  },
  {
    id: 'shadows-of-treachery', title: 'Shadows of Treachery', shortTitle: 'Shadows of Treachery', kind: 'anthology', seriesNumber: 22,
    faction: 'Multiple Legions', spoilerLevel: 'high',
    summary: 'Stories from the Legions caught between the first betrayals and the war’s middle years.',
  },
  {
    id: 'angel-exterminatus', title: 'Angel Exterminatus', shortTitle: 'Angel Exterminatus', kind: 'novel', seriesNumber: 23,
    faction: 'Iron Warriors', spoilerLevel: 'high',
    summary: 'The Iron Warriors and Emperor’s Children pursue a weapon buried in an older war.',
  },
  {
    id: 'the-mark-of-calth', title: 'The Mark of Calth', shortTitle: 'The Mark of Calth', kind: 'anthology', seriesNumber: 25,
    faction: 'Ultramarines / Word Bearers', spoilerLevel: 'high',
    summary: 'Calth’s aftermath continues through stories of survivors, memory, and underground war.',
  },
  {
    id: 'vulkan-lives', title: 'Vulkan Lives', shortTitle: 'Vulkan Lives', kind: 'novel', seriesNumber: 26,
    faction: 'Salamanders', spoilerLevel: 'high',
    summary: 'Vulkan’s captivity becomes a test of endurance, identity, and the XVIII Legion’s future.',
  },
  {
    id: 'damnation-of-pythos', title: 'The Damnation of Pythos', shortTitle: 'Damnation of Pythos', kind: 'novel', seriesNumber: 30,
    faction: 'Shattered Legions', spoilerLevel: 'high',
    summary: 'A stranded Shattered Legions force discovers that survival can be its own kind of corruption.',
  },
  {
    id: 'legacies-of-betrayal', title: 'Legacies of Betrayal', shortTitle: 'Legacies of Betrayal', kind: 'anthology', seriesNumber: 31,
    faction: 'Multiple Legions', spoilerLevel: 'high',
    summary: 'A broad set of short stories fills in the pressure between the major campaign novels.',
  },
  {
    id: 'deathfire', title: 'Deathfire', shortTitle: 'Deathfire', kind: 'novel', seriesNumber: 32,
    faction: 'Salamanders', spoilerLevel: 'high',
    summary: 'The Salamanders search for a way to restore Vulkan while the legion pays for its survival.',
  },
  {
    id: 'war-without-end', title: 'War Without End', shortTitle: 'War Without End', kind: 'anthology', seriesNumber: 33,
    faction: 'Multiple Legions', spoilerLevel: 'high',
    summary: 'The Heresy’s many fronts continue through linked stories of loyalty, loss, and reprisal.',
  },
  {
    id: 'pharos', title: 'Pharos', shortTitle: 'Pharos', kind: 'novel', seriesNumber: 34,
    faction: 'Ultramarines', spoilerLevel: 'high',
    summary: 'The refugees of Sotha become a beacon and a target as the Ruinstorm closes around them.',
  },
  {
    id: 'eye-of-terra', title: 'Eye of Terra', shortTitle: 'Eye of Terra', kind: 'anthology', seriesNumber: 35,
    faction: 'Multiple Legions', spoilerLevel: 'high',
    summary: 'Stories of the loyalist response as the war moves closer to Terra.',
  },
  {
    id: 'silent-war', title: 'The Silent War', shortTitle: 'The Silent War', kind: 'anthology', seriesNumber: 37,
    faction: 'Multiple Legions', spoilerLevel: 'high',
    summary: 'Covert operations and hidden loyalties reveal the war being fought outside the main armies.',
  },
  {
    id: 'angels-of-caliban', title: 'Angels of Caliban', shortTitle: 'Angels of Caliban', kind: 'novel', seriesNumber: 38,
    faction: 'Dark Angels', spoilerLevel: 'high',
    summary: 'The Lion’s path and Caliban’s wound collide while the First Legion turns toward Terra.',
  },
  {
    id: 'corax', title: 'Corax', shortTitle: 'Corax', kind: 'anthology', seriesNumber: 40,
    faction: 'Raven Guard', spoilerLevel: 'high',
    summary: 'Corax’s stories trace the Raven Guard’s struggle to turn defeat into a weapon.',
  },
  {
    id: 'garro', title: 'Garro', shortTitle: 'Garro', kind: 'novel', seriesNumber: 42,
    faction: 'Knights-Errant', spoilerLevel: 'high',
    summary: 'Garro’s missions carry loyalist resolve across the scattered fronts of the Heresy.',
  },
  {
    id: 'shattered-legions', title: 'Shattered Legions', shortTitle: 'Shattered Legions', kind: 'anthology', seriesNumber: 43,
    faction: 'Shattered Legions', spoilerLevel: 'high',
    summary: 'The survivors of Isstvan wage a distributed war against the forces that broke them.',
  },
  {
    id: 'crimson-king', title: 'The Crimson King', shortTitle: 'The Crimson King', kind: 'novel', seriesNumber: 44,
    faction: 'Thousand Sons', spoilerLevel: 'high',
    summary: 'Magnus and the Thousand Sons face the consequences of Prospero across the web of the warp.',
  },
  {
    id: 'tallarn', title: 'Tallarn', shortTitle: 'Tallarn', kind: 'anthology', seriesNumber: 45,
    faction: 'Iron Warriors', spoilerLevel: 'high',
    summary: 'A desert war becomes a proving ground for armour, endurance, and the traitor advance.',
  },
  {
    id: 'old-earth', title: 'Old Earth', shortTitle: 'Old Earth', kind: 'novel', seriesNumber: 47,
    faction: 'Salamanders', spoilerLevel: 'high',
    summary: 'The Salamanders’ long route reaches Terra’s edge while Vulkan’s legacy is tested again.',
  },
  {
    id: 'solar-war', title: 'The Solar War', shortTitle: 'The Solar War', kind: 'novel',
    faction: 'Imperial Fists / Sons of Horus', spoilerLevel: 'high',
    summary: 'The Siege of Terra begins as the traitor armada enters the Solar System.',
  },
  {
    id: 'lost-and-damned', title: 'The Lost and the Damned', shortTitle: 'The Lost and the Damned', kind: 'novel',
    faction: 'Imperial Fists / Traitor Legions', spoilerLevel: 'high',
    summary: 'The outer defences fail and the war closes around the walls of Terra.',
  },
  {
    id: 'first-wall', title: 'The First Wall', shortTitle: 'The First Wall', kind: 'novel',
    faction: 'Imperial Fists', spoilerLevel: 'high',
    summary: 'The first great breach turns the Palace’s defences into a battlefield of its own.',
  },
  {
    id: 'saturnine', title: 'Saturnine', shortTitle: 'Saturnine', kind: 'novel',
    faction: 'Imperial Fists / Sons of Horus', spoilerLevel: 'high',
    summary: 'A desperate defence and a hidden plan shape the next decisive turn of the Siege.',
  },
  {
    id: 'sons-of-selenar', title: 'The Sons of Selenar', shortTitle: 'The Sons of Selenar', kind: 'novella',
    faction: 'Luna / Imperial Fists', spoilerLevel: 'high',
    summary: 'A focused Siege novella about the genetic legacy behind the Legions.',
  },
  {
    id: 'fury-of-magnus', title: 'The Fury of Magnus', shortTitle: 'The Fury of Magnus', kind: 'novella',
    faction: 'Thousand Sons', spoilerLevel: 'high',
    summary: 'Magnus makes one last attempt to change the shape of the coming confrontation.',
  },
  {
    id: 'mortis', title: 'Mortis', shortTitle: 'Mortis', kind: 'novel',
    faction: 'Imperial Fists / Traitor Legions', spoilerLevel: 'high',
    summary: 'The war around the Palace becomes a contest of engines, attrition, and failing certainty.',
  },
  {
    id: 'warhawk', title: 'Warhawk', shortTitle: 'Warhawk', kind: 'novel',
    faction: 'White Scars', spoilerLevel: 'high',
    summary: 'The White Scars make their decisive counterstroke as the Siege enters its final phase.',
  },
  {
    id: 'echoes-of-eternity', title: 'Echoes of Eternity', shortTitle: 'Echoes of Eternity', kind: 'novel',
    faction: 'Blood Angels', spoilerLevel: 'high',
    summary: 'The Blood Angels hold the final line as the war reaches the Eternity Gate.',
  },
  {
    id: 'end-and-death-i', title: 'The End and the Death: Volume I', shortTitle: 'The End and the Death I', kind: 'novel',
    faction: 'Imperium / Traitor Legions', spoilerLevel: 'high',
    summary: 'The final confrontation begins as the Palace and the Vengeful Spirit become one battlefield.',
  },
  {
    id: 'end-and-death-ii', title: 'The End and the Death: Volume II', shortTitle: 'The End and the Death II', kind: 'novel',
    faction: 'Imperium / Traitor Legions', spoilerLevel: 'high',
    summary: 'The final choices of the primarchs and the Emperor narrow toward their inevitable meeting.',
  },
  {
    id: 'end-and-death-iii', title: 'The End and the Death: Volume III', shortTitle: 'The End and the Death III', kind: 'novel',
    faction: 'Imperium / Traitor Legions', spoilerLevel: 'high',
    summary: 'The Heresy reaches its final exchange and the age that follows begins to take shape.',
  },
]

const sourceSeeds = additions.map((book) => ({ ...book, shortTitle: book.title, faction: '', spoilerLevel: 'low', summary: '' })) as BookSeed[]

export const books: Book[] = [...bookSeeds, ...sourceSeeds].map((book, index) => ({
  ...book,
  x: 70 + (index % 6) * COLUMN_STEP,
  y: 100 + Math.floor(index / 6) * ROW_STEP,
}))

export const bookById = Object.fromEntries(books.map((book) => [book.id, book])) as Record<string, Book>

export const referenceCollections: Record<number, { title: string; bookId?: string }> = Object.fromEntries([
  ...bookSeeds.filter((book) => book.kind === 'anthology' || book.id === 'garro').map((book) => [book.seriesNumber, { title: book.title, bookId: book.id }]),
  [48, { title: 'The Burden of Loyalty' }],
  [50, { title: 'Born of Flame' }],
  [52, { title: 'Heralds of the Siege' }],
])
import { COLUMN_STEP, ROW_STEP } from './map-layout'

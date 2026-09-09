export type BookKind = 'novel' | 'anthology' | 'novella'
export type ArcId = 'opening' | 'dark-angels' | 'legions' | 'calth' | 'salamanders' | 'shattered' | 'imperial' | 'warmaster' | 'siege'
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

type BookSeed = Omit<Book, 'x' | 'y'> & Partial<Pick<Book, 'x' | 'y'>>

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
  'dark-angels': {
    label: 'The Lion & Caliban',
    blurb: 'The First Legion’s divided loyalties, the fall of Caliban, and the return of the Lion.',
    colour: '#879f91',
  },
  calth: {
    label: 'Calth & the Word Bearers',
    blurb: 'A focused route through faith, betrayal, and the battle that remakes the XIII.',
    colour: '#a98dd6',
  },
  salamanders: {
    label: 'Vulkan & the Salamanders',
    blurb: 'Vulkan’s survival, the XVIII Legion’s long road, and the cost of endurance after Isstvan.',
    colour: '#9aaf73',
  },
  shattered: {
    label: 'The Shattered Legions',
    blurb: 'Iron Hands, Raven Guard, and Salamanders fight a war of survival behind enemy lines.',
    colour: '#b88778',
  },
  imperial: {
    label: 'Loyalist convergence',
    blurb: 'The loyalist legions gather, regroup, and find the routes that can still reach Terra.',
    colour: '#899fc5',
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

const bookSeeds: BookSeed[] = [
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
    arc: 'imperial', faction: 'Imperial Fists', spoilerLevel: 'high', accent: '#899fc5', x: 960, y: 325,
    summary: 'The Imperial Fists meet the Alpha Legion in the tightening approach to Terra.',
    reason: 'A loyalist counter-route that connects the legion war to the Siege.',
  },
  {
    id: 'unremembered-empire', title: 'The Unremembered Empire', shortTitle: 'Unremembered Empire', kind: 'novel', seriesNumber: 27,
    arc: 'imperial', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#899fc5', x: 510, y: 775,
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
  {
    id: 'descent-of-angels', title: 'Descent of Angels', shortTitle: 'Descent of Angels', kind: 'novel', seriesNumber: 6,
    arc: 'dark-angels', faction: 'Dark Angels', spoilerLevel: 'medium', accent: '#879f91',
    summary: 'The First Legion’s history on Caliban becomes inseparable from the wider coming rebellion.',
    reason: 'The first major branch for the Lion and the Dark Angels.',
  },
  {
    id: 'battle-for-the-abyss', title: 'Battle for the Abyss', shortTitle: 'Battle for the Abyss', kind: 'novel', seriesNumber: 8,
    arc: 'legions', faction: 'Multiple Legions', spoilerLevel: 'medium', accent: '#7da9d6',
    summary: 'A mixed crew of loyalists races to stop a Word Bearers weapon before it can reach Calth.',
    reason: 'A self-contained early-war branch that foreshadows the Calth campaign.',
  },
  {
    id: 'tales-of-heresy', title: 'Tales of Heresy', shortTitle: 'Tales of Heresy', kind: 'anthology', seriesNumber: 10,
    arc: 'opening', faction: 'Multiple Legions', spoilerLevel: 'medium', accent: '#55b8b0',
    summary: 'Short stories widen the first movements of the Heresy beyond the core novels.',
    reason: 'A supporting collection for readers who want the campaign’s first side routes.',
  },
  {
    id: 'fallen-angels', title: 'Fallen Angels', shortTitle: 'Fallen Angels', kind: 'novel', seriesNumber: 11,
    arc: 'dark-angels', faction: 'Dark Angels', spoilerLevel: 'medium', accent: '#879f91',
    summary: 'The Dark Angels face a rebellion on Caliban while the wider galaxy moves toward war.',
    reason: 'Direct continuation of the Dark Angels branch opened by Descent of Angels.',
  },
  {
    id: 'nemesis', title: 'Nemesis', shortTitle: 'Nemesis', kind: 'novel', seriesNumber: 13,
    arc: 'legions', faction: 'Officio Assassinorum', spoilerLevel: 'medium', accent: '#7da9d6',
    summary: 'An assassination mission reveals how the new war is being fought in the shadows.',
    reason: 'A parallel intelligence route between the opening and the larger legion wars.',
  },
  {
    id: 'age-of-darkness', title: 'Age of Darkness', shortTitle: 'Age of Darkness', kind: 'anthology', seriesNumber: 16,
    arc: 'opening', faction: 'Multiple Legions', spoilerLevel: 'medium', accent: '#55b8b0',
    summary: 'A collection of short routes showing the Heresy spreading beyond its first theatres.',
    reason: 'Supporting material for the point where the campaign stops being a single front.',
  },
  {
    id: 'outcast-dead', title: 'The Outcast Dead', shortTitle: 'The Outcast Dead', kind: 'novel', seriesNumber: 17,
    arc: 'legions', faction: 'Thunder Warriors', spoilerLevel: 'medium', accent: '#7da9d6',
    summary: 'A hidden prison and an impossible escape expose the pressure inside Terra itself.',
    reason: 'A parallel Terra-side story that deepens the cost of the early rebellion.',
  },
  {
    id: 'deliverance-lost', title: 'Deliverance Lost', shortTitle: 'Deliverance Lost', kind: 'novel', seriesNumber: 18,
    arc: 'shattered', faction: 'Raven Guard', spoilerLevel: 'high', accent: '#b88778',
    summary: 'The Raven Guard rebuilds after Isstvan while Corax searches for a way to answer the traitors.',
    reason: 'A key launch point for the Shattered Legions and Corax’s route.',
  },
  {
    id: 'the-primarchs', title: 'The Primarchs', shortTitle: 'The Primarchs', kind: 'anthology', seriesNumber: 20,
    arc: 'legions', faction: 'Primarchs', spoilerLevel: 'high', accent: '#7da9d6',
    summary: 'Four linked perspectives make the primarchs’ personal stakes visible inside the wider war.',
    reason: 'Supporting stories for readers following several legion leaders at once.',
  },
  {
    id: 'fear-to-tread', title: 'Fear to Tread', shortTitle: 'Fear to Tread', kind: 'novel', seriesNumber: 21,
    arc: 'imperial', faction: 'Blood Angels', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'The Blood Angels confront a trap designed to break the legion and its primarch.',
    reason: 'The major Blood Angels branch before the loyalist routes converge.',
  },
  {
    id: 'shadows-of-treachery', title: 'Shadows of Treachery', shortTitle: 'Shadows of Treachery', kind: 'anthology', seriesNumber: 22,
    arc: 'shattered', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'Stories from the Legions caught between the first betrayals and the war’s middle years.',
    reason: 'A supporting collection for the Shattered Legions and loyalist counter-routes.',
  },
  {
    id: 'angel-exterminatus', title: 'Angel Exterminatus', shortTitle: 'Angel Exterminatus', kind: 'novel', seriesNumber: 23,
    arc: 'shattered', faction: 'Iron Warriors', spoilerLevel: 'high', accent: '#b88778',
    summary: 'The Iron Warriors and Emperor’s Children pursue a weapon buried in an older war.',
    reason: 'A traitor-side branch that connects Fulgrim to Perturabo and the Shattered Legions.',
  },
  {
    id: 'the-mark-of-calth', title: 'The Mark of Calth', shortTitle: 'The Mark of Calth', kind: 'anthology', seriesNumber: 25,
    arc: 'calth', faction: 'Ultramarines / Word Bearers', spoilerLevel: 'high', accent: '#a98dd6',
    summary: 'Calth’s aftermath continues through stories of survivors, memory, and underground war.',
    reason: 'The supporting collection for the Calth and Word Bearers branch.',
  },
  {
    id: 'vulkan-lives', title: 'Vulkan Lives', shortTitle: 'Vulkan Lives', kind: 'novel', seriesNumber: 26,
    arc: 'salamanders', faction: 'Salamanders', spoilerLevel: 'high', accent: '#9aaf73',
    summary: 'Vulkan’s captivity becomes a test of endurance, identity, and the XVIII Legion’s future.',
    reason: 'The opening novel in the Salamanders’ dedicated arc.',
  },
  {
    id: 'damnation-of-pythos', title: 'The Damnation of Pythos', shortTitle: 'Damnation of Pythos', kind: 'novel', seriesNumber: 30,
    arc: 'shattered', faction: 'Shattered Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'A stranded Shattered Legions force discovers that survival can be its own kind of corruption.',
    reason: 'A darker, self-contained branch after Isstvan.',
  },
  {
    id: 'legacies-of-betrayal', title: 'Legacies of Betrayal', shortTitle: 'Legacies of Betrayal', kind: 'anthology', seriesNumber: 31,
    arc: 'shattered', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'A broad set of short stories fills in the pressure between the major campaign novels.',
    reason: 'Supporting material for the middle-war branches.',
  },
  {
    id: 'deathfire', title: 'Deathfire', shortTitle: 'Deathfire', kind: 'novel', seriesNumber: 32,
    arc: 'salamanders', faction: 'Salamanders', spoilerLevel: 'high', accent: '#9aaf73',
    summary: 'The Salamanders search for a way to restore Vulkan while the legion pays for its survival.',
    reason: 'The direct continuation of Vulkan Lives.',
  },
  {
    id: 'war-without-end', title: 'War Without End', shortTitle: 'War Without End', kind: 'anthology', seriesNumber: 33,
    arc: 'imperial', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'The Heresy’s many fronts continue through linked stories of loyalty, loss, and reprisal.',
    reason: 'A supporting collection around the loyalist convergence.',
  },
  {
    id: 'pharos', title: 'Pharos', shortTitle: 'Pharos', kind: 'novel', seriesNumber: 34,
    arc: 'imperial', faction: 'Ultramarines', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'The refugees of Sotha become a beacon and a target as the Ruinstorm closes around them.',
    reason: 'A loyalist branch that leads toward the final convergence.',
  },
  {
    id: 'eye-of-terra', title: 'Eye of Terra', shortTitle: 'Eye of Terra', kind: 'anthology', seriesNumber: 35,
    arc: 'imperial', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'Stories of the loyalist response as the war moves closer to Terra.',
    reason: 'Supporting material for Garro, the Lion, and the wider loyalist front.',
  },
  {
    id: 'silent-war', title: 'The Silent War', shortTitle: 'The Silent War', kind: 'anthology', seriesNumber: 37,
    arc: 'legions', faction: 'Multiple Legions', spoilerLevel: 'high', accent: '#7da9d6',
    summary: 'Covert operations and hidden loyalties reveal the war being fought outside the main armies.',
    reason: 'Supporting material for the Alpha Legion, assassins, and intelligence routes.',
  },
  {
    id: 'angels-of-caliban', title: 'Angels of Caliban', shortTitle: 'Angels of Caliban', kind: 'novel', seriesNumber: 38,
    arc: 'dark-angels', faction: 'Dark Angels', spoilerLevel: 'high', accent: '#879f91',
    summary: 'The Lion’s path and Caliban’s wound collide while the First Legion turns toward Terra.',
    reason: 'The late-stage Dark Angels branch before the Siege.',
  },
  {
    id: 'corax', title: 'Corax', shortTitle: 'Corax', kind: 'anthology', seriesNumber: 40,
    arc: 'shattered', faction: 'Raven Guard', spoilerLevel: 'high', accent: '#b88778',
    summary: 'Corax’s stories trace the Raven Guard’s struggle to turn defeat into a weapon.',
    reason: 'Supporting material for the Raven Guard and Shattered Legions.',
  },
  {
    id: 'garro', title: 'Garro', shortTitle: 'Garro', kind: 'anthology', seriesNumber: 42,
    arc: 'imperial', faction: 'Knights-Errant', spoilerLevel: 'high', accent: '#899fc5',
    summary: 'Garro’s missions carry loyalist resolve across the scattered fronts of the Heresy.',
    reason: 'A connective route into the Knights-Errant and the approach to Terra.',
  },
  {
    id: 'shattered-legions', title: 'Shattered Legions', shortTitle: 'Shattered Legions', kind: 'anthology', seriesNumber: 43,
    arc: 'shattered', faction: 'Shattered Legions', spoilerLevel: 'high', accent: '#b88778',
    summary: 'The survivors of Isstvan wage a distributed war against the forces that broke them.',
    reason: 'The fullest anthology view of the Shattered Legions arc.',
  },
  {
    id: 'crimson-king', title: 'The Crimson King', shortTitle: 'The Crimson King', kind: 'novel', seriesNumber: 44,
    arc: 'legions', faction: 'Thousand Sons', spoilerLevel: 'high', accent: '#7da9d6',
    summary: 'Magnus and the Thousand Sons face the consequences of Prospero across the web of the warp.',
    reason: 'The late Thousand Sons branch after A Thousand Sons and Prospero Burns.',
  },
  {
    id: 'tallarn', title: 'Tallarn', shortTitle: 'Tallarn', kind: 'anthology', seriesNumber: 45,
    arc: 'warmaster', faction: 'Iron Warriors', spoilerLevel: 'high', accent: '#e0815d',
    summary: 'A desert war becomes a proving ground for armour, endurance, and the traitor advance.',
    reason: 'A self-contained middle-war branch before the final traitor push.',
  },
  {
    id: 'old-earth', title: 'Old Earth', shortTitle: 'Old Earth', kind: 'novel', seriesNumber: 47,
    arc: 'salamanders', faction: 'Salamanders', spoilerLevel: 'high', accent: '#9aaf73',
    summary: 'The Salamanders’ long route reaches Terra’s edge while Vulkan’s legacy is tested again.',
    reason: 'The closing novel of the dedicated Salamanders arc.',
  },
  {
    id: 'solar-war', title: 'The Solar War', shortTitle: 'The Solar War', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Sons of Horus', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The Siege of Terra begins as the traitor armada enters the Solar System.',
    reason: 'The first book of the Siege sequence proper.',
  },
  {
    id: 'lost-and-damned', title: 'The Lost and the Damned', shortTitle: 'The Lost and the Damned', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The outer defences fail and the war closes around the walls of Terra.',
    reason: 'Direct continuation of the Solar War.',
  },
  {
    id: 'first-wall', title: 'The First Wall', shortTitle: 'The First Wall', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The first great breach turns the Palace’s defences into a battlefield of its own.',
    reason: 'The Imperial Fists’ central Siege branch.',
  },
  {
    id: 'saturnine', title: 'Saturnine', shortTitle: 'Saturnine', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Sons of Horus', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'A desperate defence and a hidden plan shape the next decisive turn of the Siege.',
    reason: 'A major convergence point inside the Siege sequence.',
  },
  {
    id: 'sons-of-selenar', title: 'The Sons of Selenar', shortTitle: 'The Sons of Selenar', kind: 'novella',
    arc: 'siege', faction: 'Luna / Imperial Fists', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'A focused Siege novella about the genetic legacy behind the Legions.',
    reason: 'A supporting branch around Saturnine and the Palace’s hidden resources.',
  },
  {
    id: 'fury-of-magnus', title: 'The Fury of Magnus', shortTitle: 'The Fury of Magnus', kind: 'novella',
    arc: 'siege', faction: 'Thousand Sons', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'Magnus makes one last attempt to change the shape of the coming confrontation.',
    reason: 'A late Thousand Sons branch inside the Siege.',
  },
  {
    id: 'mortis', title: 'Mortis', shortTitle: 'Mortis', kind: 'novel',
    arc: 'siege', faction: 'Imperial Fists / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The war around the Palace becomes a contest of engines, attrition, and failing certainty.',
    reason: 'The central bridge from the inner Siege to its endgame.',
  },
  {
    id: 'warhawk', title: 'Warhawk', shortTitle: 'Warhawk', kind: 'novel',
    arc: 'siege', faction: 'White Scars', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The White Scars make their decisive counterstroke as the Siege enters its final phase.',
    reason: 'The late White Scars branch and a major Siege turning point.',
  },
  {
    id: 'echoes-of-eternity', title: 'Echoes of Eternity', shortTitle: 'Echoes of Eternity', kind: 'novel',
    arc: 'siege', faction: 'Blood Angels', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The Blood Angels hold the final line as the war reaches the Eternity Gate.',
    reason: 'The last major Legion-focused novel before the end of the Siege.',
  },
  {
    id: 'end-and-death-i', title: 'The End and the Death: Volume I', shortTitle: 'The End and the Death I', kind: 'novel',
    arc: 'siege', faction: 'Imperium / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The final confrontation begins as the Palace and the Vengeful Spirit become one battlefield.',
    reason: 'The opening volume of the Heresy’s concluding trilogy.',
  },
  {
    id: 'end-and-death-ii', title: 'The End and the Death: Volume II', shortTitle: 'The End and the Death II', kind: 'novel',
    arc: 'siege', faction: 'Imperium / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The final choices of the primarchs and the Emperor narrow toward their inevitable meeting.',
    reason: 'Direct continuation of Volume I.',
  },
  {
    id: 'end-and-death-iii', title: 'The End and the Death: Volume III', shortTitle: 'The End and the Death III', kind: 'novel',
    arc: 'siege', faction: 'Imperium / Traitor Legions', spoilerLevel: 'high', accent: '#d2a85e',
    summary: 'The Heresy reaches its final exchange and the age that follows begins to take shape.',
    reason: 'The closing volume of the Siege of Terra sequence.',
  },
]

export const books: Book[] = bookSeeds.map((book, index) => ({
  ...book,
  x: book.x ?? 70 + (index % 7) * 235,
  y: book.y ?? 100 + Math.floor(index / 7) * 150,
}))

const curatedConnections: Connection[] = [
  { from: 'horus-rising', to: 'false-gods', kind: 'sequel', explanation: 'The direct continuation of the opening campaign.' },
  { from: 'false-gods', to: 'galaxy-in-flames', kind: 'sequel', explanation: 'Completes the opening trilogy.' },
  { from: 'galaxy-in-flames', to: 'flight-eisenstein', kind: 'sequel', explanation: 'Direct continuation of the opening trilogy as the loyalist escape carries the Isstvan news toward Terra.' },
  { from: 'galaxy-in-flames', to: 'fulgrim', kind: 'parallel', explanation: 'Expands the Isstvan catastrophe through another legion.' },
  { from: 'galaxy-in-flames', to: 'first-heretic', kind: 'recommended', explanation: 'Follows the rebellion back to its spiritual origin.' },
  { from: 'galaxy-in-flames', to: 'thousand-sons', kind: 'parallel', explanation: 'Opens the major legion branches beyond Isstvan.' },
  { from: 'first-heretic', to: 'know-no-fear', kind: 'recommended', explanation: 'The Word Bearers’ route reaches Calth.' },
  { from: 'know-no-fear', to: 'betrayer', kind: 'recommended', explanation: 'The consequences of Calth move into the Shadow Crusade.' },
  { from: 'thousand-sons', to: 'prospero-burns', kind: 'parallel', explanation: 'Paired perspectives on Prospero; neither book is a sequel to the other.' },
  { from: 'thousand-sons', to: 'crimson-king', kind: 'sequel', explanation: 'Direct follow-up to the Thousand Sons story after the razing of Prospero.' },
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
  { from: 'saturnine', to: 'mortis', kind: 'sequel', explanation: 'Direct continuation of the Siege of Terra novel sequence.' },
  { from: 'solar-war', to: 'lost-and-damned', kind: 'sequel', explanation: 'Direct continuation of the Siege of Terra novel sequence.' },
  { from: 'lost-and-damned', to: 'first-wall', kind: 'sequel', explanation: 'Direct continuation of the Siege of Terra novel sequence.' },
  { from: 'first-wall', to: 'saturnine', kind: 'sequel', explanation: 'Direct continuation of the Siege of Terra novel sequence.' },
  { from: 'mortis', to: 'warhawk', kind: 'sequel', explanation: 'Direct continuation of the Siege of Terra novel sequence.' },
  { from: 'warhawk', to: 'echoes-of-eternity', kind: 'sequel', explanation: 'Direct continuation of the Siege of Terra novel sequence.' },
  { from: 'echoes-of-eternity', to: 'end-and-death-i', kind: 'sequel', explanation: 'Direct continuation into the concluding End and the Death volume.' },
  { from: 'end-and-death-i', to: 'end-and-death-ii', kind: 'sequel', explanation: 'The next part of the same concluding novel.' },
  { from: 'end-and-death-ii', to: 'end-and-death-iii', kind: 'sequel', explanation: 'The final part of the same concluding novel.' },
  { from: 'saturnine', to: 'sons-of-selenar', kind: 'optional', explanation: 'A supporting Siege novella alongside the main novel sequence.' },
]

const coreRoute = [
  'horus-rising', 'false-gods', 'galaxy-in-flames', 'flight-eisenstein', 'fulgrim', 'descent-of-angels',
  'legion', 'battle-for-the-abyss', 'mechanicum', 'fallen-angels', 'thousand-sons', 'nemesis',
  'first-heretic', 'prospero-burns', 'outcast-dead', 'deliverance-lost', 'know-no-fear', 'fear-to-tread',
  'angel-exterminatus', 'betrayer', 'vulkan-lives', 'unremembered-empire', 'scars', 'vengeful-spirit',
  'damnation-of-pythos', 'deathfire', 'path-of-heaven', 'pharos', 'angels-of-caliban', 'praetorian-dorn',
  'master-of-mankind', 'crimson-king', 'tallarn', 'ruinstorm', 'old-earth', 'wolfsbane', 'slaves-to-darkness',
  'buried-dagger', 'solar-war', 'lost-and-damned', 'first-wall', 'saturnine', 'sons-of-selenar',
  'fury-of-magnus', 'mortis', 'warhawk', 'echoes-of-eternity', 'end-and-death-i', 'end-and-death-ii', 'end-and-death-iii',
]

const coreRouteSequelEdges = new Set([
  'solar-war:lost-and-damned',
  'lost-and-damned:first-wall',
  'first-wall:saturnine',
  'mortis:warhawk',
  'warhawk:echoes-of-eternity',
  'echoes-of-eternity:end-and-death-i',
  'end-and-death-i:end-and-death-ii',
  'end-and-death-ii:end-and-death-iii',
])

const coreRouteSupportHandoffs = new Set([
  'saturnine:sons-of-selenar',
  'sons-of-selenar:fury-of-magnus',
  'fury-of-magnus:mortis',
])

const coreRouteConnections: Connection[] = coreRoute.slice(0, -1).flatMap((from, index) => {
  const to = coreRoute[index + 1]
  const key = `${from}:${to}`
  if (coreRouteSupportHandoffs.has(key)) return []
  const sequel = coreRouteSequelEdges.has(key)
  return [{
    from,
    to,
    kind: sequel ? 'sequel' : 'recommended',
    explanation: sequel ? 'Direct continuation of the Siege of Terra novel sequence.' : 'A suggested bridge through the wider Heresy campaign.',
  }]
})

const supportingConnections: Connection[] = [
  { from: 'descent-of-angels', to: 'fallen-angels', kind: 'sequel', explanation: 'The Dark Angels branch continues from Caliban into the wider Heresy.' },
  { from: 'fallen-angels', to: 'angels-of-caliban', kind: 'sequel', explanation: 'The First Legion’s route returns in the late-war convergence.' },
  { from: 'galaxy-in-flames', to: 'tales-of-heresy', kind: 'optional', explanation: 'Supporting stories widen the first movements of the war.' },
  { from: 'tales-of-heresy', to: 'age-of-darkness', kind: 'parallel', explanation: 'The campaign spreads into more fronts and more voices.' },
  { from: 'prospero-burns', to: 'the-primarchs', kind: 'optional', explanation: 'A supporting collection for the primarchs behind the main routes.' },
  { from: 'fear-to-tread', to: 'shadows-of-treachery', kind: 'optional', explanation: 'The loyalist and traitor branches keep widening.' },
  { from: 'know-no-fear', to: 'the-mark-of-calth', kind: 'parallel', explanation: 'Calth’s aftermath continues through linked short stories.' },
  { from: 'damnation-of-pythos', to: 'legacies-of-betrayal', kind: 'optional', explanation: 'Supporting stories follow the war beyond its headline battles.' },
  { from: 'pharos', to: 'war-without-end', kind: 'optional', explanation: 'A supporting collection around the loyalist convergence.' },
  { from: 'angels-of-caliban', to: 'eye-of-terra', kind: 'optional', explanation: 'The loyalist route gathers more perspectives before Terra.' },
  { from: 'legion', to: 'silent-war', kind: 'parallel', explanation: 'Covert operations run alongside the visible legion war.' },
  { from: 'deliverance-lost', to: 'corax', kind: 'parallel', explanation: 'Corax’s supporting stories continue the Raven Guard route.' },
  { from: 'deliverance-lost', to: 'shattered-legions', kind: 'parallel', explanation: 'The survivors of Isstvan begin a distributed war.' },
  { from: 'shattered-legions', to: 'damnation-of-pythos', kind: 'recommended', explanation: 'The Shattered Legions route reaches one of its darkest theatres.' },
  { from: 'vulkan-lives', to: 'deathfire', kind: 'sequel', explanation: 'The dedicated Salamanders arc continues through Vulkan’s recovery.' },
  { from: 'deathfire', to: 'old-earth', kind: 'sequel', explanation: 'The Salamanders’ long route closes on the road toward Terra.' },
  { from: 'old-earth', to: 'garro', kind: 'optional', explanation: 'Garro’s missions connect the surviving loyalist routes.' },
  { from: 'crimson-king', to: 'fury-of-magnus', kind: 'parallel', explanation: 'The Thousand Sons branch remains active into the Siege.' },
]

const seenConnections = new Set<string>()
export const connections: Connection[] = [...curatedConnections, ...coreRouteConnections, ...supportingConnections].filter((edge) => {
  const key = `${edge.from}:${edge.to}`
  if (seenConnections.has(key)) return false
  seenConnections.add(key)
  return true
})

export const bookById = Object.fromEntries(books.map((book) => [book.id, book])) as Record<string, Book>

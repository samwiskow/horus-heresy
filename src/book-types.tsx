import { BookOpenText, Notebook, FileText, Headphones, PanelsTopLeft, LibraryBig } from 'lucide-react'
import type { BookKind } from './data'

export const bookTypes = {
  novel: { label: 'Novel', Icon: BookOpenText },
  novella: { label: 'Novella', Icon: Notebook },
  'short-story': { label: 'Short story', Icon: FileText },
  'audio-drama': { label: 'Audio drama', Icon: Headphones },
  'graphic-novel': { label: 'Graphic novel', Icon: PanelsTopLeft },
  anthology: { label: 'Collection', Icon: LibraryBig },
}

export function BookType({ kind }: { kind: BookKind }) {
  const { label, Icon } = bookTypes[kind]
  return <span className="book-type"><Icon size={14} strokeWidth={1.5} aria-hidden="true" />{label}</span>
}

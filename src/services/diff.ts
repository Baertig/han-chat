import { diffChars } from 'diff'

export interface DiffSegment {
  value: string
  type: 'equal' | 'added' | 'removed'
}

export function computeDiff(original: string, corrected: string): DiffSegment[] {
  const changes = diffChars(original, corrected)
  return changes.map((change) => ({
    value: change.value,
    type: change.added ? 'added' : change.removed ? 'removed' : 'equal',
  }))
}

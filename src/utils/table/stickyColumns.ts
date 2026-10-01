import { type CustomAttributeProps } from 'dhis2-semis-types'

const CHECKBOX_WIDTH = 42
const ROW_INDEX_WIDTH = 50
const STICKY_COLUMN_WIDTH = 160

type StickyOffset = { left: number, width: number }
type StickyOffsets = Map<string, StickyOffset>

/**
 * Left offsets (px) for a table's frozen leading columns: checkbox and row index (always
 * frozen when present), then whichever columns are listed in stickyColumnIds, in that order.
 * Generic across any table - the caller decides which columns should be sticky.
 */
function getStickyOffsets({ isCheckbox, showRowIndex, columns, stickyColumnIds }: {
    isCheckbox?: boolean
    showRowIndex?: boolean
    columns?: CustomAttributeProps[]
    stickyColumnIds?: string[]
}): StickyOffsets {
    const offsets: StickyOffsets = new Map()
    let left = 0

    if (isCheckbox) {
        offsets.set('checkbox', { left, width: CHECKBOX_WIDTH })
        left += CHECKBOX_WIDTH
    }
    if (showRowIndex) {
        offsets.set('rowIndex', { left, width: ROW_INDEX_WIDTH })
        left += ROW_INDEX_WIDTH
    }

    columns
        ?.filter(c => c.visible && stickyColumnIds?.includes(c.id))
        .forEach(column => {
            offsets.set(column.id, { left, width: STICKY_COLUMN_WIDTH })
            left += STICKY_COLUMN_WIDTH
        })

    return offsets
}

/** The last (rightmost) frozen column - where the divider between frozen and scrollable content goes. */
function getLastStickyKey(offsets: StickyOffsets): string | undefined {
    return Array.from(offsets.keys()).pop()
}

/**
 * Sticky positioning style for a frozen column, or undefined if it isn't one. The rightmost
 * frozen column gets an inset shadow along its inner edge, but only when showDivider is true
 * - the caller should only pass true when the table actually has hidden content to scroll
 * to, so the divider doesn't show when there's nothing to indicate. Inset (not an outer
 * shadow) so it renders inside the cell's own box, regardless of neighboring cells' paint order.
 */
function getStickyStyle(offsets: StickyOffsets, key: string, zIndex: number, showDivider = false) {
    const offset = offsets.get(key)
    if (!offset) return undefined

    const isLast = showDivider && key === getLastStickyKey(offsets)

    return {
        position: 'sticky' as const,
        left: offset.left,
        width: offset.width,
        minWidth: offset.width,
        maxWidth: offset.width,
        zIndex,
        backgroundColor: '#fff',
        ...(isLast
          ? { boxShadow: 'inset -8px 0 8px -8px rgba(0, 0, 0, 0.2)' }
          : {}),
    }
}

export { getStickyOffsets, getStickyStyle }

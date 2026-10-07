// Which dates the attendance date picker opens on and allows, for the academic year selected in the header.
// The picker used to open on today: when a past year (e.g. 2018-2019) was selected the user had to page
// back years by hand, and every date shown belonged to another year's calendar.

type CalendarLike = { academicYear?: { startDate?: string, endDate?: string } } | undefined

const day = (s?: string) => {
    if (!s) return undefined
    const [y, m, d] = s.slice(0, 10).split("-").map(Number)
    return y ? new Date(y, (m || 1) - 1, d || 1) : undefined
}
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** First and last day the picker allows: the academic year's dates, and never after today. */
export function calendarBounds(config: CalendarLike, today: Date = new Date()) {
    const now = startOfDay(today)
    const min = day(config?.academicYear?.startDate)
    const yearEnd = day(config?.academicYear?.endDate)
    const max = yearEnd && yearEnd < now ? yearEnd : now
    return { min, max: min && max < min ? min : max }
}

/**
 * The date the picker opens on: the date already chosen if it is inside the selected year, otherwise the
 * latest day of that year up to today; then moved back to the nearest school day (at most 60 days).
 */
export function initialCalendarDate(config: CalendarLike, isUnavailable?: (date: Date, config: any) => boolean,
    current?: Date, today: Date = new Date()): Date {
    const { min, max } = calendarBounds(config, today)
    const chosen = current ? startOfDay(new Date(current)) : undefined
    let date = chosen && !isNaN(chosen.getTime()) && (!min || chosen >= min) && chosen <= max ? chosen : max
    if (isUnavailable) {
        for (let i = 0, d = new Date(date); i < 60 && (!min || d >= min); i++, d.setDate(d.getDate() - 1)) {
            if (!isUnavailable(d, config)) { date = new Date(d); break }
        }
    }
    return date
}

// Dates for events created by a bulk import. They used to be "today" for every event, so marks or a
// final result captured for 2018-2019 were dated in 2026. Now:
//  - final result (and any other stage): the last day of the selected academic year
//  - performance term stages: the last day of the matching term (1st performance stage = 1st class period)
// never later than today. Events that already exist keep their own date (see postEvents.ts).

type Calendar = { academicYear?: { endDate?: string }, classPeriods?: { startDate?: string, endDate?: string }[] } | undefined

const day = (s?: string) => (s ? s.slice(0, 10) : undefined)

export function eventDateResolver(calendar: Calendar, performanceStages: string[], today: string): (programStage?: string) => string {
    const cap = (d?: string) => (d && d < today ? d : today)
    const terms = [...(calendar?.classPeriods ?? [])].sort((a, b) => String(a?.startDate).localeCompare(String(b?.startDate)))
    const yearEnd = day(calendar?.academicYear?.endDate)
    return (programStage?: string) => {
        const i = programStage ? performanceStages.indexOf(programStage) : -1
        if (i >= 0 && terms[i]?.endDate) return cap(day(terms[i].endDate))
        return cap(yearEnd)
    }
}

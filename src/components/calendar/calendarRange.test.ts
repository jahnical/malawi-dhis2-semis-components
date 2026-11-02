import { calendarBounds, initialCalendarDate } from "./calendarRange"

const y2019 = { academicYear: { startDate: "2018-09-10", endDate: "2019-07-19" } }
const y2027 = { academicYear: { startDate: "2026-09-14", endDate: "2027-07-16" } }
const today = new Date(2026, 9, 2) // Fri 2 Oct 2026
const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

describe("attendance date picker range", () => {
    it("opens on the selected past year, not on today", () => {
        expect(initialCalendarDate(y2019, weekend, undefined, today)).toEqual(new Date(2019, 6, 19)) // Fri 19 Jul 2019
        expect(calendarBounds(y2019, today)).toEqual({ min: new Date(2018, 8, 10), max: new Date(2019, 6, 19) })
    })
    it("keeps a date already chosen inside that year", () => {
        expect(initialCalendarDate(y2019, weekend, new Date(2019, 1, 4), today)).toEqual(new Date(2019, 1, 4))
    })
    it("ignores a chosen date from another year", () => {
        expect(initialCalendarDate(y2019, weekend, new Date(2026, 8, 30), today)).toEqual(new Date(2019, 6, 19))
    })
    it("for the current year opens on the latest school day up to today", () => {
        expect(initialCalendarDate(y2027, weekend, undefined, new Date(2026, 9, 4))).toEqual(new Date(2026, 9, 2)) // Sun -> Fri
        expect(calendarBounds(y2027, today).max).toEqual(today)
    })
    it("without a calendar opens on today", () => {
        expect(initialCalendarDate(undefined, undefined, undefined, today)).toEqual(today)
    })
})

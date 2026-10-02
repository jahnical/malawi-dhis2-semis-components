// Text the attendance export writes into locked cells for days that are not school days (weekends,
// holidays, days outside the terms). It is a placeholder, never an attendance value: the import skips it.
export const NON_SCHOOL_DAY = "Non School Day"

export function isNonSchoolDayPlaceholder(value: unknown): boolean {
    return typeof value === "string" && value.trim().toLowerCase() === NON_SCHOOL_DAY.toLowerCase()
}

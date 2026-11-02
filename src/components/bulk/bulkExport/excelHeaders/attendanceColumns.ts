// Columns of the attendance template. Attendance only needs to identify the learner and place them in a
// class: the learner ID, the names and gender (the attributes shown in learner lists), and the
// registration fields used as filters (academic year, standard, class/stream). Everything else in the
// profile (date of birth, guardian, village, ...) and the other registration fields are left out.

const GENDER = /^(gender|sex)$/i

type ProgramAttribute = { displayInList?: boolean, trackedEntityAttribute: { id: string, displayName?: string, name?: string } }

/** Learner attributes to show in the attendance template, learner ID first. */
export function attendanceProfileAttributes<T extends ProgramAttribute>(attributes: T[] = [], dataStore: any): T[] {
    const identifier = dataStore?.admission?.studentIdentifier
    const keep = attributes.filter(x => {
        const a = x?.trackedEntityAttribute
        return a?.id === identifier || x?.displayInList || GENDER.test(String(a?.displayName ?? a?.name ?? "").trim())
    })
    return [...keep.filter(x => x.trackedEntityAttribute.id === identifier), ...keep.filter(x => x.trackedEntityAttribute.id !== identifier)]
}

/** Registration data elements to show in the attendance template (the class-list filters). */
export function attendanceRegistrationDataElements(dataStore: any): Set<string> {
    const reg = dataStore?.registration ?? {}
    return new Set<string>([
        reg.academicYear, reg.grade, reg.section,
        ...((dataStore?.filters?.dataElements ?? []) as any[]).map(f => f?.dataElement),
    ].filter(Boolean))
}

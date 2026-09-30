import { format } from "date-fns"
import { selectedDataStoreKey, ProgramConfig } from 'dhis2-semis-types';
import { enrollmentDates, statusForFinalResult, statusForNewEnrollment, type CalendarEntry } from 'dhis2-semis-functions';

// What new enrollments need to get their status and dates (R2, R3)
export interface EnrollmentLifecycleContext {
    calendar: CalendarEntry[]
    currentAcademicYear?: string
    academicYearOptions?: { value?: string, code?: string, label?: string, displayName?: string }[]
    // Admission imports create admission-only enrollments (no registration event)
    admission?: boolean
}

// Value of one data element in an imported row, whatever sheet section it was read from
const rowValue = (student: any, dataElement?: string) => {
    if (!dataElement) return undefined
    for (const section of Object.values(student ?? {})) {
        if (!section || typeof section !== 'object') continue
        for (const [key, value] of Object.entries(section as Record<string, any>)) {
            if ((key === dataElement || key.split('.')[1] === dataElement) && value !== undefined && value !== null && value !== '') return value
        }
    }
    return undefined
}

export function generateEventObjects(programStages: string[], data: any, programConfig: ProgramConfig) {
    let events: any = []

    for (const student of data) {
        const { trackedEntity, ...rest } = student.Ids

        for (const programStage of programStages) {
            let eventProperties: any = { dataValues: [], program: programConfig.id }
            const programStageID = programConfig.programStages.find(x => x.displayName == programStage)?.id

            for (const key of Object.keys(student[programStage])) {
                if (student[programStage][key]) {
                    eventProperties.dataValues.push({
                        dataElement: key.split('.')[1],
                        value: student[programStage][key]
                    })
                }
            }

            events.push({
                trackedEntity: trackedEntity,
                ...rest,
                ...eventProperties,
                programStage: programStageID,
                occurredAt: format(new Date(), 'yyyy-MM-dd')
            })
        }
    }

    return { events }
}

export function generateAttendanceEventObjects(programStages: string[], data: any, dataStore: selectedDataStoreKey) {
    let attendanceEvents: any = []

    for (const student of data) {
        if (!student?.Ids || !student?.Ids?.trackedEntity || !student?.Ids?.orgUnit) {
            throw new Error('Import error: This operation requires a bulk update file containing (Tracked Entity Id, School UID). Please ensure you are using the bulk attendance file.');
        }
        const { trackedEntity, ...rest } = student?.Ids

        for (const programStage of programStages) {
            for (const key of Object.keys(student[programStage])) {
                if (student[programStage][key]) {
                    attendanceEvents.push({
                        occurredAt: key,
                        trackedEntity,
                        ...rest,
                        program: dataStore.program,
                        programStage: dataStore.attendance.programStage,
                        dataValues: [
                            {
                                dataElement: dataStore.attendance.status,
                                value: student[programStage][key]
                            }
                        ]
                    })
                }
            }
        }
    }

    return { attendanceEvents }
}

// New enrollments get their status from the academic year (past years COMPLETED, otherwise ACTIVE;
// admissions ACTIVE) and occurredAt from the year's start. Updates leave status and dates out:
// postEnrollments sends back the saved values.
export function generateEnrollmentData(profile: string, programConfig: ProgramConfig, stagesToIgnore: string[], data: any, orgUnit: string, updating: boolean, dataStore: selectedDataStoreKey, lifecycle: EnrollmentLifecycleContext = { calendar: [] }) {
    let enrollments: any = []
    const yearsNotInCalendar = new Set<string>()
    const academicYearDataElement = dataStore?.registration?.academicYear
    const programStages = programConfig?.programStages.map((x) => {
        if (!stagesToIgnore.includes(x.id)) return { id: x.id, name: x.displayName }
    }).filter(x => x != undefined)

    for (const student of data) {
        if (updating && (!student?.Ids || !student?.Ids?.enrollment || !student?.Ids?.trackedEntity || !student?.Ids?.orgUnit)) {
            throw new Error('Import error: This operation requires a bulk update file containing (Enrollment, Tracked Entity Id, School UID). Please ensure you are using the bulk update template.');
        }
        let events: any = [], att: any = [], enrollmentDate: any = null

        for (const stage of programStages) {
            if (student[stage.name] && student[stage.name]['enrollmentDate']) {
                enrollmentDate = student[stage.name]['enrollmentDate']
                break;
            }
        }

        const today = format(new Date(), 'yyyy-MM-dd')
        let sheetDate: string | undefined

        if (enrollmentDate) {
            try {
                let parsedDate: Date

                if (typeof enrollmentDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
                    parsedDate = new Date(enrollmentDate)
                }
                else if (typeof enrollmentDate === 'number') {
                    const excelEpoch = new Date(1899, 11, 30) // Excel's epoch is 1899-12-30
                    parsedDate = new Date(excelEpoch.getTime() + enrollmentDate * 24 * 60 * 60 * 1000)
                }
                else {
                    parsedDate = new Date(enrollmentDate)
                }

                if (!isNaN(parsedDate.getTime())) {
                    sheetDate = format(parsedDate, 'yyyy-MM-dd')
                }
            } catch (error) {

            }
        }

        const academicYear = lifecycle.admission || updating ? undefined : rowValue(student, academicYearDataElement)
        let status: string = 'ACTIVE'
        let enrolledAtDate = sheetDate ?? today
        let occurredAtDate = sheetDate ?? today
        if (academicYear) {
            const years = { calendars: lifecycle.calendar, options: lifecycle.academicYearOptions }
            status = statusForNewEnrollment(String(academicYear), String(lifecycle.currentAcademicYear ?? academicYear), years)
            const dates = enrollmentDates({ calendar: lifecycle.calendar, academicYear: String(academicYear), enrollmentDate: sheetDate, options: lifecycle.academicYearOptions })
            if (!dates.calendarFound) yearsNotInCalendar.add(String(academicYear))
            enrolledAtDate = dates.enrolledAt ?? today
            occurredAtDate = dates.occurredAt ?? today
        }

        for (const stage of programStages) {
            let dataValues: any = []

            if (
                Object.values(dataStore)?.some((dataStoreKey: any) =>
                    dataStoreKey?.programStage === stage.id || dataStoreKey?.programStages?.includes(stage.id)
                )
            ) {
                if (student[stage.name]) {
                    for (const key of Object.keys(student[stage.name])) {
                        if (student[stage.name][key] && key.split('.')[1]) {
                            dataValues = [
                                ...dataValues,
                                {
                                    dataElement: key.split(".")[1],
                                    value: student[stage.name][key]
                                }
                            ]
                        }
                    }
                }

                events.push({
                    program: programConfig.id,
                    orgUnit: orgUnit,
                    dataValues: dataValues,
                    status: "ACTIVE",
                    occurredAt: enrolledAtDate,
                    programStage: stage.id,
                    ...(updating ? { trackedEntity: student?.Ids?.trackedEntity } : {})
                })
            }
        }


        for (const key of Object.keys(student[profile])) {
            if (student[profile][key] && key != 'ref') {
                att = [
                    ...att,
                    {
                        attribute: key,
                        value: student[profile][key]
                    }
                ]
            }
        }

        enrollments.push({
            events: events,
            program: programConfig.id,
            orgUnit: orgUnit,
            attributes: att,
            ...(updating
                ? { enrollment: student.Ids.enrollment }
                : { status, occurredAt: occurredAtDate, enrolledAt: enrolledAtDate })
        })
    }

    return { enrollments, yearsNotInCalendar: Array.from(yearsNotInCalendar) }
}

// Status after a final result: CANCELLED for a dropout value of the final-result status, otherwise
// COMPLETED. Org unit and dates are left out: postEnrollments sends back the saved values.
export function generateFinalResultData(
    programStages: string[],
    data: any,
    programConfig: ProgramConfig,
    dataStore: any
) {
    let enrollmentUpdates: any = []
    const finalResult = dataStore?.["final-result"]
    const dropoutStatusValues: string[] = finalResult?.dropoutStatusValues ?? []

    for (const student of data) {
        if (!student?.Ids || !student?.Ids?.trackedEntity || !student?.Ids?.enrollment || !student?.Ids?.orgUnit) {
            throw new Error('Import error: This operation requires a bulk update file containing (Enrollment, Tracked Entity Id, School UID). Please ensure you are using the bulk update template for final results.');
        }

        const { trackedEntity, enrollment } = student.Ids
        const values = programStages.flatMap((programStage) => Object.entries(student[programStage] || {}))
        // The final decision is the configured status column; without one, any dropout value counts
        const decision = finalResult?.status
            ? values.find(([key]) => key === finalResult.status || key.split('.')[1] === finalResult.status)?.[1]
            : values.map(([, value]) => value).find((value) => statusForFinalResult(String(value ?? ''), dropoutStatusValues) === 'CANCELLED')

        enrollmentUpdates.push({
            enrollment,
            program: programConfig.id,
            status: statusForFinalResult(decision === undefined || decision === null ? undefined : String(decision), dropoutStatusValues),
            trackedEntity,
        })
    }

    return { enrollmentUpdates }
}

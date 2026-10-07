import { generateAttendanceEventObjects, generateEnrollmentData, generateEventObjects, generateFinalResultData } from "./createEventsObject";

const programConfig: any = {
    id: "P1",
    programStages: [{ id: "REG", displayName: "Registration" }, { id: "FINAL", displayName: "Final result" }],
}
const dataStore: any = { registration: { programStage: "REG", academicYear: "AY" }, "final-result": { programStage: "FINAL", status: "FS", dropoutStatusValues: ["Dropout"] } }
const calendar = [
    { academicYear: { code: "2024/2025", label: "2024/2025", startDate: "2024-09-02", endDate: "2025-07-18" } },
    { academicYear: { code: "2025/2026", label: "2025/2026", startDate: "2025-09-08", endDate: "2026-07-17" } },
]
const row = (year: string, extra: any = {}) => ({ "Student profile": { name: "Ada" }, Registration: { "REG.AY": year, ...extra } })

test("new enrollments: the current year is ACTIVE and past years COMPLETED, dated to the year start", () => {
    const { enrollments, yearsNotInCalendar } = generateEnrollmentData("Student profile", programConfig, ["FINAL"], [row("2025/2026"), row("2024/2025", { enrollmentDate: "2024-10-01" }), row("2030/2031")],
        "S1", false, dataStore, { calendar, currentAcademicYear: "2025/2026" })
    expect(enrollments.map((e: any) => [e.status, e.enrolledAt, e.occurredAt])).toEqual([
        ["ACTIVE", "2025-09-08", "2025-09-08"],
        ["COMPLETED", "2024-10-01", "2024-09-02"],
        ["ACTIVE", expect.any(String), expect.any(String)],
    ])
    expect(yearsNotInCalendar).toEqual(["2030/2031"])
})

test("admissions are ACTIVE; updates leave status and dates to the saved values", () => {
    const admitted = generateEnrollmentData("Student profile", programConfig, ["REG", "FINAL"], [{ "Student profile": { name: "Ada" } }], "S1", false, dataStore, { calendar, admission: true })
    expect(admitted.enrollments[0].status).toBe("ACTIVE")

    const updated = generateEnrollmentData("Student profile", programConfig, ["REG", "FINAL"], [{ ...row("2025/2026"), Ids: { enrollment: "E1", trackedEntity: "T1", orgUnit: "S1" } }], "S1", true, dataStore, { calendar })
    expect(updated.enrollments[0]).toMatchObject({ enrollment: "E1" })
    expect(updated.enrollments[0].status).toBeUndefined()
    expect(updated.enrollments[0].enrolledAt).toBeUndefined()
})

test("final results: a dropout is CANCELLED and no dates are set", () => {
    const Ids = { trackedEntity: "T1", enrollment: "E1", orgUnit: "S1" }
    const { enrollmentUpdates } = generateFinalResultData(["Final result"], [
        { Ids, "Final result": { "FINAL.FS": "Dropout" } },
        { Ids: { ...Ids, enrollment: "E2" }, "Final result": { "FINAL.FS": "Promoted" } },
    ], programConfig, dataStore)
    expect(enrollmentUpdates).toEqual([
        { enrollment: "E1", program: "P1", status: "CANCELLED", trackedEntity: "T1" },
        { enrollment: "E2", program: "P1", status: "COMPLETED", trackedEntity: "T1" },
    ])
})


test("attendance import skips empty cells and the export's Non School Day placeholder", () => {
    const ds: any = { program: "P1", attendance: { programStage: "ATT", status: "STATUS" } }
    const learner = {
        Ids: { trackedEntity: "TE1", enrollment: "EN1", orgUnit: "OU1" },
        Attendance: { "2018-09-08": "Non School Day", "2018-09-10": "present", "2018-09-11": "", "2018-10-15": " non school day ", "2018-09-12": "absent" },
    }
    const { attendanceEvents } = generateAttendanceEventObjects(["Attendance"], [learner], ds)
    expect(attendanceEvents.map((e: any) => [e.occurredAt, e.dataValues[0].value])).toEqual([["2018-09-10", "present"], ["2018-09-12", "absent"]])
    expect(attendanceEvents[0]).toMatchObject({ trackedEntity: "TE1", enrollment: "EN1", orgUnit: "OU1", program: "P1", programStage: "ATT" })
})

test("final results: a learner without a decision gets no event and no enrollment change; dates come from the resolver", () => {
    const program: any = { id: "P1", programStages: [{ id: "FINAL", displayName: "Final result" }] }
    const rows = [
        { Ids: { trackedEntity: "TE1", enrollment: "EN1", orgUnit: "OU" }, "Final result": { "FINAL.FS": "Promoted" } },
        { Ids: { trackedEntity: "TE2", enrollment: "EN2", orgUnit: "OU" }, "Final result": { "FINAL.FS": "" } },
        { Ids: { trackedEntity: "TE3", enrollment: "EN3", orgUnit: "OU" }, "Final result": { "FINAL.FS": "Dropout", "FINAL.REASON": "Illness" } },
    ]
    const { events } = generateEventObjects(["Final result"], rows, program, () => "2019-07-19")
    expect(events.map((e: any) => [e.enrollment, e.occurredAt, e.dataValues.length])).toEqual([["EN1", "2019-07-19", 1], ["EN3", "2019-07-19", 2]])
    const { enrollmentUpdates } = generateFinalResultData(["Final result"], rows, program, { "final-result": { status: "FS", dropoutStatusValues: ["Dropout"] } })
    expect(enrollmentUpdates.map((e: any) => [e.enrollment, e.status])).toEqual([["EN1", "COMPLETED"], ["EN3", "CANCELLED"]])
})

test("new enrollments: the final-result placeholder is dated by the year's calendar, registration by the enrollment date", () => {
    const config: any = { id: "P1", programStages: [{ id: "REG", displayName: "Registration" }, { id: "FINAL", displayName: "Final result" }] }
    const store: any = { ...dataStore, performance: { programStages: [{ programStage: "T1" }, { programStage: "T2" }] } }
    const cal = [{ academicYear: { code: "2024/2025", startDate: "2024-09-02", endDate: "2025-07-18" }, classPeriods: [{ startDate: "2025-01-06", endDate: "2025-04-04" }, { startDate: "2024-09-02", endDate: "2024-12-13" }] }]
    const { enrollments } = generateEnrollmentData("Student profile", config, [], [row("2024/2025", { enrollmentDate: "2024-10-01" })], "S1", false, store, { calendar: cal, currentAcademicYear: "2025/2026" })
    const dates = Object.fromEntries(enrollments[0].events.map((e: any) => [e.programStage, e.occurredAt]))
    expect(dates).toEqual({ REG: "2024-10-01", FINAL: "2025-07-18" })
})

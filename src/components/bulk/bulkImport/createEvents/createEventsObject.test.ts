import { generateEnrollmentData, generateFinalResultData } from "./createEventsObject";

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

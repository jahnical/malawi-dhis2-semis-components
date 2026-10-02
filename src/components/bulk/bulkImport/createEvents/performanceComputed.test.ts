import { applyPerformanceMapping } from "./performanceComputed"

const config = {
    programStages: [{ programStage: "T1" }],
    subjects: [{ scoreDataElement: "MAT_S", gradeDataElement: "MAT_G" }, { scoreDataElement: "ENG_S", gradeDataElement: "ENG_G" }],
    gradeMapping: { ranges: [{ optionCode: "A", minScore: 80, maxScore: 100 }, { optionCode: "F", minScore: 0, maxScore: 79 }] },
    maxSubjectScore: 100,
    termRemarksMapping: { dataElement: "REM", ranges: [{ optionCode: "Good", minPercentage: 60, maxPercentage: 100 }, { optionCode: "Poor", minPercentage: 0, maxPercentage: 59.99 }] },
}

test("grades and the term remark come from the scores, not from the file", () => {
    const events = [
        { programStage: "T1", enrollment: "E1", dataValues: [{ dataElement: "MAT_S", value: "85" }, { dataElement: "MAT_G", value: "F" }, { dataElement: "ENG_S", value: "50" }, { dataElement: "NOTE", value: "ok" }] },
        { programStage: "REG", dataValues: [{ dataElement: "MAT_G", value: "keep" }] },
    ]
    const [t1, reg] = applyPerformanceMapping(events, config)
    const v = Object.fromEntries(t1.dataValues.map((d: any) => [d.dataElement, d.value]))
    expect(v).toEqual({ MAT_S: "85", MAT_G: "A", ENG_S: "50", ENG_G: "F", NOTE: "ok", REM: "Good" })
    expect(reg).toBe(events[1])
})

test("a term with no scores gets no grades or remark", () => {
    const [t1] = applyPerformanceMapping([{ programStage: "T1", dataValues: [{ dataElement: "NOTE", value: "absent" }] }], config)
    expect(t1.dataValues).toEqual([{ dataElement: "NOTE", value: "absent" }])
})

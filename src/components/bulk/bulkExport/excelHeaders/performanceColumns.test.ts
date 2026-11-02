import { orderPerformanceColumns } from "./performanceColumns"

const config = {
    subjects: [{ scoreDataElement: "MAT_S", gradeDataElement: "MAT_G" }, { scoreDataElement: "ENG_S", gradeDataElement: "ENG_G" }],
    termRemarksMapping: { dataElement: "REM" },
}
const h = (de: string) => ({ key: `T1.${de}` })

test("each score is followed by its grade, other fields after, term remark last", () => {
    const headers = [h("REM"), h("MAT_G"), h("ENG_G"), h("NOTE"), h("ENG_S"), h("MAT_S")]
    expect(orderPerformanceColumns(headers, "T1", config).map(x => x.key)).toEqual(["T1.ENG_S", "T1.ENG_G", "T1.MAT_S", "T1.MAT_G", "T1.NOTE", "T1.REM"])
})

test("a stage without configured subjects keeps its order", () => {
    const headers = [h("A"), h("B")]
    expect(orderPerformanceColumns(headers, "T1", {}).map(x => x.key)).toEqual(["T1.A", "T1.B"])
})

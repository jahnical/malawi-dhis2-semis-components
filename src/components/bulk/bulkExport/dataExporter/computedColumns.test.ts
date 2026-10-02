import Excel from "exceljs"
import { read, utils } from "xlsx"
import { applyComputedColumns } from "./computedColumns"

const config = {
    subjects: [{ scoreDataElement: "MAT_S", gradeDataElement: "MAT_G" }, { scoreDataElement: "ENG_S", gradeDataElement: "ENG_G" }],
    gradeMapping: { ranges: [{ optionCode: "A", minScore: 80, maxScore: 100 }, { optionCode: "F", minScore: 0, maxScore: 79 }] },
    maxSubjectScore: 100,
    termRemarksMapping: { dataElement: "REM", ranges: [{ optionCode: "Good", minPercentage: 60, maxPercentage: 100 }, { optionCode: "Poor", minPercentage: 0, maxPercentage: 59.99 }] },
}
const headers: any = [{
    name: "Term 1", headers: [
        { key: "ref" }, { key: "T1.MAT_S" }, { key: "T1.MAT_G", formula: { kind: "grade", scoreKey: "T1.MAT_S", config } },
        { key: "T1.ENG_S" }, { key: "T1.ENG_G", formula: { kind: "grade", scoreKey: "T1.ENG_S", config } },
        { key: "T1.REM", formula: { kind: "remark", scoreKeys: ["T1.MAT_S", "T1.ENG_S"], config } },
    ],
}]

test("grade and remark cells get locked formulas with the current value cached", async () => {
    const wb = new Excel.Workbook()
    const sheet = wb.addWorksheet("performance")
    sheet.columns = headers[0].headers.map((h: any) => ({ key: h.key }))
    sheet.addRow({}); sheet.addRow({}); sheet.addRow({})          // section, titles, keys
    sheet.addRow({ ref: 1, "T1.MAT_S": "85", "T1.MAT_G": "F", "T1.ENG_S": 50 }) // stale grade from the server
    sheet.addRow({ ref: 2 })                                        // no scores yet

    expect(applyComputedColumns(sheet, headers, { fill: { type: "pattern", pattern: "solid" }, border: {} })).toBe(6)
    const g = sheet.getRow(4).getCell("T1.MAT_G")
    expect(g.value).toEqual({ formula: expect.stringContaining('VALUE(B4&"")>=80'), result: "A" })
    expect(g.protection).toEqual({ locked: true })
    expect((sheet.getRow(4).getCell("T1.REM").value as any).result).toBe("Good")
    expect((sheet.getRow(5).getCell("T1.MAT_G").value as any).result || "").toBe("") // no score: blank

    // The import (SheetJS, displayed values) reads the cached results
    const buf = await wb.xlsx.writeBuffer()
    const rows = utils.sheet_to_json(read(new Uint8Array(buf as ArrayBuffer), { type: "array" }).Sheets.performance, { header: 1, raw: false, defval: "", blankrows: true }) as string[][]
    const dataRow = rows.find(r => String(r[0]) === "1")
    expect(dataRow).toEqual(["1", "85", "A", "50", "F", "Good"])
})

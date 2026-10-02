import { gradeForScore, gradeFormula, termRemarkFor, termRemarkFormula } from "dhis2-semis-functions";

// Data rows start below the section row (1), the column titles (2) and the hidden keys row (3)
const FIRST_DATA_ROW = 4

interface ComputedHeader { key: string, formula?: { kind: "grade" | "remark", scoreKey?: string, scoreKeys?: string[], config: any } }

/**
 * Columns whose value follows from other cells of the same row (subject grade from the subject score,
 * term remark from the term's scores). Each data cell gets the formula built from the configured mapping,
 * the value it gives now (so the file reads correctly even before a spreadsheet recalculates it), and is
 * locked so it cannot be typed over.
 */
export function applyComputedColumns(sheet: any, headers: { headers: ComputedHeader[] }[], style: { fill: any, border: any }) {
    const computed = headers.flatMap(section => section?.headers ?? []).filter(h => h?.formula)
    if (computed.length === 0) return 0

    const letterOf = (key?: string) => {
        if (!key) return undefined
        try { return sheet.getColumn(key)?.letter } catch { return undefined }
    }
    let cells = 0

    for (const header of computed) {
        const column = sheet.getColumn(header.key)
        if (!column) continue
        column.numFmt = 'General'
        const { kind, config } = header.formula!
        const scoreKeys = kind === "grade" ? [header.formula!.scoreKey!] : (header.formula!.scoreKeys ?? [])
        const letters = scoreKeys.map(letterOf)
        if (letters.some(l => !l)) continue

        for (let r = FIRST_DATA_ROW; r <= sheet.rowCount; r++) {
            const row = sheet.getRow(r)
            const refs = letters.map(l => `${l}${r}`)
            const scores = scoreKeys.map(k => {
                const v = row.getCell(k).value
                return v && typeof v === "object" && "result" in v ? (v as any).result : v
            })
            const cell = row.getCell(header.key)
            cell.value = kind === "grade"
                ? { formula: gradeFormula(config, refs[0]), result: gradeForScore(config, scores[0]) }
                : { formula: termRemarkFormula(config, refs), result: termRemarkFor(config, scores) }
            cell.dataValidation = null
            cell.protection = { locked: true }
            cell.numFmt = 'General'
            cell.fill = { fgColor: { argb: 'EDEDED' }, ...style.fill }
            cell.border = style.border
            cells++
        }
    }
    return cells
}

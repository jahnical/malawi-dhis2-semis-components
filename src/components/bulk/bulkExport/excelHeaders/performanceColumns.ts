// Column order of a term in the performance template: each subject's raw score followed by its grade
// (filled in by formula), in the order the scores appear in the program stage; then any other fields of
// the stage; the term remark last.

export function orderPerformanceColumns<T extends { key: string }>(headers: T[], stageId: string, config: any): T[] {
    const subjects: { scoreDataElement?: string, gradeDataElement?: string }[] = config?.subjects ?? []
    const keyOf = (de?: string) => (de ? `${stageId}.${de}` : "")
    const gradeOfScore = new Map(subjects.filter(s => s.scoreDataElement && s.gradeDataElement).map(s => [keyOf(s.scoreDataElement), keyOf(s.gradeDataElement)]))
    const grades = new Set(gradeOfScore.values())
    const remark = keyOf(config?.termRemarksMapping?.dataElement)
    const byKey = new Map(headers.map(h => [h.key, h]))

    const pairs: T[] = [], others: T[] = [], last: T[] = []
    for (const h of headers) {
        if (h.key === remark) last.push(h)
        else if (grades.has(h.key)) continue // placed after its score
        else if (gradeOfScore.has(h.key)) {
            pairs.push(h)
            const grade = byKey.get(gradeOfScore.get(h.key)!)
            if (grade) pairs.push(grade)
        } else others.push(h)
    }
    // A grade whose score column is not in the template keeps a place (before the remark)
    const placed = new Set(pairs.map(h => h.key))
    const orphanGrades = headers.filter(h => grades.has(h.key) && !placed.has(h.key))
    return [...pairs, ...others, ...orphanGrades, ...last]
}

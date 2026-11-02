import { gradeForScore, termRemarkFor } from "dhis2-semis-functions";

/**
 * Sets each subject's grade, and the term remark, from the imported scores using the performance
 * configuration, whatever the file's grade/remark cells contain. The template fills those cells with
 * formulas, but a file saved without recalculation (or edited by hand) must not import wrong grades.
 */
export function applyPerformanceMapping(events: any[], performanceConfig: any): any[] {
    const stages = new Set<string>((performanceConfig?.programStages ?? []).map((x: any) => x?.programStage))
    const subjects: { scoreDataElement?: string, gradeDataElement?: string }[] = performanceConfig?.subjects ?? []
    const remarkDataElement: string | undefined = performanceConfig?.termRemarksMapping?.dataElement
    if (subjects.length === 0) return events

    return events.map(event => {
        if (!stages.has(event?.programStage)) return event
        const values = new Map<string, any>((event.dataValues ?? []).map((dv: any) => [dv.dataElement, dv.value]))
        const scores: unknown[] = []
        for (const s of subjects) {
            if (!s.scoreDataElement || !values.has(s.scoreDataElement)) continue
            const score = values.get(s.scoreDataElement)
            scores.push(score)
            if (s.gradeDataElement) values.set(s.gradeDataElement, gradeForScore(performanceConfig, score))
        }
        if (remarkDataElement && scores.length > 0) values.set(remarkDataElement, termRemarkFor(performanceConfig, scores))
        const dataValues = [...values.entries()]
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([dataElement, value]) => ({ dataElement, value }))
        return { ...event, dataValues }
    })
}

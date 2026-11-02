import { uploadLearnersAtomically } from "./uploadLearners"

const ok = (n: number) => ({ status: "OK", stats: { created: n, total: n }, validationReport: { errorReports: [] } })
const rejected = { details: { status: "ERROR", stats: { ignored: 2, total: 2 }, validationReport: { errorReports: [{ errorCode: "E1064", message: "Non-unique attribute value" }] } } }

describe("uploadLearnersAtomically", () => {
    it("sends one learner per request and collects reports from saved and rejected learners", async () => {
        const sent: any[] = []
        const upload = jest.fn(async (payload: any) => {
            sent.push(payload)
            if (payload.trackedEntities[0].lin === "dup") throw rejected
            return ok(2)
        })
        const items = [{ lin: "0001" }, { lin: "dup" }, { lin: "0003" }]
        const result = await uploadLearnersAtomically({ items, upload, concurrency: 2 })

        expect(upload).toHaveBeenCalledTimes(3)
        expect(sent.every(p => p.trackedEntities.length === 1)).toBe(true)
        expect(result.reports).toHaveLength(3)
        expect(result.reports.filter(r => r.status === "ERROR")).toHaveLength(1)
        expect(result.failures).toEqual([])
    })

    it("keeps going after a request that fails without a report, and reports it", async () => {
        const upload = jest.fn(async (payload: any) => {
            if (payload.trackedEntities[0].lin === "x") throw new Error("Network error")
            return ok(1)
        })
        const onEach = jest.fn()
        const result = await uploadLearnersAtomically({ items: [{ lin: "x" }, { lin: "y" }], upload, onEach })
        expect(result.reports).toHaveLength(1)
        expect(result.failures.map(f => (f.item as any).lin)).toEqual(["x"])
        expect(onEach).toHaveBeenCalledTimes(2)
    })
})

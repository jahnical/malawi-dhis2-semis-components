// Saves learners one request each with atomicMode ALL, so a learner (tracked entity), its enrollment
// and its events are saved together or not at all. With one shared request in atomicMode OBJECT,
// DHIS2 validates each object on its own: a learner could be created while its enrollment was
// rejected (for example E1064, a duplicate LIN), leaving a learner with no enrollment.

export interface LearnerUploadResult {
    /** Tracker import reports, from successful responses and from rejected (409) ones */
    reports: any[]
    /** Requests that failed without an import report (network, permissions, server error) */
    failures: { item: any, error: unknown }[]
}

export async function uploadLearnersAtomically<T>({ items, upload, concurrency = 5, onEach }: {
    items: T[]
    /** Sends one payload with atomicMode ALL; resolves with the import report or throws */
    upload: (payload: { trackedEntities: T[] }) => Promise<any>
    concurrency?: number
    onEach?: () => void
}): Promise<LearnerUploadResult> {
    const reports: any[] = []
    const failures: { item: any, error: unknown }[] = []
    let next = 0

    async function worker() {
        while (next < items.length) {
            const item = items[next++]
            try {
                reports.push(await upload({ trackedEntities: [item] }))
            } catch (error: any) {
                // A rejected learner comes back as 409 with the import report in the error's details
                const report = error?.details?.validationReport ? error.details
                    : error?.details?.response?.validationReport ? error.details.response : undefined
                if (report) reports.push(report)
                else failures.push({ item, error })
            }
            onEach?.()
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
    return { reports, failures }
}

import { ExportData } from "../../../../types/bulk/bulkOperations"
import { useUrlParams } from "dhis2-semis-functions";
import { useDataEngine } from "@dhis2/app-runtime";
import { attributes } from "../../../../utils/format/formatData";

/**
 * Admission-specific data fetcher.
 * 
 * Unlike enrollment and other modules, admission only works with
 * tracked entity attributes — no events, no program stages.
 * This fetcher queries TEIs directly and returns rows with
 * just attributes and basic identifiers.
 */
export function getAdmissionSheetData(props: ExportData) {
    const { selectedSectionDataStore, eventFilters = [], setProgress = () => { }, onError } = props
    const engine = useDataEngine()
    const { urlParameters } = useUrlParams()
    const { schoolName: orgUnitName, school: orgUnit } = urlParameters

    async function getAdmissionData() {
        try {
            const response: any = await engine.query({
                results: {
                    resource: "tracker/trackedEntities",
                    params: {
                        fields: "trackedEntity,createdAt,orgUnit,attributes[attribute,value],enrollments[enrollment,orgUnit,program,status],programOwners[orgUnit]",
                        program: selectedSectionDataStore?.program as unknown as string,
                        orgUnit: orgUnit ?? undefined,
                        ouMode: orgUnit != null ? "SELECTED" : "ACCESSIBLE",
                        paging: false,
                        ...(eventFilters.length > 0 ? { filter: eventFilters } : {}),
                    }
                }
            })

            const trackedEntities = response?.results?.instances ?? []

            setProgress((prev: any) => ({ ...prev, progress: 10, buffer: 16 }))

            if (!trackedEntities || trackedEntities.length === 0) {
                return []
            }

            const rows: any[] = []
            let counter = 0

            for (const tei of trackedEntities) {
                counter++
                const enrollment = tei?.enrollments?.[0]?.enrollment

                rows.push({
                    ref: "" + counter + " ",
                    school: orgUnitName,
                    orgUnit: tei?.orgUnit,
                    enrollment: enrollment,
                    trackedEntity: tei.trackedEntity,
                    ...attributes(tei?.attributes ?? []),
                })

                setProgress((prev: any) => ({
                    ...prev,
                    progress: prev.progress + (80 / trackedEntities.length),
                    buffer: prev.buffer + (84 / trackedEntities.length)
                }))
            }

            return rows
        } catch (error: any) {
            onError('Export Error: ' + error)
            setProgress((progress: any) => ({ ...progress, progress: 100, buffer: 100 }))
            return []
        }
    }

    return { getAdmissionData }
}

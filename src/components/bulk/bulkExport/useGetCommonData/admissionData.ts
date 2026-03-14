import { ExportData } from "../../../../types/bulk/bulkOperations"
import { useUrlParams } from "dhis2-semis-functions";
import { useDataEngine } from "@dhis2/app-runtime";
import { attributes } from "../../../../utils/format/formatData";
import { useSchoolCalendarKey } from "../../../../hooks/dataStore/useSchoolCalendarKey";

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
    const { schoolName: orgUnitName, school: orgUnit, academicYear } = urlParameters
    const { schoolCalendar } = useSchoolCalendarKey()

    const admissionDateAttribute = (selectedSectionDataStore as any)?.admission?.admissionDate as string | undefined
    const selectedCalendar = (schoolCalendar ?? []).find((cal: any) =>
        cal?.academicYear?.code === academicYear || cal?.academicYear?.id === academicYear || cal?.id === academicYear
    )
    const academicYearCode = selectedCalendar?.academicYear?.code || academicYear
    const firstYearMatch = typeof academicYearCode === 'string' ? academicYearCode.match(/\d{4}/) : null
    const admissionYear = firstYearMatch ? Number(firstYearMatch[0]) : NaN
    const admissionYearStart = Number.isInteger(admissionYear) ? `${admissionYear -1 }-01-01` : undefined
    const admissionYearEnd = Number.isInteger(admissionYear) ? `${admissionYear - 1}-12-31` : undefined

    const baseFilters = admissionDateAttribute
        ? eventFilters.filter((filter) => !filter.startsWith(`${admissionDateAttribute}:`))
        : [...eventFilters]
    const admissionYearFilter = admissionDateAttribute && admissionYearStart && admissionYearEnd
        ? `${admissionDateAttribute}:ge:${admissionYearStart}:le:${admissionYearEnd}`
        : undefined
    const effectiveFilters = admissionYearFilter ? [...baseFilters, admissionYearFilter] : baseFilters

    console.log("Admission Filter: ", admissionYearFilter)

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
                        ...(effectiveFilters.length > 0 ? { filter: effectiveFilters } : {}),
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

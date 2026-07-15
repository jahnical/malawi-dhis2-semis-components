import { excelData, importData } from "../../../types/bulk/bulkOperations";
import { selectedDataStoreKey, Modules } from 'dhis2-semis-types';
import { generateAttendanceEventObjects, generateEnrollmentData, generateEventObjects, generateFinalResultData } from "./createEvents/createEventsObject";
import { postAttendanceValues } from "./postEvents/postAttendance";
import { postEnrollmentData } from "./postEvents/postEnrollment";
import { postValues } from "./postEvents/postEvents";
import { useUrlParams } from "dhis2-semis-functions";
import { generateAndReserveIds } from "../bulkExport/generateIds/generateAndReserve";

/**
 * Replaces the first 4 characters of a generated identifier with the upper
 * (later) year of the academic year the student is being admitted into.
 * The academic year code may be a single year ("2026", already the upper
 * number) or a range ("2025/2026"), so we take the largest 4-digit token.
 */
const applyAcademicYearPrefix = (generatedId: string, academicYear: string): string => {
    if (!generatedId || generatedId.length < 4 || !academicYear) return generatedId

    const tokens = String(academicYear).match(/\d{4}/g)
    if (!tokens || tokens.length === 0) return generatedId

    const upperYear = tokens.reduce((max, token) => (Number(token) > Number(max) ? token : max), tokens[0])
    return upperYear + generatedId.substring(4)
}

type CombinedTypes = importData & excelData & { importMode: "VALIDATE" | "COMMIT" };

export function useImportData({ setProgress, onError, setStats, stats, setOpenProgress, }: { setOpenProgress: (args: boolean) => void, stats: any, setStats: (args: any) => void, setProgress: (rags: any) => void, onError: (rags: any) => void }) {
    const { postData } = postValues({ setStats, setProgress, onError, setOpenProgress })
    const { postAttendance } = postAttendanceValues({ setStats, setProgress, onError, setOpenProgress })
    const { postEnrollments } = postEnrollmentData({ setStats, setProgress, onError, setOpenProgress })
    const { generate } = generateAndReserveIds()
    const { urlParameters } = useUrlParams()
    const { school: orgUnit, academicYear } = urlParameters

    async function importData(props: CombinedTypes) {
        setProgress((prev: any) => ({ ...prev, progress: 1, buffer: 10 }))
        const { onError, excelData, importMode, updating = false, programConfig, selectedSectionDataStore, sectionType } = props

        const closeDialog = () => {
            setProgress({ prorocess: "import", progress: 0, buffer: 0 })
            setOpenProgress(false)
        }

        try {
            const studentsData = excelData.mapping
            const profile = sectionType?.substring(0, 1)?.toUpperCase() + sectionType?.substring(1, sectionType?.length) + ' profile'
            const programStages = [
                ...(
                    excelData?.module != Modules?.Enrollment && excelData?.module != Modules?.Admission ?
                        (selectedSectionDataStore as unknown as any)?.[excelData?.module].programStage ?
                            [(selectedSectionDataStore as unknown as any)?.[excelData?.module].programStage] :
                            (selectedSectionDataStore as unknown as any)?.[excelData?.module].programStages.map((x: any) => x.programStage)
                        : []
                )
            ]

            const displayNames = programConfig?.programStages.filter(x => programStages.includes(x.id)).map(x => x.displayName)

            switch (excelData?.module) {
                case Modules.Attendance:
                    const { attendanceEvents } = generateAttendanceEventObjects(displayNames, studentsData, selectedSectionDataStore as unknown as selectedDataStoreKey)
                    const attendanceDisplayName = programConfig?.programStages.find(x => x.id === selectedSectionDataStore?.attendance?.programStage)?.displayName
                    setProgress((prev: any) => ({ ...prev, progress: 20, buffer: 25 }))

                    await postAttendance(
                        attendanceEvents,
                        attendanceDisplayName as unknown as string,
                        selectedSectionDataStore?.attendance?.programStage as unknown as string,
                        excelData?.mapping,
                        programConfig?.id,
                        importMode
                    ).finally(() => closeDialog())
                    break;

                case Modules.Enrollment:
                    /**
                     * Ao se registar um novo estudante criam-se eventos de todos os program stages, excepto attendance e transfer e 
                     * ao se actualizar o estudante nao se cria nenhum evento, sendo assim, esse array terá uma lista de todos os 
                     * program stages que devem ser ignorados na hora de actualizar e/ou registar um novo estudante
                     */
                    const stagesToIgnore = [
                        selectedSectionDataStore?.attendance?.programStage as unknown as string,
                        selectedSectionDataStore?.transfer?.programStage as unknown as string,
                        ...(updating ? [
                            selectedSectionDataStore?.["final-result"]?.programStage as unknown as string,
                            selectedSectionDataStore?.registration?.programStage as unknown as string,
                            ...(selectedSectionDataStore?.performance?.programStages?.map(x => x.programStage) || [])
                        ] : [""])
                    ]

                    const { enrollments } = generateEnrollmentData(
                        profile,
                        programConfig,
                        stagesToIgnore,
                        studentsData,
                        orgUnit as unknown as string,
                        updating,
                        selectedSectionDataStore
                    )
                    setProgress((prev: any) => ({ ...prev, progress: 20, buffer: 25 }))

                    await postEnrollments(
                        enrollments,
                        studentsData,
                        importMode,
                        programConfig?.id,
                        updating,
                        selectedSectionDataStore as unknown as selectedDataStoreKey,
                        orgUnit as unknown as string
                    ).finally(() => closeDialog())

                    break

                case Modules.Admission: {
                    // For admission, ignore all program stages — we only need TEI attributes + enrollment
                    const admStagesToIgnore = programConfig?.programStages?.map(x => x.id) || []

                    // Generate student identifiers for rows where the value is empty
                    const studentIdAttr = (selectedSectionDataStore as any)?.admission?.studentIdentifier
                    const academicYearAttr = (selectedSectionDataStore as any)?.admission?.academicYearAttribute
                    const shouldReplaceYearPrefix = (selectedSectionDataStore as any)?.admission?.replaceIdentifierYearPrefix === true

                    // Store the selected academic year on each admitted student (when configured
                    // and not already provided in the import row).
                    if (academicYearAttr && academicYear && !updating) {
                        for (const student of studentsData) {
                            if (!(student as any)[profile]) (student as any)[profile] = {}
                            if (!(student as any)[profile]?.[academicYearAttr]) {
                                ;(student as any)[profile][academicYearAttr] = academicYear
                            }
                        }
                    }

                    if (studentIdAttr && !updating) {
                        const emptyIdRows = studentsData.filter((s: any) => !s[profile]?.[studentIdAttr])
                        if (emptyIdRows.length > 0) {
                            const attrConfig = programConfig?.programTrackedEntityAttributes?.find(
                                (x: any) => x.trackedEntityAttribute.id === studentIdAttr
                            )
                            if (attrConfig?.trackedEntityAttribute?.pattern) {
                                const generatedIds: any = await generate({
                                    studentsNumber: emptyIdRows.length,
                                    attributeID: studentIdAttr,
                                    pattern: attrConfig.trackedEntityAttribute.pattern,
                                    orgUnitId: orgUnit as unknown as string,
                                    onError: () => onError(`Import error: Failed to generate student identifiers`)
                                })
                                let idIndex = 0
                                for (const student of studentsData) {
                                    if (!(student as any)[profile]?.[studentIdAttr]) {
                                        if (!(student as any)[profile]) (student as any)[profile] = {}
                                        let idValue = generatedIds?.result?.[idIndex]?.value
                                        // Replace the first 4 digits with the academic year's upper number
                                        if (shouldReplaceYearPrefix && idValue && academicYear) {
                                            idValue = applyAcademicYearPrefix(idValue, academicYear as unknown as string)
                                        }
                                        ;(student as any)[profile][studentIdAttr] = idValue
                                        idIndex++
                                    }
                                }
                            }
                        }
                    }

                    const { enrollments: admEnrollments } = generateEnrollmentData(
                        profile,
                        programConfig,
                        admStagesToIgnore,
                        studentsData,
                        orgUnit as unknown as string,
                        updating,
                        selectedSectionDataStore
                    )
                    setProgress((prev: any) => ({ ...prev, progress: 20, buffer: 25 }))

                    await postEnrollments(
                        admEnrollments,
                        studentsData,
                        importMode,
                        programConfig?.id,
                        updating,
                        selectedSectionDataStore as unknown as selectedDataStoreKey,
                        orgUnit as unknown as string
                    ).finally(() => closeDialog())

                    break
                }

                case Modules.Final_Result: {
                    const { events } = generateEventObjects(displayNames, studentsData, programConfig)
                    const { enrollmentUpdates } = generateFinalResultData(
                        displayNames,
                        studentsData,
                        programConfig,
                        selectedSectionDataStore
                    )

                    setProgress((prev: any) => ({ ...prev, progress: 20, buffer: 25 }))

                    await postData(events, excelData, importMode, programConfig, programStages).finally(() => closeDialog())

                    await postEnrollments(
                        enrollmentUpdates,
                        studentsData,
                        importMode,
                        programConfig?.id,
                        true,
                        selectedSectionDataStore as unknown as selectedDataStoreKey,
                        orgUnit as unknown as string,
                        true
                    ).finally(() => closeDialog())
                }
                    break;

                default:
                    const { events } = generateEventObjects(displayNames, studentsData, programConfig)
                    setProgress((prev: any) => ({ ...prev, progress: 20, buffer: 25 }))

                    await postData(events, excelData, importMode, programConfig, programStages).finally(() => closeDialog())
                    break;
            }
        } catch (error) {
            setOpenProgress(false)
            setStats({ stats: { ignored: 0, created: 0, updated: 0, total: 0 }, errorDetails: [], exceptions: [{ "Error message": error?.message || error || 'Unkknown error' }], byType: [] })
            onError(error)
        }
    }

    return { importData, stats }
}
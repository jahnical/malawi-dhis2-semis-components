import { ExportData } from "../../../types/bulk/bulkOperations";
import { formatSheetData } from "../../../utils/format/formatSheetData";
import { selectedDataStoreKey, Modules } from 'dhis2-semis-types';
import { getMetaData } from '../../../utils/excelMetadata/getMetadata';
import { generateHeaders } from './excelHeaders/generateExcelHeaders';
import { getCommonSheetData } from './useGetCommonData/commonData';
import { getAdmissionSheetData } from './useGetCommonData/admissionData';
import { generateFile } from './dataExporter/fileGenerator';
import { generateEmptyRows } from '../../../utils/common/generateData';
import { generateAndReserveIds } from './generateIds/generateAndReserve';
import { areParamsValid } from '../../../utils/common/validateRequiredParams';
import { calendarForAcademicYear, useGetEvents, useIncrementDays, useUrlParams } from "dhis2-semis-functions";
import { useSchoolCalendarKey } from "../../../hooks/dataStore/useSchoolCalendarKey";
import { SchoolCalendarType } from "../../../types/dataStore/schoolCalendar";

// Enrollment ids per events request: keeps the URL short (about 12 characters each)
const ENROLLMENTS_PER_REQUEST = 50

function chunkRows<T>(rows: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size))
    return chunks
}

export function useExportData(props: ExportData) {
    const {
        programConfig,
        isSchoolDay,
        stagesToExport,
        module,
        selectedSectionDataStore,
        withSocioEconomics = false,
        sectionType,
        empty = false,
        setProgress = () => { },
        onError,
    } = props
    const { getData } = getCommonSheetData({ ...props, onError })
    const { getAdmissionData } = getAdmissionSheetData({ ...props, onError })
    const { urlParameters } = useUrlParams()
    const { schoolName: orgUnitName, school: orgUnit, academicYear, grade } = urlParameters
    const { getEvents } = useGetEvents()
    const { generate } = generateAndReserveIds()
    const { defaults, schoolCalendar } = useSchoolCalendarKey()
    // School days come from the calendar of the academic year selected in the header (not always the current year)
    const selectedCalendar = calendarForAcademicYear(schoolCalendar, academicYear, defaults?.academicYear)
    const { excelGenerator } = generateFile({ unavailableDays: isSchoolDay as unknown as (date: Date, config: SchoolCalendarType) => boolean, config: selectedCalendar })
    const { getHeaders } = generateHeaders({
        module,
        programConfig,
        stagesToExport,
        selectedSectionDataStore,
        sectionType,
        withSocioEconomics,
        empty,
        gradeCode: grade ?? undefined,
    })
    const { msg, valid } = areParamsValid({ ...props })
    const { getDate } = useIncrementDays()

    // `signal`: aborted when the user cancels; the export then stops at the next step and saves no file
    async function exportData({ fileName, numberOfEmptyRows, startDate, endDate, signal }: { fileName?: string, startDate?: any, endDate?: any, numberOfEmptyRows?: number, signal?: AbortSignal }) {
        const cancelled = () => signal?.aborted === true
        if (!valid) onError(`Export error: ${msg}`)
        else {

            if (empty && module != Modules.Enrollment && module != Modules.Admission) {
                onError('Export error: The empty variable only applies to the enrollment and admission modules!')
            } else {
                setProgress((prev: any) => ({ ...prev, progress: 1, buffer: 10 }))
                let data: any = []
                const { filters, formatedHeaders, attributesToGenerate, defaultLockedHeaders } = getHeaders(startDate, endDate)
                const metadata = getMetaData(programConfig, stagesToExport)

                if (!empty) {
                    if (module === Modules.Admission) {
                        data = await getAdmissionData()
                    } else {
                        data = await getData()
                    }
                }

                if (cancelled()) return

                if (module != Modules.Enrollment && module != Modules.Admission) {
                    // One request per stage and group of enrollments (not per learner and stage): the events
                    // of the learners' enrollments in this academic year only. With a class of 40 and 4 stages
                    // this is 4 requests instead of 160, and other years' events are never downloaded.
                    const rows: any[] = data ?? []
                    const groups = chunkRows(rows.filter((row: any) => row?.enrollment), ENROLLMENTS_PER_REQUEST)
                    const steps = Math.max(1, stagesToExport?.length * groups.length)
                    for (const stage of stagesToExport ?? []) {
                        const byEnrollment = new Map<string, any[]>()
                        for (const group of groups) {
                            if (cancelled()) return
                            try {
                                const resp = await getEvents({
                                    program: selectedSectionDataStore?.program as unknown as string,
                                    ...(module === Modules.Attendance ? {
                                        occurredAfter: startDate,
                                        occurredBefore: getDate({ selectedDate: new Date(endDate) }),
                                    } : {}),
                                    orgUnit,
                                    orgUnitMode: "SELECTED",
                                    programStage: stage,
                                    fields: "event,trackedEntity,occurredAt,enrollment,dataValues[dataElement,value]",
                                    enrollments: group.map((row: any) => row.enrollment),
                                    paging: false
                                })
                                for (const event of resp ?? []) {
                                    const list = byEnrollment.get(event.enrollment) ?? []
                                    list.push(event)
                                    byEnrollment.set(event.enrollment, list)
                                }
                            } catch (error) {
                                setProgress((progress: any) => ({ ...progress, progress: 100, buffer: 100 }))
                                onError(`Export error: Occurred error wihile fetching data: ${error}`)
                                return
                            }
                            setProgress((prev: any) => ({ ...prev, progress: prev.progress + 40 / steps, buffer: prev.buffer + 41 / steps }))
                        }
                        for (let index = 0; index < rows.length; index++) {
                            data[index] = {
                                ...data[index], ...formatSheetData({
                                    module: module,
                                    stageId: stage,
                                    events: byEnrollment.get(rows[index]?.enrollment) ?? [],
                                    dataStore: selectedSectionDataStore as unknown as selectedDataStoreKey
                                })
                            }
                        }
                    }
                } else if (empty && (module == Modules.Enrollment || module == Modules.Admission)) {
                    let ids: any = {}

                    for (const attr of attributesToGenerate) {
                        if (cancelled()) return
                        await generate({
                            studentsNumber: numberOfEmptyRows,
                            attributeID: attr?.attributeID,
                            pattern: attr?.pattern,
                            orgUnitId: orgUnit,
                            onError: () => onError(`Export error: Occurred error wihile generating ids for attribute ${attr?.attributeID}`)
                        }).then((generatedIds: any) => {
                            ids[attr.attributeID] = generatedIds?.result?.map((x: any) => x.value)
                        })
                            .then(() => setProgress((progress: any) => ({ ...progress, progress: 80 / attributesToGenerate.length, buffer: 82 / attributesToGenerate.length })))
                            .catch((error) => {
                                onError(`Export error: ${error}`)
                                setProgress((progress: any) => ({ ...progress, progress: 100, buffer: 100 }))
                            })
                    }

                    data = generateEmptyRows(numberOfEmptyRows, formatedHeaders, ids, orgUnitName)
                }

                if (cancelled()) return

                try {
                    await excelGenerator({ headers: formatedHeaders, rows: data, filters, fileName, metadata, module, empty, defaultLockedHeaders })
                } catch (error) {
                    onError(`Export error: Occurred an error while generating file! - ${error}`)
                } finally {
                    if (!cancelled()) setProgress((progress: any) => ({ ...progress, progress: 100, buffer: 100 }))
                }
            }
        }
    }

    return { exportData }
}
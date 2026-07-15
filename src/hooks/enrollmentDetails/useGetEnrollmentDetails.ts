import { format } from 'date-fns';
import { Modules } from 'dhis2-semis-types';
import { ExportData } from '../../types/bulk/bulkOperations';
import { attributes, dataValues } from '../../utils/format/formatData';
import { useGetEvents, useGetTeis, useUrlParams } from "dhis2-semis-functions";

export function useGetEnrollmentData(props: ExportData) {
    const { getTeis } = useGetTeis()
    const { getEvents } = useGetEvents()
    const { onError, eventFilters, withSocioEconomics, selectedSectionDataStore, module, setProgress = () => { } } = props
    const { urlParameters } = useUrlParams()
    const { schoolName: orgUnitName, school: orgUnit, } = urlParameters

    const getEnrollmentDetails = async (events: any) => {
        const percentagem = module === Modules.Enrollment ? 80 : 40
        // Must be semicolon-joined: the shared query param mapping splits a
        // multi-id string on ";" before sending it as the `trackedEntity` filter.
        // A comma-joined string is never split, so the whole blob is sent as one
        // (invalid) id and the request silently matches nothing.
        const trackedEntityIds = events?.map((x: { trackedEntity: string }) => x.trackedEntity).join(';')

        try {
            return getTeis({ program: selectedSectionDataStore?.program as unknown as string, trackedEntities: trackedEntityIds, orgUnitMode: "SELECTED", orgUnit })
                .then(async (trackedEntityInstances: any) => {
                    let rows: any = []
                    let counter = 0

                    for (const tei of trackedEntityInstances) {
                        counter++
                        let enrollment = events.find((x: any) => x.trackedEntity == tei?.trackedEntity)?.enrollment
                        let socioEconomiscData: any = []
                        const socioEconomicsStage = selectedSectionDataStore?.['socio-economics']?.programStage as unknown as string

                        const registrationData: any = await getEvents({
                            program: selectedSectionDataStore?.program as unknown as string,
                            programStage: selectedSectionDataStore?.registration?.programStage as unknown as string,
                            orgUnitMode: "SELECTED",
                            fields: "*",
                            filter: eventFilters,
                            paging: false,
                            trackedEntities: tei?.trackedEntity,
                            orgUnit: orgUnit
                        })

                        if (socioEconomicsStage && (withSocioEconomics || module === Modules.Enrollment)) {
                            socioEconomiscData = await getEvents({
                                program: selectedSectionDataStore?.program as unknown as string,
                                programStage: socioEconomicsStage,
                                orgUnitMode: "SELECTED",
                                fields: "*",
                                filter: eventFilters,
                                paging: false,
                                trackedEntities: tei?.trackedEntity,
                                orgUnit: orgUnit
                            })
                        }

                        const currEnrollmentRegistration = registrationData?.find((x: any) => x.enrollment === enrollment)
                        const currEnrollmentSocioEconomics = socioEconomicsStage ? socioEconomiscData?.find((x: any) => x.enrollment === enrollment) : undefined

                        rows = [...rows, {
                            ref: "" + counter + " ",
                            school: orgUnitName,
                            orgUnit: currEnrollmentRegistration?.orgUnit,
                            enrollmentDate: currEnrollmentRegistration?.occurredAt ? format(new Date(currEnrollmentRegistration?.occurredAt), 'yyyy-MM-dd') : "",
                            enrollment: enrollment,
                            trackedEntity: tei.trackedEntity,
                            enrollmentStatus: tei?.enrollments?.find((x: any) => x.enrollment === enrollment)?.status,
                            ...attributes(tei?.attributes ?? []),
                            ...dataValues(currEnrollmentRegistration?.dataValues ?? [], selectedSectionDataStore?.registration?.programStage as unknown as string),
                            ...(socioEconomicsStage ? dataValues(currEnrollmentSocioEconomics?.dataValues ?? [], socioEconomicsStage) : {}),
                        }]

                        setProgress((progress: any) => ({
                            ...progress,
                            progress: progress.progress + (percentagem / trackedEntityInstances?.length),
                            buffer: progress.buffer + ((percentagem + 4) / trackedEntityInstances?.length)
                        }))
                    }

                    return rows
                })
        }
        catch (error: any) {
            onError('Export Error: ' + error)
            setProgress((progress: any) => ({ ...progress, progress: 100, buffer: 100 }))
        }

    }

    return { getEnrollmentDetails }
}
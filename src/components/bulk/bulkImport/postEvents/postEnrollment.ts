import { importStrategy } from "../../../../types/bulk/bulkOperations";
import { selectedDataStoreKey } from 'dhis2-semis-types';
import { splitArrayIntoChunks } from "../../../../utils/common/splitArray";
import { importSummary } from "../../../../utils/common/getImportSummary";
import { formatTrackerError, keepEnrollmentFields, useGetLearnerEnrollments, useUploadEvents, type ExistingEnrollment } from "dhis2-semis-functions";
import { useGetEvents } from "dhis2-semis-functions";
import { TranslationState } from "../../../..//schemas/translationsSchema";
import { useRecoilValue } from "recoil";

export function postEnrollmentData({ setStats, setProgress, onError, setOpenProgress }: { setOpenProgress: (args: boolean) => void, setStats: (args: any) => void, setProgress: (rags: any) => void, onError: (args: string) => void }) {
    const { getEvents } = useGetEvents()
    const { uploadValues } = useUploadEvents()
    const { getLearnerEnrollments } = useGetLearnerEnrollments()
    const i18n = useRecoilValue(TranslationState) as any

    function updateProgressF(buffer: number, progressParam: number, denominador: number) {
        setProgress((progress: any) => ({
            ...progress,
            progress: progress.progress + (progressParam / denominador),
            buffer: progress.buffer + (buffer / denominador)
        }))
    }

    async function postEnrollments(
        enrollments: any[], excelData: any, importMode: "VALIDATE" | "COMMIT", program: string,
        updating: boolean, dataStore: selectedDataStoreKey, orgUnit: string, updatingFR = false, warnings: any[] = []
    ) {
        let copyData = [...enrollments]
        let updatedStats: any = { stats: { ignored: 0, created: 0, updated: 0, total: 0 }, errorDetails: [], warningDetails: [...warnings], exceptions: [], byType: [] }
        const updateProgress = (updating || updatingFR) ? 40 : 0

        if (updating) {
            const teis = excelData.map((x: any) => {
                return { tei: x?.Ids?.trackedEntity, orgUnit: x.Ids.orgUnit, enrollment: x.Ids.enrollment }
            })
            const socioEconomicsStage = dataStore?.["socio-economics"]?.programStage

            // Updates never change an enrollment's org unit or dates, nor its status (a final result sets
            // only the status), so send back what is saved
            const saved = new Map<string, ExistingEnrollment>()
            try {
                for (const teiEnrollments of (await getLearnerEnrollments(teis.map((x: any) => x.tei), program)).values()) {
                    for (const enrollment of teiEnrollments) saved.set(enrollment.enrollment, enrollment)
                }
            } catch (error: any) {
                setOpenProgress(false)
                onError(error)
                return
            }
            copyData = copyData.map((enrollment: any) => {
                const existing = saved.get(enrollment?.enrollment)
                if (!existing) return enrollment
                const kept = keepEnrollmentFields(existing)
                return updatingFR
                    ? { ...enrollment, orgUnit: kept.orgUnit, enrolledAt: kept.enrolledAt, occurredAt: kept.occurredAt }
                    : { ...enrollment, ...kept }
            })

            for (let index = 0; index < teis.length; index++) {
                if (socioEconomicsStage && !updatingFR) {
                    await getEvents({
                        program,
                        orgUnit: teis[index]?.orgUnit,
                        orgUnitMode: "SELECTED",
                        programStage: socioEconomicsStage,
                        fields: "event,trackedEntity,enrollment,dataValues[dataElement,value]",
                        trackedEntities: teis[index]?.tei,
                        paging: false
                    }).then((resp: any[]) => {
                        let thisTeiEvent = resp.find(x => x.enrollment === copyData[index].enrollment)
                        const { attributes, ...rest } = copyData[index]

                        copyData[index] = {
                            enrollments: [{
                                ...rest,
                                events: [...(thisTeiEvent ? [{ ...copyData[index].events[0], event: thisTeiEvent.event }] : [])]
                            }],
                            orgUnit: teis[index]?.orgUnit,
                            trackedEntity: teis[index]?.tei,
                            trackedEntityType: dataStore.trackedEntityType,
                            attributes: attributes
                        }

                        updateProgressF(updateProgress + 5, updateProgress, teis.length)
                    }).catch((error) => {
                        setOpenProgress(false)
                        onError(error)
                    })
                } else {
                    const { attributes, ...rest } = copyData[index]
                    copyData[index] = updatingFR ? { ...rest, events: [] } :
                        { enrollments: [{ ...rest, events: [] }] }

                    updateProgressF(updateProgress + 5, updateProgress, teis.length)
                }
            }
        } else {
            for (let index = 0; index < copyData.length; index++) {
                const { ...props } = copyData[index]

                copyData[index] = {
                    trackedEntityType: dataStore.trackedEntityType,
                    orgUnit: orgUnit,
                    enrollments: [{
                        ...props,
                    }]
                }
            }
        }

        const chunks = splitArrayIntoChunks(copyData, 50);

        for (const chunk of chunks) {
            await uploadValues((updatingFR ? { enrollments: chunk } : { trackedEntities: chunk }), importMode, importStrategy.CREATE, { silent: true }).then((response: any) => {
                updatedStats = importSummary(response, updatedStats)
                updateProgressF((90 + 5 - updateProgress), (90 - updateProgress), chunks.length)
            }).catch((error: any) => {
                updatedStats = { ...updatedStats, exceptions: [{ [i18n.t("Error message")]: formatTrackerError(error) }] }
                setOpenProgress(false);
                onError(error);
            });
        }

        setStats(updatedStats)
    }

    return { postEnrollments }
}
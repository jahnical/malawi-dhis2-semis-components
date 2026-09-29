import { importStrategy } from "../../../../types/bulk/bulkOperations";
import { selectedDataStoreKey } from 'dhis2-semis-types';
import { splitArrayIntoChunks } from "../../../../utils/common/splitArray";
import { importSummary } from "../../../../utils/common/getImportSummary";
import { formatTrackerError, useUploadEvents } from "dhis2-semis-functions";
import { useGetEvents } from "dhis2-semis-functions";
import { TranslationState } from "../../../..//schemas/translationsSchema";
import { useRecoilValue } from "recoil";

export function postEnrollmentData({ setStats, setProgress, onError, setOpenProgress }: { setOpenProgress: (args: boolean) => void, setStats: (args: any) => void, setProgress: (rags: any) => void, onError: (args: string) => void }) {
    const { getEvents } = useGetEvents()
    const { uploadValues } = useUploadEvents()
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
        updating: boolean, dataStore: selectedDataStoreKey, orgUnit: string, updatingFR = false
    ) {
        let copyData = [...enrollments]
        let updatedStats: any = { stats: { ignored: 0, created: 0, updated: 0, total: 0 }, errorDetails: [], warningDetails: [], exceptions: [], byType: [] }
        const updateProgress = (updating || updatingFR) ? 40 : 0

        if (updating) {
            const teis = excelData.map((x: any) => {
                return { tei: x?.Ids?.trackedEntity, orgUnit: x.Ids.orgUnit, enrollment: x.Ids.enrollment }
            })
            const socioEconomicsStage = dataStore?.["socio-economics"]?.programStage

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
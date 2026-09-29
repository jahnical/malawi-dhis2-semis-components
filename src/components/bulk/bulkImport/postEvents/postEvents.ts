import { splitArrayIntoChunks } from "../../../../utils/common/splitArray";
import { importStrategy } from "../../../../types/bulk/bulkOperations";
import { importSummary } from "../../../../utils/common/getImportSummary";
import { ProgramConfig } from "dhis2-semis-types"
import { formatTrackerError, useUploadEvents } from "dhis2-semis-functions";
import { useGetEvents } from "dhis2-semis-functions";
import { useRecoilValue } from "recoil";
import { TranslationState } from "../../../../schemas/translationsSchema";

export function postValues({ setStats, setProgress, onError, setOpenProgress }: { setOpenProgress: (args: boolean) => void, setStats: (args: any) => void, setProgress: (rags: any) => void, onError: (args: string) => void }) {
    const { uploadValues } = useUploadEvents()
    const { getEvents } = useGetEvents()
    const i18n = useRecoilValue(TranslationState) as any
    let updatedStats: any = { stats: { ignored: 0, created: 0, updated: 0, total: 0 }, errorDetails: [], exceptions: [], byType: [] }

    function updateProgressF(buffer: number, progressParam: number, denominador: number) {
        setProgress((progress: any) => ({
            ...progress,
            progress: progress.progress + (progressParam / denominador),
            buffer: progress.buffer + (buffer / denominador)
        }))
    }

    async function postData(
        data: any[],
        excelData: any,
        importMode: "VALIDATE" | "COMMIT",
        programConfig: ProgramConfig,
        programStages: string[]
    ) {
        let copyData = [...data]
        for (const student of excelData.mapping as unknown as []) {
            const { enrollment, orgUnit, trackedEntity } = (student as unknown as any).Ids

            for (const stage of programStages) {
                await getEvents({
                    program: programConfig.id,
                    orgUnit,
                    orgUnitMode: "SELECTED",
                    programStage: stage,
                    fields: "event,programStage,trackedEntity,occurredAt,enrollment,dataValues[dataElement,value]",
                    trackedEntities: trackedEntity,
                    paging: false
                }).then((resp: any) => {
                    let event = resp.find((x: any) => x.enrollment === enrollment && x.programStage == stage)?.event
                    const index = copyData.findIndex(x => x.enrollment === enrollment && x.programStage == stage)
                    copyData[index] = { ...copyData[index], ...(event ? { event: event } : {}) }

                    updateProgressF(20, 17, excelData.mapping.length * programStages.length)
                }).catch((error) => {
                    setOpenProgress(false)
                    onError(error)
                })
            }
        }

        const chunks = splitArrayIntoChunks(copyData, 50);

        for (const chunk of chunks) {
            await uploadValues({ events: chunk }, importMode, importStrategy.CREATE, { silent: true }).then((response) => {
                updatedStats = importSummary(response, updatedStats)
                updateProgressF(20, 13, chunks.length)
            }).catch((error) => {
                updatedStats = { ...updatedStats, exceptions: [{ [i18n.t("Error message")]: formatTrackerError(error) }] }
                setOpenProgress(false)
                onError(error)
            });
        }

        setStats(updatedStats)
    }

    return { postData }
}


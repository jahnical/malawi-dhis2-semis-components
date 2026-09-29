import { format } from "date-fns"
import { importStrategy } from "../../../../types/bulk/bulkOperations"
import { importSummary } from "../../../../utils/common/getImportSummary"
import { splitArrayIntoChunks } from "../../../../utils/common/splitArray"
import { useGetEvents } from "dhis2-semis-functions";
import { formatTrackerError, useUploadEvents } from "dhis2-semis-functions";
import { TranslationState } from "../../../../schemas/translationsSchema";
import { useRecoilValue } from "recoil";

export function postAttendanceValues({ setStats, setProgress, onError, setOpenProgress }: { setOpenProgress: (args: boolean) => void, setStats: (args: any) => void, setProgress: (rags: any) => void, onError: (args: string) => void }) {
    const { uploadValues } = useUploadEvents()
    const { getEvents } = useGetEvents()
    let updatedStats: any = { stats: { ignored: 0, created: 0, updated: 0, total: 0 }, errorDetails: [] }
    const i18n = useRecoilValue(TranslationState) as any

    function updateProgressF(buffer: number, progressParam: number, denominador: number) {
        setProgress((progress: any) => ({
            ...progress,
            progress: progress.progress + (progressParam / denominador),
            buffer: progress.buffer + (buffer / denominador)
        }))
    }
    async function postAttendance(
        events: any[],
        programStageName: string,
        programStageId: string,
        excelData: any[],
        program: string,
        importMode: "VALIDATE" | "COMMIT"
    ) {
        let values: any = { CREATE: [], UPDATE: [] }
        const keys = Object.keys(values)

        for (const student of excelData as unknown as []) {
            const { enrollment, orgUnit, trackedEntity } = (student as unknown as any).Ids
            const days = Object.keys(student[programStageName])
            const filter = {
                occurredAfter: days[0],
                occurredBefore: days[days.length - 1]
            }

            await getEvents({
                program,
                ...filter,
                orgUnit,
                orgUnitMode: "SELECTED",
                programStage: programStageId,
                fields: "event,trackedEntity,occurredAt,enrollment,dataValues[dataElement,value]",
                trackedEntities: trackedEntity,
                paging: false
            }).then((resp: any[]) => {

                let thisTeiEvents = events.filter(x => x.enrollment === enrollment)
                let alreadyExistingEvents: any = {}

                resp?.filter(x => x.enrollment === enrollment).map((x) => {
                    alreadyExistingEvents[format(new Date(x.occurredAt), 'yyyy-MM-dd')] = x.event
                })

                thisTeiEvents.forEach(event => {
                    if (alreadyExistingEvents[event.occurredAt]) {
                        values.UPDATE.push({ ...event, event: alreadyExistingEvents[event.occurredAt] });
                    } else {
                        values.CREATE.push(event);
                    }
                });

                updateProgressF(40, 35, excelData.length)
            }).catch((error) => {
                setOpenProgress(false)
                onError(error)
            })
        }

        for (const key of keys) {
            const chunks = splitArrayIntoChunks(values[key], 50);

            for (const chunk of chunks) {
                await uploadValues({ events: chunk }, importMode, (importStrategy as unknown as any)[key], { silent: true }).then((response) => {
                    updatedStats = importSummary(response, updatedStats)
                    updateProgressF(50, 50, keys.length * chunks.length)
                }).catch((error: any) => {
                    updatedStats = { ...updatedStats, exceptions: [{ [i18n.t("Error message")]: formatTrackerError(error) }] }
                    setOpenProgress(false)
                    onError(error)
                });
            }
        }

        setStats(updatedStats)
    }

    return { postAttendance }
}
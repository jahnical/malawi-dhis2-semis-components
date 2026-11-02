import { ExportData } from "../../../types/bulk/bulkOperations"
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@dhis2/ui";
import ModalExportEmpty from "../modal/modalExport";
import { useExportData } from "./exportData";
import ModalProgress from "../progress/interactiveProgress";
import { Modules } from "dhis2-semis-types";
import { useGetFileName } from "../../../hooks/common/useGetFileName";

const IDLE = { prorocess: "export", progress: 0, buffer: 0 }

export default function ProcessExport(props: ExportData) {
    const { empty = false, label, module, Form, button, onError } = props
    const [open, setOpen] = useState(false)
    const [openPogress, setOpenProgress] = useState(false)
    const [progress, setProgress] = useState(IDLE)
    const { getFileName } = useGetFileName()
    const fileName = getFileName(module)

    // The export that is running. Cancelling aborts it: it stops at its next step, saves no file, and
    // its late progress updates and errors are ignored, so a new export starts from a clean state.
    const runRef = useRef<AbortController | null>(null)
    const isLive = () => Boolean(runRef.current && !runRef.current.signal.aborted)
    const guardedSetProgress = useCallback((update: any) => { if (isLive()) setProgress(update) }, [])
    const guardedOnError = useCallback((error: any) => { if (isLive()) onError?.(error) }, [onError])
    const { exportData } = useExportData({ ...props, setProgress: guardedSetProgress, onError: guardedOnError })

    useEffect(() => {
        if (progress.progress > 0 && isLive()) {
            setOpen(false)
            setOpenProgress(true)
        }

        if (progress.progress >= 100) {
            setOpenProgress(false)
            setProgress(IDLE)
        }
    }, [progress.progress])

    function cancel() {
        runRef.current?.abort()
        runRef.current = null
        setOpenProgress(false)
        setProgress(IDLE)
    }

    async function run(args: { fileName?: string, numberOfEmptyRows?: number, startDate?: any, endDate?: any }) {
        runRef.current?.abort()
        const controller = new AbortController()
        runRef.current = controller
        setProgress(IDLE)
        try {
            await exportData({ ...args, signal: controller.signal })
        } finally {
            if (runRef.current === controller) runRef.current = null
        }
    }

    async function startExport() {
        if (empty || module === Modules.Attendance) setOpen(true)
        else await run({ fileName: fileName })
    }

    // Leaving the page (or the component) also stops a running export
    useEffect(() => () => runRef.current?.abort(), [])

    return (
        <>
            {button
                ? <Button icon={button.icon} disabled={button.disabled} onClick={() => { void startExport() }}>
                    {label}
                </Button>
                : <a style={{ width: "100%", cursor: "pointer", padding: "5px" }} onClick={async (e) => {
                    e.preventDefault()
                    await startExport()
                }}>
                    {label}
                </a>
            }

            <ModalExportEmpty
                onSubmit={(args: any) => { void run(args) }}
                open={open}
                setOpen={setOpen}
                module={module}
                Form={Form}
            />

            <ModalProgress
                progress={progress}
                open={openPogress}
                module={module as unknown as string}
                setOpen={(value: boolean) => { if (!value) cancel() }}
            />
        </>
    )
}

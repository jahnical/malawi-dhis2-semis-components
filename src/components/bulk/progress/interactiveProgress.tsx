import Lottie from "lottie-react";
import loading from '../../../assets/animations/loading.json'
import LinearBuffer from "./linearProgress";
import download from '../../../assets/animations/download.json'
import upload from '../../../assets/animations/upload.json'
import styles from '../modal/modal.module.css'
import ModalComponent from "../../../components/modal/Modal";
import { TranslationState } from "../../../schemas/translationsSchema";
import { useRecoilValue } from "recoil";

export default function ModalProgress({ progress, open, setOpen, module }: { progress: { prorocess: string, progress: number, buffer: number }, open: boolean, setOpen: (args: boolean) => void, module?: string }) {
    const i18n = useRecoilValue(TranslationState) as any

    const style = {
        height: 340,
    };

    return (
        <ModalComponent
            open={open}
            handleClose={() => setOpen(false)}
            title={progress.prorocess == 'export' ? i18n.t("Export progress") : i18n.t("Import progress")}
            children={
                <div className={styles.loadingContainer}>
                    <div className={styles.linearProgress}>
                        <LinearBuffer progress={progress} />
                        <span className={styles.percentagem} >{Math.round(progress.progress)}%</span>
                    </div>
                    <div className={styles.studentSeek}>
                        {
                            progress.prorocess === 'export' ?
                                <Lottie style={style} className={styles.visble} animationData={download} loop={true} />
                                : <Lottie style={style} className={styles.visble} animationData={upload} loop={true} />
                        }
                    </div>
                    <div className={styles.loading} >
                        <span>{
                            // e.g. "final-result" -> "final result"; without a module just "Importing data"
                            module
                                ? i18n.t(progress.prorocess == 'export' ? 'Exporting {{module}} data' : 'Importing {{module}} data', { module: String(module).replace(/[-_]/g, ' ') })
                                : i18n.t(progress.prorocess == 'export' ? 'Exporting data' : 'Importing data')
                        } </span>
                        <Lottie style={{ height: 100, marginLeft: "-40px" }} animationData={loading} loop={true} />
                    </div>
                </div>
            }
        />
    )
}
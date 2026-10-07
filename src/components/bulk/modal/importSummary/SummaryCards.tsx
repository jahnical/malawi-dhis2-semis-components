import { isNonSchoolDayPlaceholder } from "../../../../utils/constants/nonSchoolDay";
import React from "react";
import { ButtonStrip } from "@dhis2/ui";
import SummaryCard from "../../../card/SummaryCard";
import { useRecoilValue } from "recoil";
import { TranslationState } from "../../../../schemas/translationsSchema";

function SummaryCards({ validRecs, invalidRecs, doneProcessing, stats, module }: { module: string, stats: any, validRecs: any, invalidRecs: any, doneProcessing: boolean }): React.ReactElement {
    const i18n = useRecoilValue(TranslationState) as any

    // Attendance counts cells: one record per learner and school day. A blank cell (a day the learner was
    // not registered, e.g. after a dropout or before enrolment) is skipped by the import, so it is shown
    // as skipped, not as invalid: only rows that fail validation are invalid
    const attendanceCells = (filled: boolean) => validRecs?.reduce((acc: number, item: any) => acc +
        Object.values(item?.Attendance ?? {}).filter((v: any) => filled
            ? String(v ?? '').length > 0 && !isNonSchoolDayPlaceholder(v)
            : String(v ?? '').length === 0).length, 0) ?? 0

    const getStats = (invalid = false) => {
        if (invalid) return invalidRecs?.length || 0;
        if (module === "attendance") return attendanceCells(true)
        return validRecs?.length || 0;
    }

    return (
        <ButtonStrip>
            {!doneProcessing ? <>
                <SummaryCard color="success" label={`${i18n.t("New Records")}`} value={getStats()} />
                <SummaryCard color="warning" label={`${i18n.t("Invalid Records")}`} value={getStats(true)} />
                {module === "attendance" && <SummaryCard color="secondary" label={`${i18n.t("Blank days (skipped)")}`} value={attendanceCells(false)} />}
            </>
                :
                <>
                    <SummaryCard color="success" label={`${i18n.t("Imported Records")}`} value={stats?.stats?.created?.toString()} />
                    <SummaryCard color="updated" label={`${i18n.t("Updated Records")}`} value={stats?.stats?.updated?.toString()} />
                    <SummaryCard color="error" label={`${i18n.t("Errors")}`} value={stats?.stats?.ignored?.toString()} />
                    <SummaryCard color="warning" label={`${i18n.t("Warnings")}`} value={stats?.warningDetails?.length ?? 0} />
                    <SummaryCard color="secondary" label={`${i18n.t("Total rows")}`} value={validRecs?.length + invalidRecs?.length} />
                </>
            }
        </ButtonStrip>
    )
}

export default SummaryCards;

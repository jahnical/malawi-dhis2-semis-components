import { useBuildForm } from "dhis2-semis-functions";
import { useDataStoreKey } from "../../hooks/dataStore/useDataStoreKey";
import { useState } from "react";
import { NoticeBox, Button, IconAddCircle24 } from "@dhis2/ui";
import WithPadding from "../template/WithPadding";
import CustomForm from "../form/form";
import ModalComponent from "../modal/Modal";
import useProgramsKeys from "../../hooks/appWrapper/useProgramsKeys";
import WithBorder from "../template/WithBorder";
import { staticForm } from "../../utils/constants/searchEnrollmentForm";
import { Modules } from 'dhis2-semis-types';
import { useRecoilValue } from "recoil";
import { TranslationState } from "../../schemas/translationsSchema";

export default function PerformPromotion({ selected, Form, loading, onSubmit }: { onSubmit: (e: any) => void, selected: any[], Form: any, loading: boolean }) {
    const programsValues = useProgramsKeys();
    const programData = programsValues[0];
    const dataStoreData = useDataStoreKey({ sectionType: "student" });
    const { formData } = useBuildForm({ dataStoreData, programData, module: Modules.Enrollment });
    const [enrollmentDetails = []] = formData;
    const [open, setOpen] = useState(false)
    const i18n = useRecoilValue(TranslationState) as any

    return (
        <>
            <Button onClick={() => {
                setOpen(true);
            }} icon={<IconAddCircle24 />}
            >
                <span>{i18n.t("Perform Promotion")}</span>
            </Button >

            {
                open && <ModalComponent
                    children={<WithPadding>
                        <NoticeBox warning title={i18n.t("{{count}} selected", { count: selected.length })}>
                            {i18n.t("Each selected record gets a new enrollment in the academic year chosen below.")}
                        </NoticeBox>
                        <WithBorder type="all" >
                            <WithPadding>
                                <CustomForm
                                    Form={Form}
                                    loading={loading}
                                    formFields={[
                                        {
                                            storyBook: false,
                                            name: i18n.t("Student promotion"),
                                            description: i18n.t("Student promotion"),
                                            fields: [
                                                staticForm().registeringSchool,
                                                ...enrollmentDetails,
                                                staticForm().enrollmentDate
                                            ]
                                        }
                                    ]}
                                    storyBook={false}
                                    withButtons={true}
                                    onFormSubtmit={(e) => onSubmit(e)}
                                    onCancel={() => setOpen(false)}
                                />
                            </WithPadding>
                        </WithBorder>
                    </WithPadding>}
                    open={open}
                    handleClose={() => setOpen(false)}
                    title={i18n.t("Perform Promotion")}
                />
            }
        </>
    );
}
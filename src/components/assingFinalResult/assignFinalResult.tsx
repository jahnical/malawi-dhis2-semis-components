import { useGetDataElements, useUrlParams, useUploadEvents } from "dhis2-semis-functions";
import { useDataStoreKey } from "../../hooks/dataStore/useDataStoreKey";
import { useState } from "react";
import { NoticeBox, Button, IconAddCircle24 } from "@dhis2/ui";
import WithPadding from "../template/WithPadding";
import CustomForm from "../form/form";
import ModalComponent from "../modal/Modal";
import WithBorder from "../template/WithBorder";
import { TranslationState } from "../../schemas/translationsSchema";
import { useRecoilValue } from "recoil";

export default function AsssignFinalResult({ selected, Form }: { selected: any[], Form: any }) {
    const { urlParameters } = useUrlParams()
    const { sectionType } = urlParameters
    const { "final-result": fr } = useDataStoreKey({ sectionType: sectionType as unknown as "student" | "staff" })
    const { dataElements } = useGetDataElements({ programStageId: fr.programStage as string, type: "programStage" })
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { uploadValues } = useUploadEvents()
    const i18n = useRecoilValue(TranslationState) as any

    async function formSubmit(values: any) {
        setLoading(true)
        let events = []
        let frStatus = Object.keys(values)[0]

        for (const tei of selected) {
            events.push({
                ...tei.frEvent,
                dataValues: [
                    {
                        dataElement: frStatus,
                        value: values[frStatus]
                    }
                ]
            })
        }
        await uploadValues({ events: events }, 'COMMIT', 'CREATE_AND_UPDATE')
            .then(() => setLoading(false))
            .catch(() => setLoading(false))
    }


    return (
        <>
            <Button onClick={() => {
                setOpen(true);
            }} icon={<IconAddCircle24 />}
            >
                <span>{`${i18n.t('Assing final result')}`}</span>
            </Button >

            {
                open && <ModalComponent
                    children={<WithPadding>
                        <NoticeBox
                            title={
                                i18n.t('WARNING! {{size}} rows will be affected', {
                                    size: `${selected.length}`,
                                })
                            }
                            warning
                        >
                            {i18n.t("No one will be able to access this program. Add some Organisation Units to the access list.")}
                        </NoticeBox>
                        <WithBorder type="all" >
                            <WithPadding>
                                <CustomForm
                                    Form={Form}
                                    loading={loading}
                                    formFields={[
                                        {
                                            storyBook: false,
                                            name: `${i18n.t('Final Results')}`,
                                            description: `${i18n.t('Student final result')}`,
                                            fields: dataElements
                                        }
                                    ]}
                                    storyBook={false}
                                    withButtons={true}
                                    onFormSubtmit={(e) => formSubmit(e)}
                                    onCancel={() => setOpen(false)}
                                />
                            </WithPadding>
                        </WithBorder>
                    </WithPadding>}
                    open={open}
                    handleClose={() => setOpen(false)}
                    title={`${i18n.t('Assign Final Result')}`}
                />
            }
        </>
    );
}
import ModalComponent from '../../../components/modal/Modal'
import CustomForm from '../../../components/form/form'
import { exportFields } from '../../../utils/constants/exportFields'
import { format } from 'date-fns'
import { useCheckFilters, useUrlParams } from 'dhis2-semis-functions';
import { useGetFileName } from '../../../hooks/common/useGetFileName';
import { useDataStoreKey } from '../../../hooks/dataStore/useDataStoreKey';
import { TranslationState } from '../../../schemas/translationsSchema';
import { useRecoilValue } from 'recoil';

export default function ModalExportEmpty({ open, setOpen, onSubmit, module, Form }: { Form: any, onSubmit: (rows: any) => void, open: boolean, setOpen: (args: boolean) => void, module: "attendance" | "final-result" | "enrollment" | "performance" | "admission" }) {
    const { urlParameters } = useUrlParams()
    const { schoolName: orgUnitName, academicYear, sectionType } = urlParameters
    const { filters } = useDataStoreKey({ sectionType: sectionType as unknown as "student" | "staff" })
    const { getUrlParamsAsObject } = useCheckFilters({ filters: (filters?.dataElements ?? []) as unknown as any })
    const { getFileName } = useGetFileName()
    const fileName = getFileName(module)
    const i18n = useRecoilValue(TranslationState) as any

    return (
        <ModalComponent
            open={open}
            size='large'
            handleClose={() => setOpen(false)}
            title={i18n.t('Export Data Details')}
            children={
                <CustomForm
                    storyBook={false}
                    Form={Form}
                    initialValues={{ orgUnitName: orgUnitName, academicYear: academicYear, ...getUrlParamsAsObject() }}
                    onFormSubtmit={(e) => {
                        void onSubmit({
                            fileName: fileName,
                            numberOfEmptyRows: e.rows,
                            startDate: format((e?.dateRange?.startDate ?? new Date()), 'yyyy-MM-dd'),
                            endDate: format((e?.dateRange?.endDate ?? new Date()), 'yyyy-MM-dd')
                        })
                    }}
                    withButtons={true}
                    formFields={[
                        {
                            "name": `${i18n.t("Details")}`,
                            "storyBook": false,
                            "description": `${i18n.t("This file will allow the import of new student data into the system.")}`,
                            "fields": [
                                ...exportFields(module, filters)
                            ]
                        },
                    ]}
                />
            }

        />
    )

}
import { useState } from "react";
import { Button, ButtonStrip, NoticeBox } from "@dhis2/ui";
import styles from "../modal/modal.module.css"
import WithBorder from "../template/WithBorder";
import WithPadding from "../template/WithPadding";
import CustomForm from "../form/form";
import { useSearchEnrollments, useUrlParams } from 'dhis2-semis-functions'
import useGetSearchEnrollmentForm from "../../hooks/enrollmentSearch/useGetSearchEnrollmentForm";
import { ProgramConfig } from 'dhis2-semis-types'
import { useGetProgramsAttributes } from "../../utils/tei/useGetProgramsAttributes";
import { formFields } from "../../utils/constants/searchEnrollmentForm";
import { getRecentEnrollment } from "../../utils/tei/getRecentEnrollment";
import Table from "../table/render/Table";
import ModalComponent from "../modal/Modal";
import { useDataStoreKey } from "../../hooks/dataStore/useDataStoreKey";
import { formattedQuery } from "../../utils/search/formatQuery";
import { IconInfo24 } from "@dhis2/ui";
import { Collapse, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useRecoilValue } from "recoil";
import { TranslationState } from "../../schemas/translationsSchema";

export interface ModalSearchAdmissionTemplateProps {
    Form: any
    setOpen: (value: boolean) => void
    sectionName: "student" | "staff"
    setOpenNewAdmissionModal: (value: boolean) => void
    programConfig: ProgramConfig
    open: boolean
    setFormInitialValues?: (args: any) => void
}

function ModalSearchAdmissionContent(props: ModalSearchAdmissionTemplateProps) {
  const { sectionName, setOpenNewAdmissionModal, programConfig, open, setOpen, Form, setFormInitialValues } = props;
  const { searchEnrollmentFields } = useGetSearchEnrollmentForm({ programConfig });
  const [showResults, setShowResults] = useState<boolean>(false)
  const { teiAttributes, searchableAttributes } = useGetProgramsAttributes({ programConfig });
  const { registration, program, "socio-economics": socioEconomics } = useDataStoreKey({ sectionType: sectionName })
  const { enrollmentValues, setEnrollmentValues, loading, getEnrollmentsData } = useSearchEnrollments({ program, registration, socioEconomics })
  const [collapseAttributes, setCollapseAttributes] = useState(0)
  const { urlParameters } = useUrlParams();
  const { school: orgUnit, schoolName: orgUnitName, academicYear } = urlParameters
  const i18n = useRecoilValue(TranslationState) as any

  const rowsActions: any = [
    { icon: <IconInfo24 />, color: '#144b73', label: i18n.t("View history"), disabled: false },
  ];

  const modalActions = [
    { id: "cancel", small: true, name: i18n.t("Cancel"), disabled: false, primary: true, onClick: () => { setOpen(false) } },
    { id: "continue", name: i18n.t("Admit new"), color: "gray", small: true, disabled: loading, onClick: () => { onHandleAdmitNew() } },
  ];

  const [initialValues] = useState<object>({
    registeringSchool: orgUnitName,
    [registration?.academicYear]: academicYear
  })

  const [queryForm, setQueryForm] = useState<any>({});

  const onHandleChange = (e: { value: string, field: string, name: string }) => {
    if (e.value.length === 0 || e.value === null || e.value === undefined) {
      const updatedForm = { ...queryForm };
      delete updatedForm[e.name];
      setQueryForm(updatedForm);
    } else {
      setQueryForm((prevQueryForm: any) => ({
        ...prevQueryForm,
        [e.name]: e.value,
      }));
    }
  };

  const onHandleSubmit = async () => {
    if (formattedQuery(
      teiAttributes,
      searchEnrollmentFields,
      collapseAttributes,
      queryForm
    ).length > 0) {
      getEnrollmentsData({
        filters: formattedQuery(
          teiAttributes,
          searchEnrollmentFields,
          collapseAttributes,
          queryForm
        ),
        orgUnit,
        setShowResults
      })
    }
  };

  function filterUniqueVariables() {
    const uniqueVariableIDsToRemove: string[] = searchableAttributes.filter(attribute => attribute.unique).map(attribute => attribute.id);
    const filteredOriginalObject = Object.fromEntries(
      Object.entries(queryForm).filter(([id]) => !uniqueVariableIDsToRemove.includes(id))
    );
    return filteredOriginalObject;
  }

  const onHandleAdmitNew = async () => {
    setFormInitialValues && setFormInitialValues(filterUniqueVariables());
    setOpen(false);
    setOpenNewAdmissionModal(true);
  };

  const onReset = () => {
    setQueryForm({});
    setEnrollmentValues([]);
    setFormInitialValues && setFormInitialValues({})
    setShowResults(false);
  };

  const onSelectTei = (teiData: any) => {
    const recentEnrollment = getRecentEnrollment(teiData.enrollments).enrollment
    const recentRegistration = teiData.registrationEvents?.find((event: any) => event.enrollment === recentEnrollment)

    setFormInitialValues && setFormInitialValues({
      trackedEntity: teiData.trackedEntity,
      ...teiData?.mainAttributesFormatted,
      ...recentRegistration,
      [registration.academicYear]: academicYear
    })

    setOpenNewAdmissionModal(true)
    setOpen(false);
  }

  return (
    <ModalComponent
      title={i18n.t("Fill in at least 1 attribute to search.")}
      actions={modalActions}
      handleClose={() => setOpen(false)}
      open={open}
      size="large"
      isClickAway={false}
      showActions={showResults}
      children={
        <div>
          {searchEnrollmentFields?.map((group, index) => (
            <div className="mb-3" key={index}>
              <WithBorder type="all">
                <div className={styles.accordionHeaderContainer} onClick={() => setCollapseAttributes(index === collapseAttributes ? -1 : index)}>
                  <label className={styles.accordionHeader}>{i18n.t("Search by")} {group?.name}</label>
                  <IconButton size="small" onClick={() => setCollapseAttributes(index)}> {collapseAttributes === index ? <ExpandLess /> : <ExpandMore />}  </IconButton>
                </div>

                <Collapse in={collapseAttributes === index}>
                  <WithBorder type="top">
                    <WithPadding>
                      <CustomForm
                        formFields={formFields(group?.variables, sectionName)}
                        initialValues={{ ...initialValues, orgUnit }}
                        onFormSubtmit={(e: any) => onHandleSubmit()}
                        onInputChange={(e: any) => onHandleChange(e)}
                        onCancel={onReset}
                        submitButtonLabel={`${i18n.t("Search")} ${sectionName.toLocaleLowerCase()}`}
                        Form={Form}
                        withButtons={true}
                        loading={loading}
                        storyBook={false}
                      />
                    </WithPadding>
                  </WithBorder>
                </Collapse>
              </WithBorder>
            </div>
          ))}

          <Collapse in={showResults} style={{}}>
            <>
              {enrollmentValues?.length ?
                <div className="">
                  <Table
                    columns={searchableAttributes}
                    programConfig={programConfig}
                    tableData={enrollmentValues}
                    title={`${i18n.t("Results found for")} ${sectionName} ${i18n.t("search")}`}
                    rowAction={rowsActions}
                    onRowClick={onSelectTei}
                    displayType="icon"
                    showRowActions
                    searchActions
                    paginate={false}
                    showHeaderFilters={false}
                    showRowIndex={false}
                  />
                </div> :
                <NoticeBox className={styles.noticeBox} title={`${i18n.t("No")} ${sectionName} ${i18n.t("found")}`}>
                  {i18n.t("Continue searching or click")} <strong>'{i18n.t("Admit new")}'</strong> {i18n.t("if you want to admit as a new")} <strong>{sectionName}</strong>.
                </NoticeBox>}
            </>
          </Collapse>
          {!showResults &&
            <ButtonStrip end>
              <Button key={"Close"} onClick={() => setOpen(false)} loading={false}>
                {i18n.t("Close")}
              </Button>
            </ButtonStrip>
          }
        </div>
      }
    />
  )
}

export default ModalSearchAdmissionContent;

import React from "react";
import { Button, IconAddCircle16 } from "@dhis2/ui";
import styles from "./enrollmentDetails.module.css";
import { useEnrollmentsHeader } from "../../../utils/table/useEnrollmentsHeader";
import { getSectionLabels, useGetSectionTypeLabel } from "dhis2-semis-functions";
import { TranslationState } from "../../../schemas/translationsSchema";
import { useRecoilValue } from "recoil";

function EnrollmentDetailsComponent(props: any): React.ReactElement {
  const { enrollmentsData, existingAcademicYear, onSelectTei, programConfig } = props;
  const { columns: dataElements } = useEnrollmentsHeader({ programConfig });
  const { sectionName } = useGetSectionTypeLabel();
  const i18n = useRecoilValue(TranslationState) as any

  return (
    <div className={styles.details_container}>
      <div className={styles.details_header}>
        <div className={styles.details_header_title}>
          <h6 style={{ fontSize: 13 }}>{i18n.t("Enrollment History")}</h6>
        </div>
        <div className={styles.details_header_button}>
          {existingAcademicYear ?
            <i className={styles.enrolledAlertLabel}>
              {i18n.t('This {{section}} is already enrolled for this year.', {
                section: getSectionLabels(sectionName, i18n).singular,
              })}
            </i>
            :
            <Button {...{ small: true, success: "success", onClick: onSelectTei, label: i18n.t("New enrollment"), icon: <IconAddCircle16 /> }} />
          }
        </div>
      </div>
      <div className={styles.details_body}>

        {enrollmentsData.length ?
          enrollmentsData?.map((enrollment: any) => (
            <div className={styles.detailsCard}>
              {dataElements?.map((dataElement: any, key: number) => (
                <div className={styles.details_body_list} key={key}>
                  <label className={styles.detailsCardVariable}>{dataElement?.displayName}:</label>
                  <label className={styles.detailsCardLabel}> {enrollment[dataElement?.id]} </label>
                </div>
              ))}
            </div>
          )) : <span className="ml-1">{i18n.t("No enrollments found.")}</span>
        }
      </div>
    </div>

  )
}

export default EnrollmentDetailsComponent;

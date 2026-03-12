import { generateAttendanceDays } from "../../../../utils/attendance/generateAttendanceDays";
import { GenerateHeaders } from "../../../../types/bulk/bulkOperations";
import { Modules } from 'dhis2-semis-types';
import { dfHeaders } from "../../../../utils/constants/dfHeaders";
import { getFilterLables } from "../../../../utils/format/getFilterLables";
import { useRecoilValue } from "recoil";
import { TranslationState } from "../../../../schemas/translationsSchema";

export function generateHeaders(props: GenerateHeaders) {
    const {
        empty,
        module,
        programConfig,
        stagesToExport,
        sectionType,
        selectedSectionDataStore,
        withSocioEconomics,
        isSchoolDay
    } = props
    const { getValidDaysToExport } = generateAttendanceDays({ unavailableDays: isSchoolDay as unknown as (args: Date) => boolean })
    const i18n = useRecoilValue(TranslationState) as any

    function getHeaders(startDate: string, endDate: string) {
        let formatedHeaders: any[] = [], attributesToGenerate: Array<{ attributeID: string, pattern: string }> = []
        const Profile = (sectionType ?? '').substring(0, 1).toUpperCase() + (sectionType ?? '').substring(1, (sectionType ?? '').length) + ' profile'
        let defaultLockedHeaders: any = [...(module != Modules.Enrollment && module != Modules.Admission ? [Profile] : []), "Ids"], filters: any = {}, att = [];

        // Admission only uses TEI attributes — skip all stage headers
        if (module === Modules.Admission) {
            const studentIdentifierAttrId = (selectedSectionDataStore as any)?.admission?.studentIdentifier;

            // Build attribute list
            for (const x of programConfig?.programTrackedEntityAttributes || []) {
                if (x?.trackedEntityAttribute?.optionSet?.options?.length > 0) {
                    filters[x.trackedEntityAttribute.id] = getFilterLables(x.trackedEntityAttribute.optionSet.options);
                }
                if (x.trackedEntityAttribute.generated) {
                    // Skip the configured student identifier from auto-generation and locking
                    // so the user can fill it manually in the template. Empty values will be generated during import.
                    const isStudentIdentifier = x.trackedEntityAttribute.id === studentIdentifierAttrId;
                    if (!isStudentIdentifier) {
                        attributesToGenerate.push({ attributeID: x.trackedEntityAttribute.id, pattern: x.trackedEntityAttribute.pattern ?? '' });
                        defaultLockedHeaders.push(x.trackedEntityAttribute.id);
                    }
                }
                att.push({
                    header: `${x.trackedEntityAttribute.displayName}${x.mandatory && empty ? "*" : ""}`,
                    key: x.trackedEntityAttribute.id,
                    width: x.trackedEntityAttribute.displayName.length + 2,
                });
            }

            const admissionHeaders: any[] = [
                {
                    name: i18n.t('Basic Info'),
                    headers: [
                        { header: i18n.t('Ref'), key: 'ref', width: 5 },
                        { header: i18n.t('School'), key: 'school', width: 8 },
                    ],
                    fill: 'FCE5CD'
                },
                { name: Profile, headers: [...att], fill: 'D9EAD3' },
            ]

            if (!empty) {
                admissionHeaders.push({ name: "Ids", headers: dfHeaders })
            }

            defaultLockedHeaders.push(i18n.t('Basic Info'))

            return { formatedHeaders: admissionHeaders, filters, attributesToGenerate, defaultLockedHeaders }
        }

        const socioEconomicsStage = selectedSectionDataStore?.["socio-economics"]?.programStage
        const stageHeaders = [
            selectedSectionDataStore.registration.programStage,
            ...(((withSocioEconomics || module === Modules.Enrollment) && socioEconomicsStage) ? [socioEconomicsStage] : []),
            ...(module != Modules.Enrollment ? stagesToExport : [])
        ]
        const colors: Record<string, string> = {
            [selectedSectionDataStore.registration.programStage]: "FCE5CD",
        }
        if (socioEconomicsStage) {
            colors[socioEconomicsStage] = "FFFFC5"
        }

        const attendanceStageId = selectedSectionDataStore?.attendance?.programStage

        for (const stageId of stageHeaders) {
            const currStage = programConfig?.programStages?.find(x => x.id == stageId)

            if (attendanceStageId && stageId === attendanceStageId) {
                let section: any = {
                    name: currStage?.displayName,
                    headers: [
                        ...getValidDaysToExport(new Date(startDate as unknown as string), new Date(endDate as unknown as string)).map((day) => {
                            return {
                                header: day.date,
                                key: day.date,
                                disabled: !day.schoolDay,
                                width: day.date.length + 2,
                            }
                        })
                    ]
                }

                const statusDe = currStage?.programStageDataElements.find(
                    x => x.dataElement.id === selectedSectionDataStore?.attendance?.status
                )
                if (statusDe?.dataElement?.optionSet?.options) {
                    filters["Attendance"] = getFilterLables(statusDe.dataElement.optionSet.options)
                }

                formatedHeaders.push(section)
            } else {
                let schoolKey: any = []

                if (currStage?.id === selectedSectionDataStore.registration.programStage) {
                    defaultLockedHeaders.push(currStage?.displayName)
                    const defaultHeaders = [
                        {
                            header: i18n.t('Ref'),
                            key: 'ref',
                            width: 5,
                        },
                        {
                            header: i18n.t('School'),
                            key: 'school',
                            width: 8,
                        },
                        {
                            header: i18n.t('Enrollment_Date'),
                            key: 'enrollmentDate',
                            width: 14
                        }
                    ]

                    schoolKey = defaultHeaders
                }

                let section: any = {
                    name: currStage?.displayName,
                    headers: [...schoolKey],
                    fill: colors[(currStage as unknown as any)?.id]
                }

                currStage?.programStageDataElements.map((de) => {
                    if (de?.dataElement?.optionSet?.options?.length > 0) filters[de.dataElement.id] = getFilterLables(de.dataElement.optionSet.options)
                    section = {
                        ...section, headers: [...section.headers, {
                            header: `${de?.dataElement.displayName}${de?.compulsory && empty ? "*" : ""}`,
                            key: `${stageId}.${de?.dataElement?.id}`,
                            width: de?.dataElement?.displayName.length + 2
                        }]
                    }
                })

                if (currStage?.id === selectedSectionDataStore.registration.programStage)
                    formatedHeaders.unshift(section)
                else formatedHeaders.push(section)
            }
        }

        for (const x of programConfig?.programTrackedEntityAttributes || []) {
            if (x?.trackedEntityAttribute?.optionSet?.options?.length > 0) {
                filters[x.trackedEntityAttribute.id] = getFilterLables(x.trackedEntityAttribute.optionSet.options);
            }

            if (x.trackedEntityAttribute.generated) {
                attributesToGenerate.push({ attributeID: x.trackedEntityAttribute.id, pattern: x.trackedEntityAttribute.pattern ?? '' });
                (module == Modules.Enrollment || module == Modules.Admission) && defaultLockedHeaders.push(x.trackedEntityAttribute.id);
            }

            att.push({
                header: `${x.trackedEntityAttribute.displayName}${x.mandatory && empty ? "*" : ""}`,
                key: x.trackedEntityAttribute.id,
                width: x.trackedEntityAttribute.displayName.length + 2,
            });
        }


        formatedHeaders.splice(1, 0, {
            name: Profile, headers: [...(att || [])], fill: 'D9EAD3'
        });

        if (!empty)
            formatedHeaders.push({
                name: "Ids",
                headers: dfHeaders
            })

        return { formatedHeaders, filters, attributesToGenerate, defaultLockedHeaders }
    }

    return { getHeaders }
}
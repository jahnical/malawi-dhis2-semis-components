import { Modules } from 'dhis2-semis-types';
import { CustomAttributeProps, VariablesTypes } from 'dhis2-semis-types';
import { DataStoreProps } from '../../types/dataStore/DataStoreConfig';
import { formatStringToTitleCase } from 'dhis2-semis-functions';

export function exportFields(module: "attendance" | "final-result" | "enrollment" | "performance" | "admission", filters: DataStoreProps['filters']): any[] {

    const commonFields = [
        {
            "required": true,
            "name": "orgUnitName",
            "labelName": "School",
            "valueType": "TEXT" as unknown as CustomAttributeProps['valueType'],
            "disabled": true,
            "visible": true,
            "description": "label",
            "id": "label",
            "displayName": "label",
            "type": VariablesTypes.DataElement
        },
        {
            "required": true,
            "name": "academicYear",
            "labelName": "Academic Year",
            "valueType": "TEXT" as unknown as CustomAttributeProps['valueType'],
            "disabled": true,
            "visible": true,
            "description": "label",
            "id": "label",
            "displayName": "label",
            "type": VariablesTypes.DataElement
        },
    ]

    const emptyTemplateField = [
        {
            "required": true,
            "name": "rows",
            "labelName": "Number of Rows",
            "valueType": "NUMBER" as unknown as CustomAttributeProps['valueType'],
            "disabled": false,
            "visible": true,
            "description": "label",
            "id": "label",
            "displayName": "label",
            "type": VariablesTypes.DataElement
        }
    ]

    const attendanceFields = [
        ...(filters?.dataElements?.length > 0 ? filters?.dataElements?.map((de: any) => ({
            "required": true,
            "name": de?.ulrParam,
            "labelName": formatStringToTitleCase(de?.label),
            "valueType": "TEXT" as unknown as CustomAttributeProps['valueType'],
            "disabled": true,
            "visible": true,
            "id": "label",
            "displayName": formatStringToTitleCase(de?.label),
            "type": VariablesTypes.DataElement
        })) : []),
        {
            "required": true,
            "name": "dateRange",
            "labelName": "Date Range",
            "valueType": "DATE_RANGE" as unknown as CustomAttributeProps['valueType'],
            "disabled": false,
            "visible": true,
            "description": "label",
            "id": "label",
            "displayName": "label",
            "type": VariablesTypes.DataElement
        }
    ]

    switch (module) {
        case Modules.Attendance:
            return [...commonFields, ...attendanceFields]

        case Modules.Enrollment:
            return [...commonFields, ...emptyTemplateField]
    }

    return []
}
import React, { useState } from 'react'
import classNames from 'classnames';
import { RenderRowsProps } from '../../../types/table/TableContentProps';
import MobileRow from '../components/mobileRow/MobileRow';
import RowTable from '../components/row/RowTable';
import RowCell from '../components/row/RowCell';
import TableRowActions from '../components/rowsActions/TableRowActions';
import { getDisplayName } from '../../../utils/table/getDisplayNameByOption';
import { checkCanceled } from '../../../utils/table/checkCanceled';
import { checkOwnershipOu } from '../../../utils/table/checkCanceled';
import { Attribute } from '../../../types/generated/models';
import { formatKeyValueTypeHeader } from '../../../utils/common/formatKeyValueType';
import { GetImageUrl } from '../../../utils/table/getImageUrl';
import { IconButton, Tooltip } from '@mui/material';
import EnrollmentDetailsComponent from '../../../components/searchEnrollment/enrollmentDetailsComponent/EnrollmentDetailsComponent';
import { checkEnrolledAcademicYear } from '../../../utils/table/checkEnrolledAcademicYear';
import { Checkbox } from "@dhis2/ui"
import { useUrlParams } from 'dhis2-semis-functions';
import { useDataStoreKey } from '../../../hooks/dataStore/useDataStoreKey';
import { deepEqual } from '../../../utils/table/objectComparison';
import { VariablesTypes } from '../../../types/variables/AttributeColumns';
import { CropOriginal } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { breakpoints } from '../../../constants/breakpoints';
import { useRecoilValue } from 'recoil';
import { TranslationState } from '../../../schemas/translationsSchema';
import { useConfig } from '@dhis2/app-runtime';

export const useStyles = () => {
    const theme = useTheme();

    return {
        row: {
            width: '100%',
        },
        historyRow: {
            backgroundColor: '#FFFF',
        },
        dataRow: {
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: '#F1FBFF',
            },
        },
        dataRowCollapsed: {
            backgroundColor: '#F1FBFF',
        },
        cell: {
            whiteSpace: 'nowrap',
            padding: `${Number(theme.spacing(1)) / 2}px ${Number(theme.spacing(1)) * 7}px ${Number(theme.spacing(1)) / 2}px ${Number(theme.spacing(1)) * 3}px`,
            '&:last-child': {
                paddingRight: Number(theme.spacing(1)) * 3,
            },
            borderBottomColor: 'rgba(224, 224, 224, 1)',
            [breakpoints.down('md')]: {
                padding: `${Number(theme.spacing(1)) * 1}px`,
                '&:last-child': {
                    paddingRight: `${Number(theme.spacing(1)) * 1}px`,
                },
            },
            [breakpoints.down('md')]: {
                padding: `${Number(theme.spacing(1)) * 1}px`,
                '&:last-child': {
                    paddingRight: `${Number(theme.spacing(1)) * 1}px`,
                },
            },
        },
        bodyCell: {
            fontSize: theme.typography.pxToRem(12),
            color: theme.palette.text.primary,
            [breakpoints.down('md')]: {
                fontSize: theme.typography.pxToRem(11),
            },
            [breakpoints.down('md')]: {
                fontSize: theme.typography.pxToRem(10),
            },
        },
        actionsCell: {
            padding: `${Number(theme.spacing(1)) / 2}px ${Number(theme.spacing(1)) * 7}px ${Number(theme.spacing(1)) / 2}px ${Number(theme.spacing(1.25))}px`,
            [breakpoints.down('md')]: {
                padding: `${theme.spacing(1)}px`,
            },
            [breakpoints.down('md')]: {
                padding: `${theme.spacing(1)}px`,
            },
        },
    };
};


function RenderRows(props: RenderRowsProps): React.ReactElement {
    const config = useConfig()
    const classes = useStyles()
    const { imageUrl } = GetImageUrl()
    const { urlParameters } = useUrlParams()
    const { academicYear, sectionType, school } = urlParameters
    const { registration } = useDataStoreKey({ sectionType: sectionType as unknown as "student" | "staff" })
    const [showEnrollments, setShowEnrollments] = useState<string>()
    const { headerData, rowsData = [], pagination, searchActions, showRowIndex, loading, viewPortWidth, selectedOU, showRowActions, rowAction, displayType, programConfig, inactiveRowMessage, onRowClick, indeterminate, isCheckbox, onChange, selected, enableInactiveRowSelection, enrollmentCheckAcademicYear, ignoreOrgUnitForEnrollmentCheck = false } = props;
    const i18n = useRecoilValue(TranslationState) as any

    const isSelected = (row: any): boolean => selected?.find((item: any) => deepEqual(item, row));

    if (rowsData?.length === 0 && !loading) {
        return (
            <RowTable
                style={classes.row}
            >
                <RowCell
                    style={{ ...classes.cell, ...classes.bodyCell }}
                    colspan={headerData?.filter(x => x.visible)?.length as unknown as number + 1}
                >
                    {i18n.t('No data to display')}
                </RowCell>
            </RowTable>
        );
    }

    const renderRowCheckBox = ({ row, disabled }: { row: Record<string, any>, disabled: boolean }) => {
        return (
            <>
                {isCheckbox &&
                    <RowCell
                        style={{ ...classes.cell, ...classes.bodyCell }}
                    >
                        <Checkbox
                            disabled={disabled}
                            indeterminate={indeterminate}
                            checked={isSelected(row)}
                            onChange={() => onChange && onChange(row)}
                        />
                    </RowCell>
                }
            </>
        )
    }

    const renderRowAction = ({ row }: { row: Record<string, any> }) => {
        return (
            <>
                {
                    showRowActions &&
                    <RowCell
                        key={"actions"}
                        style={{ ...classes.cell, ...classes.bodyCell, ...classes.actionsCell }}
                    >
                        <TableRowActions
                            actions={
                                searchActions ? [{
                                    ...rowAction[0],
                                    onClick: () => setShowEnrollments(showEnrollments === row.trackedEntity ? "" : row.trackedEntity)
                                }] : rowAction
                            }
                            row={row}
                            disabled={checkCanceled(row.status) && !enableInactiveRowSelection}
                            loading={loading!}
                            displayType={displayType}
                        />
                    </RowCell>
                }
            </>
        )
    }

    const renderRowIndex = ({ index }: { index: number }) => {
        return (
            <>
                {showRowIndex &&
                    <RowCell
                        style={{ ...classes.cell, ...classes.bodyCell }}
                    >
                        {(pagination?.page - 1) * pagination?.pageSize + index + 1}
                    </RowCell>
                }
            </>
        )
    }



    return (
        <React.Fragment>
            {
                rowsData?.map((row, index) => (
                    <>
                        {viewPortWidth > 520 ?
                            <RowTable
                                key={index}
                                title={inactiveRowMessage}
                                inactive={checkCanceled(row.status)}
                                isOwnershipOu={checkOwnershipOu(row.ownershipOu, selectedOU)}
                                style={{ ...classes.row, ...classes.dataRow, ...((searchActions && showEnrollments) ? classes.dataRowCollapsed : {}) }}
                            >
                                {renderRowCheckBox({ row, disabled: (checkCanceled(row.status) && !enableInactiveRowSelection) || Boolean(row.disableSelection) })}
                                {renderRowIndex({ index })}
                                {
                                    headerData?.filter((x: any) => x.visible)?.map((column: any) => (
                                        <RowCell
                                            key={column.id}
                                            style={{ ...classes.cell, ...classes.bodyCell }}
                                            onClick={() => onRowClick ? onRowClick(row) : {}}
                                        >
                                            {
                                                column.type === VariablesTypes.Custom ? row[column.id] :
                                                    formatKeyValueTypeHeader(headerData)[column.id] === Attribute.valueType.IMAGE ?
                                                        <a href={imageUrl({ attribute: column.id, trackedEntity: row.trackedEntity, program: programConfig.id , apiVersion: config.apiVersion })} target='_blank'>
                                                            {row[column.id] &&
                                                                <Tooltip title={i18n.t("Click to open in new tab")} >
                                                                    <IconButton> <CropOriginal /></IconButton>
                                                                </Tooltip>
                                                            }
                                                        </a>
                                                        : <div>
                                                            {getDisplayName({ metaData: column.id, value: row[column.id], program: programConfig })}
                                                        </div>
                                            }
                                        </RowCell>
                                    ))
                                }
                                {renderRowAction({ row })}
                            </RowTable>
                            :
                            <MobileRow
                                rowData={row}
                                checkable={isCheckbox}
                                headerData={headerData}
                                showAction={showRowActions}
                                programConfig={programConfig}
                                helperText={inactiveRowMessage}
                                inactive={checkCanceled(row.status)}
                                rowIndex={renderRowIndex({ index })}
                                rowActions={renderRowAction({ row })}
                                checkBox={renderRowCheckBox({ row, disabled: checkCanceled(row.status) || Boolean(row.disableSelection) })}
                            />
                        }

                        {searchActions && showEnrollments === row.trackedEntity ?
                            <RowTable style={{ ...classes.row, ...classes.historyRow }}>
                                <RowCell
                                    style={{ ...classes.cell, ...classes.bodyCell }}
                                    colspan={headerData?.filter(x => x.visible)?.length as unknown as number + 1}
                                >
                                    <EnrollmentDetailsComponent programConfig={programConfig} existingAcademicYear={checkEnrolledAcademicYear
                                        (
                                            row?.registrationEvents,
                                            (enrollmentCheckAcademicYear ?? academicYear) as unknown as string,
                                            registration.academicYear,
                                            school!,
                                            sectionType!,
                                            ignoreOrgUnitForEnrollmentCheck
                                        )} onSelectTei={onRowClick ? () => onRowClick(row) : undefined} enrollmentsData={row.registrationEvents} />
                                </RowCell>
                            </RowTable>
                            : null
                        }
                    </>
                ))
            }
        </React.Fragment>
    )
}

export default RenderRows

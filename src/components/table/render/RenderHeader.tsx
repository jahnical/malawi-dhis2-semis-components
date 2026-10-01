import React from 'react'
import classNames from 'classnames';
import { RenderHeaderProps } from '../../../types/table/TableContentProps';
import { Checkbox } from "@dhis2/ui"
import SortLabel from '../components/sortLabel/SortLabel';
import HeaderCell from '../components/head/HeaderCell';
import RowTable from '../components/row/RowTable';
import { useTheme } from '@mui/material/styles';
import { breakpoints } from '../../../constants/breakpoints';
import { TranslationState } from '../../../schemas/translationsSchema';
import { useRecoilValue } from 'recoil';
import { getStickyOffsets, getStickyStyle } from '../../../utils/table/stickyColumns';

export const useStyles = () => {
    const theme = useTheme();

    return {
        row: {
            width: '100%',
        },
        cell: {
            whiteSpace: "nowrap",
            borderBottomColor: "rgba(224, 224, 224, 1)",
            [theme.breakpoints.down('md')]: {
                padding: `${theme.spacing(1)}`,
                '&:last-child': {
                    paddingRight: theme.spacing(1),
                },
                fontSize: '13px !important',
            },
        },
        headerCell: {
            fontSize: theme.typography.pxToRem(12),
            color: theme.palette.text.secondary,
            fontWeight: 500,
            [breakpoints.down('md')]: {
                fontSize: theme.typography.pxToRem(11),
            },
            [theme.breakpoints.down('sm')]: {
                fontSize: theme.typography.pxToRem(10),
            },
        },
        visuallyHidden: {
            border: 0,
            clip: 'rect(0 0 0 0)',
            height: 1,
            margin: -1,
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            top: 20,
            width: 1,
        },
    };
};


function RenderHeader(props: RenderHeaderProps): React.ReactElement {
    const { selectedAll, rowsHeader = [], showRowIndex, order, orderBy, createSortHandler, isCheckbox, checked, indeterminate, onChange, sortable, showRowActions, stickyColumnIds, showStickyDivider } = props
    const classes = useStyles()
    const i18n = useRecoilValue(TranslationState) as any

    const stickyOffsets = stickyColumnIds && stickyColumnIds.length > 0
        ? getStickyOffsets({ isCheckbox, showRowIndex, columns: rowsHeader, stickyColumnIds })
        : new Map()

    // Helper to get header text color with fallback
    const getHeaderColor = (column: any) => {
        // Option 1: column.color (if you store it directly)
        // Option 2: fallback to theme
        return column?.color || classes.headerCell.color; // this will be theme.palette.text.secondary
    };

    const headerCells = rowsHeader?.filter(x => x.visible)?.map((column) => {
        const headerColor = getHeaderColor(column);

        return (
            <HeaderCell
                key={column.id}
                style={{ ...classes.cell, ...classes.headerCell, color: headerColor, ...getStickyStyle(stickyOffsets, column.id, 2, showStickyDivider) }}
            >
                {
                    sortable && column.sortable !== false ?
                        <SortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : 'asc'}
                            createSortHandler={createSortHandler ? createSortHandler(column.id) : undefined}
                            className={classNames(classes.cell, classes.headerCell)}
                        >
                            {column.displayName}
                            {orderBy === column.id
                                ? (
                                    <span style={classes.visuallyHidden as React.CSSProperties}>
                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </span>
                                )
                                : null}
                        </SortLabel>
                        :
                        column.displayName
                }
            </HeaderCell>
        )
    })

    return (
        <thead>
            <RowTable
                style={classes.row}
            >
                {isCheckbox &&
                    <HeaderCell
                        style={{ ...classes.cell, ...classes.headerCell, ...getStickyStyle(stickyOffsets, 'checkbox', 2, showStickyDivider) }}
                    >
                        <Checkbox
                            indeterminate={indeterminate}
                            checked={selectedAll}
                            onChange={() => onChange && onChange({}, true)}
                        />
                    </HeaderCell>
                }
                {showRowIndex &&
                    <HeaderCell
                        style={{ ...classes.cell, ...classes.headerCell, ...getStickyStyle(stickyOffsets, 'rowIndex', 2, showStickyDivider) }}
                    >
                        <span>#</span>
                    </HeaderCell>
                }

                {headerCells}

                {showRowActions &&
                    <HeaderCell
                        style={{ ...classes.cell, ...classes.headerCell }}
                    >
                        <span>{i18n.t("Actions")}</span>
                    </HeaderCell>
                }
            </RowTable>
        </thead>
    )
}

export default RenderHeader

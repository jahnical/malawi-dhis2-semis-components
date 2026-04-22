import React, { useState } from 'react'
import { Center as CenteredContent, CircularLoader } from "@dhis2/ui";
import RenderHeader from './RenderHeader'
import WithBorder from '../../template/WithBorder';
import WithPadding from '../../template/WithPadding';
import TableComponent from '../components/table/TableComponent';
import Pagination from '../components/pagination/Pagination';
import "./style.css"
import RenderRows from './RenderRows';
import { TableRenderProps } from '../../../types/table/TableContentProps';
import HeaderFilters from '../components/head/HeaderFilters';
import { type CustomAttributeProps } from 'dhis2-semis-types'
import 'bootstrap/dist/css/bootstrap.min.css';
import "react-select/dist/react-select.css";
import { deepEqual } from '../../../utils/table/objectComparison';
import { checkCanceled } from '../../../utils/table/checkCanceled';
import { Paper } from '@mui/material';
import { breakpoints } from '../../../constants/breakpoints';
import TopPaginator from '../components/topPaginator/Pagination';

export const useStyles = () => {

    return {
        tableContainer: {
            overflowX: 'auto' as const,
        },
        workingListsContainer: {
            display: 'flex',
            padding: '0.6rem 0.5rem 0rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            [breakpoints.down('md')]: {
                alignItems: 'start',
                flexDirection: 'column',
            },
        },
        tablebuttons: {
            display: 'flex',
            flexWrap: 'wrap' as 'wrap',
            columnGap: '5px',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        h4: {
            margin: '10px 0px 10px 0px',
            fontSize: 'larger',
            fontWeight: '500',
            [breakpoints.down('md')]: {
                margin: '10px 8px',
            },
        },
        rowCounter: {
            fontSize: '0.75em',
            color: 'gray',
        },
    };
};


function Table(props: TableRenderProps): React.ReactElement {
    const {
        title = 'Table',
        viewPortWidth = 1040,
        showRowIndex = true,
        columns,
        loading = false,
        enableRowCounter = true,
        enableInactiveRowSelection = false,
        createSortHandler,
        order,
        orderBy,
        rowsPerPages,
        tableData,
        selectedOU,
        sortable = false,
        searchActions = false,
        showRowActions = false,
        rowAction = [],
        displayType,
        filterState,
        setFilterState,
        defaultFilterNumber,
        rightElements,
        programConfig,
        inactiveRowMessage,
        onRowClick,
        selectable,
        selected,
        setSelected,
        setPagination,
        pagination,
        showHeaderFilters = true,
        showWorkingListsContainer = true,
        paginate = true,
        beforeSettings,
        enrollmentCheckAcademicYear,
        ignoreOrgUnitForEnrollmentCheck,
    } = props

    const classes = useStyles()
    const [filteredHeaders, setFilteredHeaders] = useState<CustomAttributeProps[]>([])
    const filtered = enableInactiveRowSelection ? tableData : tableData.filter(x => !checkCanceled(x.status))
    const selectableFilteredRows = filtered.filter((x: any) => !x.disableSelection)

    const onPageChange = (newPage: number) => setPagination({ ...pagination, page: newPage })

    const onRowsPerPageChange = (event: any) => setPagination({ ...pagination, pageSize: parseInt(event.value, 10), page: 1 })

    const onCheckboxChange = (row: any, all?: boolean) => {
        if (all) {
            if (all && selectableFilteredRows.length === selected.length) setSelected([])
            else {
                setSelected([...selectableFilteredRows])
            }
        } else {
            if (row?.disableSelection) return

            const index = selected.findIndex((x: any) => deepEqual(x, row))

            if (index > -1) {
                let copy = [...selected]
                copy.splice(index, 1)
                setSelected(copy)
            } else {
                setSelected((prev: any) => ([...prev, row]))
            }
        }
    }

    return (
        <Paper>
            {showWorkingListsContainer && <div style={classes.workingListsContainer}>
                {
                    <h4 style={classes.h4}>{title}</h4>
                }
                <div style={classes.tablebuttons}>
                    {rightElements}
                </div>
            </div>}
            <WithBorder type='bottom' />
            <WithPadding>
                <WithBorder type='all'>
                    {showHeaderFilters && <HeaderFilters
                        columns={columns}
                        updateVariables={setFilteredHeaders}
                        filteredHeaders={filteredHeaders}
                        filterState={filterState}
                        setFilterState={setFilterState}
                        defaultFilterNumber={defaultFilterNumber}
                        selectable={selectable}
                        selected={selected?.length ?? 0}
                        beforeSettings={
                            <>
                                {beforeSettings}
                                {(enableRowCounter && !loading) ? <TopPaginator
                                    loading={loading}
                                    onPageChange={onPageChange}
                                    totalData={tableData.length}
                                    totalElements={pagination?.totalElements}
                                    onRowsPerPageChange={onRowsPerPageChange}
                                    page={pagination?.page}
                                    rowsPerPage={pagination?.pageSize}
                                    disablePreviousPage={pagination?.page === 1}
                                    disableNextPage={pagination?.page === pagination?.totalPages}
                                    rowsPerPages={rowsPerPages}
                                /> : null}
                            </>
                        }
                    />}
                    <div
                        style={classes.tableContainer}
                    >
                        <TableComponent>
                            <>
                                {
                                    viewPortWidth > 520 &&
                                    <RenderHeader
                                        showRowIndex={showRowIndex}
                                        createSortHandler={createSortHandler}
                                        order={order}
                                        indeterminate={selected?.length > 0 && selected.length != filtered?.length}
                                        orderBy={orderBy}
                                        rowsHeader={filteredHeaders.length > 0 ? filteredHeaders : columns}
                                        sortable={sortable}
                                        showRowActions={showRowActions}
                                        onChange={onCheckboxChange}
                                        isCheckbox={selectable}
                                        selectedAll={!loading && selectableFilteredRows?.length === selected?.length}
                                    />
                                }
                                {!loading && (
                                    <RenderRows
                                        pagination={pagination}
                                        showRowIndex={showRowIndex}
                                        headerData={filteredHeaders.length > 0 ? filteredHeaders : columns}
                                        rowsData={tableData}
                                        loading={loading}
                                        selectedOU={selectedOU}
                                        searchActions={searchActions}
                                        viewPortWidth={viewPortWidth}
                                        showRowActions={showRowActions}
                                        rowAction={rowAction}
                                        displayType={displayType}
                                        programConfig={programConfig}
                                        inactiveRowMessage={inactiveRowMessage}
                                        onRowClick={onRowClick}
                                        onChange={onCheckboxChange}
                                        selected={selected}
                                        isCheckbox={selectable}
                                        enableInactiveRowSelection={enableInactiveRowSelection}
                                        enrollmentCheckAcademicYear={enrollmentCheckAcademicYear}
                                        ignoreOrgUnitForEnrollmentCheck={ignoreOrgUnitForEnrollmentCheck}
                                    />
                                )}
                            </>
                        </TableComponent>
                        {(loading) ? (
                            <CenteredContent className="p-5">
                                <CircularLoader />
                            </CenteredContent>
                        ) : null}
                    </div>
                    {paginate && <Pagination
                        loading={loading}
                        onPageChange={onPageChange}
                        onRowsPerPageChange={onRowsPerPageChange}
                        page={pagination?.page}
                        rowsPerPage={pagination?.pageSize}
                        disablePreviousPage={pagination?.page === 1}
                        disableNextPage={pagination?.page === pagination?.totalPages}
                        rowsPerPages={rowsPerPages}
                    />}
                </WithBorder>
            </WithPadding>
        </Paper>
    )
}

export default Table

import { ReactElement } from "react"
import { type CustomAttributeProps } from 'dhis2-semis-types'
import { RowActionsType, TableRowActionsType } from "./TableRowActionsProps"
import { ProgramConfig } from "dhis2-semis-types"

interface TableProps {
    head: any
    footer: any
}

interface TableComponentProps {
    children?: React.ReactNode
    className?: string
}

interface HeaderCellProps {
    children?: React.ReactNode
    className?: string
    passOnProps?: object
    table?: TableProps
    colspan?: number
    onClick?: (args: any) => void
    style?: any
}

interface RowProps {
    children?: React.ReactNode
    className?: string
    passOnProps?: object
    table?: TableProps
    inactive?: boolean
    isOwnershipOu?: boolean
    title?: string
    disableHoverListener?: boolean
    tooltip?: boolean
    style?: any
}

interface RenderHeaderProps {
    rowsHeader?: CustomAttributeProps[]
    orderBy?: string
    showRowIndex?: boolean
    order?: "asc" | "desc"
    createSortHandler?: (property: string) => any
    loading?: boolean,
    isCheckbox?: boolean
    checked?: boolean
    indeterminate?: boolean
    onChange?: (selected: any, all?: boolean) => void
    sortable: boolean
    showRowActions?: boolean
    selectedAll?: boolean
}

interface RenderRowsProps {
    showRowIndex?: boolean
    headerData?: CustomAttributeProps[]
    rowsData: Record<string, any>[]
    searchActions?: boolean
    loading?: boolean
    viewPortWidth: number
    selectedOU?: string
    pagination?: { page: number, pageSize: number, totalPages: number }
    showRowActions?: boolean
    rowAction: RowActionsType[]
    displayType?: TableRowActionsType
    programConfig: ProgramConfig
    inactiveRowMessage?: string
    onRowClick?: (args: any) => void
    onChange?: (selected: any, all?: boolean) => void
    isCheckbox?: boolean
    indeterminate?: boolean
    selected?: any
    enableInactiveRowSelection?: boolean
    enrollmentCheckAcademicYear?: string
    ignoreOrgUnitForEnrollmentCheck?: boolean
}

interface MobileRowsProps {
    inactive?: boolean
    checkable?: boolean
    showAction?: boolean
    helperText?: string
    checkBox: ReactElement
    rowIndex: ReactElement
    headerData: CustomAttributeProps[]
    rowData: Record<string, any>
    loading?: boolean
    rowActions: ReactElement
    programConfig: ProgramConfig
    onRowClick?: (args: any) => void
    onChange?: (selected: any, all?: boolean) => void
}

interface EnrollmentDetailsComponentProps {
    enrollmentsData: any
    existingAcademicYear: boolean
    onSelectTei?: (arg: any) => void
}

interface TableSortProps {
    children?: React.ReactNode
    active: boolean
    direction?: 'asc' | 'desc'
    createSortHandler: (rowsPerPage: string) => void
    className?: string
}

interface TableRenderProps {
    title?: string,
    selectable?: boolean,
    enableRowCounter?: boolean,
    viewPortWidth?: number,
    selected?: any,
    setSelected?: (arg: any) => void,
    columns: any,
    loading?: boolean,
    createSortHandler?: (property: string) => (() => void) | void,
    order?: "asc" | "desc",
    orderBy?: any,
    rowsPerPages?: { value: number, label: string }[],
    tableData: Record<string, any>[]
    sortable?: boolean,
    selectedOU?: string,
    showRowIndex?: boolean
    searchActions?: any
    showRowActions?: boolean
    rowAction?: RowActionsType[]
    displayType?: TableRowActionsType
    defaultFilterNumber?: number
    filterState?: {
        dataElements: any[],
        attributes: any[]
    },
    setFilterState?: (args: {
        dataElements: any[],
        attributes: any[]
    }) => void,
    rightElements?: ReactElement
    beforeSettings?: ReactElement
    programConfig?: ProgramConfig
    inactiveRowMessage?: string
    onRowClick?: (teiData: any) => void
    setPagination?: (args: { page: number, pageSize: number, totalPages: number, totalElements: number }) => void
    pagination?: { page: number, pageSize: number, totalPages: number, totalElements: number }
    showHeaderFilters?: boolean
    showWorkingListsContainer?: boolean
    paginate?: boolean
    enableInactiveRowSelection?: boolean
    enrollmentCheckAcademicYear?: string
    ignoreOrgUnitForEnrollmentCheck?: boolean
}


type TableDataProps = Record<string, string>;


export type {
    TableRenderProps, TableComponentProps, HeaderCellProps,
    RowProps, RenderHeaderProps, RenderRowsProps, EnrollmentDetailsComponentProps,
    TableSortProps, TableDataProps, MobileRowsProps
}
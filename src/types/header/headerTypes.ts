import { ReactNode } from "react"

type PositionProps = "sticky" | "fixed"
type AlignProps = "right" | "left"

export interface OptionProps {
    value: string
    label: string
    icon?: ReactNode
}

export interface DynamicHeaderProps {
    label: string,
    ulrParam: string,
    placehoder?: string,
    isSeachable?: boolean,
    program?: string,
    options?: OptionProps[],
    dataElement?: string,
    loader?: boolean,
    position?: "LEFT" | "RIGHT"
}

export interface ExtendedDynamicHeaderProps extends DynamicHeaderProps {
    open: boolean,
    id: string,
}

export interface SemisHeaderProps {
    otherItems?: DynamicHeaderProps[]
    hideTree?: boolean,
    hideDataStoreFilters?: boolean,
    hideAcademicYear?: boolean,
    academicYearLabel?: string,
    academicYearDataElement?: string
}

export interface HeaderItemProps {
    label?: string
    value?: any
    valuePlaceholder?: string
    icon?: ReactNode
    withDropDown?: boolean
    customAction?: () => void
    searchInputPlaceholder?: string
    isSeachable?: boolean,
    options?: OptionProps[]
    onSelectOption?: () => void
    align?: AlignProps
}

export interface MainHeaderProps {
    height?: string
    width?: string
    padding?: string
    position?: PositionProps
    headerItems?: HeaderItemProps[]
    semisHeader?: SemisHeaderProps
}
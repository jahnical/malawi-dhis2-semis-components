type TableRowActionsType = "icon" | "menu"

interface TableRowActionsProps {
    /**
     * Selected row data.
     * @type {Record<string, any>}
     */
    row?: Record<string, any>
    /**
     * To disable the component when true. Must be true if the data are being loaded.
     * @type {boolean}
     */
    loading: boolean
    /**
     * To set all actions disabled.
     * @type {boolean}
     */
    disabled: boolean
    /**
     * An array of the required actions.
     * @type {RowActionsType[]}
     */
    actions: RowActionsType[]
    /**
     * To set the actions component display mode.
     * @type {?TableRowActionsType}
     */
    displayType?: TableRowActionsType
}

interface RowActionsType {
    /**
     * The action help text.
     * @type {string}
     */
    label: string
    /**
     * A color for the action icon.
     * @type {?string}
     */
    color?: string
    /**
     * To show a centered loader instead of the action when true.
     * @type {boolean}
     */
    loading: boolean
    /**
     * To set the action disabled. Can be static or computed from row data.
     * @type {boolean | ((row?: Record<string, any>) => boolean)}
     */
    disabled: boolean | ((row?: Record<string, any>) => boolean)
    /**
     * To define whether row inactivity affects the action.
     * @type {boolean}
     */
    disableOnInactive?: boolean
    /**
     * The action icon.
     * @type {React.ReactNode}
     */
    icon: React.ReactNode
    /**
     * The action event.
     * @type {(arg?: any) => void}
     */
    onClick: (args: { event?: any; row?: any }) => void
}

interface RowActionsProps {
    /**
     * Selected row data.
     * @type {Record<string, any>}
     */
    row?: Record<string, any>
    /**
     * Sets the whole component disabled if true.
     * @type {boolean}
     */
    disabled: boolean
    /**
     * An array of the required actions.
     * @type {RowActionsType[]}
     */
    actions: RowActionsType[]
}


export type { TableRowActionsProps, RowActionsType, RowActionsProps, TableRowActionsType }
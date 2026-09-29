export const border = {
    top: { style: 'thin', color: { argb: '9B9B9B' }, },
    left: { style: 'thin', color: { argb: '9B9B9B' } },
    bottom: { style: 'thin', color: { argb: '9B9B9B' } },
    right: { style: 'thin', color: { argb: '9B9B9B' } },
}

export const fill = {
    type: 'pattern',
    pattern: 'solid',
}

export const alignment = {
    horizontal: 'center',
    vertical: 'middle'
}

export const lock = {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: true,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: true,
    autoFilter: true,
    pivotTables: false,
    objects: false,
    scenarios: false
}

export const dataValidation = {
    type: 'list',
    allowBlank: true,
    // Counter-intuitively, the underlying OOXML attribute this maps to
    // *suppresses* the dropdown arrow when true. Omitting/false is what
    // actually shows the dropdown control in Excel.
    showDropDown: false,
    showErrorMessage: true,
    errorTitle: 'Invalid Entry',
    error: 'Please select a value from the list.',
    showInputMessage: true,
    promptTitle: 'Select a value',
    prompt: 'Choose one of the listed options.'
}

export const cancelled = {
    protection: { locked: true },
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f4cccc' }
    }
}
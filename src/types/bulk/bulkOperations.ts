import { selectedDataStoreKey, ProgramConfig } from 'dhis2-semis-types';
import { SchoolCalendar } from '../datePicker/CalendarTypes';

/**
 * Description placeholder
 *
 * @interface ExportData
 * @typedef {ExportData}
 */
/**
 * Description placeholder
 *
 * @interface ExportData
 * @typedef {ExportData}
 */
interface ExportData {
    /**
     * react-final-form Form instance
     */
    Form: any
    /**
    * Error handler
    */
    onError: (args: string) => void

    /**
     * Base url for dhis2 data provider
     */
    baseURL: string
    setProgress?: (args: any) => void
    /**
     * The label wich will appear do identify componet
     */
    label: string

    /**
     * Array of program stages id to export data
     * 
     * @type {string[]}
     */
    stagesToExport: string[]

    /**
     * The array of filters applied to the headers (class, grade & academic year)
     * 
     * dataElementId:operator:value
     *
     * @type {?string[]}
     */
    eventFilters: string[]

    /**
     * The data of the socio-economics stge is not mandatory, if you want this data 
     * 
     * in your exported file you must set this variable to true. 
     * 
     * This does not apply to the enrollment module. In the enrollment module, the 
     * 
     * values for this stage will always be exported
     *
     * @type {?boolean}
     */
    withSocioEconomics?: boolean

    /**
     * selected section type name
     *
     * @type {string}
     */
    sectionType: string

    /**
     * Depending on the module, the data is exported with a focus on just one programme stage,
     * 
     * so this variable is intended to receive the name of the section that will contain this data.
     *
     * @type {?string}
     */
    module: "attendance" | "final-result" | "enrollment" | "performance" | "admission",

    /**
     * Settings saved at data store
     *
     * @type {selectedDataStoreKey}
     */
    selectedSectionDataStore: selectedDataStoreKey

    /**
    * Program configurations
    *
    * @type {ProgramConfig}
    */
    programConfig: ProgramConfig

    /**
    * function tha chekcs if the given date is school day or no
    *
    * @type {function}
    */
    isSchoolDay?: (date: Date, config: SchoolCalendar) => boolean

    /**
     * Sometimes we may need a blank file to add new data, with just the structure and headers. 
     * 
     * So this variable is intended to tell us whether the file to be exported should be empty
     * 
     * or contain the events of the registered students.
     *
     * @type {?boolean}
     */
    empty?: boolean
}

interface GenerateHeaders {
    stagesToExport: string[]
    selectedSectionDataStore: selectedDataStoreKey
    withSocioEconomics: boolean
    programConfig: ProgramConfig
    sectionType: string
    isSchoolDay?: (date: Date) => boolean
    module: string
    empty: boolean
}

interface excelProps {
    headers: any[]
    rows: any[]
    filters: any
    fileName: string
    metadata: any[]
    module: string
    empty: boolean
    defaultLockedHeaders: string[]
}

interface excelData {
    excelData: {
        module: "attendance" | "final-result" | "enrollment" | "performance" | "admission",
        mapping: []
    }
}

export enum importStrategy {
    CREATE = "CREATE_AND_UPDATE",
    UPDATE = "UPDATE"
}

interface importData {
    /**
     * Error handler
     */
    onError: (args: string) => void

    /**
    * Base url for dhis2 data provider
    * 
    *  @type {string}
    */
    baseURL: string

    /**
    * The label wich will appear do identify componet
    * 
    *  @type {string}
    */
    label: string

    /**
   * The title of the import operation component.
   * 
   * @type {string}
   */
    title: string

    /**
    * this variable makes the system know that it will have to update
    * 
    * existing data using data in this file. 
    * 
    * it'll only work work enrollment module only
    * 
    *  @type {boolean}
    */
    updating?: boolean

    /**
     * Depending on the module, the data is exported with a focus on just one programme stage,
     * 
     * so this variable is intended to receive the name of the section that will contain this data.
     *
     * @type {string}
     */
    module: "attendance" | "final-result" | "enrollment" | "performance" | "admission"

    /**
     * The selected program definitions
     */
    programConfig: ProgramConfig

    /**
     * The selected section type
     */
    sectionType: string

    /**
     * Data store configuration for SEMIS
     */
    selectedSectionDataStore: selectedDataStoreKey

    onClose?: () => void
}

export type { ExportData, GenerateHeaders, excelProps, importData, excelData }
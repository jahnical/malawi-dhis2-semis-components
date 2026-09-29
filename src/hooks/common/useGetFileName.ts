import { getSectionLabels, useGetSectionTypeLabel, useUrlParams } from 'dhis2-semis-functions'
import { useDataStoreKey } from '../dataStore/useDataStoreKey'

export function useGetFileName() {
    const { useQuery } = useUrlParams()
    const { sectionName } = useGetSectionTypeLabel()
    const { filters } = useDataStoreKey({ sectionType: sectionName })

    function getFileName(module: string): string {
        // File names stay in English, so labels are used untranslated
        const { plural } = getSectionLabels(sectionName, { t: (key: string) => key })
        const capitalizedSectionName = plural.charAt(0).toUpperCase() + plural.slice(1)
        const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1)

        let name = `SEMIS - ${capitalizedSectionName} ${capitalizedModule}`
        for (const filter of filters?.dataElements ?? []) {
            // Filters are optional for some exports; leave unselected ones out of the name
            const value = useQuery.get(filter.code)
            if (value) name += ' - ' + value
        }

        return name
    }

    return { getFileName }
}
import { useRecoilValue } from "recoil"
import { type DataStoreFor, type SectionType } from 'dhis2-semis-types'
import { DataStoreState } from "../../schemas/dataStore"

export const useDataStoreKey = <S extends SectionType>({ sectionType }: { sectionType: S }): DataStoreFor<S> => {
    const dataStoreValues = useRecoilValue(DataStoreState)
    const dataStoreKeyValues = dataStoreValues?.find((dataStore) => dataStore.key === sectionType)
    return dataStoreKeyValues as DataStoreFor<S>
}

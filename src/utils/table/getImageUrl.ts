import { useConfig } from "@dhis2/app-service-config"
import { useTrackerApiVersion } from "dhis2-semis-functions"

export const GetImageUrl = () => {
    const { baseUrl } = useConfig()
    const apiVersion = useTrackerApiVersion()

    // /trackedEntityInstances was removed in 42; the tracker image endpoint exists from 41
    function imageUrl({ trackedEntity, attribute, program }: { attribute: string, trackedEntity: string, program?: string, apiVersion?: number }) {
        if (apiVersion < 41)
            return `${baseUrl}/api/trackedEntityInstances/${trackedEntity}/${attribute}/image?dimension=MEDIUM`

        return `${baseUrl}/api/tracker/trackedEntities/${trackedEntity}/attributes/${attribute}/image?${program ? `program=${program}&` : ""}dimension=MEDIUM`
    }

    return {
        imageUrl
    }
}

import { z } from "zod";

const attendanceStatusOptionSchema = z.object({
    code: z.string(),
    color: z.string().optional(),
    icon: z.string().optional(),
    key: z.string()
});

const attendanceSchema = z.object({
    absenceReason: z.string(),
    lastUpdate: z.string().optional(),
    programStage: z.string(),
    status: z.string(),
    statusOptions: z.array(attendanceStatusOptionSchema)
});

const defaultsSchema = z.object({
    allowSearching: z.boolean(),
    currentAcademicYear: z.string(),
    defaultOrder: z.string().optional()
});

const filterElementSchema = z.object({
    code: z.string(),
    dataElement: z.string(),
    order: z.number()
});

const filtersSchema = z.object({
    dataElements: z.array(filterElementSchema)
});

const finalResultSchema = z.object({
    programStage: z.string(),
    status: z.string()
});

const performanceSchema = z.object({
    programStages: z.array(z.object({
        programStage: z.string()
    }))
});

const registrationSchema = z.object({
    academicYear: z.string(),
    grade: z.string(),
    lastUpdate: z.string(),
    programStage: z.string(),
    section: z.string()
});

const socioEconomicsSchema = z.object({
    programStage: z.string()
});

const transferStatusOptionSchema = z.object({
    code: z.string(),
    key: z.string()
});

const transferSchema = z.object({
    destinySchool: z.string(),
    programStage: z.string(),
    status: z.string(),
    key: z.string().optional(),
    statusOptions: z.array(transferStatusOptionSchema)
});

const admissionSchema = z.object({
    enabled: z.boolean().optional()
});

export const studentDataStoreSchema = z.object({
    admission: admissionSchema.optional(),
    attendance: attendanceSchema,
    defaults: defaultsSchema,
    filters: filtersSchema,
    key: z.string(),
    "final-result": finalResultSchema.optional(),
    lastUpdate: z.string(),
    performance: performanceSchema.optional(),
    program: z.string(),
    registration: registrationSchema,
    "socio-economics": socioEconomicsSchema,
    trackedEntityType: z.string(),
    transfer: transferSchema
})
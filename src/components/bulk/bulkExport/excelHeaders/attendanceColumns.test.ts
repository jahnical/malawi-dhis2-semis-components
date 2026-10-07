import { attendanceProfileAttributes, attendanceRegistrationDataElements } from "./attendanceColumns"

const attr = (id: string, displayName: string, displayInList = false) => ({ displayInList, trackedEntityAttribute: { id, displayName } })
const attributes = [
    attr("SURN", "Surname", true), attr("FIRST", "First name", true), attr("DOB", "Date of birth"),
    attr("LIN", "LIN"), attr("GEN", "Gender"), attr("GUARD", "Guardian's Name"), attr("VIL", "Village"),
]
const dataStore = {
    admission: { studentIdentifier: "LIN" },
    registration: { academicYear: "AY", grade: "GR", section: "SEC", programStage: "REG" },
    filters: { dataElements: [{ dataElement: "GR" }, { dataElement: "SEC" }, { dataElement: "SHIFT" }] },
}

test("the attendance template keeps only the learner ID, names and gender, ID first", () => {
    expect(attendanceProfileAttributes(attributes, dataStore).map(x => x.trackedEntityAttribute.id)).toEqual(["LIN", "SURN", "FIRST", "GEN"])
})

test("the attendance template keeps the class-list registration fields only", () => {
    expect([...attendanceRegistrationDataElements(dataStore)].sort()).toEqual(["AY", "GR", "SEC", "SHIFT"])
})

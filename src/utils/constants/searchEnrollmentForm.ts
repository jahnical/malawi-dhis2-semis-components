import { format } from 'date-fns';
import { VariablesTypes, GroupFormProps } from 'dhis2-semis-types'

const staticForm = () => {
  return {
    registeringSchool: {
      required: false,
      name: "registeringSchool",
      labelName: "Registering School",
      valueType: "TEXT",
      options: undefined,
      disabled: true,
      pattern: "",
      visible: true,
      description: "Registering School",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "registeringSchool",
      displayName: "Registering School",
      header: "Registering School",
      type: VariablesTypes.DataElement,
      assignedValue: undefined
    },
    enrollmentDate: {
      required: true,
      name: "enrollment_date",
      labelName: "Enrollment date",
      valueType: "DATE",
      options: undefined,
      disabled: false,
      pattern: "",
      visible: true,
      description: "Enrollment date",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "enrollment_date",
      displayName: "Enrollment date",
      header: "Enrollment date",
      type: VariablesTypes.DataElement,
      assignedValue: format(new Date(), "yyyy-MM-dd")
    },
    numberOfStudents: {
      required: false,
      name: "studentsNumber",
      labelName: "Number of Learners",
      valueType: "NUMBER",
      options: undefined,
      disabled: false,
      pattern: "",
      visible: true,
      description: "Number of Learners",
      searchable: false,
      error: false,
      programStage: "",
      content: "",
      id: "studentsNumber",
      displayName: "Number of Learners",
      header: "Number of Learners",
      type: VariablesTypes.DataElement,
      assignedValue: undefined,
      placeholder: "Maximum number of learners supported for each file: 1000"
    }
  }
}

function formFields(variablesData: any[], sectionName: string): GroupFormProps[] {

  return [
    {
      storyBook: false,
      name: "",
      description: "",
      fields: variablesData
    }
  ];
}

export { formFields, staticForm };

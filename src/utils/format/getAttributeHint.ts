interface GetAttributeHintProps {
    valueType?: string
    mandatory?: boolean
    generated?: boolean
    unique?: boolean
    hasOptionSet?: boolean
    isAutoFillExempt?: boolean
}

/**
 * Builds a short, human-readable hint describing how a column should be
 * filled in, based on the tracked entity attribute's valueType. Used to
 * populate cell notes / input prompts on bulk import templates so users
 * don't have to guess the expected format.
 */
export function getAttributeHint({ valueType, mandatory, generated, unique, hasOptionSet, isAutoFillExempt }: GetAttributeHintProps): string | undefined {
    let hint: string | undefined

    if (hasOptionSet) {
        hint = 'Select a value from the dropdown list.'
    } else if (generated && isAutoFillExempt) {
        hint = 'Leave empty to auto-generate a value, or enter your own.'
    } else {
        switch (valueType) {
            case 'DATE':
                hint = 'Enter a date in the format YYYY-MM-DD.'
                break
            case 'DATETIME':
                hint = 'Enter a date and time in the format YYYY-MM-DDTHH:mm.'
                break
            case 'TIME':
                hint = 'Enter a time in the format HH:mm.'
                break
            case 'BOOLEAN':
                hint = 'Select TRUE or FALSE from the dropdown list.'
                break
            case 'TRUE_ONLY':
                hint = 'Enter true if applicable, or leave blank.'
                break
            case 'PHONE_NUMBER':
                hint = 'Enter a valid phone number (digits only).'
                break
            case 'EMAIL':
                hint = 'Enter a valid email address, e.g. name@example.com.'
                break
            case 'NUMBER':
                hint = 'Enter a numeric value, e.g. 12.5.'
                break
            case 'INTEGER':
                hint = 'Enter a whole number, e.g. 12.'
                break
            case 'INTEGER_POSITIVE':
                hint = 'Enter a whole number greater than 0.'
                break
            case 'INTEGER_NEGATIVE':
                hint = 'Enter a whole number less than 0.'
                break
            case 'INTEGER_ZERO_OR_POSITIVE':
                hint = 'Enter a whole number of 0 or greater.'
                break
            case 'PERCENTAGE':
                hint = 'Enter a percentage value between 0 and 100.'
                break
            case 'UNIT_INTERVAL':
                hint = 'Enter a decimal value between 0 and 1.'
                break
            case 'AGE':
                hint = 'Enter a date of birth in the format YYYY-MM-DD.'
                break
            case 'URL':
                hint = 'Enter a valid web address, e.g. https://example.com.'
                break
            case 'USERNAME':
                hint = 'Enter a username with no spaces.'
                break
            case 'LONG_TEXT':
                hint = 'Enter a detailed text value.'
                break
            default:
                if (unique) hint = 'Must be a unique value.'
        }
    }

    if (!hint) return mandatory ? 'This field is required.' : undefined

    return mandatory ? `${hint} Required.` : hint
}

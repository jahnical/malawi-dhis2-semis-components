function extractAcademicYearTokens(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    const matches = String(value).match(/\d{4}/g);
    return matches ?? [];
}

function matchesAcademicYearValue(eventAcademicYearValue: unknown, selectedAcademicYear: unknown): boolean {
    if (eventAcademicYearValue === undefined || eventAcademicYearValue === null) return false;
    if (selectedAcademicYear === undefined || selectedAcademicYear === null) return false;

    const eventValue = String(eventAcademicYearValue).trim();
    const selectedValue = String(selectedAcademicYear).trim();

    if (!eventValue || !selectedValue) return false;
    if (eventValue === selectedValue) return true;

    const eventTokens = extractAcademicYearTokens(eventValue);
    const selectedTokens = extractAcademicYearTokens(selectedValue);

    if (!eventTokens.length || !selectedTokens.length) return false;

    return eventTokens.some((token) => selectedTokens.includes(token));
}

export function checkEnrolledAcademicYear(
    registrationEvents: any[],
    selectedAcademicYear: string,
    academicYearId: string,
    selectedSchool: string,
    sectionType: string,
    ignoreOrgUnitForEnrollmentCheck: boolean = false
): boolean {
    const events = registrationEvents ?? [];

    if (!events.length || !selectedAcademicYear || !academicYearId) {
        return false;
    }

    const sameYearEvents = events.filter((event: any) =>
        matchesAcademicYearValue(event?.[academicYearId], selectedAcademicYear)
    );

    if (!sameYearEvents.length) {
        return false;
    }

    if (sectionType === 'staff' && !ignoreOrgUnitForEnrollmentCheck) {
        return sameYearEvents.some((event: any) => event?.orgUnitId === selectedSchool);
    }

    return true;
}
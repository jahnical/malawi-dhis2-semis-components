import React, { useState } from 'react';
import { Field } from 'react-final-form';
import { Popover, Paper, Button, TextField } from '@mui/material';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { TranslationState } from '../../../../schemas/translationsSchema';
import { useRecoilValue } from 'recoil';
import { calendarForAcademicYear, useUrlParams } from 'dhis2-semis-functions';
import { useSchoolCalendarKey } from '../../../../hooks/dataStore/useSchoolCalendarKey';
import { calendarBounds } from '../../../calendar/calendarRange';

interface DateRangePickerProps {
    name: string;
    disabled?: boolean;
    setChanged?: any
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ name, disabled, setChanged }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [open, setOpen] = useState(false);
    const i18n = useRecoilValue(TranslationState) as any
    // With nothing chosen yet, the picker opens on the academic year selected in the header
    // (its first day up to its last day, or today for the current year), not on today's date
    const schoolCalendar = useSchoolCalendarKey()
    const { urlParameters } = useUrlParams()
    const yearCalendar = calendarForAcademicYear(schoolCalendar?.schoolCalendar as any[], urlParameters?.academicYear as string, schoolCalendar?.defaults?.academicYear) as any
    const bounds = calendarBounds(yearCalendar)

    return (
        <Field name={name}>
            {({ input }) => {
                const selected = input.value || {};
                const value = [
                    {
                        startDate: selected.startDate || bounds.min || new Date(),
                        endDate: selected.endDate || bounds.max || new Date(),
                        key: 'selection',
                    },
                ];

                return (
                    <div>
                        <TextField
                            disabled={disabled}
                            style={{ width: '100%' }}
                            value={
                                selected.startDate && selected.endDate
                                    ? `${format(selected.startDate, 'MMMM d, yyyy')} - ${format(selected.endDate, 'MMMM d, yyyy')}`
                                    : ''
                            }
                            size="small"
                            onClick={(event: React.MouseEvent<HTMLElement>) => {
                                setAnchorEl(event.currentTarget);
                                setOpen(true);
                            }}
                        />

                        <Popover
                            open={open}
                            anchorEl={anchorEl}
                            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                            onClose={() => setOpen(false)}
                        >
                            <Paper>
                                <DateRange
                                    editableDateInputs={true}
                                    moveRangeOnFirstSelection={false}
                                    ranges={value}
                                    direction="horizontal"
                                    months={2}
                                    onChange={(ranges: any) => {
                                        input.onChange({
                                            startDate: ranges.selection.startDate,
                                            endDate: ranges.selection.endDate,
                                        });
                                    }}
                                />
                            </Paper>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
                                <Button onClick={() => setOpen(false)} color="primary">
                                    {i18n.t('CANCEL')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        input.onChange({
                                            startDate: value[0].startDate,
                                            endDate: value[0].endDate,
                                        });
                                        setOpen(false);
                                        setChanged(true)
                                    }}
                                    color="primary"
                                >
                                    OK
                                </Button>
                            </div>
                        </Popover>
                    </div>
                );
            }}
        </Field>
    );
};

export default DateRangePicker;

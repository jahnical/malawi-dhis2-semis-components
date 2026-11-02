import { useEffect, useState } from 'react'
import { initialCalendarDate } from './calendarRange';
import Calendar from './Calendar';
import { format } from 'date-fns';
import style from './datepicker.module.css'
import { DropDownCalendarProps } from '../../types/datePicker/CalendarTypes';
import { Button as Dhis2Btn } from "@dhis2/ui";
import { Button, Paper, Popover, Typography } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { TranslationState } from '../../schemas/translationsSchema';

export default function DropDownCalendar(props: DropDownCalendarProps) {
    const { setValue, dateDisabler, label, icon, value, config } = props
    // Open on the academic year selected in the header (its config), not on today's date
    const opening = () => ({ selectedDate: initialCalendarDate(config, dateDisabler as any, (value as any)?.selectedDate) })
    const [localDateSelected, setlocalDateSelected] = useState<{ selectedDate: Date }>(opening)
    useEffect(() => { setlocalDateSelected(opening()) }, [config?.academicYear?.startDate, config?.academicYear?.endDate])
    const [anchorCalendar, setAnchorCalendat] = useState<null | HTMLElement>(null);
    const [open, setOpen] = useState<boolean>(false);
    const i18n = useRecoilValue(TranslationState) as any

    const closeAnchor = () => {
        setAnchorCalendat(null);
        setOpen(false);
    };

    return (
        <>
            <span onClick={(event: any) => { setlocalDateSelected(opening()); setAnchorCalendat(event.currentTarget), setOpen(true) }}>
                <Dhis2Btn
                    icon={icon}
                >
                    {label}
                </Dhis2Btn>
            </span>

            <Popover
                open={open}
                anchorEl={anchorCalendar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Paper>
                    <div className={style.datepickerTypography}>
                        <Typography variant="overline">{i18n.t("SELECT DATE")}</Typography>
                        <Typography variant="h4" className="mt-2">{format(new Date(localDateSelected.selectedDate), "E, MMM dd - YYY")}</Typography>
                    </div>
                    <Calendar config={config} dateDisabler={dateDisabler} setValue={setlocalDateSelected} value={localDateSelected} />
                    <div className={style.datepickerButtons}>
                        <Button onClick={() => { closeAnchor() }} color="primary" className="mb-2">{i18n.t("CANCEL")}</Button>
                        <Button disabled={dateDisabler && dateDisabler(localDateSelected.selectedDate, config)} onClick={() => {
                            setValue(localDateSelected);
                            closeAnchor();
                        }} color="primary" className="mb-2">{i18n.t("OK")}</Button>
                    </div>
                </Paper>
            </Popover>
        </>
    )
}

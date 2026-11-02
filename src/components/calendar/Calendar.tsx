import { DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { CalendarProps } from '../../types/datePicker/CalendarTypes';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { calendarBounds } from './calendarRange';

export default function Calendar(props: CalendarProps) {
  const { value, setValue, dateDisabler, config } = props
  // Only the selected academic year can be shown and picked (and nothing after today)
  const { min, max } = calendarBounds(config)

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateCalendar
        value={value.selectedDate}
        minDate={min}
        maxDate={max}
        onChange={(e: any) => { setValue({ selectedDate: e as Date }) }}
        shouldDisableDate={(date: any) => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const isFuture = date > today
          const isDisabledByCustomLogic = dateDisabler && dateDisabler(date, config)
          return isFuture || isDisabledByCustomLogic
        }}
      />
    </LocalizationProvider>
  );
}

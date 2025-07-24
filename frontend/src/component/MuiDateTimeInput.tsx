import * as React from 'react';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

export default function MuiDateTimeInput({
  value,
  onChange,
  minDateTime,
  maxDateTime,
}: {
  value?: Date | null,
  onChange?: (date: Date | null) => void,
  minDateTime?: Date | null,
  maxDateTime?: Date | null,
}) {
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(value ? dayjs(value) : dayjs());

  const handleChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    onChange && onChange(date ? date.toDate() : null);
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale="vi"
      localeText={{
        cancelButtonLabel: 'Hủy',
        okButtonLabel: 'Chọn',
      }}
    >
      <DateTimePicker
        value={selectedDate}
        onChange={handleChange}
        ampm={false}
        slotProps={{ textField: { fullWidth: true } }}
        minDateTime={minDateTime ? dayjs(minDateTime) : undefined}
        maxDateTime={maxDateTime ? dayjs(maxDateTime) : undefined}
      />
    </LocalizationProvider>
  );
} 
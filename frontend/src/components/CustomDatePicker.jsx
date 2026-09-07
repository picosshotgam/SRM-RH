import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale/fr';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('fr', fr);

export default function CustomDatePicker({
  value,
  onChange,
  min,
  max,
  required = false,
  className = "form-input",
  placeholder = "jj/mm/yyyy",
  id,
  style,
  disabled = false
}) {
  // Convert 'yyyy-MM-dd' string to Date object
  const parseDate = (str) => {
    if (!str) return null;
    const parts = String(str).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  // Convert Date object to 'yyyy-MM-dd' string
  const formatDateString = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDate = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const handleChange = (date) => {
    const formattedStr = formatDateString(date);
    if (onChange) {
      onChange({
        target: {
          value: formattedStr,
          name: id,
          id: id
        }
      });
    }
  };

  return (
    <DatePicker
      id={id}
      selected={selectedDate}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      locale="fr"
      minDate={minDate}
      maxDate={maxDate}
      required={required}
      disabled={disabled}
      className={className}
      placeholderText={placeholder || "jj/mm/yyyy"}
      autoComplete="off"
      style={style}
      wrapperClassName="custom-datepicker-wrapper"
    />
  );
}

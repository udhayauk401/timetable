export default function DayColumn({ day, habitId, date, isDateCompleted, onToggle }) {
  if (!date) return <td className="empty-day-cell"></td>;

  const isCompleted = isDateCompleted(habitId, date);

  return (
    <td className="day-cell">
      <label className="day-checkbox-wrapper">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggle(habitId, date)}
          className="habit-checkbox"
        />
        <span className="day-checkbox-mark">{isCompleted ? '✔' : '☐'}</span>
      </label>
    </td>
  );
}

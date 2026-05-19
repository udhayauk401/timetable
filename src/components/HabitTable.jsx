import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import DayColumn from './DayColumn';
import '../styles/HabitTable.css';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

export default function HabitTable({ habits, onDeleteHabit }) {
  const [attendance, setAttendance] = useState({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(
    Array.from({ length: 12 }, (_, i) => i) // All months selected by default
  );

  useEffect(() => {
    loadYearlyData();
  }, [currentYear, habits]);

  const loadYearlyData = async () => {
    if (habits.length === 0) return;

    setLoading(true);
    try {
      const attendanceMap = {};

      // Load all 12 months for the current year
      for (const habit of habits) {
        const allRecords = [];
        for (let month = 1; month <= 12; month++) {
          const response = await attendanceAPI.getByMonth(habit._id, currentYear, month);
          if (response.success) {
            allRecords.push(...(response.records || []));
          }
        }
        attendanceMap[habit._id] = allRecords;
      }

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckbox = async (habitId, date) => {
    try {
      const records = attendance[habitId] || [];
      const record = records.find(r => new Date(r.date).toDateString() === date.toDateString());
      const completed = record ? !record.completed : true;

      const response = await attendanceAPI.toggle(habitId, date.toISOString().split('T')[0], completed);

      if (response.success) {
        // Update local state
        const updatedRecords = records.filter(r => new Date(r.date).toDateString() !== date.toDateString());
        updatedRecords.push(response.record);
        
        setAttendance(prev => ({
          ...prev,
          [habitId]: updatedRecords
        }));
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const getMonthDays = (monthIndex) => {
    const year = currentYear;
    const month = monthIndex;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let date = 1; date <= lastDay; date++) {
      days.push(new Date(year, month, date));
    }

    return days;
  };

  const isDateCompleted = (habitId, date) => {
    if (!date) return false;
    const records = attendance[habitId] || [];
    const record = records.find(r => new Date(r.date).toDateString() === date.toDateString());
    return record?.completed || false;
  };

  const calculateMonthPercentage = (monthIndex) => {
    const days = getMonthDays(monthIndex);
    let totalCompleted = 0;
    let totalDays = 0;

    habits.forEach(habit => {
      days.forEach(date => {
        if (date) {
          totalDays++;
          if (isDateCompleted(habit._id, date)) {
            totalCompleted++;
          }
        }
      });
    });

    return totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0;
  };

  const toggleMonth = (monthIndex) => {
    if (selectedMonths.includes(monthIndex)) {
      setSelectedMonths(selectedMonths.filter(m => m !== monthIndex));
    } else {
      setSelectedMonths([...selectedMonths, monthIndex].sort());
    }
  };

  const selectAllMonths = () => {
    setSelectedMonths(Array.from({ length: 12 }, (_, i) => i));
  };

  const clearAllMonths = () => {
    setSelectedMonths([]);
  };

  if (loading && habits.length > 0) {
    return <div className="loading">Loading attendance data...</div>;
  }

  return (
    <div className="habit-table-container">
      <div className="year-navigation">
        <button onClick={() => setCurrentYear(currentYear - 1)}>
          ← Prev Year
        </button>
        <h2>Year {currentYear}</h2>
        <button onClick={() => setCurrentYear(currentYear + 1)}>
          Next Year →
        </button>
      </div>

      {/* Month Filter Selector */}
      <div className="month-filter-section">
        <div className="filter-header">
          <h3>Select Months to Display</h3>
          <div className="filter-buttons">
            <button onClick={selectAllMonths} className="filter-btn select-all">
              Select All
            </button>
            <button onClick={clearAllMonths} className="filter-btn clear-all">
              Clear All
            </button>
          </div>
        </div>
        <div className="month-selector">
          {MONTH_NAMES.map((name, monthIndex) => (
            <label key={monthIndex} className="month-checkbox">
              <input
                type="checkbox"
                checked={selectedMonths.includes(monthIndex)}
                onChange={() => toggleMonth(monthIndex)}
              />
              <span className={`month-label ${selectedMonths.includes(monthIndex) ? 'active' : ''}`}>
                {name.slice(0, 3)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Render only selected months */}
      {selectedMonths.length === 0 ? (
        <div className="no-months-message">
          <p>Please select at least one month to display.</p>
        </div>
      ) : (
        Array.from({ length: 12 }, (_, monthIndex) => monthIndex).filter(monthIndex => 
          selectedMonths.includes(monthIndex)
        ).map((monthIndex) => {
          const monthDays = getMonthDays(monthIndex);
          const monthPercentage = calculateMonthPercentage(monthIndex);
          const isFit = monthPercentage >= 70;

          return (
            <div key={`month-${monthIndex}`} className="month-table-section">
              <div className="month-title">
                <h3>{MONTH_NAMES[monthIndex]} {currentYear}</h3>
                <div className="month-stats">
                  <span className={`month-percentage ${isFit ? 'fit' : 'unfit'}`}>
                    {monthPercentage}% - {isFit ? '✅ FIT' : '❌ UNFIT'}
                  </span>
                </div>
              </div>

              <div className="month-table-wrapper">
                <table className="month-table">
                  <thead>
                    <tr>
                      <th className="habit-name-col">My Habits</th>
                      {monthDays.map((date) => (
                        <th key={`day-${date.getDate()}`} className="day-header">
                          <div className="day-number">{date.getDate()}</div>
                          <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((habit) => (
                      <tr key={habit._id} className="habit-row">
                        <td className="habit-name">
                          <span>{habit.name}</span>
                          <button onClick={() => onDeleteHabit(habit._id)} className="delete-btn">
                            ✕
                          </button>
                        </td>
                        {monthDays.map((date) => (
                          <DayColumn
                            key={`${habit._id}-${date.getDate()}`}
                            day={date.getDate()}
                            habitId={habit._id}
                            date={date}
                            isDateCompleted={isDateCompleted}
                            onToggle={toggleCheckbox}
                          />
                        ))}
                      </tr>
                    ))}

                    {/* Daily Percentage Row */}
                    <tr className="stats-row daily-row">
                      <td className="stats-label">Daily %</td>
                      {monthDays.map((date) => {
                        let checked = 0;
                        habits.forEach(habit => {
                          if (isDateCompleted(habit._id, date)) {
                            checked++;
                          }
                        });
                        const percentage = habits.length > 0 ? Math.round((checked / habits.length) * 100) : 0;
                        return (
                          <td key={`daily-${date.getDate()}`} className="stats-cell">
                            <span className="daily-percent">{percentage}%</span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

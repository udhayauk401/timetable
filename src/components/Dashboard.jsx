import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitsAPI } from '../services/api';
import HabitTable from './HabitTable';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadHabits();
  }, [navigate]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      console.log('Loading habits...');
      const response = await habitsAPI.getHabits();
      console.log('Habits response:', response);
      if (response.success) {
        setHabits(response.habits || []);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error loading habits:', err);
      setError(err.message);
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (newHabit.trim()) {
      try {
        const response = await habitsAPI.createHabit({ name: newHabit });
        if (response.success) {
          setHabits([...habits, response.habit]);
          setNewHabit('');
          setShowForm(false);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      const response = await habitsAPI.deleteHabit(habitId);
      if (response.success) {
        setHabits(habits.filter(h => h._id !== habitId));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📅 Daily Routine Tracker</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {habits.length === 0 ? (
        <div className="create-timetable">
          <h2>Create Your Timetable</h2>
          <p>Add your daily habits to get started!</p>
        </div>
      ) : (
        <HabitTable habits={habits} onDeleteHabit={deleteHabit} />
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="add-habit-section">
        {showForm ? (
          <div className="add-habit-form">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Enter habit name"
              autoFocus
            />
            <button onClick={addHabit} className="add-btn">
              Add Habit
            </button>
            <button onClick={() => setShowForm(false)} className="cancel-btn">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="add-habit-btn">
            + Add Habit
          </button>
        )}
      </div>
    </div>
  );
}

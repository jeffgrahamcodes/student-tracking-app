import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Paper,
} from '@mui/material';

const StudentCheckIn = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [destination, setDestination] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, 'students'));
    setStudents(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const isRestrictedTime = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const dayMinutes = hours * 60 + minutes;

    const restrictedTimes = [
      { start: 9 * 60 + 30, end: 9 * 60 + 40 }, // Period 1 First 10 Min
      { start: 10 * 60 + 30, end: 10 * 60 + 40 }, // Period 2 First 10 Min
      { start: 11 * 60 + 30, end: 11 * 60 + 40 }, // Period 3 First 10 Min
      { start: 12 * 60 + 30, end: 12 * 60 + 40 }, // Period 4 First 10 Min
      { start: 14 * 60 + 20, end: 14 * 60 + 30 }, // Period 5 First 10 Min
      { start: 15 * 60 + 25, end: 15 * 60 + 35 }, // Period 6 First 10 Min
    ];

    return restrictedTimes.some(
      ({ start, end }) => dayMinutes >= start && dayMinutes < end
    );
  };

  const isRestroomAllowed = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const dayMinutes = hours * 60 + minutes;

    const restroomTimes = [
      { start: 9 * 60 + 40, end: 10 * 60 + 10 }, // Period 1 Restroom Window
      { start: 10 * 60 + 35, end: 11 * 60 + 20 }, // Period 2 Restroom Window
      { start: 12 * 60 + 5, end: 12 * 60 + 50 }, // Period 3 Restroom Window
      { start: 13 * 60 + 20, end: 14 * 60 + 5 }, // Period 4 Restroom Window
      { start: 14 * 60 + 30, end: 15 * 60 }, // Period 5 Restroom Window
      { start: 15 * 60 + 25, end: 16 * 60 }, // Period 6 Restroom Window
    ];

    return restroomTimes.some(
      ({ start, end }) => dayMinutes >= start && dayMinutes < end
    );
  };

  const handleCheckOut = async () => {
    if (!selectedStudent || !destination) {
      alert('Select a student and destination');
      return;
    }

    if (isRestrictedTime()) {
      alert(
        'Hall passes are not allowed during the first and last 10 minutes of class.'
      );
      return;
    }

    if (destination === 'Restroom' && !isRestroomAllowed()) {
      alert('Restrooms are only available at specific times.');
      return;
    }

    await addDoc(collection(db, 'exit_records'), {
      student_id: selectedStudent,
      destination,
      exit_time: serverTimestamp(),
    });

    alert('Student checked out successfully!');
    setSelectedStudent('');
    setDestination('');
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}
    >
      <Typography variant="h5" gutterBottom>
        Student Check-In
      </Typography>

      <TextField
        select
        label="Select Student"
        fullWidth
        value={selectedStudent}
        onChange={(e) => setSelectedStudent(e.target.value)}
        margin="normal"
      >
        {students.map((student) => (
          <MenuItem key={student.id} value={student.id}>
            {student.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Select Destination"
        fullWidth
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        margin="normal"
      >
        <MenuItem value="Restroom">Restroom</MenuItem>
        <MenuItem value="Counseling Office">
          Counseling Office
        </MenuItem>
        <MenuItem value="Nurse">Nurse</MenuItem>
        <MenuItem value="Office">Office</MenuItem>
      </TextField>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleCheckOut}
        sx={{ mt: 2 }}
      >
        Check Out
      </Button>
    </Paper>
  );
};

export default StudentCheckIn;

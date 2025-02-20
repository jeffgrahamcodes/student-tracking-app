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

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, 'students'));
    setStudents(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const handleCheckOut = async () => {
    if (!selectedStudent || !destination)
      return alert('Select a student and destination');

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
        <MenuItem value="Bathroom">Bathroom</MenuItem>
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

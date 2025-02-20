import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';

const StudentCheckIn = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [destination, setDestination] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // "error" or "success"

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, 'students'));
    setStudents(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const getCheckInCountToday = async (studentId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const checkOutQuery = query(
      collection(db, 'exit_records'),
      where('student_id', '==', studentId),
      where('exit_time', '>=', today)
    );

    const checkOutSnapshot = await getDocs(checkOutQuery);
    return checkOutSnapshot.size;
  };

  const isRestrictedTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const restrictedTimes = [
      { start: 9 * 60, end: 9 * 60 + 10 }, // Period 1 First 10 Minutes
      { start: 10 * 60 + 50, end: 11 * 60 }, // Period 1 Last 10 Minutes
      { start: 11 * 60, end: 11 * 60 + 10 }, // Period 2 First 10 Minutes
      { start: 12 * 60 + 50, end: 13 * 60 }, // Period 2 Last 10 Minutes
    ];

    return restrictedTimes.some(
      ({ start, end }) => totalMinutes >= start && totalMinutes < end
    );
  };

  const handleCheckOut = async () => {
    if (!selectedStudent || !destination) {
      showAlert(
        '⚠️ Please select a student and destination.',
        'error'
      );
      return;
    }

    if (isRestrictedTime()) {
      showAlert(
        '🚨 You cannot check out during the first or last 10 minutes of class.',
        'error'
      );
      return;
    }

    const checkInCount = await getCheckInCountToday(selectedStudent);
    if (checkInCount >= 3) {
      showAlert(
        '🚨 STUDENT LIMIT REACHED 🚨\n\nThis student has already checked out 3 times today. No further checkouts allowed.',
        'error'
      );
      return;
    }

    await addDoc(collection(db, 'exit_records'), {
      student_id: selectedStudent,
      destination,
      exit_time: serverTimestamp(),
    });

    showAlert('✅ Student checked out successfully!', 'success');
    setSelectedStudent('');
    setDestination('');
  };

  const showAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
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

      {/* Full-Screen Alert Dialog with Dynamic Background */}
      <Dialog open={alertOpen} fullScreen>
        <DialogContent
          sx={{
            backgroundColor:
              alertType === 'error' ? '#d32f2f' : '#2e7d32', // Red for errors, Green for success
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 4 }}>
            {alertMessage}
          </Typography>
          <DialogActions>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#ffffff',
                color: alertType === 'error' ? '#d32f2f' : '#2e7d32',
                fontSize: 20,
              }}
              onClick={() => setAlertOpen(false)}
            >
              OK
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default StudentCheckIn;

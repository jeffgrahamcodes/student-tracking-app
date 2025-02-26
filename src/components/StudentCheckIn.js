import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  MenuItem,
  TextField,
  Typography,
  Paper,
} from '@mui/material';

const StudentCheckIn = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [destination, setDestination] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [period, setPeriod] = useState('');
  const [periods, setPeriods] = useState([]); // Stores periods available for the teacher

  useEffect(() => {
    fetchTeacherDetails();
  }, []);

  const fetchTeacherDetails = async () => {
    if (!auth.currentUser) return;

    const teacherRef = collection(db, 'user_roles');
    const q = query(
      teacherRef,
      where('email', '==', auth.currentUser.email)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const teacherData = querySnapshot.docs[0].data();
      setCurrentTeacher(teacherData.name);
      fetchPeriods(teacherData.name);
    }
  };

  const fetchPeriods = async (teacherName) => {
    const studentsRef = collection(db, 'student_schedules');
    const q = query(studentsRef, where('teacher', '==', teacherName));
    const querySnapshot = await getDocs(q);

    // Extract unique period values
    const periodSet = new Set(); // Use a Set to prevent duplicates

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      periodSet.add(
        JSON.stringify(formatPeriod(data.period, data.meet_days))
      ); // Store unique stringified period objects
    });

    const uniquePeriods = Array.from(periodSet).map((item) =>
      JSON.parse(item)
    ); // Convert back to array of objects

    setPeriods(uniquePeriods);
  };

  const formatPeriod = (period, meet_days) => {
    let label = `Period ${period}`;
    if (meet_days === 12) label += ' (Core)';
    else if (meet_days === 1) label += ' (A)';
    else if (meet_days === 2) label += ' (B)';
    return { period, label };
  };

  const fetchStudents = async () => {
    if (!currentTeacher || !period) return;

    const studentsRef = collection(db, 'student_schedules');
    const q = query(
      studentsRef,
      where('teacher', '==', currentTeacher),
      where('period', '==', period) // ✅ Using correct field name
    );

    const querySnapshot = await getDocs(q);
    const studentList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setStudents(studentList);
  };

  useEffect(() => {
    fetchStudents();
  }, [currentTeacher, period]);

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}
    >
      <Typography variant="h5" gutterBottom>
        Student Check-In
      </Typography>

      {/* Period Dropdown */}
      <TextField
        select
        label="Select Period"
        fullWidth
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        margin="normal"
      >
        {periods.map((p, index) => (
          <MenuItem key={index} value={p.period}>
            {p.label}
          </MenuItem>
        ))}
      </TextField>

      {/* Student Dropdown */}
      <TextField
        select
        label="Select Student"
        fullWidth
        value={selectedStudent}
        onChange={(e) => setSelectedStudent(e.target.value)}
        margin="normal"
        disabled={!period} // Disable until a period is selected
      >
        {students.map((student) => (
          <MenuItem key={student.id} value={student.id}>
            {student.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Destination Dropdown */}
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
    </Paper>
  );
};

export default StudentCheckIn;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from '@mui/material';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const StudentCheckIn = ({ impersonateUser }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [destination, setDestination] = useState('');
  const [period, setPeriod] = useState('');
  const [alert, setAlert] = useState('');
  const [periods, setPeriods] = useState([]);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState('');

  const destinations = [
    'Bathroom',
    'Water Fountain',
    'Nurse',
    'Office',
    'Locker',
    'Guidance Counselor',
  ];

  useEffect(() => {
    fetchTeacherDetails();
  }, [impersonateUser]);

  const fetchTeacherDetails = async () => {
    if (!auth.currentUser) return;

    const teacherRef = collection(db, 'user_roles');
    const q = query(
      teacherRef,
      where('email', '==', impersonateUser || auth.currentUser.email),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const teacherData = querySnapshot.docs[0].data();
      setCurrentTeacher(teacherData.name);
      setTeacherEmail(teacherData.email);
      fetchPeriods(teacherData.email);
    }
  };

  const fetchPeriods = async (email) => {
    const studentsRef = collection(db, 'student_schedules');
    const q = query(studentsRef, where('teacher_email', '==', email));
    const querySnapshot = await getDocs(q);

    const periodSet = new Set();

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      periodSet.add(JSON.stringify(formatPeriod(data.period, data.meet_days)));
    });

    const uniqueSortedPeriods = Array.from(periodSet)
      .map((item) => JSON.parse(item))
      .sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;

        const priority = { A: 1, B: 2 };
        const labelA = a.label.includes('(A)')
          ? 'A'
          : a.label.includes('(B)')
          ? 'B'
          : '';
        const labelB = b.label.includes('(A)')
          ? 'A'
          : b.label.includes('(B)')
          ? 'B'
          : '';

        return (priority[labelA] || 0) - (priority[labelB] || 0);
      });

    setPeriods(uniqueSortedPeriods);
  };

  const formatPeriod = (period, meet_days) => {
    let label = `Period ${period}`;
    if (meet_days === 1) label += ' (A)';
    else if (meet_days === 2) label += ' (B)';
    // meet_days === 12 will just show "Period X" — no label
    return { period, label };
  };

  const fetchStudents = async () => {
    if (!period) return;

    const studentsRef = collection(db, 'student_schedules');
    const q = query(
      studentsRef,
      where('teacher_email', '==', impersonateUser || auth.currentUser.email),
      where('period', '==', Number(period)),
    );
    const querySnapshot = await getDocs(q);

    const studentList = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        student_id: data.student_id,
        name: data.name,
      };
    });

    setStudents(studentList);
  };

  useEffect(() => {
    if (period) {
      fetchStudents();
    }
  }, [period]);

  const handleSubmit = async () => {
    if (!selectedStudent || !destination) {
      setAlert('Please select both a student and a destination.');
      return;
    }

    try {
      // Check how many times the student has left today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'exit_records'),
        where('student_id', '==', selectedStudent),
        where('exit_time', '>=', serverTimestamp(today)),
      );

      const snapshot = await getDocs(q);
      const exitCount = snapshot.size;

      if (exitCount >= 3) {
        setAlert('⚠️ This student has already used 3 hall passes today.');
        return;
      }

      await addDoc(collection(db, 'exit_records'), {
        student_id: selectedStudent,
        destination,
        teacher: currentTeacher,
        exit_time: serverTimestamp(),
      });

      setAlert('✅ Hall pass recorded!');
      setSelectedStudent('');
      setDestination('');
    } catch (error) {
      console.error('Error recording hall pass:', error);
      setAlert('An error occurred. Please try again.');
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 3 }}>
      <Typography variant='h5' gutterBottom>
        Hall Pass Check-In
      </Typography>

      {alert && (
        <Alert
          severity={alert.startsWith('✅') ? 'success' : 'warning'}
          sx={{ my: 2 }}
        >
          {alert}
        </Alert>
      )}

      <FormControl sx={{ minWidth: 200, m: 1 }}>
        <InputLabel>Period</InputLabel>
        <Select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          label='Period'
        >
          {periods.map((p) => (
            <MenuItem key={p.label} value={p.period}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200, m: 1 }}>
        <InputLabel>Student</InputLabel>
        <Select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          label='Student'
        >
          {students.map((s) => (
            <MenuItem key={s.student_id} value={s.student_id}>
              {s.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200, m: 1 }}>
        <InputLabel>Destination</InputLabel>
        <Select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          label='Destination'
        >
          {destinations.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Button variant='contained' onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default StudentCheckIn;

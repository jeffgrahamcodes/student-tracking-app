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
  const [currentTeacher, setCurrentTeacher] = useState('');

  const destinations = [
    'Bathroom',
    'Nurse',
    'Office',
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
      where('email', '==', impersonateUser || auth.currentUser.email)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const teacherData = querySnapshot.docs[0].data();
      setCurrentTeacher(teacherData.name);
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
      periodSet.add(
        JSON.stringify(formatPeriod(data.period, data.meet_days))
      );
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
    return { period, label };
  };

  const fetchStudents = async () => {
    if (!period) return;

    const studentsRef = collection(db, 'student_schedules');
    const q = query(
      studentsRef,
      where(
        'teacher_email',
        '==',
        impersonateUser || auth.currentUser.email
      ),
      where('period', '==', Number(period))
    );
    const querySnapshot = await getDocs(q);

    const studentList = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        student_id: String(data.student_id),
        name: data.name,
      };
    });

    // ✅ Remove duplicate student_ids
    const uniqueStudentsMap = new Map();
    studentList.forEach((student) => {
      uniqueStudentsMap.set(student.student_id, student);
    });
    const uniqueStudents = Array.from(uniqueStudentsMap.values());

    // ✅ Sort by second word in name
    const sortedBySecondName = uniqueStudents.sort((a, b) => {
      const secondA = a.name.split(' ')[1]?.toLowerCase() || '';
      const secondB = b.name.split(' ')[1]?.toLowerCase() || '';
      return secondA.localeCompare(secondB);
    });

    setStudents(sortedBySecondName);
  };

  useEffect(() => {
    if (period) {
      fetchStudents();
    }
  }, [period]);

  const handleSubmit = async () => {
    if (!selectedStudent || !destination) {
      setAlert('Please select both a student and a destination.');
      setTimeout(() => setAlert(''), 10000);
      return;
    }

    try {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const oneHourAgo = new Date();
      oneHourAgo.setHours(now.getHours() - 1);

      // Check how many hall passes were used today
      const dailyQuery = query(
        collection(db, 'exit_records'),
        where('student_id', '==', selectedStudent),
        where('exit_time', '>=', today)
      );
      const dailySnapshot = await getDocs(dailyQuery);
      const exitCount = dailySnapshot.size;

      if (exitCount >= 3) {
        setAlert(
          '⚠️ This student has already used 3 hall passes today.'
        );
        setTimeout(() => setAlert(''), 10000);
        return;
      }

      // Check if a hall pass was used within the last hour
      const hourQuery = query(
        collection(db, 'exit_records'),
        where('student_id', '==', selectedStudent),
        where('exit_time', '>=', oneHourAgo)
      );
      const hourSnapshot = await getDocs(hourQuery);

      if (!hourSnapshot.empty) {
        setAlert(
          '⚠️ This student has already used a hall pass in the last hour.'
        );
        setTimeout(() => setAlert(''), 10000);
        return;
      }

      // All checks passed — record the pass
      await addDoc(collection(db, 'exit_records'), {
        student_id: selectedStudent,
        destination,
        teacher: currentTeacher,
        exit_time: serverTimestamp(),
      });

      setAlert('✅ Hall pass recorded!');
      setTimeout(() => setAlert(''), 10000);
      setSelectedStudent('');
      setDestination('');
    } catch (error) {
      console.error('Error recording hall pass:', error);
      setAlert('An error occurred. Please try again.');
      setTimeout(() => setAlert(''), 10000);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 3 }}>
      <Typography variant="h5" gutterBottom>
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
          label="Period"
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
          onChange={(e) => setSelectedStudent(String(e.target.value))} // ✅ ensure string
          label="Student"
        >
          {students.map((s) => (
            <MenuItem key={s.student_id} value={String(s.student_id)}>
              {' '}
              {/* ✅ ensure string */}
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
          label="Destination"
        >
          {destinations.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default StudentCheckIn;

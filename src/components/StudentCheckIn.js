// StudentCheckIn.js

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
  const [classId, setClassId] = useState('');
  const [alert, setAlert] = useState('');
  const [classes, setClasses] = useState([]);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState('');
  const [destinations, setDestinations] = useState([]);

  // Fetch teacher and class info
  useEffect(() => {
    fetchTeacherDetails();
    fetchDestinations();
  }, [impersonateUser]);

  const fetchTeacherDetails = async () => {
    if (!auth.currentUser) return;

    const teacherRef = collection(db, 'teachers');
    const q = query(
      teacherRef,
      where('email', '==', impersonateUser || auth.currentUser.email)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const teacherData = querySnapshot.docs[0].data();
      setCurrentTeacher(teacherData.name);
      setTeacherEmail(teacherData.email);
      fetchClasses(teacherData.teacher_id);
    }
  };

  const fetchClasses = async (teacherId) => {
    const classRef = collection(db, 'classes');
    const q = query(classRef, where('teacher_id', '==', teacherId));
    const querySnapshot = await getDocs(q);

    const classList = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.class_id,
        label: data.class_name || `Class ${data.class_id}`,
      };
    });

    setClasses(classList);
  };

  const fetchDestinations = async () => {
    const destRef = collection(db, 'destinations');
    const snapshot = await getDocs(destRef);
    const destList = snapshot.docs.map((doc) => doc.data().name);
    setDestinations(destList);
  };

  const fetchStudents = async () => {
    if (!classId) return;

    try {
      const studentClassRef = collection(db, 'student_classes');
      const q = query(
        studentClassRef,
        where('class_id', '==', classId)
      );
      const snapshot = await getDocs(q);

      const studentIds = snapshot.docs.map(
        (doc) => doc.data().student_id
      );
      console.log(
        'Matched student_ids from student_classes:',
        studentIds
      );

      if (studentIds.length === 0) {
        console.warn('No students found for this class');
        setStudents([]);
        return;
      }

      const studentsRef = collection(db, 'students');
      const studentsSnap = await getDocs(studentsRef);

      const filteredStudents = studentsSnap.docs
        .map((doc) => ({ ...doc.data(), docId: doc.id }))
        .filter(
          (student) =>
            student.active &&
            studentIds.includes(student.student_id) &&
            student.school_id === 'SAMPLE-SCHOOL'
        )
        .map((student) => ({
          student_id: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
        }));

      console.log(
        'Filtered students for dropdown:',
        filteredStudents
      );

      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  const handleSubmit = async () => {
    if (!selectedStudent || !destination) {
      setAlert('Please select both a student and a destination.');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'exit_records'),
        where('student_id', '==', selectedStudent),
        where('exit_time', '>=', today)
      );

      const snapshot = await getDocs(q);
      const exitCount = snapshot.size;

      if (exitCount >= 3) {
        setAlert(
          '⚠️ This student has already used 3 hall passes today.'
        );
        return;
      }

      await addDoc(collection(db, 'exit_records'), {
        student_id: selectedStudent,
        class_id: classId,
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
        <InputLabel>Class</InputLabel>
        <Select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          label="Class"
        >
          {classes.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200, m: 1 }}>
        <InputLabel>Student</InputLabel>
        <Select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          label="Student"
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

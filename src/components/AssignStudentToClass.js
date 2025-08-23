// AssignStudentToClass.js

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
} from '@mui/material';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';

const AssignStudentToClass = ({ impersonateUser }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [alert, setAlert] = useState('');

  useEffect(() => {
    fetchData();
  }, [impersonateUser]);

  const fetchData = async () => {
    const email = impersonateUser || auth.currentUser.email;

    // Get teacher ID
    const teacherQuery = query(
      collection(db, 'teachers'),
      where('email', '==', email)
    );
    const teacherSnapshot = await getDocs(teacherQuery);
    if (teacherSnapshot.empty) return;
    const teacher = teacherSnapshot.docs[0].data();

    // Get teacher's classes
    const classQuery = query(
      collection(db, 'classes'),
      where('teacher_id', '==', teacher.teacher_id)
    );
    const classSnapshot = await getDocs(classQuery);
    const classList = classSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setClasses(classList);

    // Get students from the same school
    const studentQuery = query(
      collection(db, 'students'),
      where('school_id', '==', teacher.school_id),
      where('active', '==', true)
    );
    const studentSnapshot = await getDocs(studentQuery);
    const studentList = studentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setStudents(studentList);
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedStudent) {
      setAlert('❌ Please select both class and student.');
      return;
    }

    try {
      await addDoc(collection(db, 'student_classes'), {
        student_id: selectedStudent,
        class_id: selectedClass,
        school_id: 'SAMPLE-SCHOOL', // Ideally dynamically set this
      });
      setAlert('✅ Student assigned to class!');
      setSelectedClass('');
      setSelectedStudent('');
    } catch (err) {
      console.error(err);
      setAlert('❌ Failed to assign student. Try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Assign Student to Class
      </Typography>

      {alert && (
        <Alert
          severity={alert.startsWith('✅') ? 'success' : 'error'}
          sx={{ my: 2 }}
        >
          {alert}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Class</InputLabel>
        <Select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          label="Class"
        >
          {classes.map((cls) => (
            <MenuItem key={cls.class_id} value={cls.class_id}>
              {cls.class_name || cls.class_id}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Student</InputLabel>
        <Select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          label="Student"
        >
          {students.map((stu) => (
            <MenuItem key={stu.student_id} value={stu.student_id}>
              {stu.first_name} {stu.last_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" fullWidth onClick={handleSubmit}>
        Assign
      </Button>
    </Box>
  );
};

export default AssignStudentToClass;

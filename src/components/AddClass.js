// AddClass.js

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

const AddClass = ({ impersonateUser }) => {
  const [form, setForm] = useState({ class_name: '' });
  const [alert, setAlert] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    fetchTeacherInfo();
  }, [impersonateUser]);

  const fetchTeacherInfo = async () => {
    const q = query(
      collection(db, 'teachers'),
      where('email', '==', impersonateUser || auth.currentUser.email)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const teacher = snapshot.docs[0].data();
      setTeacherId(teacher.teacher_id);
      setSchoolId(teacher.school_id);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const { class_name } = form;

    if (!class_name) {
      setAlert('Please fill out all fields.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        class_name,
        teacher_id: teacherId,
        school_id: schoolId,
      });

      // Automatically set class_id field to Firestore doc ID
      await updateDoc(docRef, { class_id: docRef.id });

      setAlert('✅ Class successfully added!');
      setForm({ class_name: '' });
    } catch (error) {
      console.error(error);
      setAlert('❌ Failed to add class. Try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Add a New Class
      </Typography>

      {alert && (
        <Alert
          severity={alert.startsWith('✅') ? 'success' : 'error'}
          sx={{ my: 2 }}
        >
          {alert}
        </Alert>
      )}

      <TextField
        label="Class Name"
        name="class_name"
        fullWidth
        margin="normal"
        value={form.class_name}
        onChange={handleChange}
      />

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </Box>
  );
};

export default AddClass;

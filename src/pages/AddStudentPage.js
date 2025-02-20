import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Container,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AddStudentPage = () => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !studentId) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'students'), {
        name,
        student_id: studentId,
      });
      alert('Student added successfully!');
      setName('');
      setStudentId('');
      navigate('/'); // Redirect back to home after adding
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <Container
      sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, width: 400, textAlign: 'center' }}
      >
        <Typography variant="h5" gutterBottom>
          Add Student
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Student Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Student ID"
            fullWidth
            margin="normal"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: '#1e3a5f',
              color: '#f8e9d2',
              '&:hover': { backgroundColor: '#162d4c' },
            }}
          >
            Add Student
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddStudentPage;

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import {
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Box,
} from '@mui/material';

const EditStudent = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [escortRequired, setEscortRequired] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchStudents();
    setCurrentUser(auth.currentUser);
    checkAdmin();
  }, []);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, 'students'));
    setStudents(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const checkAdmin = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'user_roles', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().role === 'admin') {
      setIsAdmin(true);
    }
  };

  const handleStudentSelect = async (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (studentDoc.exists()) {
      setEscortRequired(studentDoc.data().escort_required || false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedStudent) return;
    await updateDoc(doc(db, 'students', selectedStudent), {
      escort_required: escortRequired,
    });
    alert('Student record updated successfully!');
  };

  if (!isAdmin) {
    return (
      <Typography
        variant="h5"
        color="error"
        textAlign="center"
        mt={4}
      >
        ❌ Access Denied: Only admins can edit student details.
      </Typography>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}
    >
      <Typography variant="h5" gutterBottom>
        Edit Student
      </Typography>

      <TextField
        select
        label="Select Student"
        fullWidth
        value={selectedStudent}
        onChange={handleStudentSelect}
        margin="normal"
      >
        {students.map((student) => (
          <MenuItem key={student.id} value={student.id}>
            {student.name}
          </MenuItem>
        ))}
      </TextField>

      {selectedStudent && (
        <>
          <FormControlLabel
            control={
              <Checkbox
                checked={escortRequired}
                onChange={(e) => setEscortRequired(e.target.checked)}
              />
            }
            label="Requires Escort"
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleUpdate}
            sx={{ mt: 2 }}
          >
            Save Changes
          </Button>
        </>
      )}
    </Paper>
  );
};

export default EditStudent;

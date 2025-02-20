import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
  const [escortRequired, setEscortRequired] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // "error" or "success"
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchStudents();
    setCurrentUser(auth.currentUser); // Get logged-in user
  }, []);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, 'students'));
    setStudents(
      querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  const getStudentDetails = async (studentId) => {
    if (!studentId) return null;
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    return studentDoc.exists() ? studentDoc.data() : null;
  };

  const handlePasswordConfirm = async () => {
    if (!currentUser || !password) {
      showAlert(
        '⚠️ Please enter your password to release the student.',
        'error'
      );
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        currentUser.email,
        password
      );
      setPasswordModalOpen(false);
      setPassword('');
      proceedWithCheckOut();
    } catch (error) {
      showAlert('🚨 Incorrect password. Access denied.', 'error');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedStudent || !destination) {
      showAlert(
        '⚠️ Please select a student and destination.',
        'error'
      );
      return;
    }

    const studentDetails = await getStudentDetails(selectedStudent);
    if (studentDetails?.escort_required) {
      setPasswordModalOpen(true); // Open full-screen password confirmation modal
      return;
    }

    proceedWithCheckOut();
  };

  const proceedWithCheckOut = async () => {
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
        onChange={async (e) => {
          const studentId = e.target.value;
          setSelectedStudent(studentId);
          const studentDetails = await getStudentDetails(studentId);
          setEscortRequired(studentDetails?.escort_required || false);
        }}
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

      {/* Full-Screen Password Confirmation Modal */}
      <Dialog open={passwordModalOpen} fullScreen>
        <DialogContent
          sx={{
            backgroundColor: '#1e3a5f',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
            🔒 Escort Required: Enter Password
          </Typography>
          <TextField
            type="password"
            label="Enter Password"
            variant="outlined"
            fullWidth
            sx={{
              maxWidth: 300,
              mb: 4,
              backgroundColor: '#ffffff',
              borderRadius: '5px',
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <DialogActions sx={{ flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                fontSize: 18,
                width: '200px',
              }}
              onClick={handlePasswordConfirm}
            >
              Confirm
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#d32f2f',
                color: '#ffffff',
                fontSize: 18,
                width: '200px',
              }}
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Alert Dialog */}
      <Dialog open={alertOpen} fullScreen>
        <DialogContent
          sx={{
            backgroundColor:
              alertType === 'error' ? '#d32f2f' : '#2e7d32',
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

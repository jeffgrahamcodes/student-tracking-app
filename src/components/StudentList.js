import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
} from '@mui/material';

const StudentList = () => {
  const [exitRecords, setExitRecords] = useState([]);

  useEffect(() => {
    // Firestore real-time listener
    const unsubscribe = onSnapshot(
      collection(db, 'exit_records'),
      (snapshot) => {
        const exitData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          duration: calculateDuration(doc.data().exit_time), // Initialize duration
        }));

        // Fetch student names and map to exit records
        const fetchStudents = async () => {
          const studentSnapshot = await onSnapshot(
            collection(db, 'students'),
            (studentSnap) => {
              const studentData = studentSnap.docs.reduce(
                (acc, doc) => {
                  acc[doc.id] = doc.data().name;
                  return acc;
                },
                {}
              );

              const updatedExitRecords = exitData
                .filter((record) => !record.return_time) // Show only students who haven't returned
                .map((record) => ({
                  ...record,
                  studentName:
                    studentData[record.student_id] ||
                    'Unknown Student',
                }));

              setExitRecords(updatedExitRecords);
            }
          );
          return fetchStudents;
        };

        fetchStudents();
      }
    );

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, []);

  const calculateDuration = (exitTime) => {
    if (!exitTime) return 'Just left';
    const exitDate = exitTime.toDate();
    const now = new Date();
    const diff = Math.floor((now - exitDate) / 1000); // Get time difference in seconds

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleReturn = async (recordId) => {
    try {
      const recordRef = doc(db, 'exit_records', recordId);
      await updateDoc(recordRef, {
        return_time: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating return time:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Students Currently Out
      </Typography>
      <Grid container spacing={3}>
        {exitRecords.length === 0 ? (
          <Typography variant="body1">
            No students are currently out.
          </Typography>
        ) : (
          exitRecords.map((record) => (
            <Grid item xs={12} sm={6} md={4} key={record.id}>
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {record.studentName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Destination:</strong> {record.destination}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Exit Time:</strong>{' '}
                    {record.exit_time
                      ? new Date(
                          record.exit_time.toDate()
                        ).toLocaleTimeString()
                      : 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="error">
                    <strong>Time Gone:</strong> {record.duration}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleReturn(record.id)}
                    sx={{ mt: 2 }}
                  >
                    Return
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default StudentList;

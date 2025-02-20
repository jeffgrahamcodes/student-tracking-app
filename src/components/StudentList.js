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
  Container,
  Chip,
} from '@mui/material';

const StudentList = () => {
  const [exitRecords, setExitRecords] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'exit_records'),
      (snapshot) => {
        const exitData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          duration: calculateDuration(doc.data().exit_time), // Initialize duration
        }));

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

    // Update the timer every second
    const interval = setInterval(() => {
      setExitRecords((prevRecords) =>
        prevRecords.map((record) => ({
          ...record,
          duration: calculateDuration(record.exit_time),
        }))
      );
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Define color mapping for destinations
  const destinationColors = {
    Restroom: '#2196F3', // Blue
    'Counseling Office': '#9C27B0', // Purple
    Nurse: '#E91E63', // Pink
    Office: '#FF9800', // Orange
    Library: '#4CAF50', // Green
    Cafeteria: '#FFC107', // Yellow
  };

  const calculateDuration = (exitTime) => {
    if (!exitTime) return { time: 'Just left', alert: false };
    const exitDate = exitTime.toDate();
    const now = new Date();
    const diff = Math.floor((now - exitDate) / 1000); // Time difference in seconds

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return { time: `${minutes}m ${seconds}s`, alert: minutes >= 5 }; // Alert if >= 5 minutes
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
    <Container
      sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
    >
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Students Currently Out
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {exitRecords.length === 0 ? (
            <Typography variant="body1">
              No students are currently out.
            </Typography>
          ) : (
            exitRecords.map((record) => (
              <Grid item xs={12} sm={6} md={4} key={record.id}>
                <Card
                  sx={{
                    boxShadow: 3,
                    borderRadius: 2,
                    backgroundColor: record.duration.alert
                      ? '#FFCCCC'
                      : '#FFFFFF', // Red if > 5 mins
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {record.studentName}
                    </Typography>
                    <Chip
                      label={record.destination}
                      sx={{
                        backgroundColor:
                          destinationColors[record.destination] ||
                          '#607D8B',
                        color: 'white',
                        fontWeight: 'bold',
                        my: 1,
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      <strong>Exit Time:</strong>{' '}
                      {record.exit_time
                        ? new Date(
                            record.exit_time.toDate()
                          ).toLocaleTimeString()
                        : 'Unknown'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        record.duration.alert
                          ? 'error'
                          : 'text.secondary'
                      }
                    >
                      <strong>Time Gone:</strong>{' '}
                      {record.duration.time}
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
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
    </Container>
  );
};

export default StudentList;

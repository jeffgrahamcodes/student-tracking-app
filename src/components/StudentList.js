import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Container,
} from '@mui/material';

const StudentList = () => {
  const [exitRecords, setExitRecords] = useState([]);

  const calculateDuration = (exitTime) => {
    if (!exitTime) return { time: 'Just left', alert: false };
    const exitDate = exitTime.toDate();
    const now = new Date();
    const diff = Math.floor((now - exitDate) / 1000); // seconds
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return { time: `${minutes}m ${seconds}s`, alert: minutes >= 5 };
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

  useEffect(() => {
    if (!auth.currentUser) return;

    const teacherQuery = query(
      collection(db, 'exit_records'),
      where('teacher_email', '==', auth.currentUser.email),
      where('return_time', '==', null)
    );

    const unsubscribeExitRecords = onSnapshot(
      teacherQuery,
      async (snapshot) => {
        const exitData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          duration: calculateDuration(doc.data().exit_time),
        }));

        const studentSnapshot = await getDocs(
          collection(db, 'student_schedules')
        );
        const studentData = studentSnapshot.docs.reduce(
          (acc, doc) => {
            const data = doc.data();
            acc[data.student_id] = data.name;
            return acc;
          },
          {}
        );

        const updatedExitRecords = exitData.map((record) => ({
          ...record,
          studentName:
            studentData[record.student_id] || 'Unknown Student',
        }));

        setExitRecords(updatedExitRecords);
      }
    );

    const interval = setInterval(() => {
      setExitRecords((prev) =>
        prev.map((record) => ({
          ...record,
          duration: calculateDuration(record.exit_time),
        }))
      );
    }, 1000);

    return () => {
      unsubscribeExitRecords();
      clearInterval(interval);
    };
  }, []);

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
                      : '#FFFFFF',
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {record.studentName}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Destination:</strong>{' '}
                      {record.destination}
                    </Typography>
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
    </Container>
  );
};

export default StudentList;

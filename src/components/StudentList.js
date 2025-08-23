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

const StudentList = ({ selectedClassId }) => {
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

    let unsubscribeExitRecords;

    const setupListener = async () => {
      let exitQuery;

      // If a class is selected, filter by class_id
      if (selectedClassId) {
        exitQuery = query(
          collection(db, 'exit_records'),
          where('class_id', '==', selectedClassId),
          where('return_time', '==', null)
        );
      } else {
        // If no class selected, show all exit records for the current teacher
        exitQuery = query(
          collection(db, 'exit_records'),
          where('teacher_email', '==', auth.currentUser.email),
          where('return_time', '==', null)
        );
      }

      unsubscribeExitRecords = onSnapshot(
        exitQuery,
        async (snapshot) => {
          const exitData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            duration: calculateDuration(doc.data().exit_time),
          }));

          // Fetch student names from students collection
          const studentIds = [
            ...new Set(exitData.map((record) => record.student_id)),
          ];
          const studentNames = {};

          if (studentIds.length > 0) {
            // First try to get names from students collection
            const studentsRef = collection(db, 'students');
            const studentsSnapshot = await getDocs(studentsRef);

            studentsSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              if (studentIds.includes(data.student_id)) {
                studentNames[
                  data.student_id
                ] = `${data.first_name} ${data.last_name}`;
              }
            });

            // For any missing names, try student_schedules collection as fallback
            const missingIds = studentIds.filter(
              (id) => !studentNames[id]
            );
            if (missingIds.length > 0) {
              const scheduleSnapshot = await getDocs(
                collection(db, 'student_schedules')
              );
              scheduleSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (missingIds.includes(data.student_id)) {
                  studentNames[data.student_id] = data.name;
                }
              });
            }
          }

          const updatedExitRecords = exitData.map((record) => ({
            ...record,
            studentName:
              studentNames[record.student_id] || 'Unknown Student',
          }));

          setExitRecords(updatedExitRecords);
        }
      );
    };

    setupListener();

    const interval = setInterval(() => {
      setExitRecords((prev) =>
        prev.map((record) => ({
          ...record,
          duration: calculateDuration(record.exit_time),
        }))
      );
    }, 1000);

    return () => {
      if (unsubscribeExitRecords) {
        unsubscribeExitRecords();
      }
      clearInterval(interval);
    };
  }, [selectedClassId]); // Re-run effect when selectedClassId changes

  return (
    <Container
      sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
    >
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Students Currently Out
          {selectedClassId && (
            <Typography variant="subtitle1" color="text.secondary">
              (From selected class)
            </Typography>
          )}
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {exitRecords.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                {selectedClassId
                  ? 'No students are currently out from this class.'
                  : 'No students are currently out. Select a class to see students.'}
              </Typography>
            </Grid>
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      <strong>Teacher:</strong>{' '}
                      {record.teacher || 'Unknown'}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleReturn(record.id)}
                      sx={{ mt: 2 }}
                    >
                      Mark as Returned
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

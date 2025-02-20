import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
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
    fetchExitRecords();
  }, []);

  const fetchExitRecords = async () => {
    try {
      // Fetch check-out records where return_time is NOT set
      const exitSnapshot = await getDocs(
        collection(db, 'exit_records')
      );
      const exitData = exitSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch student names
      const studentSnapshot = await getDocs(
        collection(db, 'students')
      );
      const studentData = studentSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data().name;
        return acc;
      }, {});

      // Map student names to exit records
      const updatedExitRecords = exitData
        .filter((record) => !record.return_time) // Only show students who haven't returned
        .map((record) => ({
          ...record,
          studentName:
            studentData[record.student_id] || 'Unknown Student',
        }));

      setExitRecords(updatedExitRecords);
    } catch (error) {
      console.error('Error fetching exit records:', error);
    }
  };

  const handleReturn = async (recordId) => {
    try {
      const recordRef = doc(db, 'exit_records', recordId);
      await updateDoc(recordRef, {
        return_time: serverTimestamp(),
      });

      // Remove the student card from the page
      setExitRecords((prevRecords) =>
        prevRecords.filter((record) => record.id !== recordId)
      );
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

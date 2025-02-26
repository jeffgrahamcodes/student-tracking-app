import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Button, Typography, Container } from '@mui/material';

const UploadSchedule = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    setUploading(true);
    setMessage('');

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0]; // Read first sheet
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      try {
        const collectionRef = collection(db, 'student_schedules');
        const batchSize = 500;
        let batch = writeBatch(db);
        let batchCount = 0;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];

          const studentData = {
            student_id: row['Student ID']?.toString() || '',
            name: `${row['First Name']} ${row['Last Name']}` || '',
            grade: row['Grade'] || '',
            meet_days: parseInt(row['Meet Days'], 10) || 12,
            period: parseInt(row['Per'], 10) || 0,
            teacher: row['Teacher Staff Name'] || '',
            room: row['Room'] || '',
            course: row['Course Title'] || '',
            section_id: row['Section ID'] || '',
            term: row['Term Code'] || '',
          };

          // Use a unique identifier: student_id + period + teacher
          const docId = `${studentData.student_id}_${studentData.period}_${studentData.teacher}`;
          const docRef = doc(collectionRef, docId); // Directly overwrite existing data

          batch.set(docRef, studentData, { merge: true }); // Overwrites without checking

          batchCount++;

          // Firestore only allows 500 writes per batch
          if (batchCount === batchSize || i === data.length - 1) {
            await batch.commit(); // Upload batch
            batch = writeBatch(db); // Start new batch
            batchCount = 0;
          }
        }

        setMessage(
          `✅ Successfully uploaded & overwritten ${data.length} records!`
        );
      } catch (error) {
        console.error('Upload failed:', error);
        setMessage('❌ Upload failed. Check console.');
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <Container sx={{ textAlign: 'center', mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Upload Student Schedule
      </Typography>
      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={handleFileChange}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={uploading}
        sx={{ mt: 2 }}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
      {message && (
        <Typography
          sx={{
            mt: 2,
            color: message.startsWith('✅') ? 'green' : 'red',
          }}
        >
          {message}
        </Typography>
      )}
    </Container>
  );
};

export default UploadSchedule;

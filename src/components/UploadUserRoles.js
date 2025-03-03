import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db, auth } from '../firebase';
import {
  collection,
  writeBatch,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UploadUserRoles = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      try {
        const userRef = doc(db, 'user_roles', auth.currentUser.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRole(userData.role);
        } else {
          console.error('🚨 User role not found in Firestore.');
          setMessage('❌ Access Denied: Role not found.');
        }
      } catch (error) {
        console.error('🚨 Error checking user role:', error);
        setMessage('❌ Access Denied: Firestore error.');
      }
    };

    checkUserRole();
  }, [navigate]);

  if (role !== 'superuser') {
    return (
      <Typography variant="h5" sx={{ textAlign: 'center', mt: 5 }}>
        ❌ Access Denied
      </Typography>
    );
  }

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('❌ Please select a file.');
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
        console.log('🔍 Parsed Data:', JSON.stringify(data, null, 2));

        const collectionRef = collection(db, 'user_roles');
        const batchSize = 500;
        let batch = writeBatch(db);
        let batchCount = 0;
        let skippedRecords = 0;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];

          // 🔥 Ensure email field is correctly mapped
          if (
            !row['Email Address'] ||
            row['Email Address'].trim() === ''
          ) {
            console.error(`❌ Skipping row ${i + 1}: Missing email`);
            skippedRecords++;
            continue;
          }

          const email = row['Email Address'].trim();

          // 🔥 Map Excel column names to Firestore field names
          const userData = {
            name: row['Teacher Staff Name'] || '',
            full_name: row['Employee Full Name'] || '',
            role: row['Type of Access']
              ? row['Type of Access'].toLowerCase()
              : '',
            email: email,
          };

          const docRef = doc(collectionRef, email); // Use email as document ID
          batch.set(docRef, userData, { merge: true });

          batchCount++;

          // Commit batch after 500 writes
          if (batchCount === batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
          }
        }

        // Ensure any remaining records are committed
        if (batchCount > 0) {
          await batch.commit();
        }

        setMessage(
          `✅ Successfully uploaded ${
            data.length - skippedRecords
          } records! ❌ Skipped ${skippedRecords} missing emails.`
        );
      } catch (error) {
        console.error('❌ Upload failed:', error);
        setMessage('❌ Upload failed. Check console.');
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <Container sx={{ textAlign: 'center', mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Upload User Roles
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

export default UploadUserRoles;

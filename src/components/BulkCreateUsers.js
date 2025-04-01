import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  Button,
  Typography,
  Container,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const BulkCreateUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!auth.currentUser) {
        setRole('unauthorized');
        navigate('/');
        return;
      }

      try {
        const userRef = doc(db, 'user_roles', auth.currentUser.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('✅ Superuser Role Found:', userData.role);
          setRole(userData.role.toLowerCase());
        } else {
          console.error('🚨 No Role Found in Firestore');
          setRole('unauthorized');
        }
      } catch (error) {
        console.error('🚨 Error fetching role:', error);
        setRole('unauthorized');
      }
    };

    checkUserRole();
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userRolesSnapshot = await getDocs(
          collection(db, 'user_roles')
        );
        const fetchedUsers = userRolesSnapshot.docs.map((doc) =>
          doc.data()
        );
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (role !== 'superuser') {
    return (
      <Typography variant="h5" sx={{ textAlign: 'center', mt: 5 }}>
        Access Denied
      </Typography>
    );
  }

  const handleCreateAccounts = async () => {
    setCreating(true);
    setMessage('');

    for (const user of users) {
      try {
        // Check if the user already exists in Firebase Auth
        await createUserWithEmailAndPassword(
          auth,
          user.email,
          'HallWaze123!'
        )
          .then(() => {
            console.log(`✅ Created account for ${user.email}`);
          })
          .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
              console.log(
                `⏩ Skipped (already exists): ${user.email}`
              );
            } else {
              console.error(
                `❌ Error creating account for ${user.email}:`,
                error.message
              );
            }
          });
      } catch (error) {
        console.error(
          `❌ Failed to create account for ${user.email}:`,
          error.message
        );
      }
    }

    setCreating(false);
    setMessage('✅ All eligible user accounts have been created!');
  };

  return (
    <Container sx={{ textAlign: 'center', mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Bulk Create User Accounts
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Found {users.length} users in Firestore.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateAccounts}
            disabled={creating}
          >
            {creating ? 'Creating Accounts...' : 'Create Accounts'}
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
        </>
      )}
    </Container>
  );
};

export default BulkCreateUsers;

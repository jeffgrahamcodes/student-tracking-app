import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button, Typography, Box, Paper } from '@mui/material';

const Auth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          const userRef = doc(db, 'user_roles', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setRole(userSnap.data().role);
          }
        } else {
          setRole('');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignUp = async () => {
    const email = prompt('Enter your email');
    const password = prompt(
      'Enter your password (at least 6 characters)'
    );
    if (!email || !password) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, 'user_roles', userCredential.user.uid), {
        email,
        role: 'teacher',
      });
      alert('Account created! Default role: Teacher');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignIn = async () => {
    const email = prompt('Enter your email');
    const password = prompt('Enter your password');
    if (!email || !password) return;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setRole(''); // Reset UI state after signing out
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        textAlign: 'center',
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
      }}
    >
      {user ? (
        <>
          <Typography variant="h6">
            Welcome, {user.email} ({role})
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSignOut}
            sx={{ mt: 2 }}
          >
            Sign Out
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSignUp}
            sx={{ mr: 2 }}
          >
            Sign Up
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </>
      )}
    </Paper>
  );
};

export default Auth;

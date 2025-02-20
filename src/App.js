import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Auth from './components/Auth';
import StudentCheckIn from './components/StudentCheckIn';
import StudentList from './components/StudentList';
import AddStudent from './components/AddStudent';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CssBaseline,
  Box,
} from '@mui/material';

function App() {
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

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    setRole('');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ✅ Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          {/* Left: App Name */}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HALL-WAZE
          </Typography>

          {/* Right: Display User Email & Sign Out Button if Logged In */}
          {user && (
            <>
              <Typography variant="body1" sx={{ marginRight: 2 }}>
                {user.email}
              </Typography>
              <Button color="inherit" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container>
        <CssBaseline />
        {!user ? (
          <Auth />
        ) : (
          <>
            {role === 'admin' && <AddStudent />}
            <StudentCheckIn />
            <StudentList />
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;

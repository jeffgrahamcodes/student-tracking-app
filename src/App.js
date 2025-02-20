import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom';
import Auth from './components/Auth';
import StudentCheckIn from './components/StudentCheckIn';
import StudentList from './components/StudentList';
import Dashboard from './components/Dashboard';
import AddStudentPage from './pages/AddStudentPage';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CssBaseline,
  Box,
} from '@mui/material';
import logo from './assets/hall-waze-logo.png';

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
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        {/* ✅ Updated Navigation Bar Layout */}
        <AppBar position="static" sx={{ backgroundColor: '#1e3a5f' }}>
          {' '}
          {/* Dark Navy Blue */}
          <Toolbar>
            {/* Logo */}
            <Box
              component="img"
              src={logo}
              alt="Hall-Waze Logo"
              sx={{
                height: 50,
                width: 50,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #f8e9d2',
                mr: 2,
              }}
            />

            {/* App Name */}
            <Typography
              variant="h6"
              sx={{ color: '#f8e9d2', fontWeight: 'bold', mr: 4 }}
            >
              HALL-WAZE
            </Typography>

            {/* Show "Home" button only for admins */}
            {user && role === 'admin' && (
              <Button
                color="inherit"
                component={Link}
                to="/"
                sx={{ mr: 2 }}
              >
                Home
              </Button>
            )}

            {/* Show "Dashboard" button only for admins */}
            {user && role === 'admin' && (
              <Button
                color="inherit"
                component={Link}
                to="/dashboard"
                sx={{ mr: 2 }}
              >
                Dashboard
              </Button>
            )}

            {/* Show "Add Student" button only for admins */}
            {user && role === 'admin' && (
              <Button
                color="inherit"
                component={Link}
                to="/add-student"
                sx={{ mr: 2 }}
              >
                Add Student
              </Button>
            )}

            {/* Pushes elements to the right */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Right-Aligned User Email & Sign Out Button */}
            {user && (
              <>
                <Typography
                  variant="body1"
                  sx={{ mr: 2, color: '#f8e9d2' }}
                >
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
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <Auth />
                ) : (
                  <>
                    <StudentCheckIn />
                    <StudentList />
                  </>
                )
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-student" element={<AddStudentPage />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;

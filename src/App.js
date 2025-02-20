import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import StudentCheckIn from './components/StudentCheckIn';
import StudentList from './components/StudentList';
import EditStudent from './components/EditStudent';
import AddStudent from './components/AddStudent';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard'; // Placeholder for dashboard page

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
    await signOut(auth);
    setUser(null);
    setRole('');
  };

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        {/* Navigation Bar */}
        <AppBar position="static" sx={{ backgroundColor: '#1e3a5f' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left-Aligned Links */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  textDecoration: 'none',
                  color: '#f8e9d2',
                  fontWeight: 'bold',
                }}
              >
                Hall-Waze
              </Typography>

              <Button color="inherit" component={Link} to="/">
                Home
              </Button>

              <Button
                color="inherit"
                component={Link}
                to="/student-list"
              >
                Student List
              </Button>

              {user && role === 'admin' && (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/add-student"
                  >
                    Add Student
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/edit-student"
                  >
                    Edit Student
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/dashboard"
                  >
                    Dashboard
                  </Button>
                </>
              )}
            </Box>

            {/* Right-Aligned User Info & Sign Out */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
            >
              {user ? (
                <>
                  <Typography
                    variant="body1"
                    sx={{ color: '#f8e9d2' }}
                  >
                    {user.email}
                  </Typography>
                  <Button color="inherit" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button color="inherit" component={Link} to="/auth">
                  Sign In
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Routes */}
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <>
                  <StudentCheckIn />
                  <StudentList />
                </>
              ) : (
                <Auth />
              )
            }
          />
          <Route path="/student-list" element={<StudentList />} />
          <Route
            path="/add-student"
            element={
              role === 'admin' ? (
                <AddStudent />
              ) : (
                <Typography
                  variant="h5"
                  color="error"
                  textAlign="center"
                  mt={4}
                >
                  ❌ Access Denied
                </Typography>
              )
            }
          />
          <Route
            path="/edit-student"
            element={
              role === 'admin' ? (
                <EditStudent />
              ) : (
                <Typography
                  variant="h5"
                  color="error"
                  textAlign="center"
                  mt={4}
                >
                  ❌ Access Denied
                </Typography>
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              role === 'admin' ? (
                <Dashboard />
              ) : (
                <Typography
                  variant="h5"
                  color="error"
                  textAlign="center"
                  mt={4}
                >
                  ❌ Access Denied
                </Typography>
              )
            }
          />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;

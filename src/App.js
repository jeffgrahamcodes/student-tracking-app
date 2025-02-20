import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import StudentCheckIn from './components/StudentCheckIn';
import StudentList from './components/StudentList';
import EditStudent from './components/EditStudent';
import AddStudent from './components/AddStudent';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import logo from './assets/hall-waze-logo.png'; // Ensure the logo is in the assets folder

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setAuthChecked(true);

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

  if (!authChecked) {
    return (
      <Typography variant="h5" sx={{ textAlign: 'center', mt: 5 }}>
        Loading...
      </Typography>
    );
  }

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        {/* Always show the navbar */}
        <AppBar position="static" sx={{ backgroundColor: '#1e3a5f' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left-Aligned Links */}
            <Box
              sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
            >
              <img
                src={logo}
                alt="Hall-Waze Logo"
                style={{ height: 40, width: 40, borderRadius: '50%' }} // Circular logo in navbar
              />
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

              {user && (
                <>
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

                  {role === 'admin' && (
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
                </>
              )}
            </Box>

            {/* Right-Aligned User Info & Sign Out */}
            {user && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Typography variant="body1" sx={{ color: '#f8e9d2' }}>
                  {user.email}
                </Typography>
                <Button color="inherit" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Routes */}
        <Routes>
          {user ? (
            <>
              <Route
                path="/"
                element={
                  <>
                    <StudentCheckIn />
                    <StudentList />
                  </>
                }
              />
              <Route path="/student-list" element={<StudentList />} />
              <Route
                path="/add-student"
                element={
                  role === 'admin' ? (
                    <AddStudent />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/edit-student"
                element={
                  role === 'admin' ? (
                    <EditStudent />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  role === 'admin' ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
            </>
          ) : (
            <Route path="*" element={<AuthPage />} />
          )}
        </Routes>
      </Box>
    </Router>
  );
}

// Custom Auth Page with Enlarged Circular Logo
const AuthPage = () => {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
      }}
    >
      <img
        src={logo}
        alt="Hall-Waze Logo"
        style={{
          height: 300,
          width: 300,
          borderRadius: '50%',
          marginBottom: 20,
        }} // Larger circular logo
      />
      <Auth />
    </Container>
  );
};

export default App;

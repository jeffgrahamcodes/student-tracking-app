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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import StudentCheckIn from './components/StudentCheckIn';
import StudentList from './components/StudentList';
import AddStudent from './components/AddStudent';
import UploadSchedule from './components/UploadSchedule';
import UploadUserRoles from './components/UploadUserRoles';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import FirestoreDebugger from './components/FirestoreDebugger';
import logo from './assets/hall-waze-logo.png';

function App() {
  const [user, setUser] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [role, setRole] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [impersonateUser, setImpersonateUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setAuthChecked(true);

        if (currentUser) {
          try {
            const userRef = doc(db, 'user_roles', currentUser.email);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              console.log('✅ User Role Found:', userData.role);
              setTeacherName(userData.name || 'Unknown');
              setRole(userData.role || '');
            } else {
              console.error(
                '🚨 User role not found for:',
                currentUser.email
              );
              setRole('unauthorized');
            }
          } catch (error) {
            console.error('🚨 Firestore read error:', error);
            setRole('unauthorized');
          }
        } else {
          setTeacherName('');
          setRole('');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role === 'superuser') {
      fetchAllUsers();
    }
  }, [role]);

  const fetchAllUsers = async () => {
    const userRef = collection(db, 'user_roles');
    const querySnapshot = await getDocs(userRef);

    const users = querySnapshot.docs
      .map((doc) => ({
        email: doc.id,
        name: doc.data().name || 'Unknown',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // 🔥 Sort alphabetically

    setAllUsers(users);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setTeacherName('');
    setRole('');
    setImpersonateUser(null);
  };

  const handleImpersonate = (event) => {
    setImpersonateUser(event.target.value);
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
        {/* Navbar */}
        <AppBar position="static" sx={{ backgroundColor: '#1e3a5f' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left Navigation */}
            <Box
              sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
            >
              <img
                src={logo}
                alt="Hall-Waze Logo"
                style={{ height: 40, width: 40, borderRadius: '50%' }}
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
                        to="/upload-schedule"
                      >
                        Upload Schedule
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

                  {role === 'superuser' && (
                    <>
                      <Button
                        color="inherit"
                        component={Link}
                        to="/upload-user-roles"
                      >
                        Upload User Roles
                      </Button>
                      {/* Superuser Impersonation Dropdown */}
                      <FormControl
                        sx={{ minWidth: 200, marginLeft: 2 }}
                      >
                        <InputLabel>Impersonate User</InputLabel>
                        <Select
                          value={impersonateUser}
                          onChange={handleImpersonate}
                        >
                          {allUsers.map((user) => (
                            <MenuItem
                              key={user.email}
                              value={user.email}
                            >
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                </>
              )}
            </Box>

            {/* Right Side: Teacher Name & Sign Out */}
            {user && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Typography variant="body1" sx={{ color: '#f8e9d2' }}>
                  {teacherName}
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
                    <StudentCheckIn
                      impersonateUser={impersonateUser}
                    />
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
                path="/upload-schedule"
                element={
                  role === 'admin' ? (
                    <UploadSchedule />
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
              <Route
                path="/upload-user-roles"
                element={
                  role === 'superuser' ? (
                    <UploadUserRoles />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
            </>
          ) : (
            <Route path="*" element={<AuthPage />} />
          )}
          <Route path="/debug" element={<FirestoreDebugger />} />
        </Routes>
      </Box>
    </Router>
  );
}

// Custom Auth Page with Enlarged Circular Logo
const AuthPage = () => {
  return (
    <Box
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
          height: 150,
          width: 150,
          borderRadius: '50%',
          marginBottom: 20,
        }}
      />
      <Auth />
    </Box>
  );
};

export default App;

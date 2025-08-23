import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
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
  Container,
  Paper,
  Fade,
  Chip,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  Groups as GroupsIcon,
  ExitToApp as ExitIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
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
import AddClass from './components/AddClass';
import AssignStudentToClass from './components/AssignStudentToClass';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import FirestoreDebugger from './components/FirestoreDebugger';
import BulkCreateUsers from './components/BulkCreateUsers';
import logo from './assets/hall-waze-logo.png';

// Navigation items configuration
const getNavItems = (role) =>
  [
    {
      label: 'Dashboard',
      path: '/',
      icon: <DashboardIcon />,
      roles: ['teacher', 'admin', 'superuser'],
    },
    {
      label: 'Students',
      path: '/student-list',
      icon: <SchoolIcon />,
      roles: ['teacher', 'admin', 'superuser'],
    },
    {
      label: 'Classes',
      path: '/add-class',
      icon: <GroupsIcon />,
      roles: ['teacher', 'admin', 'superuser'],
    },
    {
      label: 'Assign Students',
      path: '/assign-student',
      icon: <AssignmentIcon />,
      roles: ['teacher', 'admin', 'superuser'],
    },
    {
      label: 'Add Student',
      path: '/add-student',
      icon: <PersonAddIcon />,
      roles: ['admin', 'superuser'],
    },
    {
      label: 'Upload Schedule',
      path: '/upload-schedule',
      icon: <UploadIcon />,
      roles: ['admin', 'superuser'],
    },
    {
      label: 'Analytics',
      path: '/dashboard',
      icon: <DashboardIcon />,
      roles: ['admin', 'superuser'],
    },
    {
      label: 'User Roles',
      path: '/upload-user-roles',
      icon: <AdminIcon />,
      roles: ['superuser'],
    },
    {
      label: 'Bulk Create',
      path: '/bulk-create-users',
      icon: <PersonAddIcon />,
      roles: ['superuser'],
    },
  ].filter((item) => item.roles.includes(role));

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
        role: doc.data().role || 'teacher',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            background:
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Loading Hall-Waze...
          </Typography>
        </Paper>
      </Box>
    );
  }

  const navItems = getNavItems(role);

  return (
    <Router>
      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        {/* Professional Navbar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: '#1e293b',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Toolbar sx={{ px: 3, py: 1 }}>
            {/* Left Section - Logo & Brand */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', mr: 4 }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  mr: 2,
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logo}
                  alt="Hall-Waze Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component={Link}
                  to="/"
                  sx={{
                    textDecoration: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Hall-Waze
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    display: 'block',
                    lineHeight: 1,
                  }}
                >
                  Digital Hall Pass System
                </Typography>
              </Box>
            </Box>

            {/* Center Navigation */}
            {user && (
              <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
                {navItems.map((item) => (
                  <NavButton key={item.path} item={item} />
                ))}
              </Box>
            )}

            {/* Right Section - User Info & Controls */}
            {user && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                {/* Impersonation Dropdown for Superuser */}
                {role === 'superuser' && (
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.7)',
                      },
                      '& .MuiSelect-select': { color: '#ffffff' },
                    }}
                  >
                    <InputLabel>Impersonate User</InputLabel>
                    <Select
                      value={impersonateUser || ''}
                      onChange={handleImpersonate}
                      label="Impersonate User"
                    >
                      <MenuItem value="">
                        <em>None (Use your account)</em>
                      </MenuItem>
                      {allUsers.map((user) => (
                        <MenuItem key={user.email} value={user.email}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography>{user.name}</Typography>
                            <Chip
                              label={user.role}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                />

                {/* User Info */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#ffffff', fontWeight: 600 }}
                  >
                    {teacherName}
                  </Typography>
                  <Chip
                    label={role}
                    size="small"
                    sx={{
                      backgroundColor: getRoleColor(role),
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 20,
                    }}
                  />
                </Box>

                {/* Sign Out Button */}
                <Button
                  variant="outlined"
                  startIcon={<ExitIcon />}
                  onClick={handleSignOut}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    '&:hover': {
                      borderColor: '#ef4444',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                    },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Fade in={true} timeout={300}>
            <Box>
              <Routes>
                {user ? (
                  <>
                    <Route
                      path="/"
                      element={
                        <Box>
                          <StudentCheckIn
                            impersonateUser={impersonateUser}
                          />
                          <Box sx={{ mt: 4 }}>
                            <StudentList />
                          </Box>
                        </Box>
                      }
                    />
                    <Route
                      path="/student-list"
                      element={<StudentList />}
                    />
                    <Route path="/add-class" element={<AddClass />} />
                    <Route
                      path="/assign-student"
                      element={<AssignStudentToClass />}
                    />
                    <Route
                      path="/add-student"
                      element={
                        ['admin', 'superuser'].includes(role) ? (
                          <AddStudent />
                        ) : (
                          <Navigate to="/" />
                        )
                      }
                    />
                    <Route
                      path="/upload-schedule"
                      element={
                        ['admin', 'superuser'].includes(role) ? (
                          <UploadSchedule />
                        ) : (
                          <Navigate to="/" />
                        )
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        ['admin', 'superuser'].includes(role) ? (
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
                    <Route
                      path="/bulk-create-users"
                      element={
                        role === 'superuser' ? (
                          <BulkCreateUsers />
                        ) : (
                          <Navigate to="/" />
                        )
                      }
                    />
                  </>
                ) : (
                  <Route path="*" element={<AuthPage />} />
                )}
                <Route
                  path="/debug"
                  element={<FirestoreDebugger />}
                />
              </Routes>
            </Box>
          </Fade>
        </Container>
      </Box>
    </Router>
  );
}

// Professional Navigation Button Component
const NavButton = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Button
      component={Link}
      to={item.path}
      startIcon={item.icon}
      sx={{
        color: isActive ? '#667eea' : 'rgba(255,255,255,0.8)',
        backgroundColor: isActive
          ? 'rgba(102,126,234,0.15)'
          : 'transparent',
        borderRadius: '8px',
        px: 2,
        py: 1,
        fontWeight: isActive ? 600 : 400,
        textTransform: 'none',
        fontSize: '0.9rem',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#ffffff',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {item.label}
    </Button>
  );
};

// Helper function for role colors
const getRoleColor = (role) => {
  switch (role) {
    case 'superuser':
      return '#8b5cf6';
    case 'admin':
      return '#f59e0b';
    case 'teacher':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

// Enhanced Auth Page
const AuthPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        background:
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 4,
        mx: 2,
        mt: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="36" cy="12" r="2"/%3E%3Ccircle cx="48" cy="24" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
        },
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 6,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          minWidth: 400,
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            mx: 'auto',
            mb: 3,
            borderRadius: '24px',
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
          }}
        >
          <img
            src={logo}
            alt="Hall-Waze Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>

        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 1,
          }}
        >
          Welcome to Hall-Waze
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#64748b',
            mb: 4,
            fontSize: '1.1rem',
          }}
        >
          Your digital hall pass management system
        </Typography>

        <Auth />
      </Paper>
    </Box>
  );
};

export default App;

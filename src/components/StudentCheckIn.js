// StudentCheckIn.js

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const StudentCheckIn = ({ impersonateUser }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [destination, setDestination] = useState('');
  const [classId, setClassId] = useState('');
  const [alert, setAlert] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [classes, setClasses] = useState([]);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentPasses, setRecentPasses] = useState([]);
  const [showRecentPasses, setShowRecentPasses] = useState(false);

  // Fetch teacher and class info
  useEffect(() => {
    fetchTeacherDetails();
    fetchDestinations();
  }, [impersonateUser]);

  const fetchTeacherDetails = async () => {
    if (!auth.currentUser) return;

    try {
      const teacherRef = collection(db, 'teachers');
      const q = query(
        teacherRef,
        where(
          'email',
          '==',
          impersonateUser || auth.currentUser.email
        )
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const teacherData = querySnapshot.docs[0].data();
        setCurrentTeacher(teacherData.name);
        setTeacherEmail(teacherData.email);
        fetchClasses(teacherData.teacher_id);
      }
    } catch (error) {
      console.error('Error fetching teacher details:', error);
    }
  };

  const fetchClasses = async (teacherId) => {
    try {
      const classRef = collection(db, 'classes');
      const q = query(classRef, where('teacher_id', '==', teacherId));
      const querySnapshot = await getDocs(q);

      const classList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: data.class_id,
          label: data.class_name || `Class ${data.class_id}`,
          period: data.period,
          room: data.room,
        };
      });

      setClasses(classList);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchDestinations = async () => {
    try {
      const destRef = collection(db, 'destinations');
      const snapshot = await getDocs(destRef);
      const destList = snapshot.docs.map((doc) => ({
        name: doc.data().name,
        category: doc.data().category || 'Other',
        description: doc.data().description || '',
      }));
      setDestinations(destList);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  const fetchStudents = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const studentClassRef = collection(db, 'student_classes');
      const q = query(
        studentClassRef,
        where('class_id', '==', classId)
      );
      const snapshot = await getDocs(q);

      const studentIds = snapshot.docs.map(
        (doc) => doc.data().student_id
      );

      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      const studentsRef = collection(db, 'students');
      const studentsSnap = await getDocs(studentsRef);

      const filteredStudents = studentsSnap.docs
        .map((doc) => ({ ...doc.data(), docId: doc.id }))
        .filter(
          (student) =>
            student.active &&
            studentIds.includes(student.student_id) &&
            student.school_id === 'SAMPLE-SCHOOL'
        )
        .map((student) => ({
          student_id: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          grade: student.grade || 'N/A',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPasses = async () => {
    if (!classId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'exit_records'),
        where('class_id', '==', classId),
        where('exit_time', '>=', today)
      );

      const snapshot = await getDocs(q);
      const passes = snapshot.docs
        .map((doc) => ({ ...doc.data(), id: doc.id }))
        .sort(
          (a, b) => b.exit_time?.toMillis() - a.exit_time?.toMillis()
        );

      setRecentPasses(passes);
    } catch (error) {
      console.error('Error fetching recent passes:', error);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchStudents();
      fetchRecentPasses();
    }
  }, [classId]);

  const checkStudentPasses = async (studentId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'exit_records'),
      where('student_id', '==', studentId),
      where('exit_time', '>=', today)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !destination || !classId) {
      setAlert('Please select a class, student, and destination.');
      setAlertType('warning');
      return;
    }

    try {
      setLoading(true);

      const passCount = await checkStudentPasses(selectedStudent);

      if (passCount >= 3) {
        setAlert(
          '⚠️ This student has already used 3 hall passes today.'
        );
        setAlertType('warning');
        return;
      }

      await addDoc(collection(db, 'exit_records'), {
        student_id: selectedStudent,
        class_id: classId,
        destination,
        teacher: currentTeacher,
        exit_time: serverTimestamp(),
      });

      setAlert(
        `✅ Hall pass recorded successfully! (${
          passCount + 1
        }/3 passes used today)`
      );
      setAlertType('success');

      // Reset form
      setSelectedStudent('');
      setDestination('');

      // Refresh recent passes
      fetchRecentPasses();
    } catch (error) {
      console.error('Error recording hall pass:', error);
      setAlert('❌ An error occurred. Please try again.');
      setAlertType('error');
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === classId);
  const selectedStudentData = students.find(
    (s) => s.student_id === selectedStudent
  );
  const selectedDestination = destinations.find(
    (d) => d.name === destination
  );

  // Group destinations by category
  const destinationsByCategory = destinations.reduce((acc, dest) => {
    const category = dest.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(dest);
    return acc;
  }, {});

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background:
            'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Digital Hall Pass
        </Typography>
        <Typography
          variant="body1"
          sx={{ opacity: 0.9, fontSize: '1.1rem' }}
        >
          Issue hall passes quickly and track student movement
        </Typography>
      </Paper>

      {/* Alert */}
      {alert && (
        <Alert
          severity={alertType}
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: '1.5rem' },
          }}
          onClose={() => setAlert('')}
        >
          {alert}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Issue New Hall Pass
            </Typography>

            <Grid container spacing={3}>
              {/* Class Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Class</InputLabel>
                  <Select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    label="Select Class"
                    startAdornment={
                      <SchoolIcon
                        sx={{ mr: 1, color: 'action.active' }}
                      />
                    }
                  >
                    {classes.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600 }}
                          >
                            {c.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {c.period && `Period ${c.period}`}{' '}
                            {c.room && `• Room ${c.room}`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Student Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!classId || loading}>
                  <InputLabel>Select Student</InputLabel>
                  <Select
                    value={selectedStudent}
                    onChange={(e) =>
                      setSelectedStudent(e.target.value)
                    }
                    label="Select Student"
                    startAdornment={
                      <PersonIcon
                        sx={{ mr: 1, color: 'action.active' }}
                      />
                    }
                  >
                    {students.map((s) => (
                      <MenuItem
                        key={s.student_id}
                        value={s.student_id}
                      >
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600 }}
                          >
                            {s.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Grade {s.grade} • ID: {s.student_id}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Destination Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Destination</InputLabel>
                  <Select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    label="Select Destination"
                    startAdornment={
                      <LocationIcon
                        sx={{ mr: 1, color: 'action.active' }}
                      />
                    }
                  >
                    {Object.entries(destinationsByCategory)
                      .map(([category, dests]) => [
                        <MenuItem
                          key={`header-${category}`}
                          disabled
                          sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                          }}
                        >
                          {category.toUpperCase()}
                        </MenuItem>,
                        ...dests.map((d) => (
                          <MenuItem
                            key={d.name}
                            value={d.name}
                            sx={{ pl: 4 }}
                          >
                            <Box>
                              <Typography variant="body1">
                                {d.name}
                              </Typography>
                              {d.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {d.description}
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        )),
                      ])
                      .flat()}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={
                  !selectedStudent ||
                  !destination ||
                  !classId ||
                  loading
                }
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  color: 'white !important',
                  background:
                    'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
                    color: 'white !important',
                  },
                  '&:disabled': {
                    color: 'rgba(255,255,255,0.5) !important',
                  },
                }}
              >
                {loading ? 'Processing...' : 'Issue Hall Pass'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Summary Panel */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Pass Summary
            </Typography>

            {selectedClass && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Class
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedClass.label}
                </Typography>
                {selectedClass.period && (
                  <Chip
                    label={`Period ${selectedClass.period}`}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            )}

            {selectedStudentData && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Student
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedStudentData.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Grade {selectedStudentData.grade}
                </Typography>
              </Box>
            )}

            {selectedDestination && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Destination
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedDestination.name}
                </Typography>
                {selectedDestination.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {selectedDestination.description}
                  </Typography>
                )}
              </Box>
            )}

            {currentTeacher && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Issued By
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currentTeacher}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Recent Passes */}
          {classId && (
            <Paper elevation={2} sx={{ borderRadius: 3 }}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setShowRecentPasses(!showRecentPasses)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <TimeIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Today's Passes
                  </Typography>
                  <Chip
                    label={recentPasses.length}
                    size="small"
                    color="primary"
                  />
                </Box>
                <IconButton size="small">
                  {showRecentPasses ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>

              <Collapse in={showRecentPasses}>
                <Divider />
                <Box sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {recentPasses.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No passes issued today
                    </Typography>
                  ) : (
                    recentPasses.map((pass, index) => (
                      <Box
                        key={pass.id}
                        sx={{
                          mb: 2,
                          pb: 2,
                          borderBottom:
                            index < recentPasses.length - 1
                              ? '1px solid #f0f0f0'
                              : 'none',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                        >
                          Student ID: {pass.student_id}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          To: {pass.destination}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {pass.exit_time
                            ?.toDate()
                            .toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Collapse>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Tooltip title="Refresh data">
          <IconButton
            onClick={() => {
              if (classId) {
                fetchStudents();
                fetchRecentPasses();
              }
              fetchDestinations();
            }}
            sx={{
              backgroundColor: 'rgba(14,165,233,0.1)',
              '&:hover': { backgroundColor: 'rgba(14,165,233,0.2)' },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default StudentCheckIn;

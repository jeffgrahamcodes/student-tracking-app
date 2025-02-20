import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Typography, Box, Paper } from '@mui/material';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A28EFF',
];

const Dashboard = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchExitRecords();
  }, []);

  const fetchExitRecords = async () => {
    try {
      const exitSnapshot = await getDocs(
        collection(db, 'exit_records')
      );
      const exitData = exitSnapshot.docs.map((doc) => doc.data());

      // Count occurrences of each destination
      const destinationCount = exitData.reduce((acc, record) => {
        acc[record.destination] = (acc[record.destination] || 0) + 1;
        return acc;
      }, {});

      // Convert object to an array for Recharts
      const chartFormattedData = Object.keys(destinationCount).map(
        (key, index) => ({
          name: key,
          value: destinationCount[key],
          color: COLORS[index % COLORS.length], // Assign colors dynamically
        })
      );

      setChartData(chartFormattedData);
    } catch (error) {
      console.error('Error fetching exit records:', error);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Student Hall Pass Usage
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default Dashboard;

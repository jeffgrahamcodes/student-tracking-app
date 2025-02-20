import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AddStudent = () => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [message, setMessage] = useState('');

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!name || !grade) {
      setMessage('Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'students'), {
        name,
        grade,
      });
      setMessage('Student added successfully!');
      setName('');
      setGrade('');
    } catch (error) {
      console.error('Error adding student:', error);
      setMessage('Error adding student.');
    }
  };

  return (
    <div>
      <h2>Add Student</h2>
      <form onSubmit={handleAddStudent}>
        <input
          type="text"
          placeholder="Student Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Grade/Class"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <button type="submit">Add Student</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddStudent;

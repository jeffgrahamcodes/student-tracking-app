import React, { useEffect } from 'react';
import { auth, db } from '../firebase'; // Ensure this points to your firebase config
import { collection, getDocs } from 'firebase/firestore';

const FirestoreDebugger = () => {
  useEffect(() => {
    const testFirestoreAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ No user logged in');
        return;
      }

      console.log(`🔍 Testing Firestore Access for: ${user.email}`);

      try {
        const exitRecords = await getDocs(
          collection(db, 'exit_records')
        );
        console.log(
          '✅ Firestore: exit_records accessible',
          exitRecords.docs.map((doc) => doc.data())
        );
      } catch (error) {
        console.error('🚨 Firestore Error: exit_records', error);
      }

      try {
        const userRoles = await getDocs(collection(db, 'user_roles'));
        console.log(
          '✅ Firestore: user_roles accessible',
          userRoles.docs.map((doc) => doc.data())
        );
      } catch (error) {
        console.error('🚨 Firestore Error: user_roles', error);
      }
    };

    testFirestoreAccess();
  }, []);

  return (
    <div>
      <h3>📊 Firestore Debugger Running (Check Console)</h3>
    </div>
  );
};

export default FirestoreDebugger;

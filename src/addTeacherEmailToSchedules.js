const admin = require('firebase-admin');
const serviceAccount = require('./account.json'); // 🔁 Replace with your path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const run = async () => {
  try {
    // Step 1: Build a map of teacher name → email
    const userRolesSnapshot = await db.collection('user_roles').get();
    const teacherMap = {};
    userRolesSnapshot.forEach((doc) => {
      const { name, email, role } = doc.data();
      if (['teacher', 'admin', 'superuser'].includes(role)) {
        teacherMap[name] = email;
      }
    });

    console.log(`📋 Found ${Object.keys(teacherMap).length} teacher names`);

    // Step 2: Fetch all student schedules
    const scheduleSnapshot = await db.collection('student_schedules').get();

    let updateCount = 0;
    const batch = db.batch();

    scheduleSnapshot.forEach((docRef) => {
      const data = docRef.data();
      const teacherName = data.teacher;

      if (teacherMap[teacherName]) {
        const scheduleDoc = db.collection('student_schedules').doc(docRef.id);
        batch.update(scheduleDoc, {
          teacher_email: teacherMap[teacherName],
        });
        updateCount++;
      } else {
        console.warn(`⚠️ No email found for teacher: ${teacherName}`);
      }
    });

    await batch.commit();
    console.log(`✅ Added teacher_email to ${updateCount} schedule records!`);
  } catch (err) {
    console.error('❌ Error updating documents:', err);
  }
};

run();

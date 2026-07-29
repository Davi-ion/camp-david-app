import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.DB_HOST || '193.203.168.91';
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || 'u859677653_camp_david';
const password = process.env.DB_PASSWORD || '*Reedb4b4';
const database = process.env.DB_NAME || 'u859677653_camp_david_db';

async function testAnnouncementFlow() {
  console.log(`--- CONNECTING TO MYSQL DATABASE AT ${host}:${port}/${database} ---`);

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 10000,
    });

    console.log('✓ Connected to MySQL database successfully!');

    // Generate unique ID for test announcement
    const annId = `ann-test-${Date.now()}`;
    const testTitle = `Curl Integration Test Announcement ${Date.now()}`;
    const testBody = 'This is an end-to-end integration test announcement written directly to the database via database driver.';
    const now = new Date();

    console.log('\nExecuting INSERT INTO Announcement table...');
    const [result] = await connection.execute(
      `INSERT INTO Announcement (id, title, body, category, priority, status, isEmergency, pinned, targetType, authorId, authorName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        annId,
        testTitle,
        testBody,
        'General',
        'high',
        'published',
        0,
        1,
        'all',
        'commander-test-001',
        'Camp Commander',
        now,
        now,
      ]
    );

    console.log('✓ Database WRITE PASSED! Affected Rows:', result.affectedRows);

    console.log('\nExecuting SELECT FROM Announcement table for verification...');
    const [rows] = await connection.execute(
      'SELECT id, title, body, category, priority, status, authorName, createdAt FROM Announcement WHERE id = ?',
      [annId]
    );

    if (rows.length > 0 && rows[0].title === testTitle) {
      console.log('✓ Database READBACK PASSED!');
      console.log('  Inserted Record:', rows[0]);
    } else {
      console.error('❌ Database READBACK FAILED!');
    }

    console.log('\nCleaning up test record...');
    await connection.execute('DELETE FROM Announcement WHERE id = ?', [annId]);
    console.log('✓ Test cleanup complete.');

    await connection.end();
    console.log('\n=================================================');
    console.log('✅ ANNOUNCEMENT DATABASE CREATION FLOW TEST PASSED!');
    console.log('=================================================');
  } catch (err) {
    console.error('❌ MYSQL DATABASE TEST ERROR:', err);
  }
}

testAnnouncementFlow();

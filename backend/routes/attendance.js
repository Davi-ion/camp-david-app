import express from 'express';
import { PrismaClient } from '../generated/prisma/client.ts';
const prisma = new PrismaClient();
const router = express.Router();

// ─── Get All Attendance Records (Session Map) ────────────────────
router.get('/all', async (req, res) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      select: {
        sessionId: true,
        camperId: true,
        status: true,
      },
    });

    const attendanceMap = {};
    for (const r of records) {
      if (!r.sessionId || !r.camperId) continue;
      if (!attendanceMap[r.sessionId]) {
        attendanceMap[r.sessionId] = {};
      }
      attendanceMap[r.sessionId][r.camperId] = r.status;
    }

    res.json(attendanceMap);
  } catch (err) {
    console.error('Failed to fetch attendance map:', err);
    res.status(500).json({ error: 'Failed to fetch attendance map' });
  }
});

// ─── Mark Single Attendance Record ──────────────────────────────
router.post('/mark', async (req, res) => {
  try {
    const { sessionKey, camperId, status, staffId } = req.body;
    if (!sessionKey || !camperId) {
      return res.status(400).json({ error: 'sessionKey and camperId are required.' });
    }

    if (!status) {
      // Remove attendance record if status is null or empty
      await prisma.attendanceRecord.deleteMany({
        where: { sessionId: sessionKey, camperId },
      });
      return res.json({ message: 'Attendance record cleared' });
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_camperId: {
          sessionId: sessionKey,
          camperId: camperId,
        },
      },
      update: {
        status,
        timestamp: new Date(),
        recordedById: staffId || null,
      },
      create: {
        sessionId: sessionKey,
        camperId,
        status,
        timestamp: new Date(),
        recordedById: staffId || null,
      },
    });

    res.json(record);
  } catch (err) {
    console.error('Failed to mark attendance:', err);
    res.status(500).json({ error: 'Failed to save attendance record' });
  }
});

// ─── Mark Bulk Attendance Records ───────────────────────────────
router.post('/bulk-mark', async (req, res) => {
  try {
    const { sessionKey, camperIds, status, staffId } = req.body;
    if (!sessionKey || !Array.isArray(camperIds)) {
      return res.status(400).json({ error: 'sessionKey and camperIds array are required.' });
    }

    await prisma.$transaction(
      camperIds.map((camperId) =>
        prisma.attendanceRecord.upsert({
          where: {
            sessionId_camperId: {
              sessionId: sessionKey,
              camperId,
            },
          },
          update: {
            status,
            timestamp: new Date(),
            recordedById: staffId || null,
          },
          create: {
            sessionId: sessionKey,
            camperId,
            status,
            timestamp: new Date(),
            recordedById: staffId || null,
          },
        })
      )
    );

    res.json({ message: 'Bulk attendance saved successfully', count: camperIds.length });
  } catch (err) {
    console.error('Failed to bulk mark attendance:', err);
    res.status(500).json({ error: 'Failed to bulk mark attendance' });
  }
});

// ─── Camper QR Lookup ─────────────────────────────────────────────
router.get('/camper/:qr', async (req, res) => {
  try {
    const { qr } = req.params;
    const camper = await prisma.camper.findUnique({
      where: { qrCode: qr },
      include: {
        platoon: true
      }
    });
    if (!camper) return res.status(404).json({ error: 'Camper not found' });
    res.json(camper);
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// ─── Offline Sync (Bulk Add) ──────────────────────────────────────
router.post('/sync', async (req, res) => {
  try {
    const { records, staffId } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    let syncedCount = 0;
    
    // We use a transaction to ensure all records sync together
    await prisma.$transaction(async (tx) => {
      for (const r of records) {
        // Find existing record to resolve conflicts
        const existing = await tx.attendanceRecord.findFirst({
          where: {
            sessionId: r.sessionId,
            camperId: r.camperId || undefined,
            staffId: r.staffId || undefined
          }
        });

        const recordTime = new Date(r.timestamp);

        if (!existing) {
          await tx.attendanceRecord.create({
            data: {
              sessionId: r.sessionId,
              camperId: r.camperId,
              staffId: r.staffId,
              status: r.status,
              timestamp: recordTime,
              recordedById: r.recordedById || staffId,
              notes: r.notes
            }
          });
          syncedCount++;
        } else {
          // If the offline record is newer than the existing record in the DB, override it.
          if (recordTime > new Date(existing.timestamp)) {
            await tx.attendanceRecord.update({
              where: { id: existing.id },
              data: {
                status: r.status,
                timestamp: recordTime,
                recordedById: r.recordedById || staffId,
                notes: r.notes
              }
            });
            syncedCount++;
          }
        }
      }
    });

    res.json({ message: 'Sync successful', syncedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

// ─── Get Session Attendance ───────────────────────────────────────
router.get('/session/:sessionId', async (req, res) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId: req.params.sessionId },
      include: {
        camper: { select: { id: true, name: true, registrationNumber: true, platoon: { select: { name: true, emoji: true } } } },
        staff: { select: { id: true, name: true, role: true } },
        recordedBy: { select: { id: true, name: true } }
      }
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session attendance' });
  }
});

// ─── Dashboard Stats ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    // Determine the current or most recent session that requires attendance
    const now = new Date();
    const currentSession = await prisma.session.findFirst({
      where: {
        requiresAttendance: true,
        startTime: { lte: now },
        endTime: { gte: now }
      },
      orderBy: { startTime: 'desc' }
    });

    let currentSessionStats = null;

    if (currentSession) {
      // Find expected campers
      // First find platoons assigned to this session
      const sessionWithPlatoons = await prisma.session.findUnique({
        where: { id: currentSession.id },
        include: { platoons: true }
      });
      
      const platoonIds = sessionWithPlatoons.platoons.map(p => p.id);
      let expectedCampersCount = 0;
      
      if (platoonIds.length > 0) {
        expectedCampersCount = await prisma.camper.count({ where: { status: 'active', platoonId: { in: platoonIds } } });
      } else {
        expectedCampersCount = await prisma.camper.count({ where: { status: 'active' } });
      }

      // Count distinct present campers
      const presentRecords = await prisma.attendanceRecord.count({
        where: {
          sessionId: currentSession.id,
          camperId: { not: null },
          status: { in: ['present', 'late'] }
        }
      });

      // Count absent/missing campers
      const absentRecords = await prisma.attendanceRecord.count({
        where: {
          sessionId: currentSession.id,
          camperId: { not: null },
          status: { notIn: ['present', 'late'] }
        }
      });

      // Calculate missing (those with no record)
      const totalRecorded = await prisma.attendanceRecord.count({
        where: { sessionId: currentSession.id, camperId: { not: null } }
      });
      
      const missingRecords = Math.max(0, expectedCampersCount - totalRecorded);

      const attendancePercentage = expectedCampersCount > 0 
        ? Math.round((presentRecords / expectedCampersCount) * 100)
        : 0;

      currentSessionStats = {
        sessionTitle: currentSession.title,
        expected: expectedCampersCount,
        present: presentRecords,
        absent: absentRecords + missingRecords, // combining explicit absent + missing
        missing: missingRecords,
        percentage: attendancePercentage
      };
    }

    res.json({
      currentSessionStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

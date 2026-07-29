import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './utils/prisma.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersSeedPath = path.join(__dirname, 'users_seed.json');

async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}

async function seed() {
  try {
    const defaultPassword = 'CampDavid@2026!';
    const passwordHash = await hashPassword(defaultPassword);

    console.log('Seeding roles...');
    const roleDefinitions = [
      {
        name: 'Super Admin',
        description: 'Full platform access. Can manage everything.',
        permissions: JSON.stringify(['all']),
        isSystem: true,
      },
      {
        name: 'Camp Director',
        description: 'Manage camp operations, view reports, manage staff.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'view:attendance', 'view:incidents',
          'manage:incidents', 'view:reports', 'manage:reports', 'view:staff',
          'manage:staff', 'view:schedule', 'manage:schedule', 'view:audit',
          'manage:announcements', 'manage:settings', 'manage:dorms', 'manage:bulk',
        ]),
        isSystem: true,
      },
      {
        name: 'Head Counsellor',
        description: 'Oversee counsellors and camper welfare.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'manage:campers', 'view:attendance',
          'manage:attendance', 'view:incidents', 'manage:incidents', 'view:staff',
          'view:schedule', 'manage:announcements', 'manage:dorms',
        ]),
        isSystem: true,
      },
      {
        name: 'Counsellor',
        description: 'Direct camper care, attendance, incident reporting.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'manage:campers', 'view:attendance',
          'manage:attendance', 'view:incidents', 'manage:incidents', 'view:schedule',
        ]),
        isSystem: true,
      },
      {
        name: 'Medical Staff',
        description: 'Health center staff, manage medical incidents & notes.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'view:incidents', 'manage:incidents',
          'view:schedule', 'view:reports',
        ]),
        isSystem: true,
      },
      {
        name: 'Platoon Leader',
        description: 'Lead assigned platoon, log attendance and incidents.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'view:attendance', 'manage:attendance',
          'view:incidents', 'manage:incidents', 'view:schedule',
        ]),
        isSystem: true,
      },
      {
        name: 'Platoon Lead',
        description: 'Lead assigned platoon, log attendance and incidents.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'view:attendance', 'manage:attendance',
          'view:incidents', 'manage:incidents', 'view:schedule',
        ]),
        isSystem: true,
      },
      {
        name: 'Dorm Lead',
        description: 'Manage dorm assignment and camper welfare.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'manage:campers', 'view:attendance',
          'manage:attendance', 'view:incidents', 'manage:incidents', 'manage:dorms',
        ]),
        isSystem: true,
      },
      {
        name: 'Camp Commander',
        description: 'Camp command, operational oversight.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'view:attendance', 'view:incidents',
          'manage:incidents', 'view:reports', 'manage:reports', 'view:staff',
          'manage:staff', 'view:schedule', 'manage:schedule',
        ]),
        isSystem: true,
      },
      {
        name: 'Volunteer',
        description: 'General volunteer staff member.',
        permissions: JSON.stringify([
          'view:dashboard', 'view:campers', 'view:schedule',
        ]),
        isSystem: true,
      },
    ];

    const rolesByName = {};
    for (const rDef of roleDefinitions) {
      const role = await prisma.role.upsert({
        where: { name: rDef.name },
        update: { permissions: rDef.permissions, description: rDef.description },
        create: rDef,
      });
      rolesByName[rDef.name] = role;
    }

    console.log('Seeding default staff...');
    let seedUsersFile = [];
    if (fs.existsSync(usersSeedPath)) {
      seedUsersFile = JSON.parse(fs.readFileSync(usersSeedPath, 'utf8'));
    }

    const seedStaff = [
      {
        name: 'Super Admin',
        email: 'admin@campdavid.org',
        username: 'admin',
        passwordHash,
        role: 'Super Admin',
        department: 'Executive',
        forcePasswordChange: false,
        status: 'active',
      },
      ...seedUsersFile.map(u => ({
        name: u.name,
        email: u.email,
        username: u.username,
        gender: u.gender || null,
        passwordHash,
        role: u.role || 'Volunteer',
        department: u.department || 'General Volunteer',
        forcePasswordChange: false,
        status: 'active',
      }))
    ];

    for (const sData of seedStaff) {
      const { role: roleName, ...staffFields } = sData;
      const staff = await prisma.staff.upsert({
        where: { email: staffFields.email },
        update: { ...staffFields },
        create: staffFields,
      });

      const matchedRole = rolesByName[roleName];
      if (matchedRole) {
        await prisma.roleAssignment.upsert({
          where: { staffId: staff.id },
          update: { roleId: matchedRole.id },
          create: { staffId: staff.id, roleId: matchedRole.id },
        });
      }
    }

    console.log('Seeding platoons...');
    const platoons = [
      { name: 'Alfa',    emoji: '🎖️', colorHex: '#10B981', description: 'Alfa Platoon - Courage & Vanguard' },
      { name: 'Bravo',   emoji: '🛡️', colorHex: '#3B82F6', description: 'Bravo Platoon - Honor & Shield' },
      { name: 'Charlie', emoji: '⚡', colorHex: '#EAB308', description: 'Charlie Platoon - Lightning & Might' },
      { name: 'Delta',   emoji: '🔥', colorHex: '#EF4444', description: 'Delta Platoon - Flame & Valor' },
      { name: 'Echo',    emoji: '🔊', colorHex: '#8B5CF6', description: 'Echo Platoon - Resonant Leadership' },
      { name: 'Foxtrot', emoji: '🦊', colorHex: '#F97316', description: 'Foxtrot Platoon - Swift & Discerning' },
      { name: 'Golf',    emoji: '⛳', colorHex: '#84CC16', description: 'Golf Platoon - Precision & Purpose' },
      { name: 'Kilo',    emoji: '⚖️', colorHex: '#06B6D4', description: 'Kilo Platoon - Balance & Integrity' },
      { name: 'Lima',    emoji: '🦁', colorHex: '#D97304', description: 'Lima Platoon - Bold Strength' },
      { name: 'Mike',    emoji: '🦅', colorHex: '#6366F1', description: 'Mike Platoon - High Soaring Vision' },
      { name: 'Oscar',   emoji: '👑', colorHex: '#A855F7', description: 'Oscar Platoon - Excellence & Favor' },
      { name: 'Quebec',  emoji: '⚓', colorHex: '#14B8A6', description: 'Quebec Platoon - Anchor of Hope' },
      { name: 'Romeo',   emoji: '⚔️', colorHex: '#EC4899', description: 'Romeo Platoon - Steadfast Warriors' },
      { name: 'Sierra',  emoji: '🏔️', colorHex: '#64748B', description: 'Sierra Platoon - Unshakeable Faith' },
      { name: 'Tango',   emoji: '🎺', colorHex: '#F59E0B', description: 'Tango Platoon - Champion March' },
      { name: 'Victor',  emoji: '🏆', colorHex: '#22C55E', description: 'Victor Platoon - Overcoming Victory' },
    ];

    for (const p of platoons) {
      await prisma.platoon.upsert({
        where: { name: p.name },
        update: { emoji: p.emoji, colorHex: p.colorHex, description: p.description },
        create: p,
      });
    }

    console.log('Seeding dorms...');
    const dorms = [
      { name: 'LQF1', gender: 'female', capacity: 100 },
      { name: 'LQF2', gender: 'female', capacity: 100 },
      { name: 'LQM1', gender: 'male', capacity: 100 },
      { name: 'LQM2', gender: 'male', capacity: 100 },
    ];

    for (const dorm of dorms) {
      await prisma.dorm.upsert({
        where: { name: dorm.name },
        update: { gender: dorm.gender, capacity: dorm.capacity },
        create: dorm,
      });
    }

    console.log('Database seeded successfully into Remote MySQL!');
  } catch (e) {
    console.error('Error during seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();

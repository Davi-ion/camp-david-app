import 'dotenv/config';
import { prisma } from './utils/prisma.js';
import bcrypt from 'bcryptjs';

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
      {
        name: 'Pastor John',
        email: 'director@campdavid.org',
        username: 'director',
        passwordHash,
        role: 'Camp Director',
        department: 'Leadership',
        forcePasswordChange: false,
        status: 'active',
      },
      {
        name: 'Sarah Connor',
        email: 'head.counsellor@campdavid.org',
        username: 'sarah.c',
        passwordHash,
        role: 'Head Counsellor',
        department: 'Welfare',
        forcePasswordChange: true,
        status: 'active',
      },
      {
        name: 'Dr. House',
        email: 'medic@campdavid.org',
        username: 'dr.house',
        passwordHash,
        role: 'Medical Staff',
        department: 'Medical',
        forcePasswordChange: true,
        status: 'active',
      },
      {
        name: 'Captain Price',
        email: 'platoon.lead@campdavid.org',
        username: 'cpt.price',
        passwordHash,
        role: 'Platoon Leader',
        department: 'Operations',
        forcePasswordChange: true,
        status: 'active',
      },
      {
        name: 'Default Staff User',
        email: 'staff@campdavid.org',
        username: 'staff',
        passwordHash,
        role: 'Counsellor',
        department: 'General',
        forcePasswordChange: true,
        status: 'active',
      },
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
      { name: 'Judah', emoji: '🦁', colorHex: '#EAB308', description: 'The Lion Tribe - Bold & Courageous' },
      { name: 'Ephraim', emoji: '🦅', colorHex: '#3B82F6', description: 'The Eagle Tribe - Fruitful & Strong' },
      { name: 'Asher', emoji: '⚔️', colorHex: '#10B981', description: 'The Shield Tribe - Blessed & Mighty' },
      { name: 'Naphtali', emoji: '🔥', colorHex: '#EF4444', description: 'The Flame Tribe - Victory & Honor' },
      { name: 'Reuben', emoji: '🛡️', colorHex: '#6366F1', description: 'The Vanguard Tribe - Firstborn Strength' },
      { name: 'Simeon', emoji: '🗡️', colorHex: '#8B5CF6', description: 'The Sword Tribe - Steadfast & Resolute' },
      { name: 'Levi', emoji: '✝️', colorHex: '#EC4899', description: 'The Sanctuary Tribe - Devoted & Faithful' },
      { name: 'Issachar', emoji: '🏹', colorHex: '#F59E0B', description: 'The Archer Tribe - Wise & Discerning' },
      { name: 'Zebulun', emoji: '⚓', colorHex: '#14B8A6', description: 'The Haven Tribe - Anchor of Hope' },
      { name: 'Dan', emoji: '⚖️', colorHex: '#06B6D4', description: 'The Justice Tribe - Fair & Vigilant' },
      { name: 'Gad', emoji: '🛡️', colorHex: '#84CC16', description: 'The Troop Tribe - Overcoming Victor' },
      { name: 'Benjamin', emoji: '🐺', colorHex: '#F97316', description: 'The Wolf Tribe - Swift & Brave' },
      { name: 'Manasseh', emoji: '🌿', colorHex: '#22C55E', description: 'The Branch Tribe - Growing & Prosperous' },
      { name: 'Joseph', emoji: '👑', colorHex: '#A855F7', description: 'The Crown Tribe - Favored & Exalted' },
      { name: 'Caleb', emoji: '🏔️', colorHex: '#64748B', description: 'The Mountain Tribe - Wholehearted Faith' },
      { name: 'Joshua', emoji: '🎺', colorHex: '#D97304', description: 'The Conqueror Tribe - Champion Leader' },
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

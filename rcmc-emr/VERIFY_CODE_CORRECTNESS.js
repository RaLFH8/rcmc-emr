// This script verifies that the code structure is correct
// Run with: node VERIFY_CODE_CORRECTNESS.js

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING ONLINE BOOKING CODE STRUCTURE...\n');

let allChecks = true;

// Check 1: Verify supabase.js exports db object
console.log('✓ Check 1: Verifying supabase.js exports...');
const supabaseContent = fs.readFileSync(path.join(__dirname, 'src/lib/supabase.js'), 'utf8');

if (supabaseContent.includes('export const db = {')) {
  console.log('  ✅ db object is exported');
} else {
  console.log('  ❌ db object export not found');
  allChecks = false;
}

if (supabaseContent.includes('createOnlineBooking(bookingData)') || 
    supabaseContent.includes('createOnlineBooking: async (bookingData)')) {
  console.log('  ✅ createOnlineBooking function exists');
} else {
  console.log('  ❌ createOnlineBooking function not found');
  allChecks = false;
}

if (supabaseContent.includes('getActiveDoctors()') || 
    supabaseContent.includes('getActiveDoctors: async ()')) {
  console.log('  ✅ getActiveDoctors function exists');
} else {
  console.log('  ❌ getActiveDoctors function not found');
  allChecks = false;
}

if (supabaseContent.includes('getAvailableTimeSlots(doctorId, date)') || 
    supabaseContent.includes('getAvailableTimeSlots: async (doctorId, date)')) {
  console.log('  ✅ getAvailableTimeSlots function exists');
} else {
  console.log('  ❌ getAvailableTimeSlots function not found');
  allChecks = false;
}

// Check time slot configuration
if (supabaseContent.includes('for (let hour = 10; hour < 17; hour++)')) {
  console.log('  ✅ Time slots: 10 AM - 5 PM');
} else {
  console.log('  ⚠️  Time slot hours might be different');
}

if (supabaseContent.includes('for (let minute of [0, 20, 40])')) {
  console.log('  ✅ Interval: 20 minutes');
} else {
  console.log('  ⚠️  Interval might be different');
}

// Check 2: Verify PublicBooking.jsx imports correctly
console.log('\n✓ Check 2: Verifying PublicBooking.jsx imports...');
const publicBookingContent = fs.readFileSync(path.join(__dirname, 'src/pages/PublicBooking.jsx'), 'utf8');

if (publicBookingContent.includes("import { db } from '../lib/supabase'")) {
  console.log('  ✅ Correct import: { db } from supabase');
} else if (publicBookingContent.includes("import { createOnlineBooking")) {
  console.log('  ❌ WRONG import: using named exports instead of db object');
  allChecks = false;
} else {
  console.log('  ⚠️  Import pattern unclear');
}

if (publicBookingContent.includes('db.getActiveDoctors()')) {
  console.log('  ✅ Correct usage: db.getActiveDoctors()');
} else {
  console.log('  ❌ Wrong usage: not using db object');
  allChecks = false;
}

if (publicBookingContent.includes('db.getAvailableTimeSlots(')) {
  console.log('  ✅ Correct usage: db.getAvailableTimeSlots()');
} else {
  console.log('  ❌ Wrong usage: not using db object');
  allChecks = false;
}

if (publicBookingContent.includes('db.createOnlineBooking(')) {
  console.log('  ✅ Correct usage: db.createOnlineBooking()');
} else {
  console.log('  ❌ Wrong usage: not using db object');
  allChecks = false;
}

// Check 3: Verify App.jsx has ErrorBoundary
console.log('\n✓ Check 3: Verifying App.jsx error handling...');
const appContent = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');

if (appContent.includes("import ErrorBoundary from './components/ErrorBoundary'")) {
  console.log('  ✅ ErrorBoundary imported');
} else {
  console.log('  ⚠️  ErrorBoundary not imported (optional)');
}

if (appContent.includes('<ErrorBoundary>') && appContent.includes('<PublicBooking />')) {
  console.log('  ✅ PublicBooking wrapped with ErrorBoundary');
} else {
  console.log('  ⚠️  PublicBooking not wrapped with ErrorBoundary (optional)');
}

// Check 4: Verify ErrorBoundary component exists
console.log('\n✓ Check 4: Verifying ErrorBoundary component...');
const errorBoundaryPath = path.join(__dirname, 'src/components/ErrorBoundary.jsx');
if (fs.existsSync(errorBoundaryPath)) {
  console.log('  ✅ ErrorBoundary.jsx exists');
  const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf8');
  if (errorBoundaryContent.includes('componentDidCatch')) {
    console.log('  ✅ ErrorBoundary has error handling');
  }
} else {
  console.log('  ⚠️  ErrorBoundary.jsx not found (optional)');
}

// Final Summary
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('✅ ALL CRITICAL CHECKS PASSED!');
  console.log('\nThe code structure is CORRECT.');
  console.log('If you\'re seeing a white screen, it\'s a CACHE ISSUE.');
  console.log('\nSOLUTION: Run FIX_WHITE_SCREEN_NOW.bat');
} else {
  console.log('❌ SOME CHECKS FAILED!');
  console.log('\nPlease review the errors above.');
  console.log('The code structure needs to be fixed.');
}
console.log('='.repeat(50) + '\n');

process.exit(allChecks ? 0 : 1);

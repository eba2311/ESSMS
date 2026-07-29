import { useState, useEffect, useCallback } from 'react';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enLayout from './locales/en/layout.json';
import enAssessment from './locales/en/assessment.json';
import enStudent from './locales/en/student.json';
import enTeacher from './locales/en/teacher.json';
import enAttendance from './locales/en/attendance.json';
import enFinance from './locales/en/finance.json';
import enLibrary from './locales/en/library.json';
import enSections from './locales/en/sections.json';
import enRankings from './locales/en/rankings.json';
import enRosters from './locales/en/rosters.json';
import enSettings from './locales/en/settings.json';
import enUsers from './locales/en/users.json';
import enCommunications from './locales/en/communications.json';
import enProfile from './locales/en/profile.json';
import enDiscipline from './locales/en/discipline.json';
import enHealth from './locales/en/health.json';
import enTransport from './locales/en/transport.json';
import enInventory from './locales/en/inventory.json';
import enCounseling from './locales/en/counseling.json';
import enCalendar from './locales/en/calendar.json';
import enClassrooms from './locales/en/classrooms.json';
import enAssignments from './locales/en/assignments.json';
import enAlumni from './locales/en/alumni.json';
import enGuardians from './locales/en/guardians.json';
import enReports from './locales/en/reports.json';
import enDashboard from './locales/en/dashboard.json';
import enMyTeaching from './locales/en/myTeaching.json';
import enMyStudent from './locales/en/myStudent.json';

import omCommon from './locales/om/common.json';
import omAuth from './locales/om/auth.json';
import omLayout from './locales/om/layout.json';
import omAssessment from './locales/om/assessment.json';
import omStudent from './locales/om/student.json';
import omTeacher from './locales/om/teacher.json';
import omAttendance from './locales/om/attendance.json';
import omFinance from './locales/om/finance.json';
import omLibrary from './locales/om/library.json';
import omSections from './locales/om/sections.json';
import omRankings from './locales/om/rankings.json';
import omRosters from './locales/om/rosters.json';
import omSettings from './locales/om/settings.json';
import omUsers from './locales/om/users.json';
import omCommunications from './locales/om/communications.json';
import omProfile from './locales/om/profile.json';
import omDiscipline from './locales/om/discipline.json';
import omHealth from './locales/om/health.json';
import omTransport from './locales/om/transport.json';
import omInventory from './locales/om/inventory.json';
import omCounseling from './locales/om/counseling.json';
import omCalendar from './locales/om/calendar.json';
import omClassrooms from './locales/om/classrooms.json';
import omAssignments from './locales/om/assignments.json';
import omAlumni from './locales/om/alumni.json';
import omGuardians from './locales/om/guardians.json';
import omReports from './locales/om/reports.json';
import omDashboard from './locales/om/dashboard.json';
import omMyTeaching from './locales/om/myTeaching.json';
import omMyStudent from './locales/om/myStudent.json';

import amCommon from './locales/am/common.json';
import amAuth from './locales/am/auth.json';
import amLayout from './locales/am/layout.json';
import amAssessment from './locales/am/assessment.json';
import amStudent from './locales/am/student.json';
import amTeacher from './locales/am/teacher.json';
import amAttendance from './locales/am/attendance.json';
import amFinance from './locales/am/finance.json';
import amLibrary from './locales/am/library.json';
import amSections from './locales/am/sections.json';
import amRankings from './locales/am/rankings.json';
import amRosters from './locales/am/rosters.json';
import amSettings from './locales/am/settings.json';
import amUsers from './locales/am/users.json';
import amCommunications from './locales/am/communications.json';
import amProfile from './locales/am/profile.json';
import amDiscipline from './locales/am/discipline.json';
import amHealth from './locales/am/health.json';
import amTransport from './locales/am/transport.json';
import amInventory from './locales/am/inventory.json';
import amCounseling from './locales/am/counseling.json';
import amCalendar from './locales/am/calendar.json';
import amClassrooms from './locales/am/classrooms.json';
import amAssignments from './locales/am/assignments.json';
import amAlumni from './locales/am/alumni.json';
import amGuardians from './locales/am/guardians.json';
import amReports from './locales/am/reports.json';
import amDashboard from './locales/am/dashboard.json';
import amMyTeaching from './locales/am/myTeaching.json';
import amMyStudent from './locales/am/myStudent.json';

const STORAGE_KEY = 'i18nextLng';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'om', label: 'Oromo', nativeLabel: 'Afaan Oromoo' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ' },
];

const resources: Record<string, Record<string, any>> = {
  en: {
    common: enCommon, auth: enAuth, layout: enLayout, assessment: enAssessment,
    student: enStudent, teacher: enTeacher, attendance: enAttendance, finance: enFinance,
    library: enLibrary, sections: enSections, rankings: enRankings, rosters: enRosters,
    settings: enSettings, users: enUsers, communications: enCommunications, profile: enProfile,
    discipline: enDiscipline, health: enHealth, transport: enTransport, inventory: enInventory,
    counseling: enCounseling, calendar: enCalendar, classrooms: enClassrooms, assignments: enAssignments,
    alumni: enAlumni, guardians: enGuardians, reports: enReports, dashboard: enDashboard,
    myTeaching: enMyTeaching, myStudent: enMyStudent,
  },
  om: {
    common: omCommon, auth: omAuth, layout: omLayout, assessment: omAssessment,
    student: omStudent, teacher: omTeacher, attendance: omAttendance, finance: omFinance,
    library: omLibrary, sections: omSections, rankings: omRankings, rosters: omRosters,
    settings: omSettings, users: omUsers, communications: omCommunications, profile: omProfile,
    discipline: omDiscipline, health: omHealth, transport: omTransport, inventory: omInventory,
    counseling: omCounseling, calendar: omCalendar, classrooms: omClassrooms, assignments: omAssignments,
    alumni: omAlumni, guardians: omGuardians, reports: omReports, dashboard: omDashboard,
    myTeaching: omMyTeaching, myStudent: omMyStudent,
  },
  am: {
    common: amCommon, auth: amAuth, layout: amLayout, assessment: amAssessment,
    student: amStudent, teacher: amTeacher, attendance: amAttendance, finance: amFinance,
    library: amLibrary, sections: amSections, rankings: amRankings, rosters: amRosters,
    settings: amSettings, users: amUsers, communications: amCommunications, profile: amProfile,
    discipline: amDiscipline, health: amHealth, transport: amTransport, inventory: amInventory,
    counseling: amCounseling, calendar: amCalendar, classrooms: amClassrooms, assignments: amAssignments,
    alumni: amAlumni, guardians: amGuardians, reports: amReports, dashboard: amDashboard,
    myTeaching: amMyTeaching, myStudent: amMyStudent,
  },
};

function detectLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && resources[stored]) return stored;
    const browser = navigator.language?.slice(0, 2);
    if (browser && resources[browser]) return browser;
  } catch { /* localStorage unavailable */ }
  return 'en';
}

function getValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(text: string, vars?: Record<string, any>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}

let currentLang = detectLanguage();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function changeLanguage(code: string): void {
  if (resources[code]) {
    currentLang = code;
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
    notifyListeners();
  }
}

export function useTranslation(ns?: string) {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => { listeners.delete(forceUpdate); };
  }, [forceUpdate]);

  const t = useCallback((key: string, options?: { ns?: string; defaultValue?: string } & Record<string, any>) => {
    const namespace = options?.ns || ns || 'common';
    const translation = getValue(resources[currentLang]?.[namespace], key)
      || getValue(resources['en']?.[namespace], key)
      || options?.defaultValue
      || key;
    return interpolate(translation, options);
  }, [ns, currentLang]);

  return { t, i18n: { language: currentLang, changeLanguage } };
}

export const initReactI18next = {};
export const i18n = { language: currentLang };

export default { useTranslation, initReactI18next, i18n };

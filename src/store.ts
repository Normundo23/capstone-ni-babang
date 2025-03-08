import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, ParticipationRecord, ParticipationQuality, Class, Settings, NameDetectionMode, Section } from './types';
import { db } from './db';
import toast from 'react-hot-toast';
import { notificationManager } from './utils/notifications';

interface StoreState {
  students: Student[];
  participationRecords: ParticipationRecord[];
  classes: Class[];
  sections: Section[];
  currentClassId: string | null;
  currentSectionId: string | null;
  isTracking: boolean;
  settings: Settings;
  addStudent: (firstName: string, lastName: string, sectionId: string | null) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  toggleStudentProtection: (id: string) => Promise<void>;
  addClass: (name: string, description?: string) => Promise<void>;
  removeClass: (id: string) => Promise<void>;
  addSection: (name: string, description?: string) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
  updateStudentSection: (studentId: string, sectionId: string | null) => Promise<void>;
  setCurrentClass: (id: string | null) => void;
  setCurrentSection: (id: string | null) => void;
  recordParticipation: (studentId: string, duration: number, quality: ParticipationQuality, keywords: string[], confidence: number) => Promise<void>;
  startTracking: () => void;
  stopTracking: () => void;
  updateRankings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      students: [],
      participationRecords: [],
      classes: [],
      sections: [],
      currentClassId: null,
      currentSectionId: null,
      isTracking: false,
      settings: {
        nameDetectionMode: 'both' as NameDetectionMode,
        theme: 'system' as 'light' | 'dark' | 'system'
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set(state => ({
          settings: {
            ...state.settings,
            ...newSettings
          }
        }));
      },

      addStudent: async (firstName: string, lastName: string, sectionId: string | null) => {
        const newStudent: Student = {
          id: crypto.randomUUID(),
          firstName,
          lastName,
          participationCount: 0,
          lastParticipation: null,
          rank: 0,
          totalScore: 0,
          classRecords: {},
          sectionId,
          protected: true
        };
        
        await db.students.add(newStudent);
        set(state => ({
          students: [...state.students, newStudent]
        }));
        toast.success(`Added student: ${firstName} ${lastName}`);
      },

      toggleStudentProtection: async (id: string) => {
        const student = get().students.find(s => s.id === id);
        if (student) {
          const updatedStudent = { ...student, protected: !student.protected };
          await db.students.put(updatedStudent);
          set(state => ({
            students: state.students.map(s => s.id === id ? updatedStudent : s)
          }));
          toast.success(`${student.firstName} ${student.lastName} is now ${updatedStudent.protected ? 'protected' : 'unprotected'}`);
        }
      },

      removeStudent: async (id: string) => {
        const student = get().students.find(s => s.id === id);
        if (!student) return;

        if (student.protected) {
          toast.error('Cannot delete a protected student record');
          return;
        }

        await db.students.delete(id);
        await db.participationRecords.where('studentId').equals(id).delete();
        
        set(state => ({
          students: state.students.filter(s => s.id !== id),
          participationRecords: state.participationRecords.filter(r => r.studentId !== id)
        }));
        toast.success('Student removed');
      },

      addSection: async (name: string, description?: string) => {
        const newSection: Section = {
          id: crypto.randomUUID(),
          name,
          description,
          createdAt: new Date()
        };
        
        await db.sections.add(newSection);
        set(state => ({
          sections: [...state.sections, newSection]
        }));
        toast.success(`Added section: ${name}`);
      },

      removeSection: async (id: string) => {
        await db.sections.delete(id);
        
        const { students } = get();
        const updatedStudents = students.map(student => 
          student.sectionId === id ? { ...student, sectionId: null } : student
        );
        
        await Promise.all(updatedStudents.map(student => db.students.put(student)));
        
        set(state => ({
          sections: state.sections.filter(s => s.id !== id),
          students: updatedStudents,
          currentSectionId: state.currentSectionId === id ? null : state.currentSectionId
        }));
        toast.success('Section removed');
      },

      updateStudentSection: async (studentId: string, sectionId: string | null) => {
        const { students } = get();
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          const updatedStudent = { ...student, sectionId };
          await db.students.put(updatedStudent);
          
          set(state => ({
            students: state.students.map(s => s.id === studentId ? updatedStudent : s)
          }));
          
          const sectionName = sectionId 
            ? get().sections.find(s => s.id === sectionId)?.name 
            : 'No Section';
          toast.success(`Updated ${student.firstName}'s section to ${sectionName}`);
        }
      },

      addClass: async (name: string, description?: string) => {
        const newClass: Class = {
          id: crypto.randomUUID(),
          name,
          description,
          createdAt: new Date()
        };
        
        await db.classes.add(newClass);
        set(state => ({
          classes: [...state.classes, newClass]
        }));
        toast.success(`Added class: ${name}`);
      },

      removeClass: async (id: string) => {
        await db.classes.delete(id);
        await db.participationRecords.where('classId').equals(id).delete();
        
        const { students } = get();
        const updatedStudents = students.map(student => {
          const { [id]: _, ...remainingRecords } = student.classRecords;
          return {
            ...student,
            classRecords: remainingRecords
          };
        });
        
        await Promise.all(updatedStudents.map(student => db.students.put(student)));
        
        set(state => ({
          classes: state.classes.filter(c => c.id !== id),
          students: updatedStudents,
          currentClassId: state.currentClassId === id ? null : state.currentClassId
        }));
        toast.success('Class removed');
      },

      setCurrentClass: (id: string | null) => {
        set({ currentClassId: id });
        if (id) {
          const className = get().classes.find(c => c.id === id)?.name;
          toast.success(`Switched to class: ${className}`);
        }
      },

      setCurrentSection: (id: string | null) => {
        set({ currentSectionId: id });
        if (id) {
          const sectionName = get().sections.find(s => s.id === id)?.name;
          toast.success(`Filtered by section: ${sectionName}`);
        } else {
          toast.success('Cleared section filter');
        }
      },

      recordParticipation: async (studentId: string, duration: number, quality: ParticipationQuality, keywords: string[], confidence: number) => {
        const { currentClassId } = get();
        if (!currentClassId) {
          toast.error('Please select a class first');
          return;
        }

        const newRecord: ParticipationRecord = {
          id: crypto.randomUUID(),
          studentId,
          timestamp: new Date(),
          duration,
          quality,
          keywords,
          confidence,
          classId: currentClassId
        };
        
        await db.participationRecords.add(newRecord);
        
        const student = get().students.find(s => s.id === studentId);
        if (student) {
          const updatedStudent = {
            ...student,
            participationCount: student.participationCount + 1,
            lastParticipation: new Date(),
            totalScore: student.totalScore + quality.score,
            classRecords: {
              ...student.classRecords,
              [currentClassId]: {
                participationCount: (student.classRecords[currentClassId]?.participationCount || 0) + 1,
                lastParticipation: new Date(),
                rank: student.classRecords[currentClassId]?.rank || 0,
                totalScore: (student.classRecords[currentClassId]?.totalScore || 0) + quality.score
              }
            }
          };
          
          await db.students.put(updatedStudent);
          
          set(state => ({
            participationRecords: [...state.participationRecords, newRecord],
            students: state.students.map(s => s.id === studentId ? updatedStudent : s)
          }));
          
          notificationManager.notifyParticipation(updatedStudent, quality);
          
          toast.success(`Participation recorded for ${student.firstName} ${student.lastName}`);
          await get().updateRankings();

          const now = new Date();
          const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
          const lowParticipationStudents = get().students.filter(s => 
            !s.classRecords[currentClassId]?.lastParticipation || 
            s.classRecords[currentClassId].lastParticipation < thirtyMinutesAgo
          );
          
          if (lowParticipationStudents.length > 0) {
            notificationManager.notifyLowParticipation(lowParticipationStudents);
          }
        }
      },

      startTracking: () => {
        if (!get().currentClassId) {
          toast.error('Please select a class first');
          return;
        }
        set({ isTracking: true });
        toast.success('Started tracking participation');
        notificationManager.notifyAudioDevice('Started tracking participation');
      },

      stopTracking: () => {
        set({ isTracking: false });
        toast.success('Stopped tracking participation');
        notificationManager.notifyAudioDevice('Stopped tracking participation');
      },

      updateRankings: async () => {
        const { students, currentClassId, currentSectionId } = get();
        
        // Filter students by section if one is selected
        const sectionStudents = currentSectionId
          ? students.filter(s => s.sectionId === currentSectionId)
          : students;
        
        const sortedStudents = [...sectionStudents].sort((a, b) => b.totalScore - a.totalScore);
        
        const updatedStudents = students.map(student => {
          const isInSection = !currentSectionId || student.sectionId === currentSectionId;
          const newRank = isInSection
            ? sortedStudents.findIndex(s => s.id === student.id) + 1
            : student.rank;

          const updatedStudent = {
            ...student,
            rank: newRank
          };

          if (currentClassId && student.classRecords[currentClassId]) {
            const classStudents = sortedStudents
              .filter(s => s.classRecords[currentClassId])
              .sort((a, b) => 
                (b.classRecords[currentClassId]?.totalScore || 0) - 
                (a.classRecords[currentClassId]?.totalScore || 0)
              );
            
            const classRank = classStudents.findIndex(s => s.id === student.id) + 1;
            
            if (student.classRecords[currentClassId].rank !== 0 && 
                student.classRecords[currentClassId].rank !== classRank) {
              notificationManager.notifyRankingChange(
                student, 
                student.classRecords[currentClassId].rank, 
                classRank
              );
            }

            updatedStudent.classRecords[currentClassId] = {
              ...student.classRecords[currentClassId],
              rank: classRank
            };
          }

          if (student.rank !== 0 && student.rank !== newRank) {
            notificationManager.notifyRankingChange(student, student.rank, newRank);
          }

          return updatedStudent;
        });
        
        await Promise.all(updatedStudents.map(student => db.students.put(student)));
        set({ students: updatedStudents });
      }
    }),
    {
      name: 'participation-storage'
    }
  )
);

export { useStore };
import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, Trash2, Trophy, Medal, ChevronDown, Folder, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { PARTICIPATION_QUALITIES, Student } from '../types';
import { toast } from 'react-hot-toast';

export const StudentList: React.FC = () => {
  const { 
    students, 
    addStudent, 
    removeStudent, 
    recordParticipation,
    participationRecords,
    currentSectionId,
    currentClassId,
    sections 
  } = useStore();
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(currentSectionId);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentFirstName.trim() && newStudentLastName.trim()) {
      addStudent(newStudentFirstName.trim(), newStudentLastName.trim(), selectedSection);
      setNewStudentFirstName('');
      setNewStudentLastName('');
      firstNameRef.current?.focus();
    } else {
      toast.error('Please enter both first and last name');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'firstName' | 'lastName' | 'section') => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      switch (field) {
        case 'firstName':
          lastNameRef.current?.focus();
          break;
        case 'lastName':
          sectionRef.current?.focus();
          break;
        case 'section':
          if (newStudentFirstName && newStudentLastName) {
            handleAddStudent(e as any);
          }
          break;
      }
    }
  };

  const getLastParticipation = (studentId: string) => {
    const records = participationRecords
      .filter(record => 
        record.studentId === studentId && 
        record.classId === currentClassId
      )
      .sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    return records[0];
  };

  const getRankIcon = (student: Student) => {
    const rank = currentClassId 
      ? student.classRecords[currentClassId]?.rank || 0
      : student.rank;

    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={20} />;
      case 2:
        return <Medal className="text-gray-400" size={20} />;
      case 3:
        return <Medal className="text-amber-600" size={20} />;
      default:
        return null;
    }
  };

  const formatLastParticipation = (date: Date | null | string) => {
    if (!date) return null;
    const participationDate = date instanceof Date ? date : new Date(date);
    return formatDistanceToNow(participationDate, { addSuffix: true });
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Group students by section
  const groupedStudents: Record<string | 'unsectioned', Student[]> = {
    unsectioned: students.filter(s => !s.sectionId)
  };

  sections.forEach(section => {
    groupedStudents[section.id] = students.filter(s => s.sectionId === section.id);
  });

  // Sort students within each section by score
  Object.values(groupedStudents).forEach(sectionStudents => {
    sectionStudents.sort((a, b) => {
      if (currentClassId) {
        return (b.classRecords[currentClassId]?.totalScore || 0) - 
               (a.classRecords[currentClassId]?.totalScore || 0);
      }
      return b.totalScore - a.totalScore;
    });
  });

  const renderStudent = (student: Student) => {
    const lastParticipation = getLastParticipation(student.id);
    const classRecord = currentClassId ? student.classRecords[currentClassId] : null;
    const lastParticipationFormatted = formatLastParticipation(
      classRecord?.lastParticipation || student.lastParticipation
    );
    
    return (
      <div
        key={student.id}
        className="flex items-center justify-between p-4 bg-white dark:bg-dark-800 rounded-lg shadow transition-all hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          {getRankIcon(student)}
          <div>
            <h3 className="text-lg font-semibold dark:text-white">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentClassId ? (
                <>
                  Class Score: {classRecord?.totalScore || 0}
                  <span className="mx-2">•</span>
                  Class Participations: {classRecord?.participationCount || 0}
                </>
              ) : (
                <>
                  Total Score: {student.totalScore}
                  <span className="mx-2">•</span>
                  Total Participations: {student.participationCount}
                </>
              )}
              {lastParticipationFormatted && lastParticipation && (
                <span className="ml-2">
                  • Last: {lastParticipationFormatted} ({lastParticipation.quality.keyword})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {PARTICIPATION_QUALITIES.map(quality => (
              <button
                key={quality.keyword}
                onClick={() => {
                  if (!currentClassId) {
                    toast.error('Please select a class first');
                    return;
                  }
                  recordParticipation(
                    student.id,
                    60,
                    quality,
                    [],
                    1.0
                  );
                  toast.success(`${quality.keyword} participation recorded for ${student.firstName}`);
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${quality.color} bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors`}
                title={quality.description}
              >
                {quality.keyword}
              </button>
            ))}
          </div>
          <button
            onClick={() => removeStudent(student.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Remove Student"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {!currentClassId && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
          <AlertCircle size={20} />
          <p>Please select a class to start tracking participation</p>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                ref={firstNameRef}
                id="firstName"
                type="text"
                value={newStudentFirstName}
                onChange={(e) => setNewStudentFirstName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'firstName')}
                placeholder="Enter first name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-800 dark:border-dark-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                ref={lastNameRef}
                id="lastName"
                type="text"
                value={newStudentLastName}
                onChange={(e) => setNewStudentLastName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'lastName')}
                placeholder="Enter last name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-800 dark:border-dark-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section (Optional)
              </label>
              <select
                ref={sectionRef}
                id="section"
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(e.target.value || null)}
                onKeyDown={(e) => handleKeyDown(e, 'section')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-800 dark:border-dark-600 dark:text-white"
              >
                <option value="">No Section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <UserPlus size={20} />
                Add Student
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {sections.map(section => {
          const sectionStudents = groupedStudents[section.id];
          if (!sectionStudents?.length) return null;
          
          const isCollapsed = collapsedSections.has(section.id);
          
          return (
            <div key={section.id} className="space-y-2">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="text-purple-500" size={20} />
                  <h2 className="text-lg font-semibold dark:text-white">
                    {section.name}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({sectionStudents.length} students)
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform ${
                    isCollapsed ? '' : 'rotate-180'
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-2 pl-2">
                  {sectionStudents.map(renderStudent)}
                </div>
              )}
            </div>
          );
        })}

        {groupedStudents.unsectioned.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 p-3">
              Unsectioned Students ({groupedStudents.unsectioned.length})
            </h2>
            <div className="space-y-2">
              {groupedStudents.unsectioned.map(renderStudent)}
            </div>
          </div>
        )}

        {Object.values(groupedStudents).every(group => group.length === 0) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No students added yet
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Settings2, Sun, Moon, Monitor, Plus, Check, XCircle, Edit2, Trash2, Lock, FileText, Star, Award, ChevronDown, Users, Search, Filter, SortAsc, SortDesc, UserPlus, Download, Folder } from 'lucide-react';
import { useStore } from '../store';
import { ThemeToggle } from './ThemeToggle';
import { NameSettings } from './NameSettings';
import { Student, Section, PARTICIPATION_QUALITIES, ParticipationQuality, VOICE_COMMANDS } from '../types';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export const Settings: React.FC = () => {
  const { 
    students,
    sections,
    removeSection,
    addSection,
    updateStudentSection,
    removeStudent,
    toggleStudentProtection,
    participationRecords,
    currentClassId
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [expandedQuality, setExpandedQuality] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'score' | 'participations'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showProtectedOnly, setShowProtectedOnly] = useState(false);

  const getStudentsWithQuality = (quality: ParticipationQuality) => {
    const studentMap = new Map<string, { count: number, lastTime: Date }>();
    
    participationRecords
      .filter(record => record.quality.keyword === quality.keyword)
      .forEach(record => {
        const timestamp = record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp);
        const existing = studentMap.get(record.studentId);
        if (!existing || timestamp > existing.lastTime) {
          studentMap.set(record.studentId, {
            count: (existing?.count || 0) + 1,
            lastTime: timestamp
          });
        }
      });

    return Array.from(studentMap.entries())
      .map(([studentId, data]) => ({
        student: students.find(s => s.id === studentId)!,
        count: data.count,
        lastTime: data.lastTime
      }))
      .filter(item => item.student)
      .sort((a, b) => b.count - a.count);
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student => 
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term)
      );
    }

    if (selectedSection) {
      result = result.filter(student => student.sectionId === selectedSection);
    }

    if (showProtectedOnly) {
      result = result.filter(student => student.protected);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
          break;
        case 'score':
          comparison = (currentClassId ? 
            (b.classRecords[currentClassId]?.totalScore || 0) - (a.classRecords[currentClassId]?.totalScore || 0) :
            b.totalScore - a.totalScore);
          break;
        case 'participations':
          comparison = (currentClassId ?
            (b.classRecords[currentClassId]?.participationCount || 0) - (a.classRecords[currentClassId]?.participationCount || 0) :
            b.participationCount - a.participationCount);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, searchTerm, selectedSection, showProtectedOnly, sortField, sortDirection, currentClassId]);

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      addSection(newSectionName.trim());
      setNewSectionName('');
      setShowNewSectionForm(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent({ ...student });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    await updateStudentSection(editingStudent.id, editingStudent.sectionId);
    setEditingStudent(null);
    toast.success('Student updated successfully');
  };

  const handleDeleteStudent = async (student: Student) => {
    if (student.protected) {
      const confirm = window.confirm(
        'This student is protected. Are you sure you want to remove them? This action cannot be undone.'
      );
      if (!confirm) return;
    }
    await removeStudent(student.id);
  };

  const handleExportData = () => {
    const data = students.map(student => ({
      firstName: student.firstName,
      lastName: student.lastName,
      section: sections.find(s => s.id === student.sectionId)?.name || 'Unsectioned',
      totalScore: student.totalScore,
      participationCount: student.participationCount,
      protected: student.protected
    }));

    const csv = [
      ['First Name', 'Last Name', 'Section', 'Total Score', 'Participations', 'Protected'].join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkImport = () => {
    const lines = bulkImportText.split('\n');
    const processed = lines.map(line => {
      const [firstName, lastName, section] = line.split(',').map(s => s.trim());
      return { firstName, lastName, section };
    });

    console.log('Bulk import:', processed);
    setShowBulkImport(false);
    setBulkImportText('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
        title="Settings"
      >
        <Settings2 size={24} />
      </button>

      {showSettings && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowSettings(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-[48rem] bg-white dark:bg-dark-800 rounded-lg shadow-lg z-50 max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</h4>
                  <ThemeToggle />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name Detection</h4>
                  <NameSettings />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Teacher's Guide</h4>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Voice Commands</h5>
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-dark-600 rounded-lg p-3">
                          <h6 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Recording Controls</h6>
                          <ul className="space-y-2 text-sm">
                            {VOICE_COMMANDS.START_RECORDING.map(command => (
                              <li key={command} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 font-mono">
                                  "{command}"
                                </span>
                                <span>- Start recording participation</span>
                              </li>
                            ))}
                            {VOICE_COMMANDS.STOP_RECORDING.map(command => (
                              <li key={command} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 font-mono">
                                  "{command}"
                                </span>
                                <span>- Stop recording participation</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-dark-600 rounded-lg p-3">
                          <h6 className="font-medium text-purple-600 dark:text-purple-400 mb-2">Participation Triggers</h6>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Use these words with a student's name to record participation:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {VOICE_COMMANDS.PARTICIPATION_TRIGGERS.map(trigger => (
                              <span 
                                key={trigger}
                                className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded text-purple-600 dark:text-purple-400 text-sm font-mono"
                              >
                                "{trigger}"
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Example: "John Smith answers thoughtfully"
                          </p>
                        </div>

                        <div className="bg-white dark:bg-dark-600 rounded-lg p-3">
                          <h6 className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">Quality Keywords</h6>
                          <div className="space-y-3">
                            {PARTICIPATION_QUALITIES.map(quality => (
                              <div key={quality.keyword} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${quality.color}`}>
                                    {quality.keyword}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    (+{quality.score} points)
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {quality.voiceCommands.map(command => (
                                    <span 
                                      key={command}
                                      className={`px-2 py-1 ${quality.color.replace('text-', 'bg-')} bg-opacity-10 dark:bg-opacity-20 rounded text-sm font-mono`}
                                    >
                                      "{command}"
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Keyboard Shortcuts</h5>
                      <div className="bg-white dark:bg-dark-600 rounded-lg p-3">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                            <span>Start/Stop Recording</span>
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-500 rounded font-mono">Space</kbd>
                          </li>
                          <li className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                            <span>Quick Add Student</span>
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-500 rounded font-mono">Ctrl + A</kbd>
                          </li>
                          <li className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                            <span>Toggle Settings</span>
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-500 rounded font-mono">Ctrl + ,</kbd>
                          </li>
                          <li className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                            <span>Switch Class</span>
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-500 rounded font-mono">Ctrl + K</kbd>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Tips & Best Practices</h5>
                      <div className="bg-white dark:bg-dark-600 rounded-lg p-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <p>• Speak clearly and at a normal pace when using voice commands</p>
                        <p>• Use full names for better student recognition accuracy</p>
                        <p>• Quality keywords can be used in any order with the student's name</p>
                        <p>• Monitor the audio indicator to ensure your microphone is working</p>
                        <p>• Use keyboard shortcuts for quick actions during active teaching</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participation Qualities</h4>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="space-y-3">
                      {PARTICIPATION_QUALITIES.map(quality => {
                        const studentsWithQuality = getStudentsWithQuality(quality);
                        const isExpanded = expandedQuality === quality.keyword;
                        
                        return (
                          <div 
                            key={quality.keyword}
                            className="bg-white dark:bg-dark-600 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedQuality(isExpanded ? null : quality.keyword)}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-dark-500 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${quality.color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')} bg-opacity-10 dark:bg-opacity-20`}>
                                  {quality.score >= 4 ? <Star size={16} className={quality.color} /> : <Award size={16} className={quality.color} />}
                                </div>
                                <div>
                                  <div className={`font-medium ${quality.color}`}>
                                    {quality.keyword}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {quality.description}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded-full text-sm font-medium ${quality.color} bg-opacity-10 dark:bg-opacity-20`}>
                                  +{quality.score} pts
                                </div>
                                {studentsWithQuality.length > 0 && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Users size={14} />
                                    {studentsWithQuality.length}
                                  </div>
                                )}
                                <ChevronDown 
                                  size={16} 
                                  className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </div>
                            </button>
                            
                            {isExpanded && studentsWithQuality.length > 0 && (
                              <div className="border-t dark:border-dark-500 divide-y dark:divide-dark-500">
                                {studentsWithQuality.map(({ student, count, lastTime }) => (
                                  <div 
                                    key={student.id}
                                    className="flex items-center justify-between p-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-500"
                                  >
                                    <span className="font-medium dark:text-white">
                                      {student.firstName} {student.lastName}
                                    </span>
                                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                      <span>{count}x</span>
                                      <span>Last: {formatDistanceToNow(lastTime, { addSuffix: true })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Student Masterlist</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                      <button
                        onClick={() => setShowBulkImport(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FileText size={16} />
                        Bulk Import
                      </button>
                    </div>
                  </div>

                  {showBulkImport && (
                    <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg mb-4">
                      <textarea
                        value={bulkImportText}
                        onChange={(e) => setBulkImportText(e.target.value)}
                        placeholder="Enter student data (First Name, Last Name, Section)"
                        className="w-full h-32 p-2 border rounded dark:bg-dark-600 dark:border-dark-500 dark:text-white"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setShowBulkImport(false)}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBulkImport}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Import
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search students..."
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                        />
                      </div>
                      <select
                        value={selectedSection || ''}
                        onChange={(e) => setSelectedSection(e.target.value || null)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      >
                        <option value="">All Sections</option>
                        {sections.map(section => (
                          <option key={section.id} value={section.id}>{section.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg"
                      >
                        {sortDirection === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                      </button>
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as any)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="score">Sort by Score</option>
                        <option value="participations">Sort by Participations</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                      <div className="space-y-2">
                        {filteredStudents.map(student => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-500 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {student.protected && (
                                  <Lock size={16} className="text-blue-500" />
                                )}
                                <span className="font-medium dark:text-white">
                                  {student.lastName}, {student.firstName}
                                </span>
                              </div>
                              {student.sectionId && (
                                <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                                  <Folder size={14} />
                                  {sections.find(s => s.id === student.sectionId)?.name}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Score: {currentClassId ? 
                                  student.classRecords[currentClassId]?.totalScore || 0 :
                                  student.totalScore
                                }
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Participations: {currentClassId ?
                                  student.classRecords[currentClassId]?.participationCount || 0 :
                                  student.participationCount
                                }
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditStudent(student)}
                                  className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => toggleStudentProtection(student.id)}
                                  className={`p-1 ${
                                    student.protected ?
                                    'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
                                    'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  } rounded`}
                                >
                                  <Lock size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredStudents.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No students found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {showNewSectionForm ? (
                      <form onSubmit={handleAddSection} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="Section name"
                          className="flex-1 border rounded px-3 py-1.5 dark:bg-dark-600 dark:border-dark-500 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewSectionForm(false)}
                          className="px-3 py-1.5 text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowNewSectionForm(true)}
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                      >
                        <Plus size={16} />
                        Add Section
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
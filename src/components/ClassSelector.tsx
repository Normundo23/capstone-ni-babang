import React, { useState } from 'react';
import { useStore } from '../store';
import { PlusCircle, GraduationCap, ChevronDown, X, FolderPlus, Folder } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ClassSelector: React.FC = () => {
  const { 
    classes, 
    addClass, 
    removeClass, 
    currentClassId, 
    setCurrentClass, 
    sections, 
    addSection, 
    removeSection,
    currentSectionId,
    setCurrentSection 
  } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      addClass(newClassName.trim());
      setNewClassName('');
      setShowAddForm(false);
      toast.success(`Added class: ${newClassName.trim()}`);
    }
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim()) {
      addSection(newSectionName.trim());
      setNewSectionName('');
      setShowSectionForm(false);
      toast.success(`Added section: ${newSectionName.trim()}`);
    }
  };

  const currentClass = classes.find(c => c.id === currentClassId);
  const currentSection = sections.find(s => s.id === currentSectionId);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium dark:text-white">
              {currentClass ? currentClass.name : 'Select Class'}
            </span>
            <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          {currentSection && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg">
              <Folder size={16} />
              <span className="font-medium">{currentSection.name}</span>
              <button
                onClick={() => setCurrentSection(null)}
                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-full"
                title="Clear section filter"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Add New Class"
          >
            <PlusCircle size={24} />
          </button>
          <button
            onClick={() => setShowSectionForm(true)}
            className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            title="Add New Section"
          >
            <FolderPlus size={24} />
          </button>
        </div>
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-lg z-50 divide-y divide-gray-100 dark:divide-dark-700">
          {/* Classes */}
          <div className="p-2 space-y-1">
            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Classes
            </div>
            {classes.map(classItem => (
              <div
                key={classItem.id}
                className="flex items-center justify-between group"
              >
                <button
                  onClick={() => {
                    setCurrentClass(classItem.id);
                    setShowDropdown(false);
                    toast.success(`Switched to ${classItem.name}`);
                  }}
                  className={`flex-1 px-3 py-2 text-left rounded-lg transition-colors ${
                    currentClassId === classItem.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white'
                  }`}
                >
                  {classItem.name}
                </button>
                <button
                  onClick={() => removeClass(classItem.id)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                  title="Remove Class"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No classes added yet</p>
            )}
          </div>

          {/* Sections */}
          <div className="p-2 space-y-1">
            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sections
            </div>
            {sections.map(section => (
              <div
                key={section.id}
                className="flex items-center justify-between group"
              >
                <button
                  onClick={() => {
                    setCurrentSection(section.id);
                    setShowDropdown(false);
                    toast.success(`Filtered by section: ${section.name}`);
                  }}
                  className={`flex-1 px-3 py-2 text-left rounded-lg dark:text-white flex items-center gap-2 transition-colors ${
                    currentSectionId === section.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <Folder size={16} className="text-purple-500 dark:text-purple-400" />
                  {section.name}
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                  title="Remove Section"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No sections added yet</p>
            )}
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Add New Class</h3>
            <form onSubmit={handleAddClass}>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Enter class name"
                className="w-full px-4 py-2 border dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewClassName('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Add New Section</h3>
            <form onSubmit={handleAddSection}>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Enter section name"
                className="w-full px-4 py-2 border dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:text-white mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionForm(false);
                    setNewSectionName('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
import Dexie, { Table } from 'dexie';
import { Student, ParticipationRecord, Class, Section } from './types';

export class ParticipationDB extends Dexie {
  students!: Table<Student>;
  participationRecords!: Table<ParticipationRecord>;
  classes!: Table<Class>;
  sections!: Table<Section>;

  constructor() {
    super('ParticipationDB');
    this.version(4).stores({
      students: 'id, firstName, lastName, participationCount, lastParticipation, rank, totalScore, classRecords, sectionId, protected',
      participationRecords: 'id, studentId, timestamp, duration, quality, keywords, confidence, classId',
      classes: 'id, name, createdAt',
      sections: 'id, name, createdAt'
    });
  }
}

export const db = new ParticipationDB();
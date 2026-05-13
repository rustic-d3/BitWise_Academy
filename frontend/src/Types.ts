export interface Student {
  id: number;
  full_name: string;
  credits: number;
  parent: number;
}

export interface Lesson {
  id: number;
  date_time: string;
  is_canceled: boolean;
  skipped_by: number[];
}

export interface Classroom {
  id: number;
  titlu: string;
  students: Student[];
  lessons: Lesson[];
  schedule_day: string;
  schedule_time: string;
  classroom_type: string;
  is_canceled: boolean;
}

export interface LessonWithClassroom extends Lesson {
  classroom: Classroom;
}

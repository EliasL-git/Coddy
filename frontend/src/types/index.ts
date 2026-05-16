export interface User {
  id: string;
  name: string;
  email: string;
  streak: number;
  xp: number;
  coins: number;
  completedLessons: string[];
  completedCourses: string[];
  achievements: Achievement[];
  role?: string;
  avatar?: string;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  examples: Example[];
  tasks: Task[];
  nextLessonSlug?: string;
  prevLessonSlug?: string;
  slugArray: string[];
}

export interface Example {
  title: string;
  code: string;
}

export interface Task {
  title: string;
  description: string;
  initialCode: string;
  solution: string;
  hints: string[];
  validation: Validation;
}

export interface Validation {
  test: string;
  expect: string;
}

export interface GraderFeedback {
  valid: boolean;
  fix?: string;
  aiPowered?: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
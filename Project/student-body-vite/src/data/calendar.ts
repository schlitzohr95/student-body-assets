import { ACADEMIC_TESTS } from "./academics";
import { timeChunk } from "./locations";
import type { CalendarEvent } from "../types/game";

const CLASS_DAYS = [1, 3, 8, 10, 15, 17, 22, 24];

export const BASE_CALENDAR_EVENTS: CalendarEvent[] = [
  ...CLASS_DAYS.map(day => ({
    id: `soc101_lecture_${day}`,
    title: "Intro Sociology Lecture",
    kind: "class" as const,
    day,
    startSlot: timeChunk(10),
    endSlot: timeChunk(11, 15),
    location: "lecture_hall",
    courseId: "soc101",
    source: "base-calendar",
    description: "Dr. Hale's lecture block. Attendance helps class rhythm and test prep.",
  })),
  {
    id: "soc101_reading_response_1",
    title: "Reading Response 1 Due",
    kind: "deadline",
    day: 5,
    startSlot: timeChunk(21),
    location: "dorm_room",
    courseId: "soc101",
    source: "base-calendar",
    description: "Short response on norms, belonging, and observation notes.",
  },
  {
    id: "club_fair_preview",
    title: "Club Fair Preview",
    kind: "social",
    day: 4,
    startSlot: timeChunk(16),
    endSlot: timeChunk(18),
    location: "student_union",
    source: "base-calendar",
    description: "A low-pressure way to see which campus circles are forming early.",
  },
];

export function academicTestCalendarEvents(): CalendarEvent[] {
  return ACADEMIC_TESTS.map(test => ({
    id: `test_${test.id}`,
    title: `${test.courseTitle}: ${test.label}`,
    kind: "test",
    day: test.day,
    startSlot: timeChunk(10),
    endSlot: timeChunk(11),
    location: test.location,
    courseId: test.courseId,
    testId: test.id,
    source: "academics",
    description: `Academic test. Prep affects difficulty and hints.`,
  }));
}

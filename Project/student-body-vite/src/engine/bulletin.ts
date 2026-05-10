import type { Choice, GameState } from "../types/game";
import { formatCalendarEventTime, getUpcomingCalendarEvents } from "./calendar";

export interface BulletinItem {
  id: string;
  kicker: string;
  title: string;
  body: string;
  action: Choice;
}

const STATIC_BULLETINS: BulletinItem[] = [
  {
    id: "study-group",
    kicker: "Academic",
    title: "SOC 101 study table",
    body: "A first-year study table is meeting near the Union couches. Low pressure, bring rough notes.",
    action: { id: "bulletin_study_group", label: "Save the study table" },
  },
  {
    id: "club-fair",
    kicker: "Campus",
    title: "Club fair preview",
    body: "The activities desk is collecting early interest before the full fair later this week.",
    action: { id: "bulletin_club_fair", label: "Mark club fair interest" },
  },
  {
    id: "part-time",
    kicker: "Work",
    title: "Part-time desk shifts",
    body: "The Union info desk needs evening coverage. It is not glamorous, but it pays.",
    action: { id: "bulletin_job_lead", label: "Copy the job lead" },
  },
];

export function getStudentUnionBulletinItems(state: GameState): BulletinItem[] {
  const calendarItems = getUpcomingCalendarEvents(state, 96 * 7)
    .filter(event => event.location === "student_union")
    .slice(0, 2)
    .map(event => ({
      id: `calendar-${event.id}`,
      kicker: event.kind,
      title: event.title,
      body: `${formatCalendarEventTime(event)}. ${event.description || "Posted on the Union board."}`,
      action: { id: `bulletin_event_${event.id}`, label: "Pin this event" },
    }));

  return [...calendarItems, ...STATIC_BULLETINS].slice(0, 5);
}

export type ConnectionType =
  | "Close family"
  | "Work colleague"
  | "Romantic partner"
  | "Hobby buddy"
  | "New connection"
  | "Solo goal";

export type Person = {
  id: string;
  name: string;
  relation: "Family" | "Friend" | "Colleague" | "Mom's circle";
  connectionType: ConnectionType;
  goal: string;
  exampleIdea: string;
  cadence: string;
  lastMet?: string;
  avatarColor: string;
  initials: string;
  status?: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string; // ISO
  time: string;
  location: string;
  attendees: string[];
  emoji: string;
  type: "Brunch" | "Walk" | "Dinner" | "Call" | "Birthday" | "Trip";
  visibility: "public" | "private";
};

export type BusyBlock = {
  id: string;
  date: string;
  start: number; // hour 0-23
  end: number;
  label: string;
  kind: "work" | "personal" | "family";
};

export type Announcement = {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  title: string;
  body: string;
  visibility: "public" | "private";
  createdAt: string;
};

export type Reminder = {
  id: string;
  title: string;
  when: string;
  kind: "rsvp" | "leave" | "gift" | "ai";
};

export const people: Person[] = [
  {
    id: "p1", name: "Mom", relation: "Family", avatarColor: "14 88% 62%", initials: "M",
    connectionType: "Close family", goal: "Quality time, mild outdoor",
    exampleIdea: "Mushroom walk in Nordmarka", cadence: "1×/month",
    lastMet: "2 weeks ago", status: "Free Sat afternoon",
  },
  {
    id: "p2", name: "Dad", relation: "Family", avatarColor: "32 80% 60%", initials: "D",
    connectionType: "Close family", goal: "Cook together, low-key evenings",
    exampleIdea: "Sunday pasta night", cadence: "2×/month", lastMet: "1 week ago",
  },
  {
    id: "p3", name: "Aunt Lila", relation: "Mom's circle", avatarColor: "265 60% 70%", initials: "AL",
    connectionType: "Close family", goal: "Brunch & gossip",
    exampleIdea: "Café Lumière, late morning", cadence: "1×/month",
    lastMet: "5 weeks ago", status: "Loves brunch",
  },
  {
    id: "p4", name: "Priya (work)", relation: "Colleague", avatarColor: "190 70% 50%", initials: "P",
    connectionType: "Work colleague", goal: "Career growth, UX events",
    exampleIdea: "Oslo UX Meetup, May 14th 18:00", cadence: "1×/month", lastMet: "3 weeks ago",
  },
  {
    id: "p5", name: "Sam", relation: "Friend", avatarColor: "152 55% 45%", initials: "S",
    connectionType: "Hobby buddy", goal: "Learn pottery together",
    exampleIdea: "Local clay studio, Tue evenings", cadence: "weekly",
    lastMet: "4 days ago", status: "Down for hikes",
  },
  {
    id: "p6", name: "Noor", relation: "Friend", avatarColor: "340 70% 60%", initials: "N",
    connectionType: "Romantic partner", goal: "Date night, mix of active & cosy",
    exampleIdea: "Sunset bike ride + ramen", cadence: "2×/month", lastMet: "Yesterday",
  },
  {
    id: "p7", name: "Uncle Raj", relation: "Family", avatarColor: "25 60% 45%", initials: "UR",
    connectionType: "Close family", goal: "Long phone calls",
    exampleIdea: "Sunday call after lunch", cadence: "1×/month", lastMet: "6 weeks ago",
  },
  {
    id: "p8", name: "Maya", relation: "Mom's circle", avatarColor: "210 60% 60%", initials: "MA",
    connectionType: "New connection", goal: "Match with strangers, same interests",
    exampleIdea: "Group brunch with mom's circle", cadence: "occasional", lastMet: "Just met",
  },
];

// Today = Sat Apr 18, 2026. "Tomorrow" events are Sun Apr 19.
export const events: EventItem[] = [
  {
    id: "e1",
    title: "Sunday brunch with Mom & Aunt Lila",
    date: "2026-04-19",
    time: "11:00",
    location: "Café Lumière",
    attendees: ["p1", "p3", "p8"],
    emoji: "🥐",
    type: "Brunch",
    visibility: "private",
  },
  {
    id: "e2",
    title: "Park walk with Sam",
    date: "2026-04-20",
    time: "07:30",
    location: "Riverside Park",
    attendees: ["p5"],
    emoji: "🌳",
    type: "Walk",
    visibility: "private",
  },
  {
    id: "e3",
    title: "Dad's birthday dinner",
    date: "2026-04-25",
    time: "19:30",
    location: "Home",
    attendees: ["p1", "p2", "p7"],
    emoji: "🎂",
    type: "Birthday",
    visibility: "private",
  },
  {
    id: "e4",
    title: "Team coffee — Priya",
    date: "2026-04-22",
    time: "10:00",
    location: "Blue Bottle, 5th",
    attendees: ["p4"],
    emoji: "☕",
    type: "Call",
    visibility: "private",
  },
];

// Saturday Apr 18 busy blocks (today)
export const busyBlocks: BusyBlock[] = [
  { id: "b1", date: "2026-04-18", start: 8, end: 9, label: "Mom's yoga (drop-off)", kind: "family" },
  { id: "b2", date: "2026-04-18", start: 10, end: 11, label: "Design review", kind: "work" },
  { id: "b3", date: "2026-04-18", start: 14, end: 15, label: "Grocery run", kind: "personal" },
  { id: "b4", date: "2026-04-18", start: 17, end: 18, label: "Call with Noor", kind: "personal" },
];

export const announcements: Announcement[] = [
  {
    id: "a1",
    author: "Mom",
    authorInitials: "M",
    authorColor: "14 88% 62%",
    title: "Sunday lunch is on!",
    body: "Bringing the lasagna. Aunt Lila will pick up dessert.",
    visibility: "private",
    createdAt: "2h ago",
  },
  {
    id: "a2",
    author: "You",
    authorInitials: "A",
    authorColor: "14 88% 62%",
    title: "Weekend hike — open invite",
    body: "Anyone free Saturday 8am? Easy 5km loop.",
    visibility: "public",
    createdAt: "Yesterday",
  },
];

export const reminders: Reminder[] = [
  { id: "r1", title: "RSVP to Aunt Lila's brunch", when: "Today, 6pm", kind: "rsvp" },
  { id: "r2", title: "Leave for park walk", when: "Tomorrow, 7:10am", kind: "leave" },
  { id: "r3", title: "Pick up gift for Dad", when: "Thu, 5pm", kind: "gift" },
  { id: "r4", title: "AI found a free slot Friday 6pm", when: "Now", kind: "ai" },
];

export const interestsList = [
  "Brunch", "Hiking", "Coffee", "Cooking", "Movies", "Board games",
  "Yoga", "Concerts", "Travel", "Reading", "Photography", "Volunteering",
];

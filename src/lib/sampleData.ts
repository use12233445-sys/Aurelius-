import type { Assignment, Note, StudySession } from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function makeSampleNotes(): Note[] {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: "Big-O Notation Basics",
      subject: "Algorithms",
      content:
        "Big-O describes an upper bound on runtime as input grows.\n\nCommon orders:\n- O(1) constant\n- O(log n) logarithmic\n- O(n) linear\n- O(n log n) linearithmic\n- O(n^2) quadratic\n\nDrop constants and lower-order terms. Focus on the dominant term as n → ∞.",
      createdAt: now - 86400000 * 3,
      updatedAt: now - 3600000,
    },
    {
      id: uid(),
      title: "Newton's Three Laws",
      subject: "Physics I",
      content:
        "1. An object at rest stays at rest unless acted on by a net force.\n2. F = m a.\n3. For every action there is an equal and opposite reaction.",
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: uid(),
      title: "The French Revolution - Timeline",
      subject: "World History",
      content:
        "1789: Storming of the Bastille.\n1791: Flight to Varennes.\n1792: Monarchy abolished.\n1793: Louis XVI executed.\n1799: Napoleon's coup.",
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 4,
    },
    {
      id: uid(),
      title: "Linear Regression Assumptions",
      subject: "Statistics",
      content:
        "1. Linearity\n2. Independence\n3. Homoscedasticity\n4. Normality of residuals\n5. No multicollinearity",
      createdAt: now - 86400000,
      updatedAt: now - 3600000 * 2,
    },
  ];
}

export function makeSampleAssignments(): Assignment[] {
  return [
    {
      id: uid(),
      title: "Problem Set 4: Sorting Algorithms",
      subject: "Algorithms",
      dueDate: iso(2),
      priority: "high",
      completed: false,
      createdAt: Date.now() - 86400000,
    },
    {
      id: uid(),
      title: "Lab Report: Pendulum Motion",
      subject: "Physics I",
      dueDate: iso(5),
      priority: "medium",
      completed: false,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: uid(),
      title: "Essay: Causes of WWI",
      subject: "World History",
      dueDate: iso(8),
      priority: "medium",
      completed: false,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: uid(),
      title: "Read Ch. 7: Hypothesis Testing",
      subject: "Statistics",
      dueDate: iso(0),
      priority: "high",
      completed: false,
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: uid(),
      title: "Quiz: Integration Techniques",
      subject: "Calculus II",
      dueDate: iso(-2),
      priority: "low",
      completed: true,
      createdAt: Date.now() - 86400000 * 6,
    },
  ];
}

export function makeSampleSessions(): StudySession[] {
  return [
    {
      id: uid(),
      subject: "Algorithms",
      durationSec: 25 * 60,
      date: Date.now() - 86400000 * 4,
    },
    {
      id: uid(),
      subject: "Physics I",
      durationSec: 50 * 60,
      date: Date.now() - 86400000 * 3,
    },
    {
      id: uid(),
      subject: "Statistics",
      durationSec: 25 * 60,
      date: Date.now() - 86400000 * 2,
    },
    {
      id: uid(),
      subject: "World History",
      durationSec: 50 * 60,
      date: Date.now() - 86400000,
    },
  ];
}

export const SUBJECTS = [
  "Algorithms",
  "Physics I",
  "World History",
  "Statistics",
  "Calculus II",
  "Chemistry",
  "Other",
];

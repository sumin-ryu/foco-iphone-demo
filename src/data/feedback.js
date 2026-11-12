/** How a session felt, picked on the completion page. */
export const FEEDBACK_MOODS = [
  { id: 'good', label: '잘 됐어요' },
  { id: 'okay', label: '보통이에요' },
  { id: 'bad', label: '아쉬워요' },
];

export const moodLabel = (id) => FEEDBACK_MOODS.find((m) => m.id === id)?.label ?? null;

/** The note and self feedback left on a visit, or null if it has neither. */
export function notesOf(visit) {
  const note = visit.report.note?.trim() ?? '';
  const text = visit.report.feedback?.text?.trim() ?? '';
  const mood = visit.report.feedback?.mood ?? null;
  return note || text || mood ? { key: visit.key, start: visit.start, note, text, mood } : null;
}

/** The most recent visit that left a note or self feedback, to read before the next one. */
export function latestNotes(records) {
  const visits = Object.values(records)
    .flatMap((day) => day.visits)
    .sort((a, b) => b.key.localeCompare(a.key) || b.start.localeCompare(a.start));
  for (const visit of visits) {
    const notes = notesOf(visit);
    if (notes && (notes.note || notes.text)) return notes;
  }
  return null;
}

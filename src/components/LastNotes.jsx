import { latestNotes, moodLabel } from '../data/feedback.js';
import { parseKey } from '../data/records.js';
import { useRecords } from '../hooks/useRecords.js';
import './LastNotes.css';

/** The note and self feedback from the last visit, shown before starting the next one. */
export default function LastNotes() {
  const notes = latestNotes(useRecords().records);
  if (!notes) return null;
  const date = parseKey(notes.key);
  const mood = moodLabel(notes.mood);

  return (
    <section className="last-notes" aria-label="지난번에 남긴 메모">
      <p className="last-notes__head">
        지난번에 남긴 메모
        <span>
          {date.getMonth() + 1}월 {date.getDate()}일 {notes.start}
        </span>
      </p>
      {notes.note && <p className="last-notes__text">{notes.note}</p>}
      {notes.text && (
        <p className="last-notes__text last-notes__text--feedback">
          {mood && <span className="last-notes__mood">{mood}</span>}
          {notes.text}
        </p>
      )}
    </section>
  );
}

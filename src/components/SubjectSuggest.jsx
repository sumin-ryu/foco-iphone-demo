import './SubjectSuggest.css';

/** Chips of earlier entries (`{ name }`) to fill a field with: past subject names by default. */
export default function SubjectSuggest({ items, onPick, label = '이전에 쓴 과목' }) {
  if (!items.length) return null;
  return (
    <div className="subject-suggest">
      <span className="subject-suggest__label">{label}</span>
      <div className="subject-suggest__chips">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            className="subject-suggest__chip"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onPick(item)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

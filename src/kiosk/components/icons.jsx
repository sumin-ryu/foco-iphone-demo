const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'square',
};

/** Door/box with arrow entering from the left (matches kiosk home design). */
export function CheckInIcon({ size = 64, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      {/* Squarer box; narrow gap on the left where the arrow crosses */}
      <path d="M9.5 5.5h11v13h-11V15.2M9.5 5.5V8.8" {...stroke} />
      <path
        className="k-icon-arrow"
        d="M4 12h11.8M13.4 9.1 16.2 12l-2.8 2.9"
        {...stroke}
      />
    </svg>
  );
}

/** Door/box with arrow exiting to the right (matches kiosk home design). */
export function CheckOutIcon({ size = 64, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      {/* Squarer box; narrow gap on the right where the arrow crosses */}
      <path d="M14.5 5.5h-11v13h11V15.2M14.5 5.5V8.8" {...stroke} />
      <path
        className="k-icon-arrow"
        d="M8.2 12H20M17.2 9.1 20 12l-2.8 2.9"
        {...stroke}
      />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 28, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path
        d="M19 12H5.5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CardIcon({ size = 40, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="2" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ size = 40, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 8.5h2v2h-2zM12.5 8.5h2v2h-2zM9.5 11.5h2v2h-2zM12.5 11.5h2v2h-2z"
        fill="currentColor"
      />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

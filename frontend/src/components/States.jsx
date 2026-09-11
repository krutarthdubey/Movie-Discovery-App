export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

export function LoadingGrid() {
  return (
    <div className="grid">
      {Array.from({ length: 10 }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div />
          <span />
          <small />
        </div>
      ))}
    </div>
  );
}

export function Empty({
  title = 'No movies found',
  text = 'Try a different search or browse another category.',
}) {
  return (
    <div className="empty">
      <div>🎬</div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

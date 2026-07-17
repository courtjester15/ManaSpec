export function PlaceholderView({ description, title }) {
  return (
    <section className="module-view placeholder-view">
      <header className="view-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="view-heading-meta">Parity work in progress</span>
      </header>
      <div className="react-foundation-panel">
        <strong>{title} is connected to the React shell.</strong>
        <p>This placeholder is temporary and will be replaced by the complete ManaSpec workflow.</p>
      </div>
    </section>
  );
}

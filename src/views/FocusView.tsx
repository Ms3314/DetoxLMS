/** Home screen. The focus session itself arrives in the next milestone. */
export default function FocusView() {
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <p className="kicker">Focus</p>
          <h2 className="view-title">Start a focus session</h2>
        </div>
      </div>
      <p className="empty-state">
        Focus mode is coming soon. For now, pick a course in the Library.
      </p>
    </div>
  );
}

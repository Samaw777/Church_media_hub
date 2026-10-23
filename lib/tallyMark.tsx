// Home-screen / install icon artwork: a red tally light on the app's dark background.
export function TallyMark({ size }: { size: number }) {
  const ring = Math.round(size * 0.5);
  const dot = Math.round(size * 0.22);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#101315",
      }}
    >
      <div
        style={{
          width: ring,
          height: ring,
          borderRadius: "50%",
          border: `${Math.round(size * 0.05)}px solid #e4483c`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#e4483c" }} />
      </div>
    </div>
  );
}

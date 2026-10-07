const validHex = (h) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h || "") ? h : "#cccccc");

function isDark(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export default function OutfitCard({ outfit }) {
  const items = outfit.items || [];
  const q = encodeURIComponent(items.map((i) => i.name).join(" ") + " outfit");
  return (
    <article className="outfit">
      <div className="flat">
        {items.map((it, i) => {
          const c = validHex(it.color_hex);
          const dark = isDark(c);
          return (
            <div
              key={i}
              className="piece"
              data-type={it.type}
              style={{ background: c, color: dark ? "#fff" : "#222", "--shade": dark ? "#0006" : "#fff6" }}
            >
              {it.type}
            </div>
          );
        })}
      </div>
      <div className="meta">
        <h3>{outfit.name}</h3>
        <p className="occ">{outfit.occasion}</p>
        <ul>
          {items.map((it, i) => (
            <li key={i}>
              <span className="dot" style={{ background: validHex(it.color_hex) }} />
              {it.name}
            </li>
          ))}
        </ul>
        <a href={`https://www.google.com/search?tbm=isch&q=${q}`} target="_blank" rel="noopener noreferrer">
          See real photos
        </a>
        {outfit.tip && <p className="tip">{outfit.tip}</p>}
      </div>
    </article>
  );
}

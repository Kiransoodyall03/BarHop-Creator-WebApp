# Landing page assets

Drop the Figma exports here using these exact filenames — `src/pages/Landing.js`
references them via the `ASSETS` map at the top of the file. Until a file
exists, its slot renders a dashed placeholder at the same aspect ratio, so
adding the real export never shifts the layout.

| File | Used in | Aspect / notes |
| --- | --- | --- |
| `Logo.png` | Navbar + Footer | Transparent background. The current export has heavy transparent padding (art sits at ~4–81% across, ~44–76% down), so the `Logo` component in `Landing.js` crops to it with a fixed `box`/`art` pair. **Re-export tightly cropped** and those crop offsets can be deleted in favour of a plain `h-10 w-auto`. |
| `shot-venue-card.png` | Section 1 (hero) | ~424×524 (portrait). The consumer-app venue card, no surrounding slabs — the coloured slabs are drawn in CSS. |
| `shot-dashboard.png` | Section 2 | ~1000×693 (landscape). The analytics dashboard screenshot only. |
| `hero-person.png` | Section 3 | ~4:5, **transparent background** cutout. The orbit rings behind it are CSS. |
| `shot-pricing.png` | Section 4 | ~980×750. The dark 3-tier pricing panel only. |

Export the screenshots **without** the coloured offset rectangles and without
the ring/orb decorations from the comp — both are recreated in CSS
(`LAYERS` and `RINGS` in `Landing.js`) so they scale crisply.

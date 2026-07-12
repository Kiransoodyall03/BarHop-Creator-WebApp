import React, { useState, useRef, useEffect, useCallback } from 'react';

// Premium (Pro+) swipe-card border treatments, keyed by
// venue.cardBorderStyle. Default stays the plain card shell.
const CARD_BORDER_CLASSES = {
  'neon-glow': 'ring-2 ring-neon-violet shadow-glow-violet',
  'gold-trim': 'ring-2 ring-accent shadow-glow-amber',
};

function VenueCardPreview({ venueData }) {
  const {
    title,
    address,
    phone,
    website,
    category,
    categories,
    images,
    video,
    description,
    hours,
    socialLinks,
    cardBorderStyle,
  } = venueData;

  // Multi-category with legacy fallback: older venue docs only carry
  // the singular `category` field.
  const categoryList =
    categories && categories.length > 0
      ? categories
      : category
        ? [category]
        : [];

  // The swipeable media stack: every image, plus the venue video (when
  // set) as the final slide.
  const mediaItems = [
    ...(images || []).map((src) => ({ type: 'image', src })),
    ...(video ? [{ type: 'video', src: video }] : []),
  ];
  const mediaCount = mediaItems.length;

  const [mediaIndex, setMediaIndex] = useState(0);
  // Clamp instead of syncing state in an effect (media can shrink while
  // editing in CreateVenue).
  const safeIndex = mediaIndex < mediaCount ? mediaIndex : 0;
  const activeMedia = mediaItems[safeIndex];

  // Stories-style tap zones: left third steps back, the rest advances
  // (wrapping both ways).
  const handleMediaClick = (e) => {
    if (mediaCount < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftThird = e.clientX < rect.left + rect.width / 3;
    setMediaIndex(
      isLeftThird
        ? (safeIndex - 1 + mediaCount) % mediaCount
        : (safeIndex + 1) % mediaCount
    );
  };

  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [currentY, setCurrentY] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const handleDoubleClick = () => setSheetOpen(!sheetOpen);

  const handleDragStart = useCallback((clientY) => {
    isDragging.current = true;
    hasMoved.current = false;
    setDragStartY(clientY);
  }, []);

  const handleTouchStartIndicator = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      setSheetOpen(!sheetOpen);
    } else {
      setLastTap(currentTime);
      handleDragStart(e.touches[0].clientY);
    }
  };

  const handleDragMove = useCallback(
    (clientY) => {
      if (!isDragging.current || dragStartY === null) return;
      const deltaY = clientY - dragStartY;
      if (Math.abs(deltaY) > 5) hasMoved.current = true;
      if (sheetOpen) {
        if (deltaY > 0) setCurrentY(Math.min(deltaY, 400));
      } else {
        if (deltaY < 0) setCurrentY(Math.max(deltaY, -400));
      }
    },
    [dragStartY, sheetOpen]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (hasMoved.current) {
      const threshold = 60;
      if (sheetOpen && currentY > threshold) setSheetOpen(false);
      if (!sheetOpen && currentY < -threshold) setSheetOpen(true);
    }
    setCurrentY(0);
    setDragStartY(null);
    hasMoved.current = false;
  }, [currentY, sheetOpen]);

  useEffect(() => {
    const handleMouseMove = (e) =>
      (isDragging.current && e.preventDefault()) || handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e) =>
      (isDragging.current && e.preventDefault()) ||
      handleDragMove(e.touches[0].clientY);
    const handleTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const getSheetTransform = () =>
    sheetOpen
      ? `translateY(${currentY}px)`
      : `translateY(calc(100% - 40px + ${currentY}px))`;

  return (
    <div
      className={`sticky top-10 w-[min(450px,100%)] max-w-full overflow-hidden rounded-2xl bg-surface-card shadow-[0_12px_32px_rgba(0,0,0,0.5)] max-md:relative max-md:top-0 max-md:mx-auto ${
        CARD_BORDER_CLASSES[cardBorderStyle] || ''
      }`}
    >
      <div className="relative h-[clamp(500px,80vh,720px)] w-full bg-black max-md:h-[clamp(400px,70vh,600px)]">
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1.5">
          {Array.from({ length: Math.max(mediaCount, 1) }).map((_, index) => (
            <div
              key={index}
              className={`h-[3px] flex-1 rounded-sm transition-colors ${
                index === safeIndex && mediaCount > 0
                  ? 'bg-white'
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>

        {activeMedia ? (
          activeMedia.type === 'video' ? (
            <video
              key={activeMedia.src}
              src={activeMedia.src}
              data-testid="venue-media"
              autoPlay
              muted
              loop
              playsInline
              onClick={handleMediaClick}
              className={`h-full w-full object-cover ${
                mediaCount > 1 ? 'cursor-pointer' : ''
              }`}
            />
          ) : (
            <img
              src={activeMedia.src}
              alt={`Venue media ${safeIndex + 1}`}
              data-testid="venue-media"
              onClick={handleMediaClick}
              className={`h-full w-full object-cover ${
                mediaCount > 1 ? 'cursor-pointer' : ''
              }`}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-card to-black">
            <span className="text-xl font-medium text-gray-500">No Images</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 text-white">
          <h2 className="mb-3 break-words text-3xl font-bold leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
            {title || 'Venue Title'}
          </h2>

          <div className="mb-3 flex flex-wrap gap-2">
            {categoryList.length > 0 ? (
              categoryList.map((cat) => (
                <span
                  key={cat}
                  className="whitespace-nowrap rounded-full border border-white bg-white px-3.5 py-1.5 text-[13px] font-semibold text-black"
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
              ))
            ) : (
              <span className="whitespace-nowrap rounded-full border border-white/40 bg-transparent px-3.5 py-1.5 text-[13px] font-semibold text-white/60">
                Category
              </span>
            )}
          </div>

          <p className="my-2 text-sm text-white/80">Xkm away</p>
          <div className="my-3">
            <span className="inline-block cursor-pointer whitespace-nowrap rounded-lg bg-emerald-500 px-6 py-2 text-[15px] font-semibold text-white transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Open
            </span>
          </div>
          <p className="mb-4 mt-2 break-words text-[15px] leading-snug text-white/90">
            {address || 'Location of Place'}
          </p>
        </div>

        {/* BOTTOM SHEET */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex max-h-[80%] flex-col transition-transform duration-300 ease-in-out will-change-transform [&>*]:pointer-events-auto max-md:max-h-[85%]"
          style={{ transform: getSheetTransform() }}
        >
          <div
            className="group flex h-10 shrink-0 cursor-pointer touch-pan-y select-none items-center justify-center py-3"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={handleTouchStartIndicator}
            onDoubleClick={handleDoubleClick}
          >
            <div
              className={`h-[5px] w-[clamp(80px,15vw,120px)] rounded-[3px] transition-colors group-hover:bg-white/50 group-active:bg-white/60 ${
                sheetOpen ? 'bg-white/50' : 'bg-white/30'
              }`}
            />
          </div>

          <div className="flex-1 overflow-y-auto rounded-t-3xl bg-surface-card p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] [scrollbar-width:thin] max-md:px-4 max-md:pb-4 max-md:pt-0">
            <h3 className="mb-5 text-2xl font-bold text-accent">
              About this place
            </h3>

            <div className="mb-6">
              <h4 className="mb-2.5 text-lg font-semibold text-white">
                Description
              </h4>
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-300">
                {description || 'No description available yet.'}
              </p>
            </div>

            <div className="mb-6">
              <h4 className="mb-2.5 text-lg font-semibold text-white">
                Contact & Socials
              </h4>
              <div className="text-sm leading-relaxed text-gray-300">
                {phone ? (
                  <p>📞 {phone}</p>
                ) : (
                  <p className="text-sm italic text-gray-500">No phone added</p>
                )}
                {website ? (
                  <p>🌐 {website.replace(/^https?:\/\//, '')}</p>
                ) : null}
                <div className="mt-2 flex gap-2.5">
                  {socialLinks?.instagram && <span>📷 IG</span>}
                  {socialLinks?.tiktok && <span>🎵 TT</span>}
                </div>
              </div>
            </div>

            <div className="pb-12">
              <h4 className="mb-2.5 text-lg font-semibold text-white">
                Operating Hours
              </h4>
              <div className="text-[13px] text-gray-300">
                {hours ? (
                  Object.entries(hours).map(([day, time]) => (
                    <div key={day} className="mb-1 flex justify-between">
                      <span className="capitalize">{day}</span>
                      <span>
                        {time.closed
                          ? 'Closed'
                          : time.open
                            ? `${time.open} - ${time.close}`
                            : 'TBD'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-500">
                    Hours will be displayed here
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VenueCardPreview;

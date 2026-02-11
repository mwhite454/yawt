import type { AssetImage } from "@utils/story/types.ts";

type BookCoverProps = {
  title: string;
  authorName: string;
  coverImage?: AssetImage;
  onClick?: () => void;
  href?: string;
};

export function BookCover(
  { title, authorName, coverImage, onClick, href }: BookCoverProps,
) {
  const hasImage = Boolean(coverImage?.objectKey);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle keyboard events for non-anchor elements
    if (href) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onClick) {
        onClick();
      }
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const ariaLabel = href
    ? "View book settings"
    : "Upload or change cover image";
  const titleText = href
    ? "Click to view book settings"
    : "Click to upload or change cover image";

  const content = (
    <div class="card bg-base-100 shadow-xl h-full max-h-[250px] overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
      {/* 8 empty divs - explicitly required by problem statement:
          "Make sure that the reusable component includes the 8 empty 
          required divs so that the 3d hover effect works"
      */}
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>

      <div class="card-body flex flex-col justify-between p-4 h-full">
        {coverImage?.url ? (
          // Negative margins (-mt-4 = -1rem, -mx-4 = -1rem) counteract card-body 
          // padding (p-4 = 1rem) to allow image to fill top and sides of card
          // while preserving bottom padding for author text
          <figure class="flex-1 -mt-4 -mx-4">
            <img
              src={coverImage.url}
              alt={`Cover for ${title}`}
              class="w-full h-full object-cover"
            />
          </figure>
        ) : (
          <div>
            <h2 class="card-title text-lg">{title}</h2>
            {hasImage && (
              <div class="badge badge-success badge-sm mt-2">has cover</div>
            )}
          </div>
        )}
        <p class="text-sm opacity-70 mt-auto">by {authorName}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        class="block w-full max-h-[250px] cursor-pointer"
        style="perspective: 1000px"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={ariaLabel}
        title={titleText}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      class="block w-full max-h-[250px] cursor-pointer"
      style="perspective: 1000px"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      title={titleText}
    >
      {content}
    </div>
  );
}

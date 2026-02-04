import type { AssetImage } from "@utils/story/types.ts";

type BookCoverProps = {
  title: string;
  authorName: string;
  coverImage?: AssetImage;
  onClick?: () => void;
};

export function BookCover(
  { title, authorName, coverImage, onClick }: BookCoverProps,
) {
  const hasImage = Boolean(coverImage?.objectKey);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      // Always prevent Space from scrolling the page
      // Only prevent Enter if onClick is defined
      if (e.key === " " || onClick) {
        e.preventDefault();
      }
      if (onClick) {
        onClick();
      }
    }
  };

  return (
    <div
      class="w-full max-h-[250px] cursor-pointer"
      style="perspective: 1000px"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Click to upload or change cover image"
      title="Click to upload or change cover image"
    >
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
            // Negative margins counteract card-body padding (p-4 = 1rem)
            // to allow image to fill the card area while keeping bottom padding for author text
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
    </div>
  );
}

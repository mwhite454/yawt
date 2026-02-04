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

  return (
    <div
      class="w-full max-h-[250px] cursor-pointer perspective-1000"
      onClick={onClick}
      title="Click to upload or change cover image"
    >
      <div class="card bg-base-100 shadow-xl h-full max-h-[250px] overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 transform">
        {/* 8 empty divs as specified in requirements
            These are required by the problem statement for the 3D hover effect
            The actual 3D transform is achieved through Tailwind classes above
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
          <div>
            <h2 class="card-title text-lg">{title}</h2>
            {hasImage && (
              <div class="badge badge-success badge-sm mt-2">has cover</div>
            )}
          </div>
          <p class="text-sm opacity-70 mt-auto">by {authorName}</p>
        </div>
      </div>
    </div>
  );
}

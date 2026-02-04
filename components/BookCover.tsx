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
      class="w-full max-h-[250px] cursor-pointer"
      onClick={onClick}
      title="Click to upload or change cover image"
    >
      <div class="card bg-base-100 shadow-xl h-full max-h-[250px] overflow-hidden hover:shadow-2xl transition-shadow duration-300">
        {/* 8 empty divs required for daisyUI 3D hover effect 
            These divs are part of the daisyUI hover-3d component pattern
            See: https://daisyui.com/components/hover-3d/
            They create the layered effect needed for the 3D transformation
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

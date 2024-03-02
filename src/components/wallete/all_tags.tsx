import { useTagStore } from "~/lib/state/wallete/tag";
import { api } from "~/utils/api";

export default function AllTags() {
  const { selectTag } = useTagStore();

  const tags = api.wallate.tag.getAllTags.useQuery();

  if (tags.isLoading) return <span className="loading loading-spinner" />;

  if (tags.data)
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="scrollbar-style join flex w-full space-x-2 overflow-x-auto py-1"
      >
        <input
          onClick={() => {}}
          className="!btn join-item"
          key={""}
          type="radio"
          name="options"
          aria-label="Tags: "
        />
        {tags.data.map((item, i) => (
          <input
            type="radio"
            name="options"
            aria-label={item.tagName}
            onClick={() => selectTag(item.tagName)}
            className="!btn join-item"
            key={i}
          />
        ))}
      </div>
    );
}

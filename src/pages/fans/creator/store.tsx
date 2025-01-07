import Shop from "~/components/fan/creator/shop";
import CreatorLayout from "./layout";

export default function StorePage() {
  return (
    <CreatorLayout>
      <div className="p-5">
        <h2 className="mb-5 flex text-center text-2xl font-bold">Store</h2>
        <Shop />
      </div>
    </CreatorLayout>
  );
}

import AllAsset from "./all_asset";
import AllTag from "./all_tags";

function Main() {
  return (
    <div className="h-full space-y-2 tracking-wider">
      <AllTag />
      <div className="h-full space-y-2">
        <p>search asset</p>

        {/* <MyAsset /> */}

        <AllAsset />
      </div>
    </div>
  );
}

export default Main;

import { api } from "~/utils/api";

const FunctionTest: React.FC = () => {
  const { data } = api.bounty.Bounty.getTrustCost.useQuery();
  console.log(data);
  return (
    <div>
      <h1>Function Test</h1>
    </div>
  );
};
export default FunctionTest;

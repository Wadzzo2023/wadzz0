import { match } from "ts-pattern";
import { api } from "~/utils/api";
import { error, loading, success } from "~/utils/trcp/patterns";

export default function TestPage() {
  const offers = api.marketplace.trade.getOffers.useQuery();
  // const auth = api.auth.trx..useMutation();
  const offersComponent = match(offers)
    .with(loading, () => <div>Loading...</div>)
    .with(error, (e) => <div>Error: {e.error?.message}</div>)
    .with(success, (res) => <ul>hi</ul>)
    .otherwise(() => null);
  return (
    <div>
      {/* TestPage <MapApp /> */}
      {/* <button
        onClick={() =>
          auth.mutate({
            token:
              "eyJraWQiOiJUOHRJSjF6U3JPIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiaG9zdC5leHAuRXhwb25lbnQiLCJleHAiOjE3MzA1NzIxMzIsImlhdCI6MTczMDQ4NTczMiwic3ViIjoiMDAwNTk1LmM5YmVmMDBlYzU1ZDQ3ZTY4YWM2OTk0MTA0Y2FhZjY0LjE3MTgiLCJub25jZSI6InJsbHg1MjBhIiwiY19oYXNoIjoiLXd6ZFlIamY2THl6V1BWU1NpQk5DZyIsImVtYWlsIjoibXhoYzU3bWRnZkBwcml2YXRlcmVsYXkuYXBwbGVpZC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNfcHJpdmF0ZV9lbWFpbCI6dHJ1ZSwiYXV0aF90aW1lIjoxNzMwNDg1NzMyLCJub25jZV9zdXBwb3J0ZWQiOnRydWV9.paR3DSA967OZTLm_Bhb9BnBvs9Ftq3O61iwYdkGueHN1flVTU8kJX2ghuOSKu-x3gIOZWjs2urQXbX--zvvLgifwF5CcIFalOKh9l1F22K7eM4sjePaDlKC_otj2YIFXyBji1X0hnE_e6YVhmouJ-MPh62uK-kjhBOxiUJQZFHaeHJ8P0wjpXSmcZHl3uvSFD7U3D0zYJdPTE6K03tDW_ICF6wB8HJyT31g9Xx_36vCiwjR8S2SEK5himPXCBS3sICSDlivpbpK9EvrFsLIHHElituqAyjJBUH1l_AaLnBld7IRnKEe3yThwm6Z2NkZvI8XUwzG8_1uE0QT751Ssrw",
          })
        }
      >
        {auth.isLoading && <Loader2 className="animate-spin" />}
        Test Apple jwt verify
      </button> */}
    </div>
  );
}

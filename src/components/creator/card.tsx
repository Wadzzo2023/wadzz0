import React from "react";
import AddTierModal from "./add-tier-modal";

export default function MemberShipCard() {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Card title!</h2>
        <p>If a dog chews shoes whose shoes does he choose?</p>
        <div className="card-actions justify-end">
          <AddTierModal />
        </div>
      </div>
    </div>
  );
}

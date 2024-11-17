import React, { useEffect } from "react";
import { getAllBrands } from "~/lib/play/get-all-brands";

export default function APITest() {
  const [brands, setBrands] = React.useState<{ id: string }[]>([]);

  useEffect(() => {
    getAllBrands().then((data) => {
      console.log(data, "vong cong");

      setBrands(data);
    });
  }, []);

  return <div>APITest</div>;
}

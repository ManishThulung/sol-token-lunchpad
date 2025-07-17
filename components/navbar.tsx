import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <div className="flex gap-8">
      <Link href={"/token-mint"}>Mint token</Link>
    </div>
  );
};

export default Navbar;

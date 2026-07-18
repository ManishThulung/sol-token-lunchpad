import { Loader2 } from "lucide-react";
import React from "react";

export const SpinningLoader = ({
  className,
  size = 16,
  color = "gray",
}: {
  className?: string;
  size?: number;
  color?: string;
}) => {
  return (
    <Loader2
      size={size}
      color={color}
      className={`mr-2 h-4 w-4 animate-spin ${className ?? ""}`}
    />
    // <div className="flex h-full w-full items-center justify-center">
    //   ....Loading
    //   <Spinner />
    // </div>
  );
};

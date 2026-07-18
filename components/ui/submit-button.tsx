import React, { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { SpinningLoader } from "./spinning-loader";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting: boolean;
  children: ReactNode;
  className?: string;
}

const SubmitButton = ({
  isSubmitting,
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      className={cn(
        "w-fit rounded-[4px] px-6 py-3 text-base font-bold",
        className,
      )}
      disabled={isSubmitting || disabled}
      {...props}
    >
      {children}
      {isSubmitting && <SpinningLoader />}
    </Button>
  );
};

export default SubmitButton;

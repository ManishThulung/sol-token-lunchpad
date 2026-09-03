import * as React from "react";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomSelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label: string;
  options: CustomSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  labelBackground?: string;
}

const CustomeSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select",
  disabled,
  className,
  labelBackground = "bg-white",
}) => {
  const id = React.useId();

  return (
    <div className="relative">
      {/* Label */}
      <label
        htmlFor={id}
        className={cn(
          "absolute -top-2 left-2 px-1 text-xs text-[#666666] transition-all duration-200",
          labelBackground,
        )}
      >
        {label}
      </label>

      {/* Select */}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn(
            "h-[52px] w-full pt-4 text-[#333333]", // pt-4 gives space for floating label
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export { CustomeSelect };

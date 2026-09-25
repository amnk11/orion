"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground hover:bg-background/50"
          )}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedControl, type SegmentedControlOption };

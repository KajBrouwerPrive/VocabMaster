import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: FilterOption[];
  selectedValues: Set<string>;
  onSelectionChange: (values: Set<string>) => void;
  placeholder: string;
  className?: string;
}

export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  className,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    onSelectionChange(newSet);
  };

  const getDisplayText = () => {
    if (selectedValues.size === 0) return placeholder;
    if (selectedValues.size === 1) {
      const selectedValue = Array.from(selectedValues)[0];
      const option = options.find(o => o.value === selectedValue);
      return option?.label || selectedValue;
    }
    return `${selectedValues.size} geselecteerd`;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs justify-between min-w-[90px] font-normal"
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={cn("h-3 w-3 ml-1 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[140px] bg-popover border rounded-md shadow-md p-2 space-y-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedValues.has(option.value)}
                onCheckedChange={() => toggleOption(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
          {selectedValues.size > 0 && (
            <button
              type="button"
              onClick={() => onSelectionChange(new Set())}
              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Wis selectie
            </button>
          )}
        </div>
      )}
    </div>
  );
}

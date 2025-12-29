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
  minWidth?: string;
}

export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  className,
  minWidth = "100px",
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

  const selectAll = () => {
    onSelectionChange(new Set(options.map(o => o.value)));
  };

  const clearAll = () => {
    onSelectionChange(new Set());
  };

  const allSelected = options.length > 0 && selectedValues.size === options.length;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs justify-between font-normal"
        style={{ minWidth }}
      >
        <span className="truncate">
          {selectedValues.size === 0 ? placeholder : `${placeholder} (${selectedValues.size})`}
        </span>
        <ChevronDown className={cn("h-3 w-3 ml-1 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[160px] bg-popover border rounded-md shadow-md p-2">
          {/* Select all / Clear all buttons */}
          <div className="flex gap-1 mb-2 pb-2 border-b">
            <button
              type="button"
              onClick={selectAll}
              disabled={allSelected}
              className={cn(
                "flex-1 text-xs py-1 px-2 rounded hover:bg-accent",
                allSelected ? "text-muted-foreground/50" : "text-primary"
              )}
            >
              Alles
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedValues.size === 0}
              className={cn(
                "flex-1 text-xs py-1 px-2 rounded hover:bg-accent",
                selectedValues.size === 0 ? "text-muted-foreground/50" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Wissen
            </button>
          </div>
          
          {/* Options */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
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
          </div>
        </div>
      )}
    </div>
  );
}

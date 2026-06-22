import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_MODELS } from "@/lib/models";

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
  // Group models for display
  const groups = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.group]) {
      acc[model.group] = [];
    }
    acc[model.group].push(model);
    return acc;
  }, {} as Record<string, typeof AI_MODELS>);

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 sticky top-0">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-[280px] bg-card border-border border shadow-sm font-medium" data-testid="select-model">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="max-h-[60vh] bg-card border-border">
          {Object.entries(groups).map(([group, models]) => (
            <SelectGroup key={group}>
              <SelectLabel className="text-muted-foreground font-semibold px-2 py-1.5 text-xs uppercase tracking-wider">{group}</SelectLabel>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id} data-testid={`model-item-${model.id}`} className="cursor-pointer">
                  {model.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

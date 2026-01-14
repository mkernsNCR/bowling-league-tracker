import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Users, AlertTriangle, UserPlus } from "lucide-react";
import { RosterScanner } from "@/components/photo-scanner";

const teamWithBowlersSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  bowlers: z.array(z.object({
    name: z.string().min(1, "Bowler name is required"),
    startingAverage: z.number().min(0).max(300),
  })).min(1, "At least one bowler is required"),
});

type TeamWithBowlers = z.infer<typeof teamWithBowlersSchema>;

interface TeamFormProps {
  onSubmit: (data: TeamWithBowlers) => void;
  isSubmitting?: boolean;
  teamSize: number;
  defaultValues?: Partial<TeamWithBowlers>;
}

export function TeamForm({ onSubmit, isSubmitting, teamSize, defaultValues }: TeamFormProps) {
  const [overflowBowlers, setOverflowBowlers] = useState<{ name: string; startingAverage: number }[]>([]);
  
  const form = useForm<TeamWithBowlers>({
    resolver: zodResolver(teamWithBowlersSchema),
    defaultValues: {
      name: "",
      bowlers: Array(teamSize).fill(null).map(() => ({ name: "", startingAverage: 150 })),
      ...defaultValues,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "bowlers",
  });

  const handleRosterExtracted = (data: { teamName?: string; bowlers: { name: string; startingAverage: number }[] }) => {
    if (data.teamName) {
      form.setValue("name", data.teamName);
    }
    if (data.bowlers.length > 0) {
      const bowlersToAdd = data.bowlers.slice(0, teamSize);
      const overflow = data.bowlers.slice(teamSize);
      
      replace(bowlersToAdd.map(b => ({
        name: b.name,
        startingAverage: b.startingAverage,
      })));
      
      setOverflowBowlers(overflow);
    }
  };

  const addOverflowBowler = (bowler: { name: string; startingAverage: number }, index: number) => {
    if (fields.length < teamSize) {
      append(bowler);
      setOverflowBowlers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const dismissOverflow = () => {
    setOverflowBowlers([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <RosterScanner onExtracted={handleRosterExtracted} />
        
        {overflowBowlers.length > 0 && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="ml-2">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {overflowBowlers.length} additional bowler{overflowBowlers.length > 1 ? 's were' : ' was'} found but couldn't be added (this league allows {teamSize} bowlers per team).
                </p>
                <div className="space-y-2">
                  {overflowBowlers.map((bowler, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-background rounded border">
                      <span className="text-sm">
                        {bowler.name} (Avg: {bowler.startingAverage})
                      </span>
                      {fields.length < teamSize && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOverflowBowler(bowler, index)}
                          data-testid={`button-add-overflow-bowler-${index}`}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start text-amber-700 hover:text-amber-800"
                  onClick={dismissOverflow}
                  data-testid="button-dismiss-overflow"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Pin Crushers" 
                      {...field} 
                      data-testid="input-team-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Bowlers ({fields.length}/{teamSize})</FormLabel>
                {fields.length < teamSize && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", startingAverage: 150 })}
                    data-testid="button-add-bowler"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bowler
                  </Button>
                )}
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`bowlers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={`Bowler ${index + 1}`}
                              {...field} 
                              data-testid={`input-bowler-name-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`bowlers.${index}.startingAverage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Starting Average</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={0}
                              max={300}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid={`input-bowler-average-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => remove(index)}
                      data-testid={`button-remove-bowler-${index}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="button-create-team"
          >
            {isSubmitting ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

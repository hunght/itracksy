import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api.js";
import { useMutation as useConvexMutation, useQuery as useConvexQuery } from "convex/react";

import { Loader } from "@/components/Loader";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BoardView } from "./components/BoardView.js";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { LayoutGrid, List, PlusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { use } from "i18next";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  hourlyRate: z.number().optional(),
  currency: z.string().optional(),
});

export function ProjectsPage() {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [open, setOpen] = useState(false);
  const currentUser = useConvexQuery(api.users.viewer);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "#e0e0e0",
      hourlyRate: undefined,
      currency: "USD",
    },
  });

  const colorPalette = [
    "#f87171", // red
    "#fb923c", // orange
    "#fbbf24", // amber
    "#a3e635", // lime
    "#34d399", // emerald
    "#2dd4bf", // teal
    "#38bdf8", // sky
    "#818cf8", // indigo
    "#a78bfa", // violet
    "#f472b6", // pink
  ];

  const { data: board, isLoading: boardLoading } = useQuery({
    ...convexQuery(api.board.getBoard, { id: boardId ?? "" }),
    enabled: !!boardId,
  });
  const { data: boards, isLoading: boardsLoading } = useSuspenseQuery(
    convexQuery(api.board.getBoards, {})
  );

  const createBoard = useConvexMutation(api.board.createBoard);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser?._id) {
      throw new Error("User not found");
    }

    await createBoard({
      id: crypto.randomUUID(),
      name: values.name.trim(),
      color: values.color,
      userId: currentUser._id,
      hourlyRate: values.hourlyRate,
      currency: values.currency,
    });
    form.reset();
    setOpen(false);
  };

  useEffect(() => {
    if (boards.length > 0 && !boardId) {
      setBoardId(boards[0].id);
    }
  }, [boards, boardId]);

  if (boardLoading || boardsLoading) return <Loader />;
  console.log("viewMode", viewMode);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Select
            value={boardId ?? ""}
            onValueChange={(value) => {
              if (value === "new") {
                setOpen(true);
                return;
              }
              setBoardId(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="new" onSelect={() => setOpen(true)}>
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Create Board
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}
              aria-label={viewMode === "board" ? "Switch to list view" : "Switch to board view"}
            >
              {viewMode === "board" ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{viewMode === "board" ? "Switch to list view" : "Switch to board view"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {board && viewMode === "board" && <BoardView board={board} />}
      {board && viewMode === "list" && (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {board.items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 shadow-sm">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>Add a new board to organize your projects.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter board name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Color</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`h-8 w-8 rounded-full border-2 transition-all ${
                              field.value === color
                                ? "scale-110 border-black"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional hourly rate"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

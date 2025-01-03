import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { supabase } from "@/lib/supabase";
import { BoardWithRelations } from "@/types/supabase";
import { getBoard } from "@/services/board";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  onCreateTimeEntry: () => Promise<void>;
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  selectedItemId,
  setSelectedItemId,
  onCreateTimeEntry,
}: TimeEntryDialogProps) {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);

  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("boards").select("*").order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: selectedBoard } = useQuery<BoardWithRelations | null>({
    queryKey: ["board", selectedBoardId],
    queryFn: async () => getBoard(selectedBoardId ?? ""),
    enabled: !!selectedBoardId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Time Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Board</label>
            <Select value={selectedBoardId ?? undefined} onValueChange={setSelectedBoardId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {boards?.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBoard && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Item</label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {selectedBoard.items?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => void onCreateTimeEntry()}
            disabled={!selectedItemId || !selectedBoardId}
            className="w-full"
          >
            Start Time Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

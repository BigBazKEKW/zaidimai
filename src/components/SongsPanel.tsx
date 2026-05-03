import { useEffect, useState } from "react";
import { SONGS } from "@/data/songs";
import { getBlockedIds, toggleBlocked } from "@/lib/heardle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Eye, EyeOff } from "lucide-react";

export function SongsPanel() {
  const [blocked, setBlocked] = useState<number[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setBlocked(getBlockedIds());
  }, []);

  const filtered = SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.artist.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Nustatymai">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dainų katalogas</SheetTitle>
          <SheetDescription>
            Paslėpk dainas, kurių nenori matyti pagrindiniame ar neribotame režime.
            Pasirinkimai saugomi tik šioje naršyklėje.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="Ieškok…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="divide-y divide-border rounded-md border border-border">
            {filtered.map((s) => {
              const isBlocked = blocked.includes(s.id);
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.artist} ·{" "}
                      {s.genre === "rock"
                        ? "rokas"
                        : s.genre === "hiphop"
                        ? "hip-hop"
                        : "bet koks"}
                    </p>
                  </div>
                  <Button
                    variant={isBlocked ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setBlocked(toggleBlocked(s.id))}
                  >
                    {isBlocked ? (
                      <>
                        <EyeOff className="mr-1 h-4 w-4" /> Paslėpta
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-4 w-4" /> Paslėpti
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nieko nerasta
              </li>
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

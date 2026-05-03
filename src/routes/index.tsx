import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GamePanel } from "@/components/GamePanel";
import { SongsPanel } from "@/components/SongsPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Infinity as InfinityIcon, Music2 } from "lucide-react";
import { DAILY_GENRES, GENRE_LABEL } from "@/lib/heardle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lietuviškas Heardle – atspėk dainą" },
      {
        name: "description",
        content:
          "Kasdien trys naujos lietuviškos dainos: visi žanrai, rokas ir hip-hop. Atspėk per 6 bandymus.",
      },
      { property: "og:title", content: "Lietuviškas Heardle" },
      {
        property: "og:description",
        content: "Kasdien trys naujos lietuviškos dainos – atspėk per 6 bandymus.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mode, setMode] = useState<"daily" | "unlimited">("daily");

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Music2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lietuviškas Heardle</h1>
              <p className="text-xs text-muted-foreground">
                Kasdien 3 dainos – visi žanrai, rokas, hip-hop
              </p>
            </div>
          </div>
          <SongsPanel />
        </header>

        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === "daily" ? "default" : "outline"}
            onClick={() => setMode("daily")}
            className="flex-1"
          >
            Dienos dainos
          </Button>
          <Button
            variant={mode === "unlimited" ? "default" : "outline"}
            onClick={() => setMode("unlimited")}
            className="flex-1"
          >
            <InfinityIcon className="mr-2 h-4 w-4" />
            Neribotai
          </Button>
        </div>

        {mode === "daily" ? (
          <Tabs defaultValue={DAILY_GENRES[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {DAILY_GENRES.map((g) => (
                <TabsTrigger key={g} value={g}>
                  {GENRE_LABEL[g]}
                </TabsTrigger>
              ))}
            </TabsList>
            {DAILY_GENRES.map((g) => (
              <TabsContent key={g} value={g} className="mt-4">
                <GamePanel mode="daily" genre={g} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <GamePanel key="unlimited" mode="unlimited" />
        )}

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Laikmatis nusiresetina 00:00 Lietuvos laiku (GMT+3). ⚙️ – dainų sąrašo valdymas.
          </p>
        </footer>
      </div>
    </main>
  );
}

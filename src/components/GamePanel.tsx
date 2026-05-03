import { useEffect, useMemo, useRef, useState } from "react";
import { SONGS, type Song, type Genre } from "@/data/songs";
import {
  ATTEMPT_DURATIONS,
  MAX_ATTEMPTS,
  getDailySong,
  getLtDayIndex,
  getProgress,
  msUntilNextLtMidnight,
  pickRandomFromPool,
  recordResult,
  saveProgress,
  getUnlimitedPool,
  GENRE_LABEL,
} from "@/lib/heardle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, Volume2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  mode: "daily" | "unlimited";
  genre?: Genre; // required when mode === "daily"
}

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function GamePanel({ mode, genre = "all" }: Props) {
  const [dayIndex] = useState(() => getLtDayIndex());
  const [song, setSong] = useState<Song | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [guesses, setGuesses] = useState<(string | null)[]>([]);
  const [query, setQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [countdown, setCountdown] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | null>(null);

  // Init song + progress
  useEffect(() => {
    setAudioError(null);
    if (mode === "daily") {
      const s = getDailySong(dayIndex, genre);
      setSong(s);
      const p = getProgress(dayIndex, genre);
      setAttempts(p.attempts);
      setFinished(p.finished);
      setWon(p.won);
      setGuesses(p.guesses);
    } else {
      const pool = getUnlimitedPool();
      const s = pickRandomFromPool(pool);
      setSong(s);
      setAttempts(0);
      setFinished(false);
      setWon(false);
      setGuesses([]);
    }
  }, [mode, dayIndex, genre]);

  // Countdown
  useEffect(() => {
    if (mode !== "daily") return;
    setCountdown(msUntilNextLtMidnight());
    const id = window.setInterval(() => setCountdown(msUntilNextLtMidnight()), 1000);
    return () => clearInterval(id);
  }, [mode]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const currentDuration = useMemo(() => {
    if (finished) return 30;
    return ATTEMPT_DURATIONS[Math.min(attempts, MAX_ATTEMPTS - 1)];
  }, [attempts, finished]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  function stopPlayback() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio || !song) return;
    setAudioError(null);
    try {
      audio.currentTime = 0;
      audio.volume = volume;
      const dur = currentDuration;
      await audio.play();
      setIsPlaying(true);
      const start = performance.now();
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        const elapsed = (performance.now() - start) / 1000;
        const ratio = Math.min(1, elapsed / dur);
        setProgress(ratio);
        if (ratio >= 1) {
          audio.pause();
          if (tickRef.current) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
          }
          setIsPlaying(false);
        }
      }, 50);
    } catch (err) {
      setIsPlaying(false);
      setAudioError(
        `Nepavyko paleisti garso. Patikrink, ar failas /songs/${song.filename} įkeltas.`
      );
      console.error("Audio play failed:", err);
    }
  }

  function togglePlay() {
    if (isPlaying) stopPlayback();
    else play();
  }

  function persistDaily(next: {
    attempts: number;
    finished: boolean;
    won: boolean;
    guesses: (string | null)[];
  }) {
    if (mode !== "daily") return;
    saveProgress({ dayIndex, genre, ...next });
  }

  function endGame(didWin: boolean, atIndex: number, finalGuesses: (string | null)[]) {
    setFinished(true);
    setWon(didWin);
    if (mode === "daily") {
      recordResult(didWin, atIndex);
      persistDaily({ attempts: atIndex + 1, finished: true, won: didWin, guesses: finalGuesses });
    }
    stopPlayback();
  }

  function submitGuess(guessSong: Song) {
    if (finished || !song) return;
    const correct = guessSong.id === song.id;
    const label = `${guessSong.artist} – ${guessSong.title}`;
    const newGuesses = [...guesses, label];
    setGuesses(newGuesses);
    setQuery("");

    if (correct) {
      endGame(true, attempts, newGuesses);
      return;
    }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (mode === "daily")
      persistDaily({ attempts: newAttempts, finished: false, won: false, guesses: newGuesses });
    if (newAttempts >= MAX_ATTEMPTS) endGame(false, newAttempts - 1, newGuesses);
  }

  function skip() {
    if (finished || !song) return;
    const newGuesses = [...guesses, null];
    setGuesses(newGuesses);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (mode === "daily")
      persistDaily({ attempts: newAttempts, finished: false, won: false, guesses: newGuesses });
    if (newAttempts >= MAX_ATTEMPTS) endGame(false, newAttempts - 1, newGuesses);
  }

  function nextUnlimited() {
    stopPlayback();
    const pool = getUnlimitedPool();
    const s = pickRandomFromPool(pool);
    setSong(s);
    setAttempts(0);
    setFinished(false);
    setWon(false);
    setGuesses([]);
    setQuery("");
  }

  if (!song) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Šiandien dainos nėra. Bandyk vėliau – katalogas dar pildomas.
        </p>
      </div>
    );
  }

  const audioSrc = `/songs/${song.filename}`;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg">
      {mode === "daily" && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{GENRE_LABEL[genre]}</span>
          <span>Iki naujos dainos: {formatCountdown(countdown)}</span>
        </div>
      )}

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        crossOrigin="anonymous"
        onEnded={() => setIsPlaying(false)}
        onError={() =>
          setAudioError(`Nepavyko įkelti /songs/${song.filename}`)
        }
      />

      {/* Attempts bar */}
      <div className="grid grid-cols-6 gap-1.5">
        {ATTEMPT_DURATIONS.map((_d, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full",
              i < attempts
                ? guesses[i] === null
                  ? "bg-muted-foreground/40"
                  : "bg-destructive"
                : i === attempts
                ? "bg-primary/30"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Player */}
      <div className="space-y-3">
        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-primary/20"
            style={{ width: `${(currentDuration / 16) * 100}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{ width: `${(currentDuration / 16) * progress * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={togglePlay}
            size="lg"
            className="rounded-full"
            aria-label={isPlaying ? "Stabdyti" : "Groti"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {finished ? "Pilna ištrauka" : `${currentDuration}s`}
          </span>
          <div className="ml-auto flex w-40 items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[Math.round(volume * 100)]}
              onValueChange={(v) => setVolume((v[0] ?? 0) / 100)}
              max={100}
              step={1}
            />
          </div>
        </div>
        {audioError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{audioError}</span>
          </div>
        )}
      </div>

      {/* Guesses */}
      {guesses.length > 0 && (
        <ul className="space-y-1.5">
          {guesses.map((g, i) => (
            <li
              key={i}
              className={cn(
                "rounded-md border border-border px-3 py-2 text-sm",
                g === null ? "italic text-muted-foreground" : "text-foreground"
              )}
            >
              {g === null ? "Praleista" : `❌ ${g}`}
            </li>
          ))}
        </ul>
      )}

      {/* Input */}
      {!finished ? (
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ieškok atlikėjo arba dainos…"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => submitGuess(s)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-medium">{s.artist}</span>
                      <span className="text-muted-foreground"> – {s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="outline" onClick={skip} className="w-full">
            <SkipForward className="mr-2 h-4 w-4" />
            Praleisti (+{ATTEMPT_DURATIONS[Math.min(attempts + 1, MAX_ATTEMPTS - 1)]}s)
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-lg font-semibold">
            {won ? "🎉 Atspėjai!" : "😔 Neatspėjai"}
          </p>
          <p className="text-sm text-muted-foreground">
            Daina:{" "}
            <span className="font-medium text-foreground">
              {song.artist} – {song.title}
            </span>
          </p>
          {mode === "unlimited" && (
            <Button onClick={nextUnlimited}>Nauja daina</Button>
          )}
        </div>
      )}
    </div>
  );
}

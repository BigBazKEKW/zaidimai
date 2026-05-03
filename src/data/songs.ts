// ============================================================
// DAINŲ KATALOGAS
// ============================================================
// Kaip pridėti naują dainą:
// 1. Įkelk MP3 failą į aplanką: public/songs/
//    Pvz.: public/songs/daina1.mp3
// 2. Pridėk įrašą į žemiau esantį masyvą su:
//    - id: unikalus skaičius
//    - title: dainos pavadinimas
//    - artist: atlikėjas
//    - genre: 'all' | 'rock' | 'hiphop'
//      ('all' reiškia bet kokį žanrą - tinka 1, 4, 7... dienoms)
//      ('rock' - rokas/poprokas/pankrokas/sunkusis rokas)
//      ('hiphop' - hip-hop/trap/boom-bap/gangsta rap)
//    - filename: tikslus failo pavadinimas aplanke public/songs/
// 3. Failo URL bus automatiškai: /songs/<filename>
// ============================================================

export type Genre = "all" | "rock" | "hiphop";

export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: Genre;
  filename: string;
}

export const SONGS: Song[] = [
  { id: 1, title: "Pilnatis", artist: "Solo Ansamblis", genre: "rock", filename: "daina1.mp3" },
  { id: 2, title: "Muzika", artist: "G&G Sindikatas", genre: "hiphop", filename: "daina2.mp3" },
  { id: 3, title: "Diena", artist: "Stasys Povilaitis", genre: "all", filename: "daina3.mp3" },
  { id: 4, title: "Geltona Žalia Raudona", artist: "Foje", genre: "rock", filename: "daina4.mp3" },
  { id: 5, title: "Gerumas", artist: "Jurga", genre: "all", filename: "daina5.mp3" },
  { id: 6, title: "Vasara", artist: "ŽAS", genre: "all", filename: "daina6.mp3" },
  { id: 7, title: "Aš Tave Vis Dar Myliu", artist: "Marijonas Mikutavičius", genre: "all", filename: "daina7.mp3" },
  { id: 8, title: "Lietuva Brangi", artist: "Andrius Mamontovas", genre: "rock", filename: "daina8.mp3" },
  { id: 9, title: "Atjunk", artist: "Skamp", genre: "hiphop", filename: "daina9.mp3" },
  { id: 10, title: "Niekas Nemoka Taip Mylėt", artist: "BIX", genre: "rock", filename: "daina10.mp3" },
  { id: 11, title: "Pasaulis Tavo Rankose", artist: "InCulto", genre: "all", filename: "daina11.mp3" },
  { id: 12, title: "Žvaigždė", artist: "Sel", genre: "hiphop", filename: "daina12.mp3" },
];

// Genre rotation: day 1 -> all, day 2 -> rock, day 3 -> hiphop, day 4 -> all, ...
export const GENRE_CYCLE: Genre[] = ["all", "rock", "hiphop"];

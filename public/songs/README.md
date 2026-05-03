# Dainų aplankas / Songs folder

Įkelk čia savo MP3 failus.

## Kaip pridėti dainą

1. Įkelk MP3 failą į šį aplanką (`public/songs/`).
   Pvz.: `public/songs/daina1.mp3`

2. Atidaryk `src/data/songs.ts` ir pridėk įrašą į `SONGS` masyvą:

   ```ts
   {
     id: 13, // unikalus skaičius
     title: "Dainos pavadinimas",
     artist: "Atlikėjas",
     genre: "rock", // "all" | "rock" | "hiphop"
     filename: "daina1.mp3" // turi sutapti su failo pavadinimu šiame aplanke
   }
   ```

3. Failai prieinami kaip `/songs/<filename>`.

## Žanrų rotacija (24 val. ciklas)

- 1 diena → **all** (bet koks žanras)
- 2 diena → **rock** (rokas, poprokas, pankrokas, sunkusis rokas...)
- 3 diena → **hiphop** (hip-hop, trap, boom-bap, gangsta rap...)
- 4 diena → all, 5 → rock, 6 → hiphop ...

Laikmatis nusiresetina **00:00 Lietuvos laiku (GMT+3)**.

## Pasikartojimas

Dienos rotacijoje sistema stengiasi neparinkti tos pačios dainos dažniau nei kartą per **100 dienų**. Jei dainų per mažai – kartojimas neišvengiamas.

## „Neribotai“ režimas

Naudoja **kitą baseiną** – tik tas dainas, kurios pastarąsias 100 dienų **nebuvo** rodytos pagrindiniame režime. Statistika nesaugoma, blokavimas šio režimo neveikia.

# MeinKleiderschrank

Mobile-first Progressive Web App zum Digitalisieren von Kleidung und Finden wettergerechter Outfits.

## Lokal starten

```bash
npm install
npm run dev
```

Standardmäßig startet die App im **lokalen Demo-Modus**. Hier bleiben kleine, komprimierte Fotos und Katalogdaten im Browser. Dieser Modus ist zum Ausprobieren gedacht, **nicht** für eine umfangreiche Fotobibliothek oder geräteübergreifende Sicherung.

## Produktivbetrieb (in Vorbereitung)

Der Ordner `supabase/` enthält das Datenbankschema einschließlich Row Level Security und privatem Storage. Für die Anbindung werden ein Supabase-Projekt, anonyme Anmeldung oder reguläres Login sowie serverseitige KI-Edge-Funktionen benötigt. **Keine API-Schlüssel ins Frontend legen.**

## Enthalten

- Mobile-first Fotoupload mit Bildkomprimierung, manuell editierbare Kategorien und Tags
- Filterbare Garderobe, Anlässe erstellen/löschen
- Standortwetter via Open-Meteo, manueller Koordinaten-Fallback
- Regelbasierte Outfit-Vorschläge mit Begründung, Favoriten, Verlauf
- Installierbare PWA inkl. App-Shell-Offlinebetrieb

**Noch nicht produktiv angebunden:** KI-Fototagging, KI-Outfitgenerierung, persistente Supabase-Datenhaltung und geräteübergreifende Synchronisierung. Diese benötigen Konfiguration und sichere Backend-Funktionen.

## Sicherheitsprinzipien

Im Produktivbetrieb: User-ID aus authentifizierter Session (niemals frei aus dem Browser setzen), Supabase-RLS, privater Foto-Bucket, zeitlich begrenzte signierte URLs, KI-Aufrufe nur serverseitig, Eingabe-/Ausgabevalidierung und Rate Limits.

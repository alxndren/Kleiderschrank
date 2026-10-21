# MeinKleiderschrank

Mobile-first Progressive Web App zum Digitalisieren von Kleidung und Finden wettergerechter Outfits.

## Lokal starten

```bash
npm install
npm run dev
```

Standardmäßig startet die App im **lokalen Demo-Modus**. Hier bleiben kleine, komprimierte Fotos und Katalogdaten im Browser. Dieser Modus ist zum Ausprobieren gedacht, **nicht** für eine umfangreiche Fotobibliothek oder geräteübergreifende Sicherung.

## Supabase-Projekt

Projekt-URL: `https://amlnjmehzewluqaxmdcx.supabase.co`

Der optionale Supabase-Client ist unter `src/lib/supabase.ts` vorbereitet, aber **die React-App arbeitet noch im lokalen Demo-Modus**. Auch die SQL-Migration wurde nicht automatisch im Supabase-Projekt ausgeführt.

Nächste Schritte:
1. In Supabase **Project Settings → API Keys** den **Publishable Key** (z. B. `sb_publishable_...`) abrufen. **Keine Secret- oder service_role-Keys** veröffentlichen.
2. Die Datenbankmigration `supabase/migrations/202610210001_initial.sql` prüfen und ausführen; anonyme Anmeldung in Supabase Auth bewusst aktivieren oder eine Login-Methode wählen.
3. GitHub Pages benötigt die öffentlichen Vite-Variablen beim **Build**, nicht zur Laufzeit. Hierfür `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` als Build-Umgebungsvariablen konfigurieren und das Frontend mit Auth, Datenbank und privatem Storage verdrahten.
4. Den OpenAI-Key ausschließlich als Supabase Edge Function Secret einrichten, niemals unter `VITE_...`.

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

# BitWise Academy

Acest repository conține codul sursă pentru proiectul **BitWise Academy**, o aplicație ce include un frontend (React + TypeScript) și un backend (Python / Django).

## Adresa URL a repository-ului
Repository-ul GitHub poate fi găsit aici: [https://github.com/rustic-d3/BitWise_Academy](https://github.com/rustic-d3/BitWise_Academy)

## Cerințe preliminare (Prerequisites)
Înainte de a instala și rula aplicația, asigură-te că ai instalate pe sistemul tău următoarele instrumente:
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) și [Docker Compose](https://docs.docker.com/compose/)

## Pași de instalare
Urmează acești pași pentru a descărca și configura proiectul local:

1. **Clonează repository-ul:**
   Deschide un terminal și rulează comanda:
   ```bash
   git clone https://github.com/rustic-d3/BitWise_Academy.git
   ```

2. **Accesează directorul proiectului:**
   ```bash
   cd BitWise_Academy
   ```

3. **Configurează variabilele de mediu:**
   Proiectul necesită fișiere `.env` pentru ambele servicii (frontend și backend). Navighează în directoarele corespunzătoare, copiază template-urile existente și redenumește-le în `.env`:

   Pentru frontend:
   ```bash
   cp frontend/.env-frontend.template frontend/.env
   ```

   Pentru backend:
   ```bash
   cp backend/.env-backend.template backend/.env
   ```

## Lansarea aplicației
Proiectul este configurat cu `docker-compose` pentru un proces simplificat de lansare. Pentru a porni aplicația, rulează următoarea comandă în rădăcina proiectului:

```bash
docker-compose up --build
```
*(Poți folosi `docker-compose up -d --build` pentru a rula containerele în fundal - detached mode).*

Odată ce procesul de build și lansare s-a finalizat cu succes, serviciile vor fi disponibile local la următoarele adrese:
- **Frontend (Interfața Utilizator):** [http://localhost:5173](http://localhost:5173)
- **Backend (API):** [http://localhost:8000](http://localhost:8000)

Pentru a opri aplicația, folosește `Ctrl+C` (dacă a fost rulată în foreground) sau execută comanda:
```bash
docker-compose down
```

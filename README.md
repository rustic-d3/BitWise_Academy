# Instalare și lansare - BitWise Academy

## 1. Clonează repository-ul

Deschide un terminal (pe Windows poți folosi PowerShell, CMD sau Git Bash) și rulează:

```bash
git clone https://github.com/rustic-d3/BitWise_Academy.git
```

## 2. Accesează directorul proiectului

```bash
cd BitWise_Academy
```

## 3. Configurează variabilele de mediu

Proiectul necesită fișiere `.env` pentru ambele servicii (frontend și backend). Copiază template-urile existente și redenumește-le în `.env`.

Comanda diferă în funcție de terminalul folosit:

### macOS / Linux / Git Bash (Windows)

```bash
cp frontend/.env-frontend.template frontend/.env
cp backend/.env-backend.template backend/.env
```

### Windows - PowerShell

```powershell
Copy-Item frontend\.env-frontend.template frontend\.env
Copy-Item backend\.env-backend.template backend\.env
```

### Windows - Command Prompt (CMD)

```cmd
copy frontend\.env-frontend.template frontend\.env
copy backend\.env-backend.template backend\.env
```

> Cea mai simplă soluție dacă lucrezi pe Windows este să instalezi [Git Bash](https://git-scm.com/downloads) (vine împreună cu Git for Windows) și să rulezi comenzile `cp` exact ca pe Linux/macOS, fără să te mai chinui cu sintaxa PowerShell/CMD.

## Lansarea aplicației

Proiectul este configurat cu `docker-compose` pentru un proces simplificat de lansare. Aceste comenzi funcționează identic pe Windows, macOS și Linux, atâta timp cât ai [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalat și pornit.

Pentru a porni aplicația, rulează următoarea comandă în rădăcina proiectului:

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

## Notă pentru utilizatorii Windows

- Dacă `docker-compose` nu este recunoscut ca și comandă, verifică dacă Docker Desktop este instalat și pornit (integrarea WSL2 trebuie activată din Settings → Resources → WSL Integration).
- Dacă întâmpini erori legate de line endings (CRLF vs LF) în fișierele `.env` sau scripturi shell, poți configura Git să păstreze LF cu:
  ```bash
  git config --global core.autocrlf input
  ```

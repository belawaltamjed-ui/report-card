# Report Card Maker — Desktop App

এই ফোল্ডারটা তোমার **Report Card Maker** কে একটা full desktop app (.exe / .dmg) বানানোর জন্য রেডি করা।

## Storage
- আগে data browser-এর `localStorage`-এ থাকতো (যা uninstall/clear করলে হারিয়ে যেত)।
- এখন data একটা **real SQLite database file**-এ সেভ হয়, যেটা কম্পিউটারের স্থায়ী ফোল্ডারে থাকে:
  - **Windows:** `%APPDATA%\report-card-maker\reportcard.db`
  - **Mac:** `~/Library/Application Support/report-card-maker/reportcard.db`
- App uninstall করলেও এই ফাইলটা এমনিতে থেকে যায় (পুরোপুরি মুছতে হলে ম্যানুয়ালি ওই ফোল্ডার থেকে মুছতে হবে)।
- 💾 Backup Download / Import ফিচারটা আগের মতোই কাজ করবে (JSON ফাইল হিসেবে)।

## Files
```
report-card-desktop/
  main.js              → Electron main process + SQLite database logic
  preload.js            → renderer-কে safely database access দেয়
  index.html             → তোমার original app (persistence layer বদলানো হয়েছে)
  package.json           → build config (electron-builder)
  .github/workflows/build.yml → GitHub Actions (push করলেই exe + dmg বানাবে)
```

## GitHub-এ push করে exe/dmg বানানোর ধাপ

1. GitHub-এ একটা নতুন repository বানাও (public বা private, দুটোই চলবে)।
2. এই পুরো ফোল্ডারের ভেতরে গিয়ে টার্মিনালে:
   ```bash
   git init
   git add .
   git commit -m "Desktop app setup"
   git branch -M main
   git remote add origin https://github.com/<তোমার-username>/<repo-name>.git
   git push -u origin main
   ```
3. Push হওয়ার পর GitHub repo-এর **Actions** ট্যাবে যাও। "Build Desktop App" workflow টা automatically চলা শুরু করবে।
4. ~৫-১০ মিনিট পর workflow run-এর নিচে **Artifacts** সেকশনে দুটো zip পাবে:
   - `report-card-maker-windows-latest` → এর ভেতরে `.exe` ইনস্টলার
   - `report-card-maker-macos-latest` → এর ভেতরে `.dmg` ইনস্টলার
5. Zip ডাউনলোড করে ভেতরের `.exe` / `.dmg` ফাইলটা বের করে নাও — এটাই তোমার distributable installer।

## নিজের কম্পিউটারে টেস্ট করতে চাইলে (optional)
```bash
npm install
npm start
```
এতে Electron app সরাসরি চালু হবে টেস্টের জন্য, বিল্ড ছাড়াই।

## নোট
- Windows exe প্রথমবার খুললে "Unknown Publisher" SmartScreen warning দেখাতে পারে (code-signing certificate না থাকায়) — "More info → Run anyway" চাপলেই চলবে। চাইলে পরে একটা paid code-signing certificate কিনে এটা bypass করা যায়।
- Mac dmg unsigned থাকায় প্রথমবার খুলতে গেলে Gatekeeper আটকাতে পারে — System Settings → Privacy & Security থেকে "Open Anyway" দিতে হবে।
- Icon এখনো default Electron icon ব্যবহার করছে। নিজের logo দিয়ে icon বানাতে চাইলে `build/icon.ico` (Windows) আর `build/icon.icns` (Mac) ফাইল যোগ করে `package.json`-এর `build.win.icon` / `build.mac.icon`-এ path দিতে হবে — বললে সেটাও বানিয়ে দিব।

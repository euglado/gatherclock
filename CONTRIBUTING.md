# Contributing / Katkı

Open an issue describing the problem, expected behavior and steps to reproduce.
Do not attach tokens, .env files, private messages or personal event details.
For code changes, use Node.js 24, run `npm ci`, then `npm run check` and
`npm audit --audit-level=low`. Add tests for behavior changes, especially DST,
permissions, draft ownership and retry handling. Keep permissions minimal and
update both language sections of the README when behavior changes.

Sorunu, beklenen davranışı ve tekrar üretme adımlarını bir issue ile anlatın.
Token, .env, özel mesaj veya kişisel etkinlik bilgisi eklemeyin. Kod değişikliği
için Node.js 24 kullanın; `npm ci`, `npm run check` ve
`npm audit --audit-level=low` çalıştırın. Davranış değişikliklerine, özellikle
saat geçişi, yetki, taslak sahipliği ve yeniden deneme için test ekleyin.
İzinleri düşük tutun; README'nin her iki dilini de güncelleyin.

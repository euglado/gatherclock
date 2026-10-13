# GatherClock

**Türkçe:** Discord toplulukları için saat dilimi hatalarını azaltan etkinlik kartları.
**English:** Preview event cards that display in each Discord reader's local time.

[Türkçe rehber](#türkçe) · [English guide](#english) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)

## Türkçe

### Amaç ve özellikler

Farklı ülkelerdeki çalışma, oyun, gönüllülük ve müzik topluluklarında “19:30 kimin
saatine göre?” sorusunu azaltır. Gerçek bir Discord botudur; `/gather` komutuyla
açılan formdan başlık, yerel tarih/saat, IANA saat dilimi, süre ve kısa açıklama
alır. Önce yalnızca size görünen kartı gösterir. **Bu kanalda yayımla** düğmesine
basarsanız kart normal metin kanalında görünür; okuyucular başlangıç ve bitişi
Discord cihaz ayarlarına göre görür. **Vazgeç** hiçbir mesaj yayımlamaz.

- Türkçe ve İngilizce form, önizleme ve hata mesajları; `/gather language:Türkçe`.
- Yaz/kış saati geçişinde atlanan veya iki kez oluşan saatler reddedilir.
- En fazla 366 gün sonrası; süre 5–1440 dakika, boşsa 60 dakika.
- Taslaklar kullanıcı, sunucu ve kanala bağlıdır; 10 dakika sonra silinir.
- Aynı kullanıcının aynı sunucuda yeni taslağı eskisini geçersiz kılar.
- Yayımlama öncesi insan onayı ve güncel yetki kontrolü vardır. Aynı taslak bir
  kez kullanılabilir; sunucu başına yayınlar arasında 10 saniye beklenir.
- Etiketler bildirim göndermez; kullanıcı metnindeki bağlantılar ve Markdown
  etkisizleştirilir. Bot veritabanı, mesaj okuma veya ayrıcalıklı intent kullanmaz.

**Sınırlar:** Discord Scheduled Event oluşturmaz, RSVP/katılımcı listesi tutmaz,
hatırlatma/DM göndermez, kartı sonradan düzenlemez, müzik oynatmaz ve mesajları
modere etmez. Kanal/rol oluşturmaz. Forum, duyuru, özel mesaj ve thread desteklenmez.
Bir bot işlemi bir sunucu için tasarlanmıştır. Yeniden başlatma taslakları ve
bekleme sürelerini sıfırlar. Ağ zaman aşımında yayın sonucu belirsiz kalabilir;
tekrar denemeden kanalı kontrol edin. Kişisel takvim ve otomatik barındırma yoktur.

### Gereksinimler

Discord hesabı; bot ekleyebildiğiniz bir sunucu; Windows, macOS veya Linux;
[Node.js 24 LTS](https://nodejs.org/); internet ve sürekli çalışan bir bilgisayar
veya Node.js destekleyen barındırma hizmeti gerekir. Node.js 24 dışındaki
sürümler desteklenmez. Bu depo indirilebilir yazılımdır; hazır çevrimiçi bot
hizmeti değildir. Discord bot tokenınızı kendiniz oluşturmalısınız.

### Kurulum: Developer Portal

1. [Discord Developer Portal](https://discord.com/developers/applications)
   sayfasında **New Application** ile uygulama açın; adını GatherClock koyabilirsiniz.
2. **General Information → Application ID** değerini kopyalayın. Bu token değildir.
3. **Bot** sayfasında botu oluşturun (gerekiyorsa **Add Bot**), **Reset Token** ile
   token alın. Kimseyle paylaşmayın; ekran görüntüsü, issue veya GitHub'a koymayın.
   **Privileged Gateway Intents** altındaki üç anahtar kapalı kalsın. Botu yalnız
   siz kuracaksanız **Public Bot** kapalı kalabilir; bu ayar GitHub görünürlüğünden ayrıdır.
4. **Installation** bölümünde **Guild Install** kullanın. **User Install** gerekmez.
   Varsayılan scope'lar **bot** ve **applications.commands**; bot izinleri yalnızca
   **View Channels** ve **Send Messages** olsun. **Administrator** seçmeyin.
5. **Interactions Endpoint URL** alanını boş bırakın; bot Gateway bağlantısı kullanır.
6. Discord **Kullanıcı Ayarları → Gelişmiş → Geliştirici Modu** seçeneğini açın.
   Sunucu adına sağ tıklayıp **Sunucu Kimliğini Kopyala** seçin.
7. Bu depoda **Code → Download ZIP** ile indirin ve ZIP'i açın. Windows'ta
   `setup.cmd` dosyasına çift tıklayın. macOS/Linux'ta klasörde terminal açıp
   `sh setup.sh` çalıştırın. Node kurulumundan sonra açık terminali yeniden açın.
8. Kurulum tokenı gizli girişle, sonra uygulama ve sunucu kimliklerini sorar.
   Yazarken token görünmez. Sadece yerel `.env` dosyası oluşturulur; kaynak kod
   değiştirmeniz gerekmez. Verilen davet bağlantısına tıklayıp doğru sunucuya ekleyin.
9. Windows'ta `register.cmd`; macOS/Linux'ta `npm run register` çalıştırın.
   Bu yalnız `/gather` komutunu belirtilen sunucuya kaydeder; diğer komutları silmez.
10. Windows'ta `start.cmd`; macOS/Linux'ta `sh start.sh` çalıştırın. “çevrimiçi”
    mesajını bekleyin. Sunucuda `/gather` yazarak başlayın.

Terminal ile aynı kurulum:

```sh
npm ci
npm run build
npm run setup
# Verilen linkle botu sunucuya ekleyin, sonra:
npm run register
npm start
```

### Yapılandırma ve izinler

`npm run setup` ile ayarları yeniden girin; mevcut `.env` üzerine yazmak için
`yes` yanıtı gerekir. Tokenı sıfırladıysanız kurulumu tekrar yapıp botu yeniden
başlatın. Ortam değişkenleri de desteklenir: `DISCORD_TOKEN` gizli bot tokenı;
`DISCORD_APPLICATION_ID` aynı uygulamanın sayısal kimliği; `DISCORD_GUILD_ID`
tek hedef sunucunun sayısal kimliği. Host ortam değişkenleri `.env` değerlerinden
önceliklidir. `.env` işletim sistemi kullanıcı izinlerinizle de korunmalıdır;
POSIX'te 0600 istenir, Windows'ta klasör erişimini kendi hesabınızla sınırlayın.

Bot yalnız **Guilds** intent'i kullanır; üyeler, presence ve message content
intent'lerini açmayın. Davet izin değeri **3072** = Kanalı Görüntüle + Mesaj Gönder.
Embed Links, Read Message History, Manage Events, Manage Messages, Mention Everyone
ve Administrator **bot için gerekli değildir**. Kanal izinlerinin rol izinlerini
engellemediğini kontrol edin. Kartlar düz metindir; embed izni gerekmez.

Düzenleyici üyede **Etkinlikleri Yönet** veya **Sunucuyu Yönet** izni olmalıdır.
Komutun varsayılan görünürlüğü Etkinlikleri Yönet iznine bağlıdır. Sunucu yöneticisi
**Sunucu Ayarları → Entegrasyonlar → GatherClock** bölümünden komutu uygun rol ve
kanallara açabilir; çalışma anındaki düzenleyici kontrolü yine uygulanır. Botun
bu güçlü düzenleyici izinlerine ihtiyacı yoktur. Üyelerde ayrıca kanal erişimi ve
uygulama komutlarını kullanma izni bulunmalıdır.

### Kullanım ve çalışır tutma

`/gather` → başlık **Kitap kulübü** → tarih **2026-12-20 19:30** → saat dilimi
**Europe/Istanbul** → süre **90** → kısa açıklama. Bu tarih geçmişse gelecekteki
kendi tarihinizi seçin. **UTC**, **Europe/Berlin**, **America/New_York** ve
**Asia/Kathmandu** da örnektir. `TR`, `EST`, `GMT+3` yerine IANA adını kullanın.
Yaz/kış saatinde belirsiz zaman için başka bir saat seçin veya istediğiniz anı
önce UTC'ye çevirip UTC ile girin. Bot belirsiz saat için sessizce seçim yapmaz.

Önizlemedeki **Girilen saat** satırı düzenleyicinin saatini/dilimini sabit gösterir;
**Başlangıç/Bitiş** satırları okuyucuya göre değişir. Doğru kanalda olduğunuzu ve
açıklamada kişisel bilgi olmadığını kontrol edip yayımlayın. Düzeltmek gerekirse
yetkili biri Discord'un mesaj menüsünden kartı silip yenisini oluşturabilir.

Terminal açık, cihaz uyanık ve internet bağlı olmalıdır. Terminali kapatmak veya
bilgisayarı uyutmak botu çevrimdışı yapar. Durdurmak için Ctrl+C kullanın.
Kesintisiz kullanımda Node.js 24 destekleyen bir host seçin, aynı komutlarla
bağımlılıkları/build'i kurun, üç değişkeni hostun gizli ayarlarına ekleyin ve
`npm start` işlemini yeniden başlatmalı bir servis olarak çalıştırın. Tek örnek
çalıştırın; host dosyaları ve ortam değişkenlerini koruyun. Barındırma maliyeti ve
sürekliliği bu projeye dahil değildir. Kayıt sadece ilk kurulumda veya komut değişince gerekir.

### Güvenlik ve gizlilik

Bot yalnızca kendi slash komutunu, modalını ve düğmelerini işler; genel mesajları,
sesleri veya üye listesini toplamaz. Kullanıcı/sunucu/kanal kimlikleri ve taslak
alanları en fazla 10 dakika işlem belleğinde tutulur; iptal/yayın/süre dolumu veya
yeniden başlatmayla kaldırılır. Sunucu kimliği ile kısa yayın beklemesi de geçici
bellektedir. Diskte olay verisi tutulmaz, telemetri veya üçüncü taraf takvim API'si
yoktur. Bot tokenı ve kurulum kimlikleri `.env` içinde veya host sırlarında kalır.
Loglar olay metni veya token içermez; hostun kendi log politikasını da inceleyin.

Önizleme “yalnızca size görünür” demektir; Discord'a iletilir, uçtan uca şifreleme
vaadi değildir. Yayımlanan kart Discord'da kalır; kanal okuyucuları ve Discord'un
kendi saklama politikaları geçerlidir. Discord üzerinden silin. Ayrıntılara özel
iletişim bilgisi koymayın. Bot tokenı sızarsa Portal'da hemen sıfırlayın. Güvenlik
bildirimi için [SECURITY.md](SECURITY.md) dosyasını okuyun.

### Sorun giderme

- **Node/npm bulunamadı:** Node.js 24 kurup terminali yeniden açın; `node --version` kontrol edin.
- **Bot çevrimdışı/başlatma başarısız:** `.env` ayarlarını `npm run setup` ile düzeltin;
  doğru bot tokenı, internet ve hostun Discord WebSocket erişimini kontrol edin.
- **Komut yok:** botu `bot` + `applications.commands` scope'larıyla ekleyin;
  uygulama/sunucu kimliklerini kontrol edip `npm run register` çalıştırın.
  Entegrasyon yetkilerini, Etkinlikleri Yönet iznini ve Discord istemcisini kontrol edin.
- **Yayımlama izni yok:** bota hedef kanalda Kanalı Görüntüle ve Mesaj Gönder;
  düzenleyiciye Etkinlikleri Yönet/Sunucuyu Yönet izni verin. Botu yönetici yapmayın.
- **Saat hatalı:** formda 24 saat ve `YYYY-MM-DD HH:mm`, IANA saat dilimi kullanın.
  Görüntülenen zaman okuyucunun cihaz ayarlarından etkilenir.
- **Taslak süresi doldu/kullanıldı:** `/gather` ile yenisini oluşturun. Yeni form eskisini
  geçersiz kılar; yeniden başlatma taslakları siler. Sunucu yayın beklemesi 10 saniyedir.
- **Yayın doğrulanamadı:** ağ hatası mesaj gönderildikten sonra da oluşabilir. Önce
  kanala bakın. Bot otomatik tekrar yayınlamaz; gerekirse yeni taslak hazırlayın.
- **Eski derleme:** güncelleme sonrası `npm ci` ve `npm run build` çalıştırın;
  komut tanımı değiştiyse `npm run register` uygulayın. `.env` dosyanızı koruyun.

### Testler, katkı ve lisans

```sh
npm ci
npm run check
npm audit --audit-level=low
```

`check`: Biome lint, strict TypeScript derleme, Node testleri, bağımlılık lisansı/
kilit dosyası bütünlük kontrolü ve kaynakta gizli bilgi kalıbı taraması. Testler
saat geçişi, hatalı veri, yetki kaybı, taslak sahipliği/süresi, ağ hatası ve aynı
anda düğmeye basma davranışını kapsar. GitHub Actions Windows/macOS/Linux üzerinde
Node.js 24 ile aynı kontrolleri çalıştırır; bot tokenı veya yazma izni istemez.
Tarama bilinen kalıplarla sınırlıdır; tüm güvenlik sorunlarının yokluğunu kanıtlamaz.
Testler Discord etkileşimlerini taklit eder; canlı token/sunucu testi yapılmış
sayılmaz. Dağıtmadan önce kendi test sunucunuzda form, önizleme, yayımla, iptal,
yetkisiz kullanıcı ve yeniden başlatma akışlarını deneyin.

[CONTRIBUTING.md](CONTRIBUTING.md) katkı adımlarını içerir. MIT lisansı kaynak
kullanımını/değiştirmeyi/dağıtmayı izin verir; garanti vermez. Bağımlılıkların
kendi lisansları da geçerlidir. Resmî kaynaklar:
[Discord etkileşimleri](https://docs.discord.com/developers/interactions/receiving-and-responding),
[izinler](https://docs.discord.com/developers/topics/permissions),
[Gateway](https://docs.discord.com/developers/events/gateway),
[Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy).

## English

### Purpose and features

GatherClock helps international study, gaming, volunteer and music communities
share an event time without asking “19:30 in whose timezone?”. It is a real
Discord bot: `/gather` opens a form for title, local date/time, IANA timezone,
duration and optional details. It shows a private preview first. Clicking
**Publish in this channel** posts a plain text card whose start/end timestamps
display in each reader's Discord device settings. **Cancel** publishes nothing.

- English and Turkish forms, previews and errors: `/gather language:English`.
- Rejects nonexistent or repeated times during daylight saving clock changes.
- Supports future dates within 366 days; duration 5–1440 minutes, default 60.
- Drafts belong to the original user, server and channel, expire after ten minutes,
  and are replaced by the user's next preview in the same server.
- Explicit human confirmation and fresh organizer permission checks before posting.
  Each draft can be used once; a server can publish once every ten seconds.
- No pings, privileged intents, message-content access, database or calendar service.
  User-supplied Markdown and links are neutralized.

**Limits:** Does not create Discord Scheduled Events, collect RSVPs, send reminders
or DMs, edit posted cards, play music, moderate messages or create roles/channels.
Only ordinary server text channels are supported; no announcement channels,
forums, threads or DMs. One process serves one configured server. Restarting loses
drafts and resets cooldowns. A network timeout can leave publication uncertain;
check the channel before retrying. Hosting and personal calendar integration are
not included.

### Requirements

A Discord account, a server where you can install a bot, Windows/macOS/Linux,
[Node.js 24 LTS](https://nodejs.org/), internet access and a computer or Node.js
host that stays online. Other Node.js major versions are unsupported. This is
self-hosted software, not a hosted bot invitation. You create your own bot token.

### Installation: Developer Portal to first command

1. Open the [Developer Portal](https://discord.com/developers/applications) and
   create a **New Application**; GatherClock is a suitable name.
2. Copy **General Information → Application ID**. This is not the bot token.
3. Open **Bot**, create the bot if needed, and use **Reset Token** to get its
   token. Never share it in screenshots, issues, chat or GitHub. Leave all three
   **Privileged Gateway Intents** disabled. **Public Bot** may remain off if only
   you install the bot; that setting is separate from repository visibility.
4. Under **Installation**, use **Guild Install**; user installation is unnecessary.
   Choose **bot** and **applications.commands** scopes. The bot only needs
   **View Channels** and **Send Messages**. Never choose **Administrator**.
5. Leave **Interactions Endpoint URL** empty: this bot receives Gateway events.
6. In Discord, enable **User Settings → Advanced → Developer Mode**. Right-click
   the server name and choose **Copy Server ID**.
7. Download this repository with **Code → Download ZIP** and extract it.
   On Windows double-click `setup.cmd`. On macOS/Linux open a terminal in the
   extracted folder and run `sh setup.sh`. Reopen the terminal after installing Node.
8. Setup asks for a hidden bot token, Application ID and Server ID, and saves a
   local `.env`. No source editing is required. Open the printed invitation link
   and install the bot in the intended server.
9. On Windows run `register.cmd`; on macOS/Linux run `npm run register`.
   Registration adds/updates only `/gather` in this server, preserving unrelated commands.
10. Run `start.cmd` on Windows or `sh start.sh` on macOS/Linux. Wait for the online
    message, then use `/gather` in Discord.

Equivalent terminal commands:

```sh
npm ci
npm run build
npm run setup
# Install using the printed link, then:
npm run register
npm start
```

### Configuration and permissions

Rerun `npm run setup` to change configuration; replacing an existing `.env`
requires typing `yes`. After resetting a token, rerun setup and restart the bot.
Supported environment variables: `DISCORD_TOKEN` (secret bot token),
`DISCORD_APPLICATION_ID` (the same application's numeric ID),
`DISCORD_GUILD_ID` (the single target server's numeric ID). Host environment
variables override `.env`. Restrict access to `.env` and the project directory:
setup requests POSIX mode 0600; on Windows use your account's folder access controls.

Only the **Guilds** intent is requested. Keep Members, Presence and Message Content
privileged intents disabled. Invite permission value **3072** is View Channel +
Send Messages. The bot needs neither Embed Links nor Read Message History, Manage
Events, Manage Messages, Mention Everyone or Administrator. Channel overrides
must permit View Channel and Send Messages. Cards are plain text, not embeds.

The human organizer needs **Manage Events** or **Manage Server**. Command default
visibility requires Manage Events. An administrator can configure command roles
and channels in **Server Settings → Integrations → GatherClock**; the runtime
organizer check still applies. The bot itself never needs these organizer powers.
Members also need channel access and permission to use application commands.

### Usage and keeping the bot online

Use `/gather` and enter **Book club**, **2026-12-20 19:30**, **Europe/Istanbul**,
**90** minutes and optional details. If that example is in the past, choose your
own future date. Other valid zones include **UTC**, **Europe/Berlin**,
**America/New_York** and **Asia/Kathmandu**. Use an IANA name, not `EST` or `GMT+3`.
For an ambiguous clock-change time, choose another time or convert the desired
instant to UTC first and enter it with UTC. The bot never silently picks an offset.

The **Entered time** line retains the organizer's input and timezone;
**Starts/Ends** adapt for each reader. Confirm the destination channel and remove
private information from details before publishing. To correct a posted card, an
authorized person can remove it through Discord's message menu and post a new one.

The terminal must stay open, the computer awake and the internet connected.
Closing the terminal or sleeping the computer takes the bot offline. Ctrl+C stops
it. For continuous hosting choose a Node.js 24 host, install/build with the same
commands, place the three variables in the host's secret settings and run
`npm start` under its restart-capable process service. Run only one instance and
protect host secrets/files. Hosting costs and uptime are your responsibility.
Registration is needed initially and when the command definition changes.

### Security and privacy

The bot handles only its own commands, forms and buttons. It does not collect
general messages, voice or the member list. Draft fields and user/server/channel
IDs live in process memory for up to ten minutes and disappear on cancellation,
publication, expiry or restart. Server cooldown IDs are also temporary memory.
There is no event database, telemetry or third-party calendar API. Configuration
and token remain in local `.env` or host secrets. Application logs omit user event
content and credentials; also review your host's logging policy.

A private preview is visible only to you in Discord; it is still transmitted to
Discord and is not a promise of end-to-end encryption. Posted cards remain on
Discord under channel access rules and Discord's retention policy. Remove them
through Discord. Avoid personal contact details. Reset leaked tokens immediately
in the Developer Portal. See [SECURITY.md](SECURITY.md) for reporting guidance.

### Troubleshooting

- **Node/npm missing:** install Node.js 24, reopen the terminal and check `node --version`.
- **Offline/startup failed:** rerun `npm run setup`; verify the bot token, network
  and host access to Discord's WebSocket/API endpoints.
- **Command missing:** install with `bot` + `applications.commands`, verify both
  IDs and run `npm run register`; check integration permissions, Manage Events
  and refresh the Discord client.
- **Publication denied:** check the bot's channel View Channel/Send Messages and
  organizer's Manage Events/Manage Server permissions. Do not grant bot Administrator.
- **Wrong time:** use `YYYY-MM-DD HH:mm`, a 24-hour clock and IANA timezone;
  displayed timestamps also follow the reader's device settings.
- **Expired/used preview:** start `/gather` again. A new preview invalidates your
  previous one in that server; restart discards all drafts. Server cooldown is ten seconds.
- **Publication unconfirmed:** a timeout can happen after Discord accepts a
  message. Check the channel first. The bot does not retry posting automatically.
- **Old build after update:** run `npm ci` and `npm run build`; if the command
  definition changed, run `npm run register`. Preserve your `.env`.

### Tests, contribution and license

```sh
npm ci
npm run check
npm audit --audit-level=low
```

`check` runs Biome lint, strict TypeScript compilation, Node tests, dependency
license/lockfile integrity checks and a source secret-pattern scan. Tests cover
DST, invalid data, permission loss, ownership/expiry, network failures and concurrent
clicks. GitHub Actions runs the same checks on Windows, macOS and Linux with Node.js
24, no bot token and read-only repository permissions. Pattern scans are limited
and do not prove the absence of every secret or vulnerability. Tests mock Discord
interactions; they are not live server/token verification. Before deployment use
your test server to verify forms, preview, publish, cancel, unauthorized users and restart.

See [CONTRIBUTING.md](CONTRIBUTING.md). Source is MIT licensed without warranty;
dependency licenses also apply. Official references:
[Discord interactions](https://docs.discord.com/developers/interactions/receiving-and-responding),
[permissions](https://docs.discord.com/developers/topics/permissions),
[Gateway](https://docs.discord.com/developers/events/gateway),
[Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy),
[Temporal timezone handling](https://tc39.es/proposal-temporal/docs/zoneddatetime.html).

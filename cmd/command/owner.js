import fs from 'fs'
import path from 'path'
import AdmZip from "adm-zip"
import { exec } from 'child_process'
import { jadiBot } from '../../system/jadibot.js'
const config = path.join(dirname, './set/config.json'),
      pkg = JSON.parse(fs.readFileSync(path.join(dirname, '../package.json'))),
      temp = path.join(dirname, '../temp')

export default function owner(ev) {
  ev.on({
    name: 'add owner',
    cmd: ['addowner'],
    tags: 'Owner Menu',
    desc: 'menambahkan owner',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              user = quoted?.participant || quoted?.mentionedJid?.[0],
              raw = args && args[0] ? args[0] : null,
              num = raw ? global.number(raw) : null,
              targetRaw = user || num,
              target = targetRaw.replace(/@s\.whatsapp\.net$/, '')

        if (!target) return xp.sendMessage(chat.id, { text: 'reply/tag/masukan nomor nya' }, { quoted: m })

        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))

        if (cfg.ownerSetting?.ownerNumber.includes(target)) return xp.sendMessage(chat.id, { text: 'nomor sudah ada' }, { quoted: m })

        cfg.ownerSetting.ownerNumber.push(target)
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2), 'utf-8')

        xp.sendMessage(chat.id, { text: `@${target} berhasil ditambahkan`, mentions: [targetRaw] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'add money',
    cmd: ['addmoney', 'adduang'],
    tags: 'Owner Menu',
    desc: 'menambahkan uang ke target',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = quoted?.participant || quoted?.mentionedJid?.[0]

        if (!target) return xp.sendMessage(chat.id, { text: `reply/tag target\ncontoh: ${prefix}${cmd} @pengguna/reply 10000` }, { quoted: m })

        const userDb = Object.values(db().key).find(u => u.jid === target),
              nominal = Number(args[1]) || Number(args[0]),
              mention = target.replace(/@s\.whatsapp\.net$/, '')

        if (!nominal || nominal < 1) return xp.sendMessage(chat.id, { text: 'nominal tidak valid' }, { quoted: m })

        if (!userDb) return xp.sendMessage(chat.id, { text: 'pengguna belum terdaftar' }, { quoted: m })

        userDb.moneyDb.moneyInBank += nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil ditambahkan ke bank @${mention}`, mentions: [target] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'backup',
    cmd: ['backup'],
    tags: 'Owner Menu',
    desc: 'backup sc',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const name = global.botName.replace(/\s+/g, '_'),
              vers = pkg.version.replace(/\s+/g, '.'),
              zipName = `${name}-${vers}.zip`

        if (!fs.existsSync(temp)) fs.mkdirSync(temp, { recursive: !0 })

        const p = path.join(temp, zipName),
              zip = new AdmZip(),
              file = [
                'cmd',
                'connect',
                'system',
                'index.js',
                'package.json'
              ]

        for (const item of file) {
          const full = path.join(dirname, '../', item)
          if (!fs.existsSync(full)) continue
          const dir = fs.lstatSync(full).isDirectory()
          dir
            ? zip.addLocalFolder(
                full,
                item,
                item === 'connect' ? p => !p.includes('session') : void 0
              )
            : zip.addLocalFile(full)
        }

        zip.writeZip(p)

        await xp.sendMessage(chat.id, {
          document: fs.readFileSync(p),
          mimetype: 'application/zip',
          fileName: zipName,
          caption: `${cmd} berhasil dibuat.\nNama file: ${zipName}`
        }, m && m.key ? { quoted: m } : {})

        setTimeout(() => {
          if (fs.existsSync(p)) fs.unlinkSync(p)
        }, 5e3)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'ban chat',
    cmd: ['ban', 'banchat'],
    tags: 'Owner Menu',
    desc: 'banned pengguna',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo,
              nomor = global.number(args.join(' ')) + '@s.whatsapp.net',
              target = ctx?.mentionedJid?.[0] || ctx?.participant || nomor,
              userdb = Object.values(db().key).find(u => u.jid === target)

        if (!target || !userdb) return xp.sendMessage(chat.id, { text: !target ? 'reply/tag atau input nomor' : 'nomor belum terdaftar' }, { quoted: m })

        const opsi = !!userdb?.ban

        if ((target && opsi)) return xp.sendMessage(chat.id, { text: 'nomor sudah diban' }, { quoted: m })

        userdb.ban = !0
        save.db()

        await xp.sendMessage(chat.id, { text: `${target.replace(/@s\.whatsapp\.net$/, '')} diban` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'ban grup',
    cmd: ['bangc', 'bangrup'],
    tags: 'Owner Menu',
    desc: 'memblokir grup',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const gc = getGc(chat)

        if (!chat.group || !gc || (chat.id && !!gc?.ban)) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa digunakan digrup' : !gc ? `grup ini belum terdaftar ketik ${prefix}daftargc` : 'grup ini sudah diban' }, { quoted: m })
        }

        gc.ban = !0
        save.gc()

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'clear tmp',
    cmd: ['clear', 'cleartmp', 'cleartemp'],
    tags: 'Owner Menu',
    desc: 'membersihkan tempat sampah',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const tmpdir = path.join(dirname, '../temp')

        if (!fs.existsSync(tmpdir)) return xp.sendMessage(chat.id, { text: 'file temp tidak ditemukan' }, { quoted: m })

        const file = fs.readdirSync(tmpdir)
        return !file.length
          ? xp.sendMessage(chat.id, { text: 'sampah sudah bersih' }, { quoted: m })
          : (file.forEach(f => fs.rmSync(path.join(tmpdir, f), { recursive: !0, force: !0 })),
            await xp.sendMessage(chat.id, { text: 'temp berhasil dibersihkan' }, { quoted: m }))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'del owner',
    cmd: ['delowner'],
    tags: 'Owner Menu',
    desc: 'menghapus nomor owner',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              target = args[0]
                ? await global.number(args[0])
                : (quoted?.mentionedJid?.[0] || quoted?.participant)?.replace(/@s\.whatsapp\.net$/, '');

        if (!target) return xp.sendMessage(chat.id, { text: 'reply/tag/masukan nomor nya' }, { quoted: m })

        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8')),
              list = cfg.ownerSetting?.ownerNumber || [],
              index = list.indexOf(target)

        if (index < 0) {
          return xp.sendMessage(chat.id, { text: 'nomor tidak terdaftar' }, { quoted: m })
        }

        list.splice(index, 1)
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2), 'utf-8')
        await xp.sendMessage(chat.id, { text: `${target} berhasil dihapus` }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'del uang',
    cmd: ['deluang'],
    tags: 'Owner Menu',
    desc: 'menghapus uang pengguna',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              user = quoted?.participant || quoted?.mentionedJid?.[0]

        if (!chat.group || !user) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa digunakan digrup' : 'reply/tag target' }, { quoted: m })
        }

        const userDb = Object.values(db().key).find(u => u.jid === user),
              nominal = Number(args[1]) || Number(args[0])

        if (!nominal || !userDb) {
          return xp.sendMessage(chat.id, { text: !nominal ? `nominal tidak valid\ncontoh: ${prefix}${cmd} 10000` : 'pengguna belum terdaftar' }, { quoted: m })
        }

        if (userDb.moneyDb?.money < nominal) return xp.sendMessage(chat.id, { text: `uang pengguna tersisa ${userDb?.moneyDb?.money.toLocaleString('id-ID')}` }, { quoted: m })

        userDb.moneyDb.money -= nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil disita` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'eval',
    cmd: ['=>', '>', '~>'],
    tags: 'Owner Menu',
    desc: 'Mengeksekusi kode JavaScript secara langsung',
    owner: !0,
    prefix: !1,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      text
    }) => {
      try {
        const code = text.slice(cmd.length).trim()

        if (!code) return xp.sendMessage(chat.id, { text: `isi ${cmd} yang akan dijalankan` }, { quoted: m })

        let result

        if (cmd === '~>') {
          let logs = [], ori = log

          log = (...v) =>
            logs.push(
              v.map(x =>
                typeof x === 'object'
                  ? JSON.stringify(x, null, 2)
                  : String(x)
              ).join(' ')
            )

          result = await eval(`(async()=>{${code}})()`)

          log = ori

          return xp.sendMessage( chat.id, { text:
                logs.join('\n') ||
                (result !== undefined
                  ? typeof result === 'object'
                    ? JSON.stringify(result, null, 2)
                    : String(result)
                  : 'code berhasil dijalankan tanpa output') }, { quoted: m })
        }

        if (cmd === '=>') {
          const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor,
                lines = code.split('\n').map(v => v.trim()).filter(v => v),
                last = lines.at(-1),
                name =
                  last?.startsWith('const ') || last?.startsWith('let ') || last?.startsWith('var ')
                    ? last.replace(/^const |^let |^var /, '').split('=')[0].trim()
                    : null,
                fn = new AsyncFunction(`
                  with (globalThis) {
                    ${code}
                    return ${name || 'undefined'}
                  }
                `)

          result = await fn()
        }

        else
          result = await eval(`(async()=>{return ${code}})()`)

        await xp.sendMessage(chat.id, { text:
              result !== undefined
                ? typeof result === 'object'
                  ? JSON.stringify(result, null, 2)
                  : String(result)
                : 'code berhasil dijalankan tanpa output' }, { quoted: m })

      } catch (e) {
        await xp.sendMessage(chat.id, { text: e?.stack || String(e) }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'isi bank',
    cmd: ['isibank','addbank'],
    tags: 'Owner Menu',
    desc: 'isi saldo bank',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const num = parseInt(args),
              bank = path.join(dirname,'./db/bank.json')

        if (!args || isNaN(num)) return xp.sendMessage(chat.id,{ text: `nominal tidak valid\ncontoh: ${prefix}${cmd} 10000` },{ quoted: m })

        const saldoBank = JSON.parse(fs.readFileSync(bank,'utf-8')),
              saldoLama = saldoBank.key?.saldo || 0,
              saldoBaru = saldoLama + num

        saldoBank.key.saldo = saldoBaru

        fs.writeFileSync(bank, JSON.stringify(saldoBank,null,2))

        await xp.sendMessage(chat.id, { text: `Saldo bank ditambah: Rp ${num.toLocaleString('id-ID')}\nTotal: Rp ${saldoBaru.toLocaleString('id-ID')}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'jadi bot',
    cmd: ['jadibot'],
    tags: 'Owner Menu',
    desc: 'membuat usr jadi bot',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const usr = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!usr) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar, ulangi' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
        let txt = `Cara memasang bot/menjadi bot\n\n`
            txt += `1. Pertama salin code pairing/otp nya\n`
            txt += `2. Klik notifikasi yang muncul pada whatsapp anda lalu masukan code tadi\n\n`
            txt += `Jika notifikasi tidak muncul ikuti cara ini:\n\n`
            txt += '1. Salin code Pairing/Otp\n'
            txt += '2. Klik titik 3 dikanan atas pada menu whatsapp\n'
            txt += '3. Lalu tautkan perangkat\n'
            txt += '4. Klik tautkan dengan nomor telepon\n'
            txt += '5. Masukan code Pairing/Otp nya\n\n'
            txt += `jika kedua cara ini masih tidak berhasil cobalah hubungi owner dengan mengetik .owner`

        const nomor = chat.sender?.replace(/@s\.whatsapp\.net$/, '')

        await jadiBot(xp, nomor, m, txt)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'list jadi bot',
    cmd: ['listjadibot', 'listbotmode'],
    tags: 'Owner Menu',
    desc: 'melihat list jadibot',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (m.key.jadibot) return

        const baseDir = './connect',
              dirExists = fs.existsSync(baseDir),
              sessions = dirExists
                ? fs.readdirSync(baseDir)
                    .filter(v => 
                      v !== 'session' &&
                      fs.lstatSync(`${baseDir}/${v}`).isDirectory()
                    )
                : [],
              clients = Object.keys(global.client || {}),
              all = [...new Set([...sessions, ...clients])]

        if (!all.length || (sessions.length ? !sessions.length : !clients.length)) {
          return xp.sendMessage(chat.id, { text: 'tidak ada bot aktif' }, { quoted: m })
        }

        let teks = '*LIST JADIBOT*\n\n'

        for (const id of all) {
          const jid = `${id}`,
                isClient = clients.includes(id),
                isSessi = sessions.includes(id)

          teks += `• ${jid}\n`
          teks += `  - client : ${isClient ? 'aktif' : 'tidak aktif'}\n`
          teks += `  - session : ${isSessi ? 'ada' : 'tidak ada'}\n\n`
        }

        await xp.sendMessage(chat.id, { text: teks.trim() }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'mode',
    cmd: ['mode'],
    tags: 'Owner Menu',
    desc: 'setting mode group/private',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const arg = args[0]?.toLowerCase(),
              cfg = JSON.parse(fs.readFileSync(config, 'utf-8')),
              input = arg === 'group',
              type = v => v ? 'Group' : 'Private',
              md = type(global.isGroup)

        if (!['private', 'group'].includes(arg)) return xp.sendMessage(chat.id, { text: `gunakan: ${prefix}${cmd} group/private\n\n${cmd}: ${md}` }, { quoted: m })

        cfg.botSetting.isGroup = input
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))

        xp.sendMessage(chat.id, { text: `${cmd} berhasil diganti ${input ? 'ke group' : 'ke private'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'unban',
    cmd: ['unban'],
    tags: 'Owner Menu',
    desc: 'menghapus status ban pada pengguna',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo,
              nomor = global.number(args.join(' ')) + '@s.whatsapp.net',
              target = ctx?.mentionedJid?.[0] || ctx?.participant || nomor,
              userdb = Object.values(db().key).find(u => u.jid === target)

        if (!target || !userdb) return xp.sendMessage(chat.id, { text: !target ? 'reply/tag atau input nomor' : 'nomor belum terdaftar' }, { quoted: m })

        const opsi = !!userdb?.ban

        if ((target && !opsi)) return xp.sendMessage(chat.id, { text: 'nomor tidak diban' }, { quoted: m })

        userdb.ban = !1
        save.db()
        await xp.sendMessage(chat.id, { text: `${target.replace(/@s\.whatsapp\.net$/, '')} diunban` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'unban gc',
    cmd: ['unbangc', 'unbangrup'],
    tags: 'Owner Menu',
    desc: 'membuka ban grup',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const gc = getGc(chat)

        if (!chat.group || !gc || !gc?.ban) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa digunakan digrup' : !gc ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar`: 'grup ini tidak diban' }, { quoted: m })
        }

        gc.ban = !1

        save.gc()
        xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'public',
    cmd: ['public'],
    tags: 'Owner Menu',
    desc: 'pengaturan bot mode',
    owner: !0,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const arg = args[0]?.toLowerCase(),
              cfg = JSON.parse(fs.readFileSync(config, 'utf-8')),
              input = arg === 'on'

        if (!['on', 'off'].includes(arg)) return xp.sendMessage(chat.id, { text: `gunakan: ${prefix}${cmd} on/off\n\nstatus: ${global.public}` }, { quoted: m })

        cfg.ownerSetting.public = input
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))

        xp.sendMessage(chat.id, { text: `${cmd} ${input ? 'diaktifkan' : 'dimatikan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'shell',
    cmd: ['$', 'sh'],
    tags: 'Owner Menu',
    desc: 'menjalankan perintah shell',
    owner: !0,
    prefix: !1,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const cmd = args.join(' ')

        return !args.length
          ? xp.sendMessage(chat.id, { text: 'masukan perintah shell' }, { quoted: m })
          : exec(cmd, (e, out, err) => {
              const text = e ? e.message : err ? err : out || '✅'
              xp.sendMessage(chat.id, { text: text.trim() }, { quoted: m })
            })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'stop jadibot',
    cmd: ['stopjadibot', 'hapusbotmode', 'rbotmode'],
    tags: 'Owner Menu',
    desc: 'menghapus mode bot',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const usr = Object.values(db().key).find(u => u.jid === chat.sender)

        if (!usr || !m.key?.jadibot) return xp.sendMessage(chat.id, { text: 'cmd berhenti disini' }, { quoted: m })

        const sessi = `./connect/${usr?.jid?.replace(/@s\.whatsapp\.net$/, '')}`

        if (!global.client[usr?.jid?.replace(/@s\.whatsapp\.net$/, '')] || !fs.existsSync(sessi)) return xp.sendMessage(chat.id, { text: 'kamu tidak sedang jadi bot' }, { quoted: m })

        fs.rmSync(sessi, { recursive: !0, force: !0 })
        delete global.client[usr?.jid?.replace(/@s\.whatsapp\.net$/, '')]

        await xp.sendMessage(chat.id, { text: 'berhasil berhenti jadi bot\njangan lupa hapus perangkat tertaut di whatsapp anda' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}
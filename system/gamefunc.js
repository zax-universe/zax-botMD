import fs from 'fs'
import path from 'path'

const sfg = {
  timer: 24 * 60 * 60 * 1000,
  cost: 1000,
  sleep: ms => new Promise(r => setTimeout(r, ms))
}

const th = { timer: 120000 }

const file = path.join(dirname, '../temp/history_sambung_kata.json')

let runTimerHistory = !1,
    runfarm = !1,
    thCache = null,
    thTick  = 0,
    runRobberyCost = !1

async function cost_robbery() {
  if (runRobberyCost) return
  runRobberyCost = !0

  while (!0) {
    await sfg.sleep(sfg.timer)

    let dbsv = !1

    try {
      const usrDb = Object.values(db().key)

      for (const usr of usrDb) {
        if (!usr?.jid) continue

        usr.game ??= {}
        usr.game.robbery ??= {}
        usr.game.robbery.cost ??= 0

        usr.game.robbery.cost += 3
        dbsv = !0
      }

      if (dbsv) save.db()
    } catch (e) {
      err('error pada robberyCostLoop', e)
      erl(e, 'robberyCostLoop')
    }
  }
}

async function autofarm() {
  if (runfarm) return
  runfarm = !0

  while (!0) {
    let dbsv = !1,
        gmsv = !1,
        totalFarm = 0

    try {
      const usrDb = Object.values(db().key),
            dbFarm = gm().key.farm || {}

      for (const usr of usrDb) {
        if (!usr?.game?.farm) continue

        const jid = usr.jid,
              gameDb = Object.values(dbFarm).find(v => v.jid === jid)

        if (!gameDb || (usr?.moneyDb?.moneyInBank ?? 0) > 1e8) continue

        const nowTm = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY HH:mm:ss"),
              now = new Date(nowTm.split(' ').reverse().join(' ')),
              lastSet = gameDb?.set || nowTm,
              last = new Date(lastSet.split(' ').reverse().join(' ')),
              diff = now - last

        if (diff < sfg.timer) continue

        const exp = gameDb?.exp || 1,
              multiplier = Math.floor(exp / 10) || 1,
              cycle = Math.floor(25 / 2),
              reward = sfg.cost * multiplier * cycle

        gameDb.moneyDb.money += reward
        usr.moneyDb.moneyInBank += gameDb.moneyDb.money

        gameDb.moneyDb.money = 0
        gameDb.set = nowTm

        dbsv = !0
        gmsv = !0
        totalFarm++
      }

      if (dbsv) save.db()
      if (gmsv) save.gm()

    } catch (e) {
      err('error pada autofarm', e)
      erl(e, 'autofarm')
    }

    await sfg.sleep(sfg.timer)
  }
}

async function sambungkata(xp, m) {
  const chat = global.chat(m),
        usr = Object.values(db().key).find(v => v.jid === chat.sender),
        q = m.message?.extendedTextMessage?.contextInfo,
        jawaban = m.message?.conversation || m.message?.extendedTextMessage?.text,
        idBot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net'

  if (!usr || !q?.stanzaId || !jawaban || q.participant !== idBot) return

  let history = await fs.promises.readFile(file, 'utf8')
    .then(v => v ? JSON.parse(v) : { key:{} })
    .catch(() => ({ key:{} }))

  const uh = history.key?.[chat.sender],
        data = uh?.[q.stanzaId]

  if (!data?.status || data.no !== usr.noId) return

  const jawab = jawaban.trim().toLowerCase(),
        benar = data.key.toLowerCase()

  data.chance = jawab === benar ? data.chance : (data.chance ?? 1) - 1

  if (jawab !== benar)
    return data.chance <= 0
      ? (
          data.status = !1,
          await fs.promises.writeFile(file, JSON.stringify(history, null, 2)),
          xp.sendMessage(chat.id, { text:`Kesempatan habis!\nJawaban benar: *${data.key}*` }, { quoted:m })
        )
      : (
          await fs.promises.writeFile(file, JSON.stringify(history, null, 2)),
          xp.sendMessage(chat.id, { text:`Jawaban salah!\nChance tersisa: ${data.chance}` }, { quoted:m })
        )

  const lvl = Math.floor((usr.exp || 0) / 1e2) || 1,
        reward = 1e3 * lvl

  usr.moneyDb.moneyInBank += reward
  data.status = !1

  await fs.promises.writeFile(file, JSON.stringify(history, null, 2))
  save.db()

  return xp.sendMessage(chat.id, { text:`Jawaban benar!\nHadiah: Rp ${reward.toLocaleString('id-ID')}` }, { quoted:m })
}

function timerhistory(xp) {
  if (runTimerHistory) return

  runTimerHistory = !0

  setInterval(async () => {
    try {
      thTick++

      if (!thCache || thTick % 8 === 0) {
        const txt = await fs.promises.readFile(file, 'utf8').catch(() => '')
        thCache = txt ? JSON.parse(txt) : { key: {} }
      }

      const history = thCache,
            now = Date.now()
      let changed = !1

      history.key ??= {}

      for (const sender in history.key) {
        const rooms = history.key[sender]

        for (const id in rooms) {
          const d = rooms[id]

          if (!d?.status) d.status = d.status

          if (d?.status) {
            now - d.set < th.timer
              ? d.status = d.status
              : (
                  d.status = !1,
                  changed = !0,
                  await xp.sendMessage(d.chat, {
                      text: `@${sender.split('@')[0]} waktu habis!\njawaban yang bener: ${d.key}\nuntuk soal: ${d.soal}`,
                      mentions: [sender]
                    }).catch(() => !1)
                )
          }
        }
      }

      if (changed)
        await fs.promises.writeFile(file, JSON.stringify(history))

    } catch {
      !1
    }
  }, 1.5e4)
}


export { autofarm, sambungkata, timerhistory, cost_robbery }
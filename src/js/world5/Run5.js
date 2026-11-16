import { GEAR_Q5, dropGear5, itemName5, recycle5 } from './gear.js';
import {
  BOSS_CLEAVE5,
  BOSS_CLEAVE_CD5,
  CLASSES5,
  DUST_BOSS_P5,
  DUST_P5,
  ENEMIES5,
  ESS_BOSS5,
  ESS_P5,
  HEROES5,
  KRYON_FIRST5,
  KRYON_P5,
  ZONE_LEN5,
  enemyAtk5,
  enemyHp5,
  enemyLoot5,
  heroStats5,
  kryonBoss5,
  wave5,
  waveOf5,
  zone5,
  zoneOf5,
} from './data.js';

/* ================= WELT 5: der Lauf (Spiellogik ohne Oberfläche) =================
   Alles spielt auf einer Linie: Helden stehen bei x = −Platz · GAP (Platz 0 vorn), Gegner kommen von rechts.
   Nahkämpfer (Helden wie Gegner) treffen nur, was nah genug steht; deshalb zählt die Aufstellung.
   Der Lauf schreibt Beute und Fortschritt direkt in den Spielstand der Welt (save.w5) – es gibt kein Ende mit Abrechnung.
   Phasen: walk (Gruppe läuft zur nächsten Welle) → fight → won (kurze Pause) bzw. wipe (Gruppe gefallen, eine Welle zurück). */
export const GAP5 = 56, // Abstand zwischen zwei Reihen
  MELEE5 = 112, // so weit reicht ein Nahkämpfer nach vorn: aus der vordersten besetzten Reihe und der dahinter trifft er, aus der dritten nicht
  RANGE5 = 440,
  WALK_T5 = 0.5,
  ADV5 = 90, // Lauftempo der Gruppe
  CONTACT5 = 120, // die Gruppe läuft weiter, bis der nächste Gegner so nah ist (Wunsch des Nutzers: nicht stehen bleiben und warten)
  SWING5 = 0.28, // Dauer der Angriffsbewegung, nur für die Anzeige
  WON_T5 = 0.5,
  WIPE_T5 = 1.6,
  ENGAGE5 = 3, // so viele Nahkampf-Gegner können gleichzeitig angreifen
  WAVE_T5 = 60, // Zeitlimit je Welle in Sekunden (Vorgabe des Nutzers: Eine Gruppe, die nur aushält und kaum Schaden macht, soll
  BOSS_T5 = 90, // nicht durchkommen – fünf Verteidiger brauchten sonst nur Geduld). Läuft die Zeit ab, zählt die Welle als verloren.
  REST5 = 1; // nach jeder gewonnenen Welle: volles Leben, Gefallene stehen wieder auf (Vorgabe des Nutzers)

export class Run5 {
  constructor(w5, hooks) {
    this.s = w5;
    this.h = hooks || {};
    this.headless = false;
    this.t = 0;
    this.dist = 0; // zurückgelegter Weg, nur für die Anzeige
    this.moving = true; // läuft die Gruppe gerade? (Anzeige: Schrittbewegung, wandernder Boden)
    this.fx = [];
    this.heroes = [];
    this.en = [];
    this.wins = 0;
    this.loot = 0; // gefundene Ausrüstung in diesem Lauf
    this.wipes = 0;
    this.timeouts = 0; // davon: Zeit abgelaufen
    this.why = ''; // Grund der letzten Niederlage: 'wipe' oder 'time'
    this.wt = 0; // Sekunden im laufenden Kampf
    this.limit = WAVE_T5; // Zeitlimit der laufenden Welle
    this.noLimit = false; // nur für Messungen: ohne Zeitlimit
    this.cur = null; // Held, der gerade handelt (für die Auswertung: wem Schaden und Heilung gehören)
    this.scrap = 0; // Schrott aus automatisch recycelter Beute in diesem Lauf
    this.guard = 0; // Bollwerk: Schaden an der Gruppe gesenkt
    this.invul = 0; // Aegis: kein Schaden
    this.haste = 0; // Ansporn, Zeitkrümmung
    this.hasteAtk = 0; // Angriffsbonus während des Ansporns (Fanal)
    this.mark = 0; // Zielmarke (Signal): Gegner nehmen mehr Schaden
    this.am = 1; // Faktor auf den Angriff der Gruppe
    this.auraDr = 0; // Anteil, um den die Gruppe weniger Schaden nimmt (Orakel)
    this.begin(true);
  }
  /* ---------- Aufbau ---------- */
  // Gruppe aus dem Spielstand neu aufstellen (volles Leben, Energie bleibt bei 0)
  muster() {
    this.heroes = [];
    this.s.team.forEach((id, slot) => {
      const st = id && this.s.heroes[id];
      if (!st) return;
      const v = heroStats5(id, st.l, st.r, this.s.gear[id]),
        H = HEROES5[id];
      this.heroes.push({
        id,
        cls: H.cls,
        champ: H.rar === 'champ',
        slot,
        row: Math.floor(slot / 3), // 0 = vorn
        lane: (slot % 3) - 1, // Spur im Raster, nur für die Anzeige
        x: -Math.floor(slot / 3) * GAP5,
        hp: v.hp,
        max: v.hp,
        atk: v.atk,
        cd0: v.cd,
        cd: v.cd * 0.5,
        en: 0,
        reg: v.en,
        dead: false,
        sh: 0,
        flash: 0,
        cast: 0,
        tr: H.trait, // Eigenheit des Helden
        hits: 0,
        gdr: v.dr, // Schadensminderung aus der Ausrüstung
        gheal: v.heal, // Set-Boni: Heilungen stärker, Fähigkeit stärker, Schutz für die Gruppe
        gabil: v.abil,
        gaura: v.aura,
        spk: 0, // Stachelpanzer (Poller) läuft noch so lange
        out: false, // Nahkämpfer, der gerade keinen Gegner erreicht (steht zu weit hinten) – nur für die Anzeige
        at: 0, // läuft ab, solange die Angriffsbewegung gezeigt wird
        // Auswertung (Simulation): ausgeteilter Schaden, Heilung, erlittener Schaden, vom Schild geschluckt, Fähigkeiten, gefallen
        dmg: 0,
        healed: 0,
        taken: 0,
        soaked: 0,
        casts: 0,
        downs: 0,
      });
    });
  }
  // Werte nach einer Aufwertung übernehmen, ohne den Kampf neu zu beginnen
  refresh() {
    for (const h of this.heroes) {
      const st = this.s.heroes[h.id],
        v = heroStats5(h.id, st.l, st.r, this.s.gear[h.id]),
        f = h.hp / h.max;
      h.max = v.hp;
      h.hp = h.dead ? 0 : Math.max(1, Math.round(v.hp * f));
      h.atk = v.atk;
      h.reg = v.en;
      h.cd0 = v.cd;
      h.gdr = v.dr;
      h.gheal = v.heal;
      h.gabil = v.abil;
      h.gaura = v.aura;
    }
  }
  begin(fresh) {
    this.stage = Math.max(1, this.s.pos);
    this.zone = zoneOf5(this.stage);
    this.wave = waveOf5(this.stage);
    if (fresh) this.muster();
    this.en = [];
    this.guard = this.invul = this.haste = 0;
    this.hasteAtk = 0;
    this.mark = 0;
    this.angel = true; // Schutzengel: einmal je Welle
    this.phase = 'walk';
    this.pt = WALK_T5;
  }
  spawn() {
    const s = this.stage;
    this.en = wave5(s).map((type, i) => {
      const T = ENEMIES5[type],
        hp = enemyHp5(s, type);
      return {
        type,
        x: 560 + i * 38,
        lane: (i % 3) - 1,
        hp,
        max: hp,
        atk: enemyAtk5(s, type),
        cd0: T.cd,
        cd: T.cd * (0.5 + (i % 4) * 0.15),
        sp: T.sp,
        r: T.r,
        ranged: !!T.ranged,
        boss: !!T.boss,
        stun: 0,
        shots: i,
        cl: BOSS_CLEAVE_CD5,
        flash: 0,
        at: 0,
        col: T.col,
      };
    });
    this.phase = 'fight';
    this.wt = 0;
    this.limit = this.wave === ZONE_LEN5 ? BOSS_T5 : WAVE_T5;
  }
  /* ---------- Steuerung von außen ---------- */
  // Auf eine schon erreichte Stufe wechseln; die Welle beginnt neu
  goto(stage, hold) {
    const s = Math.max(1, Math.min(stage, this.s.cleared + 1));
    this.s.pos = s;
    this.s.hold = !!hold;
    if (this.s.block && s >= this.s.block) this.s.block = 0;
    this.begin(true);
  }
  // „Boss herausfordern“: hebt die Sperre auf und tritt sofort gegen den Boss an
  challenge() {
    if (!this.s.block) return false;
    const b = this.s.block;
    this.s.block = 0;
    this.s.pos = b;
    this.s.hold = false;
    this.begin(true);
    return true;
  }
  /* ---------- Hilfen ---------- */
  front() {
    let f = null;
    for (const h of this.heroes) if (!h.dead && (!f || h.row < f.row)) f = h;
    return f;
  }
  note(x, lane, text, col) {
    if (this.headless) return;
    this.fx.push({ k: 'num', x, lane, text, col, t: 0, m: 0.9 });
    if (this.fx.length > 60) this.fx.shift();
  }
  bolt(a, b, col, wide) {
    if (this.headless) return;
    this.fx.push({
      k: 'bolt',
      x1: a.x,
      l1: a.lane || 0,
      x2: b.x,
      l2: b.lane || 0,
      col,
      t: 0,
      m: 0.16,
      w: wide ? 4 : 2,
    });
    if (this.fx.length > 60) this.fx.shift();
  }
  ring(x, col, r) {
    if (this.headless) return;
    this.fx.push({ k: 'ring', x, col, r: r || 60, t: 0, m: 0.45 });
  }
  say(h, text) {
    if (this.headless) return;
    h.cast = 1.2;
    h.castName = text;
  }
  // from = angreifender Gegner (für Dornen), fehlt bei Flächenschaden
  hurt(h, d, from) {
    if (h.dead || this.invul > 0) return;
    if (this.guard > 0) d *= 0.75;
    d *= (1 - (h.tr.dr || 0)) * (1 - this.auraDr) * (1 - h.gdr);
    if (from && !from.ranged && (h.tr.thorns || h.spk > 0)) {
      const c = this.cur;
      this.cur = h; // zurückgeworfener Schaden gehört dem Getroffenen
      this.hit(from, d * (h.spk > 0 ? 1 : h.tr.thorns), null);
      this.cur = c;
    }
    if (h.sh > 0) {
      const a = Math.min(h.sh, d);
      h.sh -= a;
      d -= a;
      h.soaked += a;
    }
    if (d <= 0) return;
    h.taken += Math.min(d, h.hp);
    h.hp -= d;
    h.flash = 0.12;
    if (h.hp <= 0 && this.angel && this.heroes.some(a => !a.dead && a.tr.angel)) {
      this.angel = false;
      h.hp = 1;
      this.ring(h.x, '#ffffff', 80);
      this.note(h.x, 0, 'Schutzengel', '#6dffb0');
    }
    if (h.hp <= 0) {
      h.hp = 0;
      h.dead = true;
      h.downs++;
      h.en = 0;
      h.sh = 0;
      this.h.sfx && this.h.sfx('down');
    }
  }
  heal(h, v) {
    if (h.dead) return;
    if (this.cur) v *= 1 + this.cur.gheal; // Lebensquell: Heilungen des Handelnden sind stärker
    const a = Math.min(h.max - h.hp, v);
    h.hp += a;
    if (this.cur) this.cur.healed += a;
    if (a >= 1) this.note(h.x, 0, '+' + Math.round(a), '#6dffb0');
  }
  hit(e, d, col) {
    if (e.hp <= 0) return;
    if (this.mark > 0) d *= 1.25;
    if (this.cur) this.cur.dmg += Math.min(d, e.hp);
    e.hp -= d;
    e.flash = 0.1;
    if (e.hp <= 0) {
      const l = enemyLoot5(this.stage, e.type);
      this.s.cur.l += l;
      this.note(e.x, e.lane, '+' + l, '#9fd8ff');
      // Ausrüstung als Beute: landet im Inventar
      for (const it of dropGear5(this.s, this.stage, e.boss)) {
        this.loot++;
        // Automatisch recyceln (Wunsch des Nutzers): Teile der angehakten Güten werden schon beim Aufheben zu Schrott
        const R = this.s.recy;
        if (R && R.auto[it.q] && (R.sets || !it.set)) {
          const n = recycle5(this.s, it.id);
          this.scrap += n;
          this.note(e.x, e.lane - 1.6, '+' + n + ' Schrott', '#b9c6d6');
          this.h.event && this.h.event('scrap', n);
          continue;
        }
        this.note(e.x, e.lane - 1.6, itemName5(it), GEAR_Q5[it.q].col);
        this.h.event && this.h.event('gear', it);
      }
      this.h.sfx && this.h.sfx(e.boss ? 'killbig' : 'kill');
    } else if (col && !this.headless && d >= 1) this.note(e.x, e.lane, String(Math.round(d)), col);
  }
  /* ---------- Helden ---------- */
  // Lohnt sich die Fähigkeit jetzt? (Vorgabe: Helden handeln sinnvoll – ein Heiler heilt nicht, wenn alle volles Leben haben.)
  useful(h, foes) {
    const alive = this.heroes.filter(a => !a.dead),
      miss = alive.reduce((s, a) => s + (a.max - a.hp), 0),
      low = alive.some(a => a.hp < a.max * 0.6),
      boss = foes.some(e => e.boss);
    if (!foes.length) return false;
    if (h.id === 'aegis') return alive.some(a => a.hp < a.max * 0.7) && this.invul <= 0;
    if (h.id === 'phoenix') return this.heroes.some(a => a.dead) || miss >= h.atk * 8 || low;
    if (h.id === 'chronos') return this.haste <= 0.5;
    const ak = HEROES5[h.id].ak;
    if (ak === 'spikes') return foes.some(e => !e.ranged && e.x - h.x <= MELEE5 + e.r) && h.spk <= 0;
    if (ak === 'firstaid') return alive.some(a => a.hp < a.max * 0.6);
    if (ak === 'mark') return this.mark <= 0.5;
    if (ak === 'fireball') return true;
    if (h.cls === 'tank') return (h.hp < h.max * 0.85 || foes.length >= 3 || boss) && this.guard <= 0;
    if (h.cls === 'striker') return foes.some(e => e.x - h.x <= MELEE5 + e.r);
    if (h.cls === 'mage') return foes.length >= 2 || boss;
    if (h.cls === 'healer') return miss >= h.atk * 3.5 || low;
    if (h.cls === 'support') return this.haste <= 0.5;
    return true;
  }
  ability(h, foes) {
    const C = CLASSES5[h.cls],
      T = h.tr,
      A = h.atk * this.am * (1 + h.gabil), // Angriff mit den Boni der Gruppe und dem Set-Bonus auf die Fähigkeit
      col = C.col,
      near = foes.filter(e => e.x - h.x <= MELEE5 + e.r).sort((a, b) => a.x - b.x);
    const H5 = HEROES5[h.id];
    h.casts++;
    this.say(h, H5.abil || C.abil);
    this.h.sfx && this.h.sfx('pulse');
    if (h.id === 'aegis') {
      this.invul = 3;
      h.sh = h.max * 0.5;
      this.ring(h.x, col, 150);
    } else if (h.id === 'fenris') {
      const e = near[0];
      if (!e) return false;
      this.bolt(h, e, col, true);
      this.hit(e, A * 7, col);
      if (e.hp <= 0) h.en = 60;
      return e.hp > 0;
    } else if (h.id === 'astra') {
      for (const e of foes) {
        this.hit(e, A * 2.4, col);
        e.stun = Math.max(e.stun, e.boss ? 1 : 2);
      }
      this.ring(foes[0].x, col, 220);
    } else if (h.id === 'phoenix') {
      const d = this.heroes.find(a => a.dead);
      if (d) {
        d.dead = false;
        d.hp = d.max * 0.6;
        this.ring(d.x, '#ffb14f', 70);
      } else for (const a of this.heroes) this.heal(a, a.max * 0.45);
    } else if (h.id === 'chronos') {
      for (const a of this.heroes) if (!a.dead && a !== h) a.en = Math.min(100, a.en + 45);
      this.haste = 6;
      this.hasteAtk = 0;
      this.ring(h.x, col, 170);
    } else if (H5.ak === 'spikes') {
      h.spk = 5;
      h.sh = h.max * 0.2;
      this.ring(h.x, col, 90);
    } else if (H5.ak === 'whirl' || H5.ak === 'scythe') {
      if (!near[0]) return false;
      for (const e of near) this.hit(e, A * (H5.ak === 'whirl' ? 1.6 : 2.2) * (T.abil || 1), col);
      this.ring(h.x + 40, col, 100);
    } else if (H5.ak === 'bleed') {
      if (!near[0]) return false;
      this.bolt(h, near[0], col, true);
      this.hit(near[0], A * 3, col);
      this.heal(h, A * 1.5);
    } else if (H5.ak === 'fireball') {
      const e = foes.slice().sort((a, b) => a.x - b.x)[0];
      this.bolt(h, e, col, true);
      this.hit(e, A * 4 * (T.abil || 1), col);
      for (const o of foes) if (o !== e && Math.abs(o.x - e.x) < 80) this.hit(o, A * 1.5 * (T.abil || 1), col);
      this.ring(e.x, col, 90);
    } else if (H5.ak === 'firstaid') {
      let t = null;
      for (const a of this.heroes) if (!a.dead && (!t || a.hp / a.max < t.hp / t.max)) t = a;
      this.heal(t, A * 9 * (T.healMul || 1));
      t.sh = Math.max(t.sh, t.max * 0.15);
      this.bolt(h, t, col, true);
    } else if (H5.ak === 'mark') {
      this.mark = 6;
      this.ring(foes[0].x, col, 200);
    } else if (h.cls === 'tank') {
      h.sh = h.max * 0.35 * (T.shieldMul || 1);
      this.guard = T.guardT || 4;
      this.ring(h.x, col, 110);
    } else if (h.cls === 'striker') {
      if (!near[0]) return false;
      this.bolt(h, near[0], col, true);
      this.hit(near[0], A * 3.5 * (T.abil || 1), col);
      if (near[1]) this.hit(near[1], A * 1.75 * (T.abil || 1), col);
    } else if (h.cls === 'mage') {
      for (const e of foes) {
        this.hit(e, A * 1.5 * (T.abil || 1), col);
        if (T.stunAbil) e.stun = Math.max(e.stun, e.boss ? T.stunAbil / 2 : T.stunAbil);
      }
      this.ring(foes[0].x, col, 200);
    } else if (h.cls === 'healer') {
      for (const a of this.heroes) {
        this.heal(a, A * 3.5 * (T.healMul || 1));
        if (T.abilShield && !a.dead) a.sh = Math.max(a.sh, a.max * T.abilShield);
      }
      this.ring(h.x, col, 150);
    } else if (h.cls === 'support') {
      this.haste = T.hasteT || 6;
      this.hasteAtk = T.hasteAtk || 0;
      if (T.abilEn) for (const a of this.heroes) if (!a.dead && a !== h) a.en = Math.min(100, a.en + T.abilEn);
      this.ring(h.x, col, 150);
    }
    return true;
  }
  act(h, foes) {
    const col = CLASSES5[h.cls].col,
      T = h.tr,
      A = h.atk * this.am;
    if (h.cls === 'healer') {
      let t = null;
      for (const a of this.heroes) if (!a.dead && a.hp < a.max * 0.9 && (!t || a.hp / a.max < t.hp / t.max)) t = a;
      if (t) {
        this.heal(t, A * 2.2 * (T.healMul || 1));
        this.bolt(h, t, col);
        return true;
      }
    }
    const melee = CLASSES5[h.cls].melee;
    let e = null;
    for (const o of foes) if (o.x - h.x <= (melee ? MELEE5 : RANGE5) + o.r && (!e || o.x < e.x)) e = o;
    if (!e) return false;
    let d = A;
    h.hits++;
    if (T.nth && h.hits % T.nth === 0) d *= 2;
    if (T.exec && e.hp < e.max * T.exec[0]) d *= T.exec[1];
    this.bolt(h, e, col);
    this.hit(e, d, null);
    if (T.leech) this.heal(h, d * T.leech);
    if (T.cleave || T.chain) {
      // zweites Ziel: der nächste weitere Gegner in Reichweite
      let o2 = null;
      for (const o of foes)
        if (o !== e && o.hp > 0 && o.x - h.x <= (melee ? MELEE5 : RANGE5) + o.r && (!o2 || o.x < o2.x)) o2 = o;
      if (o2) {
        this.bolt(h, o2, col);
        this.hit(o2, T.chain ? d : d * T.cleave, null);
      }
    }
    if (h.cls === 'mage')
      for (const o of foes) if (o !== e && Math.abs(o.x - e.x) < 70) this.hit(o, A * (T.splash || 0.5), null);
    return true;
  }
  updHeroes(dt) {
    const fast = this.haste > 0 ? 1.35 : 1;
    // Boni, die für die ganze Gruppe gelten, solange ihr Träger lebt bzw. der Ansporn läuft
    let aa = 0,
      ad = 0;
    for (const h of this.heroes)
      if (!h.dead) {
        aa = Math.max(aa, h.tr.auraAtk || 0);
        ad = Math.max(ad, h.tr.auraDr || 0, h.gaura);
      }
    this.am = 1 + aa + (this.haste > 0 ? this.hasteAtk : 0);
    this.auraDr = ad;
    for (const h of this.heroes) {
      if (h.flash > 0) h.flash -= dt;
      if (h.cast > 0) h.cast -= dt;
      if (h.at > 0) h.at -= dt;
      if (h.spk > 0) h.spk -= dt;
      if (h.dead) continue;
      const foes = this.en.filter(e => e.hp > 0);
      this.cur = h;
      h.en = Math.min(100, h.en + h.reg * fast * dt);
      if (h.en >= 100 && this.useful(h, foes)) {
        h.en = 0;
        h.at = SWING5;
        this.ability(h, foes);
        continue;
      }
      h.cd -= dt * fast;
      if (h.cd <= 0) {
        if (this.act(h, foes)) {
          h.cd = h.cd0;
          h.at = SWING5;
          h.out = false;
        } else {
          h.cd = 0;
          h.out = foes.length > 0 && !this.moving && CLASSES5[h.cls].melee;
        }
      }
    }
    this.cur = null;
  }
  /* ---------- Gegner ---------- */
  updEnemies(dt) {
    const f = this.front();
    if (!f) return;
    const alive = this.heroes.filter(h => !h.dead),
      frontRow = alive.filter(h => h.row === f.row);
    // Schützen halten nur Abstand, solange Nahkämpfer vor ihnen stehen; danach rücken sie selbst vor (sonst käme eine reine
    // Nahkampf-Gruppe nie an sie heran)
    const cover = this.en.some(e => e.hp > 0 && !e.ranged);
    let m = 0,
      rg = 0;
    for (const e of this.en) {
      if (e.hp <= 0) continue;
      if (e.flash > 0) e.flash -= dt;
      if (e.at > 0) e.at -= dt;
      const far = e.ranged && cover,
        k = far ? rg++ : m++,
        stop = far ? f.x + 215 + k * 20 : k < ENGAGE5 ? f.x + 26 + e.r + k * 9 : f.x + 70 + e.r + k * 28;
      if (e.stun > 0) {
        e.stun -= dt;
        continue;
      }
      if (e.x > stop) e.x = Math.max(stop, e.x - e.sp * dt);
      else if (e.x < stop) e.x = Math.min(stop, e.x + e.sp * dt);
      const ready = e.x <= stop + 2 && (far || k < ENGAGE5);
      if (e.boss && ready) {
        e.cl -= dt;
        if (e.cl <= 0) {
          e.cl = BOSS_CLEAVE_CD5;
          for (const h of alive) this.hurt(h, e.atk * BOSS_CLEAVE5);
          this.ring(f.x, e.col, 230);
          this.h.sfx && this.h.sfx('pulse');
        }
      }
      e.cd -= dt;
      if (e.cd > 0 || !ready) continue;
      e.cd = e.cd0;
      // Fernkämpfer treffen reihum alle, Nahkämpfer verteilen sich auf die vorderste Reihe
      const t = far ? alive[e.shots++ % alive.length] : frontRow[k % frontRow.length];
      if (!t || t.dead) continue;
      e.at = SWING5;
      this.bolt(e, t, e.col);
      this.hurt(t, e.atk, e);
    }
  }
  /* ---------- Ausgang einer Welle ---------- */
  win() {
    const s = this.stage,
      W = this.s,
      Z = zone5(this.zone),
      boss = this.wave === ZONE_LEN5,
      first = s > W.cleared;
    this.wins++;
    let k = 0;
    if (boss) {
      k += kryonBoss5(this.zone, first);
      W.ess[Z.ess] += ESS_BOSS5;
      if (Math.random() < DUST_BOSS_P5) W.cur.d++;
    } else {
      if (first) k += KRYON_FIRST5;
      if (Math.random() < KRYON_P5) k++;
      if (Math.random() < ESS_P5) {
        W.ess[Z.ess]++;
        this.note(40, -1, '+1 ' + CLASSES5[Z.ess].ess, CLASSES5[Z.ess].col);
      }
      if (Math.random() < DUST_P5) {
        W.cur.d++;
        this.note(40, 1, '+1 Synchron-Staub', '#ffe14f');
      }
    }
    if (k) {
      W.cur.k += k;
      this.note(40, 0, '+' + k + ' Kryon', '#c79bff');
    }
    if (first) W.cleared = s;
    this.phase = 'won';
    this.pt = WON_T5;
    this.h.event && this.h.event(boss ? 'boss' : 'win', s, first);
  }
  next() {
    const W = this.s,
      nx = this.stage + 1;
    if (!W.hold && nx !== W.block) W.pos = nx;
    for (const h of this.heroes) {
      h.dead = false;
      h.hp = Math.min(h.max, h.hp + h.max * REST5);
      h.sh = 0;
    }
    this.begin(false);
  }
  // Gruppe gefallen: eine Welle zurück, ohne Nachteil. Am Boss gescheitert: Die Welle davor läuft, bis der Spieler ihn herausfordert.
  // why = 'time': Die Zeit ist abgelaufen (zählt wie eine gefallene Gruppe)
  lose(why) {
    const W = this.s;
    this.wipes++;
    this.why = why || 'wipe';
    if (why === 'time') this.timeouts++;
    if (this.wave === ZONE_LEN5) W.block = this.stage;
    W.pos = Math.max(1, this.stage - 1);
    this.phase = 'wipe';
    this.pt = WIPE_T5;
    this.h.event && this.h.event('wipe', this.stage, this.why);
  }
  step(dt) {
    this.t += dt;
    if (!this.headless) {
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter(f => f.t < f.m);
    }
    if (this.guard > 0) this.guard -= dt;
    if (this.invul > 0) this.invul -= dt;
    if (this.haste > 0) this.haste -= dt;
    if (this.mark > 0) this.mark -= dt;
    this.moving = this.phase === 'walk' || this.phase === 'won';
    if (this.phase === 'walk') {
      this.dist += ADV5 * dt;
      this.pt -= dt;
      for (const h of this.heroes) if (!h.dead) h.en = Math.min(100, h.en + h.reg * 0.5 * dt);
      if (this.pt <= 0) this.spawn();
    } else if (this.phase === 'fight') {
      // Die Gruppe läuft den Gegnern entgegen, bis der nächste auf Kontakt heran ist. Gerechnet wird das als Bewegung der Gegner
      // auf die stehenden Plätze zu; Fernkämpfer der Gruppe schießen schon im Laufen.
      const f = this.front();
      let near = Infinity;
      for (const e of this.en) if (e.hp > 0 && e.x < near) near = e.x;
      if (f && near - f.x > CONTACT5) {
        this.moving = true;
        this.dist += ADV5 * dt;
        for (const e of this.en) e.x -= ADV5 * dt;
      }
      this.wt += dt;
      this.updHeroes(dt);
      this.updEnemies(dt);
      if (!this.en.some(e => e.hp > 0)) this.win();
      else if (!this.heroes.some(h => !h.dead)) this.lose();
      else if (!this.noLimit && this.wt >= this.limit) this.lose('time');
    } else if (this.phase === 'won') {
      this.dist += ADV5 * dt;
      this.pt -= dt;
      if (this.pt <= 0) this.next();
    } else {
      this.pt -= dt;
      if (this.pt <= 0) this.begin(true);
    }
  }
}

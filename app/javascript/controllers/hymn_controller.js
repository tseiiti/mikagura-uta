import { Controller } from "@hotwired/stimulus"

const c  = (arg) => { console.log(arg); }
const qs  = (arg) => { return document.querySelector(arg); }
const qsa = (arg) => { return document.querySelectorAll(arg); }
const config = {};
const prm = {};

// Connects to data-controller="hymn"
export default class extends Controller {
  connect() {
    if (this.element.localName == 'main') {
      let aux = JSON.parse(this.get_cookie('config') || '{}');
      config.hymn_id     = aux.hymn_id || 'hymn_00';
      config.font_size   = aux.font_size || 16;
      config.space_width = aux.space_width || 1.3;
      config.bpm_time    = aux.bpm_time || 60;
      config.suwari_0    = aux.suwari_0 || 21;
      config.suwari_1    = aux.suwari_1 || 3;
      config.suwari_2    = aux.suwari_2 || 3;
      config.animation   = !(aux.animation == false);
      config.instruments = aux.instruments || {};

      this.get_html();

      this.set('font_size', config.font_size);
      this.set('space_width', config.space_width);
      qs('.bpm_time').value = config.bpm_time;
      qs('.suwari_0').value = config.suwari_0;
      qs('.suwari_1').value = config.suwari_1;
      qs('.suwari_2').value = config.suwari_2;
      qs('.animation').checked = config.animation;

      this.set_hymn_menu();
      this.set_instrument_menu();
    }
  }

  // html principal do hino
  get_html() {
    clearInterval(prm.id);
    this.track_icon(0);

    fetch(`/hymns/data?hymn_id=${ config.hymn_id }`)
    .then(response => {
      if (response.ok) return response.text();
      throw new Error('Falha na requisição');
    })
    .then(data => {
      qs('main').innerHTML = data;

      for (let key in config.instruments) {
        let val = config.instruments[key];
        this.instrument_icon(key, val);
      }

      this.start_prm();
    })
    .catch(error => { console.error('Erro:', error); });
  }

  // troca de hino pelo menu
  set_hymn(event) {
    let e = event.target;
    this.set_hymn_aux(e.name, e.dataset.val);
  }

  // auxiliar de troca de hino pelo menu
  set_hymn_aux(arg, val) {
    this.set(arg, val);
    this.get_html();
    this.set_hymn_menu();
  }

  // hino anterior
  previous() {
    let aux = config.hymn_id.substr(5)
    if (aux != 'st') {
      aux = aux == '00' ? 'st' : String(parseInt(aux) - 1).padStart(2, '0');
      this.set_hymn_aux('hymn_id', 'hymn_' + aux);
    }
  }

  // próximo hino
  next() {
    let aux = config.hymn_id.substr(5)
    if (aux != '12') {
      aux = aux == 'st' ? '00' : String(parseInt(aux) + 1).padStart(2, '0');
      this.set_hymn_aux('hymn_id', 'hymn_' + aux);
    }
  }

  // troca de cor da lista
  set_hymn_menu() {
    qsa('.menu-hymns').forEach(a => {
      if (a.dataset.val == config.hymn_id) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  // ativa ícones
  instrument_icon(key, val) {
    qsa(`.${ key }`).forEach(e => {
      if (val) e.classList.remove('d-none');
      else e.classList.add('d-none');
    });
    qs(`input[name=${ key }]`).checked = val;
  }

  // troca de instrumento pelo menu
  set_instrument(event) {
    let e = event.target;
    this.instrument_icon(e.name, e.checked);

    config.instruments[e.name] = e.checked;
    this.set('instruments', config.instruments);

    this.set_instrument_menu();
  }

  // ativação de todos instrumentos
  set_instrument_all() {
    let e = qs('#ch_all')
    qsa('.menu-instrument').forEach(f => {
      f.checked = e.checked
      this.instrument_icon(f.name, e.checked)
      config.instruments[f.name] = e.checked;
    });
    this.set('instruments', config.instruments);
  }

  // verificação de todos instrumentos
  set_instrument_menu() {
    let count = 0;
    for (let k in config.instruments) {
      if (config.instruments[k]) count += 1;
    }
    qs('#ch_all').checked  = count == qsa('.menu-instrument').length;
    qs('#ch_none').checked = count == 0;
  }

  // ajuste + e -
  shift(event) {
    let e = event.target.parentElement;
    this.set(e.name, config[e.name] + Number(e.dataset.val));
  }

  // ajuste
  change(event) {
    let e = event.target;
    let val = Number(e.value);
    if (val > 0) this.set(e.name, Number(e.value));
  }

  // ajuste radio button
  toogle(event) {
    let e = event.target;
    this.set(e.name, e.checked);
  }

  // salvar ajuste e propriedade
  set(key, val) {
    config[key] = val;
    this.set_cookie('config', JSON.stringify(config));

    if ([ 'font_size', 'space_width' ].includes(key)) {
      let root = document.documentElement;
      if (key == 'font_size') {
        root.style.setProperty('--size-base', `${ val }px`);
      }
      if (key == 'space_width') {
        root.style.setProperty('--size-width-multiply', val);
        val = val.toFixed(2);
      }
      qs(`.${ key }`).innerText = val;
    }
  }

  set_cookie(key, val) {
    let d = new Date();
    d.setTime(d.getTime() + 20 * 365 * 24 * 60 * 60 * 1000);
    document.cookie = `${key}=${val};expires=${d.toUTCString()};path=/;samesite=lax;`;
  }

  get_cookie(key) {
    key = key + "=";
    let val = "";
    document.cookie.split("; ").forEach(e => {
      if (e.indexOf(key) === 0) {
        val = e.substring(key.length, e.length);
        return;
      }
    })
    return val;
  }

  /****************************************************************************
   * play fill
   ***************************************************************************/

  start_prm() {
    prm.id   = 0; // id do interval
    prm.ini  = 0; // id de beat inicial
    prm.cur  = 0; // id de beat atual
    // prm.cur  = 143; // id de beat atual
    prm.sts  = 0; // status
    prm.flag = false; // flag para reinicio
    prm.qs_0 = 0;
    prm.qs_1 = 0;
    prm.qs_2 = 0;
    prm.fsw  = false; // flag suwari término
    prm.beat = qsa('progress.beat'); // todos os beats
    prm.blen = qsa('progress.beat:not(.d-none)').length;
    this.bd();
    
    if (config.hymn_id == 'hymn_st') {
      this.suwari_message();
    }
  }

  // avança um beat
  bp() {
    prm.cur += 1;
    this.bd();
  }

  // define beat atual
  bd() {
    prm.b = prm.beat[prm.cur];         // beat atual
    if (prm.b) {
      prm.p = prm.b.dataset.paragraph; // parágrafo do beat atual
      prm.l = prm.b.dataset.line;      // linha do beat atual
    }
  }

  // controle geral de execução
  track() {
    if (prm.flag && !prm.fsw) {
      this.get_html(); // reset
      return
    }
    if (prm.sts == 0) {
      this.start();
    } else if (prm.sts == 1 || prm.sts == 2) {
      this.track_icon(3);
    } else {
      this.play();
    }
  }

  // 3 tempos iniciais
  start() {
    if (prm.fsw) {
      this.play_suwari_restore();
      this.play_suwari_start();
    }
    this.track_icon(1);

    // scroll na linha
    let es = qsa(`.first-span.paragraph_${ prm.p }.line_${ prm.l } span`);
    es[0].scrollIntoView({ behavior: "smooth", block: 'center', inline: "nearest" });
    
    // troca cor do ponto no tempo
    let i = 0;
    if (config.animation) es[i].style.color = '#555'
    prm.id = setInterval(function(fx) {
      i += 1;
      if (i == 3) {
        clearInterval(prm.id);
        prm.ini = prm.cur;
        fx.play();
        return;
      }
      if (config.animation) es[i].style.color = '#555';
    }, 1000 * 60 / config.bpm_time, this);
  }

  // tocar
  play() {
    this.track_icon(2);

    // marca 3 pontos iniciais
    qsa(`.first-span.paragraph_${ prm.p }.line_${ prm.l } span`)
      .forEach(f => { if (config.animation) f.style.color = '#555' });

    // pula ocultos iniciais do parágrafo
    if (prm.b.classList.contains('d-none')) this.bp();

    this.suwari_message();
    
    let i = 0;
    this.emphasis(true);
    prm.id = setInterval(function(fx) {
      i += 1;
      if (config.animation) prm.b.value = i;

      if (i == 5) {
        i = 0;
        fx.emphasis(false)
        fx.play_aux();
      }
    }, 100 * 60 / config.bpm_time, this);
  }

  // execução de cada beat
  play_aux() {
    // término
    this.bp();
    if (!prm.b) {
      this.track_icon(3);
      return;
    }
    
    let lin = qs(`.paragraph_${ prm.p } .line_${ prm.l }`);
    lin.scrollIntoView({ behavior: "smooth", block: 'center', inline: "nearest" });
    let es = lin.querySelectorAll('.beat');
    if (es[es.length - 1] == prm.b) {
      // pausa para início de 3 tempos
      if (lin.classList.contains('pause')) {
        if (this.play_suwari()) return;
        this.track_icon(0);
        this.bp();
      }
    }
    this.emphasis(true);
  }

  // mensagens do suwari
  suwari_message() {
    if (config.hymn_id == 'hymn_st') {
      if (prm.qs_0 == 0 && prm.cur > 0) prm.qs_0 = 1;
      if (prm.qs_1 == 0 && prm.p > 1) prm.qs_1 = prm.qs_2 = 1;

      let es = qsa('.message p');
      es[0].innerText = `${ prm.qs_0 } de ${ config.suwari_0 } vezes`;
      es[1].innerText = `${ prm.p >= 1 ? 1 : 0 } de 1 vez`;
      es[2].innerText = `${ prm.qs_1 } de ${ config.suwari_1 } vezes (de ${ prm.qs_2 } de ${ config.suwari_2 })`;
    }
  }

  // parada suwari
  play_suwari() {
    if (config.hymn_id != 'hymn_st') return false;

    let boolean = false;
    if (prm.qs_0 < config.suwari_0 && prm.p == 0) {
      this.play_suwari_restore();
      prm.qs_0 += 1;
      boolean = true;
    } else if (prm.qs_1 < config.suwari_1 && prm.p == 2) {
      this.play_suwari_restore();
      prm.qs_1 += 1;
      boolean = true;
    } else {
      prm.fsw = false;
      if (prm.qs_2 < config.suwari_2 && prm.p == 2) {
        prm.qs_1  = 1;
        prm.qs_2 += 1;
        prm.fsw   = true;
      }
      this.play_suwari_final();
    }
    this.suwari_message();
    return boolean;
  }

  // restaura value do parágrafo e troca 3 pontos por beat
  play_suwari_restore() {
    for (let i = prm.ini; i < prm.cur; i++) {
      prm.beat[i].value = 0;
    }
    prm.cur = prm.ini;
    this.bd();
    prm.b.classList.remove('d-none');
    let e = qs(`.first-span.paragraph_${ prm.p }.line_${ prm.l }`);
    e.classList.add('d-none');
  }

  // volta 3 pontos do parágrafo
  play_suwari_start() {
    prm.b.classList.add('d-none');
    let e = qs(`.first-span.paragraph_${ prm.p }.line_${ prm.l }`);
    e.classList.remove('d-none');
    e.querySelectorAll('span').forEach(f => { f.style.color = '#ccc' });
  }

  // volta 3 pontos inicial terminado
  play_suwari_final() {
    let e = prm.beat[prm.ini];
    e.classList.add('d-none');
    e = qs(`.first-span.paragraph_${ e.dataset.paragraph }.line_${ e.dataset.line }`);
    e.classList.remove('d-none');
  }

  emphasis(f) {
    if (!config.animation) return;
    let e = prm.b;
    if (!e) return;
    e = e.parentElement.querySelector('.part_text');
    if (e) {
      if (f) e.classList.add('fw-bold');
      else e.classList.remove('fw-bold');
    }
  }

  // status e ícone
  track_icon(sts) {
    // 0: inicio, 1: iniciando (3 tempos), 2: tocando, 3: parado
    prm.sts = sts;

    qsa('.play').forEach(e => {
      if ([ 1, 2 ].includes(prm.sts)) {
        e.innerHTML = '<i class="bi bi-stop-fill"></i>';
        e.title = 'parar';
      } else {
        e.innerHTML = '<i class="bi bi-play-fill"></i>';
        e.title = 'tocar';
        clearInterval(prm.id);
      }
    });

    if (prm.cur >= prm.blen) {
      prm.flag = true;
    }
  }
}

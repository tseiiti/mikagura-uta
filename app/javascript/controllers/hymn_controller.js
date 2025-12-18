import { Controller } from "@hotwired/stimulus"

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
    // this.fill.track_icon(0)

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
  set_hymn_aux(val) {
    this.set('hymn_id', val);
    this.get_html();
    this.set_hymn_menu();
  }

  // hino anterior
  previous() {
    let aux = config.hymn_id.substr(5)
    if (aux != 'st') {
      aux = aux == '00' ? 'st' : String(parseInt(aux) - 1).padStart(2, '0');
      this.set_hymn_aux('hymn_' + aux);
    }
  }

  // próximo hino
  next() {
    let aux = config.hymn_id.substr(5)
    if (aux != '12') {
      aux = aux == 'st' ? '00' : String(parseInt(aux) + 1).padStart(2, '0');
      this.set_hymn_aux('hymn_' + aux);
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

  /*
   * play fill
   */

  track() {
    if (prm.flag == 1 && prm.qs_3 == 0) {
      this.get_html(); // reset
      return
    }
    if (prm.status == 0) {
      this.start()
    // } else if (prm.status == 1 || prm.status == 2) {
    //   this.track_icon(3)
    // } else {
    //   this.play()
    }
  }

  start() {
    if (prm.qs_3 == 1) {
      this.play_suwari_aux_1();
      this.play_suwari_aux_2();
    }
    this.track_icon(1);
    // let e = this.tempos[prm.cur]
    // let es = qsa(`.first-span.paragraph_${e.dataset.paragraph}.line_${e.dataset.line} span`)
    // es[0].scrollIntoView({ behavior: "smooth", block: 'center', inline: "nearest" })
    
    // if (this.anima) es[0].style.color = '#555'
    // let i = 1
    // prm.id = setInterval(function(fx) {
    //   if (i == 3) {
    //     clearInterval(fx.interval)
    //     prm.ini = prm.cur
    //     fx.play()
    //     return
    //   }
    //   e = es[i]
    //   if (fx.anima) e.style.color = '#555'
    //   i += 1
    // }, 1000 * 60 / this.cg('bpm'), this);
  }

  play_suwari_aux_1() {
    for (let i = prm.ini; i < prm.cur; i++) {
      prm.beat[i].value = 0
    }
    prm.cur = prm.ini
    let e = prm.beat[prm.cur]
    e.classList.remove('d-none')
    e = qs(`.first-span.paragraph_${ e.dataset.paragraph }.line_${ e.dataset.line }`)
    e.classList.add('d-none')
  }

  play_suwari_aux_2() {
    let e = prm.beat[prm.cur]
    e.classList.add('d-none')
    e = qs(`.first-span.paragraph_${ e.dataset.paragraph }.line_${ e.dataset.line }`)
    e.classList.remove('d-none')
    e.querySelectorAll('span').forEach(f => { f.style.color = '#ccc' })
  }

  play_suwari_aux_3() {
    let e = prm.beat[prm.ini]
    e.classList.add('d-none')
    e = qs(`.first-span.paragraph_${ e.dataset.paragraph }.line_${ e.dataset.line }`)
    e.classList.remove('d-none')
  }

  start_prm() {
    prm.id   = 0; // id do interval
    prm.ini  = 0; // id do tempo (beat) inicial
    prm.cur  = 0; // id do tempo (beat) atual
    prm.sts  = 0; // 0: inicio, 1: iniciando (3 tempos), 2: tocando, 3: parado
    prm.flag = 0;
    prm.qs_0 = 1;
    prm.qs_1 = 1;
    prm.qs_2 = 1;
    prm.qs_3 = 0;
    prm.beat = qsa('progress.beat');
    prm.blen = qsa('progress.beat:not(.d-none)').length;
  }


  // enfase_aux(e, f) {
  //   if (f) {
  //     e.classList.add('fw-bold')
  //   } else {
  //     e.classList.remove('fw-bold')
  //     // e.classList.add('fw-light')
  //   }
  // }

  // enfase(f) {
  //   if (!this.anima) return
  //   let e = this.tempos[prm.cur]
  //   if (!e) return
  //   e = e.parentElement.querySelector('.texto')
  //   if (e) this.enfase_aux(e, f)
  // }

  track_icon(sts) {
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
    })

    if (prm.cur >= prm.blen) {
      prm.flag = 1
    }
  }


  // play_suwari() {
  //   let e = this.tempos[prm.cur]
  //   if (this.qs_0 < this.gs(0) && e.dataset.paragraph == 0) {
  //     this.play_suwari_aux_1()
  //     this.qs_0 += 1
  //     qsa('.mensagem p')[0].innerText = `${ this.qs_0 } de ${ this.cg('qtd_s')[0] } vezes`
  //     return true
  //   }

  //   if (this.qs_1 < this.gs(1) && e.dataset.paragraph == 2) {
  //     this.play_suwari_aux_1()
  //     this.qs_1 += 1
  //     qsa('.mensagem p')[2].innerText = `${ this.qs_1 } de ${ this.cg('qtd_s')[1] } vezes (de ${ this.qs_2 } de ${ this.cg('qtd_s')[2] })`
  //     return true
  //   }

  //   this.qs_3 = 0
  //   if (this.qs_2 < this.gs(2) && e.dataset.paragraph == 2) {
  //     this.qs_1 = 1
  //     this.qs_2 += 1
  //     this.qs_3 = 1
  //   }
    
  //   qsa('.mensagem p')[1].innerText = `${ e.dataset.paragraph >= 1 ? 1 : 0 } de 1 vez`
  //   this.play_suwari_aux_3()
  //   return false
  // }

  // play_aux() {
  //   let e = this.tempos[prm.cur]
  //   if (!e) return
  //   let lin = qs(`.paragraph_${e.dataset.paragraph} .line_${e.dataset.line}`)
  //   lin.scrollIntoView({ behavior: "smooth", block: 'center', inline: "nearest" })
  //   let es = lin.querySelectorAll('.tempo')
  //   if (es[es.length - 1] == e) {
  //     this.enfase(false)
  //     // this.enfase_aux(qs('.paragraph_0 .line_0 .silaba:last-child .part:last-child .texto'), false)

  //     if (lin.classList.contains('parar')) {
  //       if (this.cg('id') == 's' && this.play_suwari()) return
  //       this.track_icon(0)
  //       prm.cur += 1
  //     }
  //   }
  //   this.enfase(true)
  // }

  // play() {
  //   this.track_icon(2)

  //   let e = this.tempos[prm.cur]
  //   qsa(`.first-span.paragraph_${e.dataset.paragraph}.line_${e.dataset.line} span`)
  //     .forEach(f => { if (this.anima) f.style.color = '#555' })

  //   if (this.cg('id') == 's') {
  //     let es = qsa('.mensagem p')
  //     es[0].innerText = `${ this.qs_0 } de ${ this.cg('qtd_s')[0] } vezes`
  //     es[1].innerText = `${ e.dataset.paragraph >= 1 ? 1 : 0 } de 1 vez`
  //     if (e.dataset.paragraph == 2)
  //       es[2].innerText = `${ this.qs_1 } de ${ this.cg('qtd_s')[1] } vezes (de ${ this.qs_2 } de ${ this.cg('qtd_s')[2] })`
  //   }

  //   if (e.classList.contains('d-none')) prm.cur += 1
  //   this.enfase(true)

  //   let delay = 100 * 60 / this.cg('bpm')
  //   prm.id = setInterval(function(fx) {
  //     let e = prm.beat[prm.cur]
  //     if (!e) {
  //       fx.track_icon(3)
  //       return
  //     }
  //     if (fx.anima) e.value = fx.valor

  //     fx.valor += 1
  //     if (fx.valor > 5) {
  //       fx.enfase(false)
  //       fx.valor = 1
  //       prm.cur += 1

  //       fx.play_aux()
  //     }
  //   }, delay, this);
  // }

}

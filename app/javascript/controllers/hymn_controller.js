import { Controller } from "@hotwired/stimulus"

const qs = (arg) => { return document.querySelector(arg); }
const qsa = (arg) => { return document.querySelectorAll(arg); }
const set_cookie = (key, val) => {
  let d = new Date();
  d.setTime(d.getTime() + 20 * 365 * 24 * 60 * 60 * 1000);
  document.cookie = `${key}=${val};expires=${d.toUTCString()};path=/;samesite=lax;`;
}
const get_cookie = (key) => {
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

const config = {};

// Connects to data-controller="hymn"
export default class extends Controller {
  connect() {
    if (this.element.localName == 'main') {
      let aux = JSON.parse(get_cookie('config') || '{}');
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

  get_html() {
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
    })
    .catch(error => { console.error('Erro:', error); });
  }

  set_hymn(event) {
    let e = event.target;
    this.set(e.name, e.dataset.val);
    this.get_html();
    this.set_hymn_menu();
  }

  set_hymn_menu() {
    qsa('.menu-hymns').forEach(a => {
      a.classList.remove('active')
      if (a.dataset.val == config.hymn_id) {
        a.classList.add('active')
      }
    });
  }

  instrument_icon(key, val) {
    qsa(`.${ key }`).forEach(e => {
      if (val) e.classList.remove('d-none');
      else e.classList.add('d-none');
    });
    qs(`input[name=${ key }]`).checked = val;
  }

  set_instrument(event) {
    let e = event.target;
    this.instrument_icon(e.name, e.checked);

    config.instruments[e.name] = e.checked;
    this.set('instruments', config.instruments);

    this.set_instrument_menu();
  }

  set_instrument_all(event) {
    let e = event.target;
    console.log(e)
    console.log(e.checked)

    let c = qs('#ch_all')
    qsa('.menu-instrument').forEach(f => {
      f.checked = c.checked
      this.instrument_icon(f.name, c.checked)
      config.instruments[f.name] = c.checked;
    });
    this.set('instruments', config.instruments);
  }

  set_instrument_menu() {
    let count = 0;
    for (let k in config.instruments) {
      if (config.instruments[k]) count += 1;
    }
    qs('#ch_all').checked  = count == qsa('.menu-instrument').length;
    qs('#ch_none').checked = count == 0;
  }

  shift(event) {
    let e = event.target.parentElement;
    this.set(e.name, config[e.name] + Number(e.dataset.val));
  }

  change(event) {
    let e = event.target;
    this.set(e.name, Number(e.value));
  }

  toogle(event) {
    let e = event.target;
    this.set(e.name, e.checked);
  }

  set(key, val) {
    config[key] = val;
    set_cookie('config', JSON.stringify(config));

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
}

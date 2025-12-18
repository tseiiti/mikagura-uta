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
const set_hymn = (hymn_id) => {
  fetch(`/hymns/data?hymn_id=${ hymn_id }`)
  .then(response => {
    if (response.ok) return response.text();
    throw new Error('Falha na requisição');
  })
  .then(data => {
    qs('main').innerHTML = data;
  })
  .catch(error => { console.error('Erro:', error); });
}

class Hino {
  teste() {
    console.log("classe Hino metodo teste");
  }
  teste1() {
    qs('main').innerHTML += '<p>Teste</p>';
  }

  property(chave, valor) {
    let root = document.documentElement
    root.style.setProperty(`--${chave}`, valor)
  }
}

var hino = new Hino();


const config = {};

// Connects to data-controller="hymn"
export default class extends Controller {
  connect() {
    if (this.element.localName == 'main') {
      let aux = JSON.parse(get_cookie('config') || '{}');
      config.hymn_id     = aux.hymn_id|| 'hymn_00';
      config.font_size   = aux.font_size || 16;
      config.space_width = aux.space_width || 1.3;
      config.bpm_time    = aux.bpm_time || 60;
      config.suwari_0    = aux.suwari_0 || 21;
      config.suwari_1    = aux.suwari_1 || 3;
      config.suwari_2    = aux.suwari_2 || 3;
      config.animation   = !(aux.animation == false);
      config.instruments = aux.instruments || [];
      set_hymn(config.hymn_id);

      this.set('font_size', config.font_size);
      this.set('space_width', config.space_width);
      qs('.bpm_time').value = config.bpm_time;
      qs('.suwari_0').value = config.suwari_0;
      qs('.suwari_1').value = config.suwari_1;
      qs('.suwari_2').value = config.suwari_2;
      qs('.animation').checked = config.animation;
    }
  }

  shift(event) {
    let e = event.target.parentElement;
    let arg = e.name;
    let val = e.dataset.val;
    val = config[arg] + Number(val);
    this.set(arg, val);
  }

  change(event) {
    let e = event.target;
    let arg = e.name;
    let val = Number(e.value);
    this.set(arg, val);
  }

  toogle(event) {
    let e = event.target;
    this.set(e.name, e.checked);
  }

  set(arg, val) {
    config[arg] = val;
    set_cookie('config', JSON.stringify(config));

    if ([ 'font_size', 'space_width' ].includes(arg)) {
      let root = document.documentElement;
      if (arg == 'font_size') {
        root.style.setProperty('--size-base', `${ val }px`);
      }
      if (arg == 'space_width') {
        root.style.setProperty('--size-width-multiply', val);
        val = val.toFixed(2);
      }
      qs(`.${ arg }`).innerText = val;
    }
  }
}

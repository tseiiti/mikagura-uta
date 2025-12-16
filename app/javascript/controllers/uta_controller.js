import { Controller } from "@hotwired/stimulus"

const qs = (arg) => { return document.querySelector(arg) }
const qsa = (arg) => { return document.querySelectorAll(arg) }

class Hino {
  teste() {
    console.log("classe Hino metodo teste");
  }
  teste1() {
    qs('main').innerHTML += '<p>Teste</p>';
  }
}

var hino;

// Connects to data-controller="uta"
export default class extends Controller {
  connect() {
    console.log("quando entra");
    hino = new Hino();
    hino.teste();
  }

  greet() {
    console.log("quando clica");
    hino.teste1();
  }
}

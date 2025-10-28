
let game;

const foodElement = document.getElementById("food");
const waterElement = document.getElementById("water");
const woodElement = document.getElementById("wood");
const toolsElement = document.getElementById("tools");
const materialElement = document.getElementById("material");
const moodElement = document.getElementById("mood");
const buildingsElement = document.getElementById("buildings");
const nbActionsElement = document.getElementById("nbActions");

const dayElement = document.getElementById("day");
const dayButtonElement = document.getElementById("dayButton");

const actionChoices = document.getElementById("action-choices");
const logDiv = document.getElementById("log");

let maxActions = 3;
let maxMood = 5;
let selectedActions = [];
let nbBuildingsAvailable = 0;

let dayEvents = [
  { text: "Un arbre tombe et t'apporte du bois sec.", changes: { wood: 3 }, condition: () => true, },
  { text: "Tu trouves un buisson plein de fruits.", changes: { food: 3 }, condition: () => true },
  {
    text: "Tu arrive à pêcher du poisson ce matin.", changes: { food: 2 },
    condition: () => game.buildings.indexOf("Plage") > -1,
  },
  {
    text: "Tu trouves du bois sur la plage.", changes: { wood: 2 },
    condition: () => game.buildings.indexOf("Plage") > -1,
  },
  { text: "Il y a du soleil aujourd'hui, ça te remonte le moral.", changes: { mood: 1 }, condition: () => true },
  {
    text: "Tu trouves une caisse sur la plage.",
    changes: { food: 3, wood: 2 },
    condition: () => game.buildings.indexOf("Plage") > -1,
  },
  {
    text: "Un tempête détruit une partie de ton abri.",
    changes: { mood: -1, food: -1, wood: -1 },
    condition: () => game.buildings.indexOf("Abri") > -1
  },
  { text: "Un bande de rats mange tes provisions.", changes: { food: -1 }, condition: () => true },
  { text: "Tu t'écorche le pied en marchant sur une pierre.", changes: { mood: -1 }, condition: () => true },
  { text: "La solitude te pèse.", changes: { mood: -1 }, condition: () => true },
  { text: "La chaleur est harassante, tu as besoin de boire.", changes: { water: -2 }, condition: () => true },
]

let actions = [
  {
    text: "Fouiller l'épave du bâteau",
    condition: () => game.buildings.indexOf("Epave") > -1,
    action: () => searchShipwreck()
  },
  {
    text: "Explorer",
    condition: () => game.buildings.indexOf("Plage") > -1,
    action: () => explore()
  },
  {
    text: "Manger",
    condition: () => game.resources.food >= 1,
    action: (index) => eat(index),
    changes: { food: -1, mood: +1 }
  },
  {
    text: "Construire",
    condition: () => true,
    action: () => false
  },
  {
    text: "Fabriquer des outils",
    condition: () => game.buildings.indexOf("Atelier") > -1 && game.resources.wood > 0,
    action: (index) => makeTools(index),
    changes: { tools: 1, wood: -1 }
  },
  {
    text: "Forger un matériau spécial",
    condition: () => game.buildings.indexOf("Atelier") > -1 && game.resources.wood >= 5 && game.resources.tools >= 1,
    action: (index) => forgeSpecial(index),
    changes: { material: 1, wood: -5, tools: - 1 }
  },
  {
    text: "Se reposer",
    condition: () => game.buildings.indexOf("Abri") > -1,
    action: () => rest()
  },
]

let exploreEvents = [
  { text: "Tu trouve un arbre fruitier.", changes: { food: 2 } },
  { text: "Tu trouve une tas de bois.", changes: { wood: 3 } },
  { text: "Un serpent t'attaque.", changes: { mood: -1 } },
  { text: "Tu trébuche sur une racine.", changes: { mood: -1 } },
  { text: "Tu trouves une cascade, tu récolte de l'eau.", changes: { water: 2 } },
  { text: "Tu trouves une cascade, tu décides de te baigner.", changes: { mood: 2 } },
  { text: "Tu ne trouve rien." },
  { text: "Tu ne trouve rien." },
  { text: "Tu ne trouve rien." },
]

let buildings = [
  { name: "Abri", desc: "Coût : 3 bois", cost: { wood: 3 } },
  { name: "Atelier", desc: "Coût : 5 bois", cost: { wood: 5 } },
  { name: "Jardin", desc: "Coût : 5 bois", cost: { wood: 5 } },
  { name: "Puits", desc: "Coût : 3 bois, 1 materiau spécial", cost: { wood: 3, material: 1 } },
  { name: "Palissade", desc: "Coût : 4 bois", cost: { wood: 10 } },
  { name: "Phare", cost: { wood: 5, material: 3, tools: 2 } },
]

window.onload = initGame();

function initGame() {
  console.log("initGame");
  game = {
    day: 0,
    actionsRemaining: 3,
    status: "pause",
    resources: {
      food: 0,
      water: 0,
      wood: 0,
      tools: 0,
      material: 0,
      mood: 3
    },
    buildings: ["Epave", "Plage"],
  };
  refreshResources();
  refreshBuildings();

  logDiv.textContent = "";
  logEvents("Tu te retrouve sur une île deserte. Arriveras-tu à survivre ?")
  dayButtonElement.textContent = "🏝️ Démarrer l'aventure";
  dayElement.textContent = 0;
  actionChoices.innerHTML = "";
  nbActionsElement.textContent = 0;
  dayButtonElement.onclick = () => {
    game.status = "playing";
    newDay();
  };
}

function newDay() {
  updateDayButton();
  game.day++;
  logDiv.textContent = "";
  dayElement.textContent = game.day;
  if (game.day == 4) {
    let index = game.buildings.indexOf("Epave");
    if (index > -1) {
      game.buildings.splice(index, 1);
      logEvents("L'épave a fini par sombrer.");
      refreshBuildings();
    }
  }
  updateRemainingActions(maxActions);
  launchEvent();
  launchActions();
}

function checkGameStatus() {
  let isEndGame = false;
  if (game.resources.mood <= 0) {
    game.status = "lost";
    isEndGame = true;
  }

  if (isEndGame) {
    if (game.status === "lost") {
      logEvents("Tu as perdu !");
    }

    actionChoices.innerHTML = "";
    game.actionsRemaining = 0;
    nbActionsElement.textContent = game.actionsRemaining;
    dayButtonElement.textContent = "▶️ Nouvelle partie";
    dayButtonElement.onclick = () => { initGame() };
  }
}

// check si le max mood et atteint et retourne le mood manquant
function checkMaxMood() {
  return maxMood - game.resources.mood;
}

function updateRemainingActions(nb) {
  game.actionsRemaining = nb;
  nbActionsElement.textContent = game.actionsRemaining;
}

function updateDayButton() {
  dayButtonElement.textContent = "🌅 Nouvelle journée";
  dayButtonElement.onclick = () => {
    newDay();
  }
}

function refreshResources() {
  foodElement.textContent = game.resources.food;
  waterElement.textContent = game.resources.water;
  woodElement.textContent = game.resources.wood;
  toolsElement.textContent = game.resources.tools;
  materialElement.textContent = game.resources.material;
  moodElement.textContent = game.resources.mood;
  checkGameStatus();
}

function refreshBuildings() {
  let buildingsText = game.buildings.join(", ");
  // console.log("buildings : " + buildingsText);
  buildingsElement.textContent = buildingsText;
}

function launchDice(max) {
  let dice = Math.random() * max;
  let resultat = Math.floor(dice);
  return resultat;
}

function getAvailableEvents() {
  return dayEvents.filter(ev => ev.condition());
}

function launchEvent() {
  let availableEvents = getAvailableEvents();
  let randEvent = launchDice(availableEvents.length);
  //let randEvent = 9;
  let event = availableEvents[randEvent];
  logEvents(event.text);
  applyChanges(event.changes);
}

function launchActions() {
  selectedActions = [];
  actionChoices.innerHTML = "";
  actions.forEach((a, index) => {
    if (a.condition()) {
      let btn = document.createElement("button");
      if (a.text === "Construire") {
        showBuildingDropdown();
      }
      else {
        btn.textContent = a.text;
        btn.onclick = () => {
          if (game.actionsRemaining > 0) {
            a.action(index);
            updateRemainingActions(game.actionsRemaining - 1);
            btn.disabled = true;
          }
        }
        actionChoices.appendChild(btn);
      }
    }
  });
}

function applyChanges(changes) {
  if (changes) {
    for (let key in changes) {
      let value = changes[key];
      let current = game.resources[key];
      console.log(key);
      console.log("current :" + current);
      console.log("value :" + value);
      // si c'est un gain
      if (value > 0) {
        // si c'est le mood, il ne faut pas dépasser le max
        if (key === "mood") {
          // si le mood ne dépasse pas le max alors on ajoute
          if (current + value <= maxMood) {
            game.resources[key] += value;
          }
          // si le mood dépasse le max alors on regarde ce que l'on peut rajouter
          else {
            let moodMissing = checkMaxMood();
            game.resources[key] += moodMissing;
            changes[key] = moodMissing;
          }
        }
        else {
          game.resources[key] += value;
        }
      }
      // si c'est une perte
      else {
        // si la ressource reste positive
        if (current + value >= 0) {
          game.resources[key] += value;
        }
        else {
          // si la ressource devient négative
          // on met la ressource à zéro
          game.resources[key] = 0;
          // combien faut-il pour que la ressource soit à 0 ? - la ressource actuelle
          changes[key] = -current;
          // on récupère le reste
          let remain = Math.abs(value + current);
          // on ne peut pas retirer toutes les ressources alors on donne une pénalité
          if (remain > 0) {
            game.resources["mood"] -= 1;
            changes["mood"] = -1;
            logEvents("Pas assez de" + getIcon(key) + " !", true);
          }
        }
      }
    }
  }

  displayChanges(changes);
  refreshResources();
}

function displayChanges(changes) {
  if (changes) {
    let msgParts = [];
    console.log("displayChanges ");
    for (let key in changes) {
      let value = changes[key];
      console.log(key + ":" + value);
      if (value !== 0) {
        msgParts.push((value > 0 ? "+" : "") + value + " " + getIcon(key));
      }
    }
    if (msgParts.length > 0) {
      logEvents(msgParts.join(', '), true);
    }
  }
}

function getIcon(key) {
  let name = "";
  switch (key) {
    case "food":
      name = "🍎";
      break;
    case "material":
      name = "💎";
      break;
    case "mood":
      name = "💭";
      break;
    case "tools":
      name = "🛠️";
      break;
    case "wood":
      name = "🌲";
      break;
    case "water":
      name = "💧";
      break;
    default:
      break;
  }
  return name;
}

function logEvents(message, isResource = false) {
  if (isResource)
    logDiv.innerHTML += `<p class=resmsg>${message}</p>`;
  else
    logDiv.innerHTML += `<p>${message}</p>`;
  console.log(message);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function getAvailableBuildings() {
  console.log("getAvailableBuildings");
  return buildings.filter(b => canAfford(b));
}

function canAfford(building) {
  console.log(building.name + " " + game.buildings.indexOf(building.name));
  if (game.buildings.indexOf(building.name) > -1)
    return false;

  for (let res in building.cost) {
    console.log(res + " " + game.resources[res] + " " + building.cost[res]);
    if ((game.resources[res] || 0) < building.cost[res]) {
      return false;
    }
  }
  return true;
}

function showBuildingDropdown() {
  nbBuildingsAvailable = 0;
  let select = document.createElement("select");
  buildings.forEach((b, i) => {
    if (canAfford(b)) {
      nbBuildingsAvailable++;
      let option = document.createElement("option");
      option.textContent = "Construire " + b.name;
      option.value = i;
      option.disabled = false;
      select.appendChild(option);
    }
  });
  console.log("Nombre de bâtiments disponibles à la construction : " + nbBuildingsAvailable);
  if (nbBuildingsAvailable > 0) {
    let validateBtn = document.createElement("button");
    validateBtn.textContent = "Construire";
    validateBtn.onclick = () => {
      if (game.actionsRemaining > 0) {
        construct(select.value);
        updateRemainingActions(game.actionsRemaining - 1);
        validateBtn.disabled = true;
      }
    };
    actionChoices.appendChild(select);
    actionChoices.appendChild(validateBtn);
  }
}

function searchShipwreck() {
  logEvents("Tu fouille l'épave.");
  let changes = { food: 1, wood: 1 }; // TODO : pour le moment fixe, à voir pour rendre aléatoire
  applyChanges(changes);
}

function explore() {
  logEvents("🌿 Tu explores les alentours ...");
  let rand = launchDice(exploreEvents.length);
  let event = exploreEvents[rand];
  logEvents(event.text);
  applyChanges(event.changes);
}

function eat(index) {
  let changes = actions[index].changes;
  logEvents("Tu décide de manger.");
  applyChanges(changes);
}

function construct(idBuilding) {
  let building = buildings[idBuilding];

  logEvents("Tu as construit : " + building.name)
  let changes = [];
  for (let res in building.cost) {
    changes[res] = -building.cost[res];
  }
  applyChanges(changes);

  game.buildings.push(building.name);
  refreshBuildings();
}

function makeTools(index) {
  let changes = actions[index].changes;
  logEvents("Tu fabrique un outil.");
  applyChanges(changes);
}

function forgeSpecial(index) {
  let changes = actions[index].changes;
  logEvents("Tu fabrique un materiau spécial.");
  applyChanges(changes);
}

function rest() {
  let changes = [];
  logEvents("Tu décide de te reposer.");
  let remainMood = checkMaxMood();
  if (remainMood > 0) {
    changes = { mood: 1 };
    applyChanges(changes);
  }
  else {
    logEvents("Max " + getIcon("mood") + " atteint", true);
  }
}


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

const eventContainer = document.getElementById("event-container");
const eventText = document.getElementById("event-text");
const eventChoices = document.getElementById("event-choices");
const eventChoiceText = document.getElementById("event-choice-text");
const actionContainer = document.getElementById("action-container");
const actionLib = document.getElementById("action-lib");
const actionChoices = document.getElementById("action-choices");
const actionValidate = document.getElementById("validate-actions");
const actionSummary = document.getElementById("action-summary");
const consumptionContainer = document.getElementById("consumption-container");
const consumptionText = document.getElementById("consumption-text");
const logDiv = document.getElementById("log");

let maxActions = 3;
let maxMood = 10;
let selectedActions = [];
let nbBuildingsAvailable = 0;

let dayEvents = [
  { text: "Un arbre tombe et t'apporte du bois sec.", changes: { wood: 3 }, condition: () => true, },
  { text: "Tu trouves un buisson plein de fruits.", changes: { food: 3 }, condition: () => true },
  { text: "Tu arrive à pêcher du poisson ce matin.", changes: { food: 2 }, condition: () => true },
  { text: "Tu trouves du bois sur la plage.", changes: { wood: 2 }, condition: () => true },
  { text: "Il y a du soleil aujourd'hui, ça te remonte le moral.", changes: { mood: 1 }, condition: () => true },
  { text: "Tu trouves une caisse sur la plage.", changes: { food: 3, wood: 2 }, condition: () => true },
  { text: "Un tempête détruit une partie de ton abri.", changes: { mood: -1, food: -1, wood: -1 }, condition: () => game.buildings.indexOf("Abri") > -1 },
  { text: "Un bande de rats mange tes provisions.", changes: { food: -1 }, condition: () => true },
  { text: "Tu t'écorche le pied en marchant sur une pierre.", changes: { mood: -1 }, condition: () => true },
  { text: "La solitude te pèse.", changes: { mood: -1 }, condition: () => true },
  { text: "La chaleur est harassante, tu bois beaucoup d'eau.", changes: { water: -2 }, condition: () => true },
]

let actions = [
  { text: "Fouiller l'épave du bâteau", condition: () => game.buildings.indexOf("Epave") > -1, action: () => searchShipwreck() },
  { text: "Explorer", condition: () => true, action: () => explore() },
  { text: "Manger", condition: () => game.resources.food >= 1, action: () => eat() },
  { text: "Construire", condition: () => getAvailableBuildings(), action: () => false },
  { text: "Fabriquer des outils", condition: () => game.buildings.indexOf("Atelier") > -1 && game.resources.wood > 0, action: () => makeTools() },
  { text: "Forger un matériau spécial", condition: () => game.buildings.indexOf("Atelier") > -1 && game.resources.wood >= 5 && game.resources.tools >= 1, action: () => forgeSpecial() },
  { text: "Se reposer", condition: () => game.buildings.indexOf("Abri") > -1, action: () => rest() },
]

let exploreEvents = [
  { text: "Tu trouve un arbre fruitier.", changes: { food: 2 } },
  { text: "Tu trouve une tas de bois.", changes: { wood: 3 } },
  { text: "Un serpent t'attaque.", changes: { mood: -1 } },
  { text: "Tu trébuche sur une racine.", changes: { mood: -1 } },
  { text: "Tu trouves une cascade, tu as très soif.", changes: { water: 2 } },
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
  { name: "Palissade", desc: "Coût : 4 bois", cost: { wood: 4 } },
  { name: "Phare", desc: "Coût : 5 bois, 3 materiaux spéciaux, 2 outils", cost: { wood: 5, material: 3, tools: 2 } },
]

window.onload = initGame();

function initGame() {
  console.log("initGame");
  game = {
    day: 0,
    actionsRemaining: 3,
    resources: {
      food: 0,
      water: 0,
      wood: 0,
      tools: 0,
      material: 0,
      mood: 5
    },
    buildings: ["Epave"],
  };
  refreshResources();
  refreshBuildings();

  logDiv.textContent = "";
  logEvents("Tu te retrouve sur une île deserte. Arriveras-tu à survivre ?")
  dayButtonElement.textContent = "🏝️ Démarrer l'aventure";
  dayElement.textContent = 0;
  nbActionsElement.textContent = 0;
  dayButtonElement.onclick = () => { newDay() };
}

function newDay() {
  updateDayButton();
  game.day++;
  logDiv.textContent = "";
  dayElement.textContent = game.day;
  if (game.day == 4) {
    const index = game.buildings.indexOf("Epave");
    console.log(index);
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

function checkGameState() {
  let isEndGame = false;
  if (game.resources.mood <= 0) {
    isEndGame = true;
  }

  if (isEndGame) {
    dayButtonElement.textContent = "▶️ Nouvelle partie";
    dayButtonElement.onclick = () => { initGame() };
    logEvents("Tu as perdu !");
    game.actionsRemaining = 0;
  }
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
  let resourcesText = [];

  for (let [key, value] of Object.entries(game.resources)) {
    resourcesText.push(key + " " + value);
  }
  // console.log("resources : " + resourcesText);
  foodElement.textContent = game.resources.food;
  waterElement.textContent = game.resources.water;
  woodElement.textContent = game.resources.wood;
  toolsElement.textContent = game.resources.tools;
  materialElement.textContent = game.resources.material;
  moodElement.textContent = game.resources.mood;
  checkGameState();
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
  let event = availableEvents[randEvent];
  logEvents(event.text);
  applyResourceChanges(event.changes);
}

function applyResourceChanges(changes) {
  let msgParts = [];
  let amount = 0;
  if (changes) {
    for (let [key, value] of Object.entries(changes)) {
      //amount = Math.floor(Math.random() * value) + 1;
      amount = value;
      game.resources[key] += amount;
      if (amount > 0)
        msgParts.push("+" + amount + getIcon(key));
      else if (amount < 0)
        msgParts.push(amount + getIcon(key));
    }
    refreshResources();
    let resources = msgParts.join(", ");
    logEvents(resources, true);
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

function launchActions() {
  selectedActions = [];
  actionChoices.innerHTML = "";
  console.log("Possède Abri " + (game.buildings.indexOf("Abri") > -1));
  actions.forEach(a => {
    if (a.condition()) {
      const btn = document.createElement("button");
      if (a.text === "Construire") {
        showBuildingDropdown();
      }
      else {
        btn.textContent = a.text;
        btn.onclick = () => {
          if (game.actionsRemaining > 0) {
            a.action();
            updateRemainingActions(game.actionsRemaining - 1);
            btn.disabled = true;
          }
        }
        actionChoices.appendChild(btn);
      }
    }
  });
}

function getAvailableBuildings() {
  return buildings.filter(b => canAfford(b));
}

function canAfford(building) {
  if (game.buildings.indexOf(building.name) > -1)
    return false;

  for (let res in building.cost) {
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
    const validateBtn = document.createElement("button");
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
  applyResourceChanges({ food: 1, wood: 1 });
  // logEvents("1" + getIcon("food") + ", +1" + getIcon("wood"), true);
}

function explore() {
  logEvents("🌿 Tu explores les alentours ...");
  let rand = launchDice(exploreEvents.length);
  let event = exploreEvents[rand];
  logEvents(event.text);
  applyResourceChanges(event.changes);
}

function eat() {
  game.resources.food -= 1;
  game.resources.mood += 1;
  refreshResources();
  logEvents("Tu décide de manger.");
  logEvents("-1" + getIcon("food") + ", +1" + getIcon("mood"), true);
}

function construct(idBuilding) {
  let msgParts = [];

  const building = buildings[idBuilding];

  for (let [key, value] of Object.entries(building.cost)) {
    game.resources[key] -= value;
    msgParts.push("-" + value + " " + getIcon(key));
  }
  refreshResources();
  logEvents("Tu as construit : " + building.name)
  logEvents(msgParts.join(', '), true);

  game.buildings.push(building.name);
  refreshBuildings();
}

function makeTools() {
  game.resources.tools += 1;
  game.resources.wood += 1;
  refreshResources();
  logEvents("Tu fabrique un outil.");
  logEvents("+1" + getIcon("tools") + ", -1" + getIcon("wood"), true);
}

function forgeSpecial() {
  game.resources.material += 1;
  game.resources.wood -= 5;
  game.resources.tools -= 1;
  refreshResources();
  logEvents("Tu fabrique un materiau spécial.");
  logEvents("+1" + getIcon("material") + ", -5" + getIcon("wood") + ", -1" + getIcon("tools"), true);
}

function rest() {
  logEvents("Tu décide de te reposer.");
  if (game.resources.mood < 5) {
    logEvents("+1 " + getIcon("mood"), true);
    game.resources.mood += 1;
    refreshResources();
  }
  else if (game.resources.mood == 5) {
    logEvents("Max de moral atteint", true);
  }
}
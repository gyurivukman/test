/** Utility Functions */
function $(id){return document.getElementById(id);}
function ß(className){return document.getElementsByClassName(className);}


/** Fisher-Yates array shuffler */
function shuffle(array) {
    let j, x;
    for (let i = array.length - 1; i > 0; --i) {
        j = Math.floor(Math.random() * (i + 1));
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }
    return array;
}

/** Initialization */

window.onload = onLoadInit;

const TIME_PER_ROUND = 60;

var mapModel;
var gameTableHandle;
var playerModel;
var playerElementHandle;
var hasGameEnded;

var fullActionSet = [];
var perRoundActionSet = [];
var actionQueue = [];

var timeRemaining;

var canPlayerInteract;
var intervalHandle;

function onLoadInit() {
    initPregameMenuHandler();
    initGameControls();
}

function initPregameMenuHandler() {
    let mapCards = ß('map-card');
    for(let mapCard of mapCards){
        mapCard.addEventListener('click', preGameMenuClicked, false);
    }
}

function initGameControls() {
    $('end-turn-button').addEventListener('click', endTurn, false);
}

function preGameMenuClicked(){
    preGameInit(this.getAttribute('name'));
    startRound();
}

function preGameInit(mapType) {
    let gameContainer = $('game-container');
    let pregameMenu = $('pregame-menu');
    gameTableHandle = $('game-table');

    initFullActionSet();
    initMapModel(mapType);
    initPlayer();
    buildMap();
    pregameMenu.classList.add('d-none');
    gameContainer.classList.remove('d-none');
    hasGameEnded = false;
}

function initMapModel(mapType) {
    if(mapType === 'small') {
        mapModel = [
            Array(8).fill({type:TileTypes.PIT, walls:[]}),
            [
                {type:TileTypes.PIT, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.END_POINT, walls:[]},
                {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.PIT, walls:[]},
                {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.PIT, walls:[]},
            ],
            [
                {type:TileTypes.PIT, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.BELT_LEFT_DOWN, walls:[]},
                {type:TileTypes.BELT_UP_LEFT, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.FLOOR, walls:[]},
                {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.PIT, walls:[]}    
            ],
            [
                {type:TileTypes.PIT, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.BELT_DOWN, walls:[]},
                {type:TileTypes.BELT_LEFT_UP, walls:[]}, {type:TileTypes.BELT_LEFT, walls:[]}, {type:TileTypes.BELT_LEFT, walls:[]},
                {type:TileTypes.BELT_LEFT, walls:[]}, {type:TileTypes.PIT, walls:[]}
            ],
            [
                {type:TileTypes.PIT, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.TURN_LEFT, walls:[]},
                {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.FLOOR, walls:[Directions.UP, Directions.LEFT]},{type:TileTypes.FLOOR, walls:[]},
                {type:TileTypes.FLOOR, walls:[]},{type:TileTypes.PIT, walls:[]}
            ],
            [
                {type:TileTypes.PIT, walls: []}, {type: TileTypes.FLOOR, walls: []}, {type: TileTypes.FLOOR, walls: []},
                {type:TileTypes.PIT, walls: []}, {type: TileTypes.FLOOR, walls: []},{type: TileTypes.START_POINT, walls: []},
                {type:TileTypes.FLOOR, walls: []},{type: TileTypes.PIT, walls: []}
            ],
            Array(8).fill({type: TileTypes.PIT, walls: []})
        ];

        player = {posX: 5, posY: 5, direction: Directions.LEFT};
        
    }else{
        
    }
}

function initFullActionSet() {
    Object.keys(ActionTypes).forEach(
        (action)=>{
            fullActionSet.push(action);
            fullActionSet.push(action);
            fullActionSet.push(action);
        }
    )
}

function initPlayer() {
    playerElementHandle = document.createElement('div');
    playerElementHandle.classList.add('player');
}

function buildMap() {
    for(let i=0; i<mapModel.length; ++i){
        let tableRow = gameTableHandle.insertRow(i);
        for(let j=0; j < mapModel[i].length; ++j){
            let cell = tableRow.insertCell(j);
            player.posX == i && player.posY == j?cell.appendChild(playerElementHandle):cell.innerHTML = '&nbsp;';
            for(let cssClass of TileCSSMap[mapModel[i][j].type]){
                cell.classList.add(cssClass);
            }
            for(let wall of mapModel[i][j].walls){
                cell.classList.add(TileWallCSSMap[wall]);
            }
            
        }
    }
    playerElementHandle.classList.add(DirectionsTransformMap[player.direction]);
}

function startRound() {
    shuffle(fullActionSet);
    perRoundActionSet = [];
    for(let i=0;i<9;++i){perRoundActionSet.push(fullActionSet[i])};
    actionQueue = [];
    
    canPlayerInteract = true;
    timeRemaining = TIME_PER_ROUND;
    let timerBarElement = $('round-timer-inner');
    let timerValueElement = $('timer-value');
    let endTurnButton = $('end-turn-button');

    endTurnButton.disabled = false;
    endTurnButton.classList.remove('turn-ended-button');

    timerBarElement.style.width = 100+'%';
    timerValueElement.innerText = TIME_PER_ROUND;

    intervalHandle = setInterval(reduceTimer, 1000, timerBarElement, timerValueElement);
}

function reduceTimer(timerBarElement, timerValueElement){
    timeRemaining--;
    timerBarElement.style.width = (timeRemaining * 100/TIME_PER_ROUND) + '%';
    timerValueElement.innerText = timeRemaining;

    if(timeRemaining < 1){
        endTurn();
    }
}

function endTurn() {
    clearInterval(intervalHandle);
    canPlayerInteract = false;
    $('end-turn-button').disabled = true;
    $('end-turn-button').classList.add('turn-ended-button');
    handleActions();
    startRound();
}

function handleActions() {
    
}

/** global enums */
const TileTypes =  {
    FLOOR: 0,
    BELT_LEFT: 1,
    BELT_UP: 2,
    BELT_RIGHT: 3,
    BELT_DOWN: 4,
    BELT_DOWN_LEFT: 5,
    BELT_DOWN_RIGHT: 6,
    BELT_UP_LEFT: 7,
    BELT_UP_RIGHT: 8,
    BELT_LEFT_UP: 9,
    BELT_RIGHT_UP: 10,
    BELT_LEFT_DOWN: 11,
    BELT_RIGHT_DOWN: 12,
    TURN_LEFT: 13,
    TURN_RIGHT: 14,
    PIT: 15,
    START_POINT: 16,
    END_POINT: 17
}

const TileCSSMap = [
    ['floor'],
    ['belt-straight'],
    ['belt-straight', 'rotate90'],
    ['belt-straight', 'rotate180'],
    ['belt-straight', 'rotate270'],
    ['belt-clockwise-corner', 'rotate270'],
    ['belt-counter-clockwise-corner'],
    ['belt-counter-clockwise-corner', 'rotate180'],
    ['belt-clockwise-corner', 'rotate90'],
    ['belt-clockwise-corner'],
    ['belt-counter-clockwise-corner'],
    ['belt-counter-clockwise-corner', 'rotate90'],
    ['belt-clockwise-corner', 'rotate180'],
    ['turn'],
    ['turn', 'turn-right'],
    ['pit'],
    ['start-point'],
    ['end-point']
];

const TileWallCSSMap = [
    'wall-up',
    'wall-down',
    'wall-left',
    'wall-right'
];

const ActionTypes = {
    ONE_STEP_FORWARD: "⭢",
    TWO_STEPS_FORWARD: "⮆",
    THREE_STEPS_FORWARD: "⇶",
    TURN_LEFT: "⬏",
    TURN_RIGHT: "⬎",
    TURN_AROUND: "⮌",
    ONE_STEP_BACKWARD: "⭠"
};

const Directions = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

const DirectionsTransformMap = ['','rotate180','rotate270', 'rotate90'];
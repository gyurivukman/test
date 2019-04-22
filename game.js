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

const TIME_PER_ROUND = 5;

var mapModel;
var gameTableHandle;
var playerModel;
var playerElementHandle;
var currentCommandDisplayText;
var actionQueueDomElement;

var hasGameEnded;
var roundCounter = 0;

var fullActionSet;
var perRoundActionSet;
var perRoundActionQueue;

var timeRemaining;

var canPlayerInteract;
var roundTimerIntervalHandle;
var actionHandlerIntervalHandle;

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
    $('new-game-button').addEventListener('click', startNewGame, false);
}

function preGameMenuClicked(){
    preGameInit(this.getAttribute('name'));
    startRound();
}

function preGameInit(mapType) {
    actionQueueDomElement = $('player-actions');
    currentCommandDisplayText = $('currentCommandDisplay');
    perRoundActionQueue = [];
    let gameContainer = $('game-container');
    let gameOverContainer = $('game-over-container');
    let pregameMenu = $('pregame-menu');
    gameTableHandle = $('game-table');

    initFullActionSet();
    initMapModel(mapType);
    initPlayerElement();
    buildMap();

    pregameMenu.classList.add('d-none');
    gameOverContainer.classList.add('d-none');
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
                {type:TileTypes.PIT, walls:[]}, {type:TileTypes.FLOOR, walls:[]}, {type:TileTypes.BELT_TURN_LEFT, walls:[]},
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

        playerModel = {posX: 5, posY: 5, direction: Directions.LEFT};
        
    } else {
        
    }
}

function initFullActionSet() {
    fullActionSet = [];
    let idCounter = 0;
    Object.keys(ActionTypes).forEach(
        (actionType) => {
            for(let i = 0; i < 3; ++i){
                fullActionSet.push(createActionItem(ActionTypes[actionType],idCounter++));
            }
        }
    )
}

function createActionItem(actionType, id) {
    let domElement = document.createElement("div");

    domElement.classList = ["action-item"];
    domElement.innerText = ActionTypesMap[actionType].displayValue;
    domElement.dataset.id = id;
    
    domElement.addEventListener("click", addToPerRoundActionQueue, false);

    let actionItem = {
        displayValue: ActionTypesMap[actionType].displayValue,
        handle: ActionTypesMap[actionType].handler,
        domElement: domElement
    }

    return actionItem;
}

function addToPerRoundActionQueue() {
    if( canPlayerInteract && this.dataset.inQueue == "0" && perRoundActionQueue.length < 5) {
        this.dataset.inQueue = 1;
        let targetID = parseInt(this.dataset.id);
        $('player-actions').appendChild($('available-actions').removeChild(this));
        let actionItemIndex = perRoundActionSet.findIndex(( item )=>{ return item.domElement.dataset.id == targetID });
        perRoundActionQueue.push(perRoundActionSet.splice(actionItemIndex,1)[0]);
    }
}

function initPlayerElement() {
    playerElementHandle = document.createElement('div');
    playerElementHandle.id = "player";
}

function buildMap() {
    for(let i=0; i<mapModel.length; ++i){
        let tableRow = gameTableHandle.insertRow(i);
        for(let j=0; j < mapModel[i].length; ++j){
            let cell = tableRow.insertCell(j);
            playerModel.posX == i && playerModel.posY == j?cell.appendChild(playerElementHandle):cell.innerHTML = '&nbsp;';
            for(let cssClass of TileCSSMap[mapModel[i][j].type]){
                cell.classList.add(cssClass);
            }
            for(let wall of mapModel[i][j].walls){
                cell.classList.add(TileWallCSSMap[wall]);
            }
            
        }
    }
    playerElementHandle.classList.add(DirectionsCSSTransformMap[playerModel.direction]);
}

async function startRound() {

    prepareActionSets();

    canPlayerInteract = true;
    timeRemaining = TIME_PER_ROUND;
    
    let timerBarElement = $('round-timer-inner');
    let timerValueElement = $('timer-value');
    let endTurnButton = $('end-turn-button');
    let roundCounterElement = $('round-counter');

    endTurnButton.disabled = false;
    endTurnButton.classList.remove('turn-ended-button');

    roundCounterElement.innerText = ++roundCounter;
    timerBarElement.style.width = 100 + '%';
    timerValueElement.innerText = TIME_PER_ROUND+" s";

    roundTimerIntervalHandle = setInterval(reduceTimer, 1000, timerBarElement, timerValueElement);
}

function prepareActionSets() {

    let availableActionsContainer = $('available-actions');
    availableActionsContainer.innerHTML = "";
    $('player-actions').innerHTML = "";

    shuffle(fullActionSet);
    perRoundActionSet = [];

    for(let i=0;i<9;++i) {
        fullActionSet[i].domElement.dataset.
        inQueue = 0;
        perRoundActionSet.push(fullActionSet[i]);
        availableActionsContainer.appendChild(fullActionSet[i].domElement);
    };
}

function reduceTimer(timerBarElement, timerValueElement) {
    --timeRemaining;
    timerBarElement.style.width = (timeRemaining * 100/TIME_PER_ROUND) + '%';
    if(timeRemaining  > -1){
        timerValueElement.innerText = timeRemaining + " s";
    }
    if(timeRemaining < 1 ) {
        endTurn();
    }
    
}

function endTurn() {
    clearInterval(roundTimerIntervalHandle);
    canPlayerInteract = false;
    $('end-turn-button').disabled = true;
    $('end-turn-button').classList.add('turn-ended-button');

    if(perRoundActionQueue.length < 5) {
         fillActionQueue();
    }
    handleActions();
}

function fillActionQueue() {
    let remainingRegisters = 5 - perRoundActionQueue.length;
    shuffle(perRoundActionSet);
    for(let i = 0; i < remainingRegisters; ++i){
        let randomActionItem = perRoundActionSet.shift();
        randomActionItem.domElement.dataset.inQueue = 1;
        $('player-actions').appendChild($('available-actions').removeChild(randomActionItem.domElement));
        perRoundActionQueue.push(randomActionItem);
    }
}

function handleActions() {
    actionHandlerIntervalHandle = setInterval(handleNextAction, 500);
}

function handleNextAction() {
    if(!hasGameEnded && perRoundActionQueue.length > 0) {
        let actionItem = perRoundActionQueue.shift();
        currentCommandDisplayText.innerText = actionItem.displayValue;
        actionItem.domElement = actionQueueDomElement.removeChild(actionItem.domElement);
        actionItem.handle();
    }else{
        clearInterval(actionHandlerIntervalHandle);
        handleBeltActions();
        if(!hasGameEnded){startRound()};
    }
}

function startNewGame() {
    perRoundActionQueue = [];
    roundCounter = 0;

    $('game-over-container').classList.add('d-none');
    $('game-container').classList.add('d-none');
    $('pregame-menu').classList.remove('d-none');
    gameTableHandle.innerHTML = "";
    $('available-actions').innerHTML = "";
    $('player-actions').innerHTML = "";
}

function finishGame(isVictory){

    hasGameEnded = true;
    canPlayerInteract = false;
    clearInterval(roundTimerIntervalHandle);
    
    let endGameTextElement = $('end-game-text')
    endGameTextElement.classList = [];
    if(isVictory){
        endGameTextElement.innerText = "Congratulations!"
        endGameTextElement.classList.add("victory-text");
    }else{
        endGameTextElement.innerText = "Game Over!"
        endGameTextElement.classList.add("lose-text");
    }
    $('game-over-container').classList.remove('d-none');
}

function checkGameOver(){
    if(mapModel[playerModel.posX][playerModel.posY].type == TileTypes.END_POINT){
        finishGame(true);
    }else if(mapModel[playerModel.posX][playerModel.posY].type == TileTypes.PIT){
        finishGame(false);
    }
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
    BELT_TURN_LEFT: 13,
    BELT_TURN_RIGHT: 14,
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
    ONE_STEP_FORWARD: 0,
    TWO_STEPS_FORWARD: 1,
    THREE_STEPS_FORWARD: 2,
    TURN_LEFT:  3,
    TURN_RIGHT: 4,
    TURN_AROUND: 5,
    ONE_STEP_BACKWARD: 6
};

const ActionTypesMap = [
    {displayValue: "⭢", handler: oneStepForwardActionHandler },
    {displayValue: "⮆", handler: twoStepsForwardActionHandler },
    {displayValue: "⇶", handler: threeStepsForwardActionHandler },
    {displayValue: "⬏", handler: turnPlayerLeft },
    {displayValue: "⬎", handler: turnPlayerRight },
    {displayValue: "⮌", handler: turnAroundActionHandler },
    {displayValue:"⭠", handler: oneStepBackwardActionHandler }
]

const Directions = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

const DirectionsCSSTransformMap = ['', 'rotate180', 'rotate270', 'rotate90'];

/** Action Handlers */

function oneStepForwardActionHandler(){
    console.log("stepping forward");
    movePlayerInDirection(playerModel.direction);
}

function twoStepsForwardActionHandler(){
    console.log("two steps forward")
    movePlayerInDirection(playerModel.direction);
    movePlayerInDirection(playerModel.direction);
}

function threeStepsForwardActionHandler(){
    console.log("three steps forward!")
    movePlayerInDirection(playerModel.direction);
    movePlayerInDirection(playerModel.direction);
    movePlayerInDirection(playerModel.direction);
}

function movePlayerInDirection(direction){
    let canStepInDirection = calculateCanStepInDirection(direction);
    
    if(canStepInDirection){
        gameTableHandle.rows[playerModel.posX].cells[playerModel.posY].innerHTML = '&nbsp;';
        switch(direction){
            case Directions.UP:
                --playerModel.posX;
                break;
            case Directions.RIGHT:
                ++playerModel.posY;
                break;
            case Directions.LEFT:
                --playerModel.posY;
                break;
            case Directions.DOWN:
                ++playerModel.posX;
                break;
        }
        gameTableHandle.rows[playerModel.posX].cells[playerModel.posY].innerHTML = "";
        gameTableHandle.rows[playerModel.posX].cells[playerModel.posY].appendChild(playerElementHandle);
        checkGameOver();
    } else {
        finishGame(false);
    }
}

function calculateCanStepInDirection(direction){
    let nextTile;
    let reverseDirection = direction%2 == 0?direction+1:direction-1;
    switch(direction){
        case Directions.UP:
            nextTile = mapModel[playerModel.posX-1][playerModel.posY];
            break;
        case Directions.DOWN:
            nextTile = mapModel[playerModel.posX+1][playerModel.posY];
            break;
        case Directions.LEFT:
            nextTile = mapModel[playerModel.posX][playerModel.posY-1];
            break;
        case Directions.RIGHT:
            nextTile = mapModel[playerModel.posX][playerModel.posY+1];
            break;
    }
    
    let currentTileIsSafe = !(mapModel[playerModel.posX][playerModel.posY].walls.includes(direction))
    let nextTileIsSafe = !(nextTile.walls.includes(reverseDirection));
    return !hasGameEnded && currentTileIsSafe && nextTileIsSafe;
}

function turnPlayerLeft(){
    if(playerModel.direction != Directions.UP){
        playerElementHandle.classList.remove(DirectionsCSSTransformMap[playerModel.direction]);
    }
    switch(playerModel.direction){
        case Directions.UP:
            playerModel.direction = Directions.LEFT;
            break;
        case Directions.DOWN:
            playerModel.direction = Directions.RIGHT;
            break;
        case Directions.LEFT:
            playerModel.direction = Directions.DOWN;
            break;
        case Directions.RIGHT:
            playerModel.direction = Directions.UP;
            break;
    }
    if(playerModel.direction != Directions.UP){
        playerElementHandle.classList.add(DirectionsCSSTransformMap[playerModel.direction])
    };
}

function turnPlayerRight(){
    if(playerModel.direction != Directions.UP){
        playerElementHandle.classList.remove(DirectionsCSSTransformMap[playerModel.direction]);
    }
    switch(playerModel.direction){
        case Directions.UP:
            playerModel.direction = Directions.RIGHT;
            break;
        case Directions.DOWN:
            playerModel.direction = Directions.LEFT;
            break;
        case Directions.LEFT:
            playerModel.direction = Directions.UP;
            break;
        case Directions.RIGHT:
            playerModel.direction = Directions.DOWN;
            break;
    }
    if(playerModel.direction != Directions.UP){
        playerElementHandle.classList.add(DirectionsCSSTransformMap[playerModel.direction])
    };
}

function turnAroundActionHandler(){
    turnPlayerLeft();
    turnPlayerLeft();
}

function oneStepBackwardActionHandler() {
    let reverseDirection = playerModel.direction%2 == 0?playerModel.direction+1:playerModel.direction-1;
    movePlayerInDirection(reverseDirection);
}

/** Belt Action Handlers */
function handleBeltActions() {
    actionHandlerIntervalHandle = setInterval(handleNextBeltAction, 1000);
}

function handleNextBeltAction() {
    if(!hasGameEnded && isMoverBeltTile(playerModel.posX, playerModel.posY)){
        let tileType = mapModel[playerModel.posX][playerModel.posY].type;
        switch(tileType){
            case TileTypes.BELT_LEFT:
                console.log('BELT_LEFT: belt pushing left')
                movePlayerInDirection(Directions.LEFT);
                break;
            case TileTypes.BELT_UP:
                console.log('BELT_UP: belt pushing up')
                movePlayerInDirection(Directions.UP);
                break;
            case TileTypes.BELT_RIGHT:
                console.log('BELT_RIGHT:belt pushing right')
                movePlayerInDirection(Directions.RIGHT);
                break;
            case TileTypes.BELT_DOWN:
                console.log('BELT_DOWN: belt pushing down')
                movePlayerInDirection(Directions.DOWN);
                break;
            case TileTypes.BELT_DOWN_LEFT:
                console.log('BELT_DOWN_LEFT: belt turn Right and push')
                turnPlayerRight();
                movePlayerInDirection(Directions.LEFT);
                break;
            case TileTypes.BELT_DOWN_RIGHT:
                console.log('BELT_DOWN_RIGHT belt turn Left and push')
                turnPlayerLeft();
                movePlayerInDirection(Directions.RIGHT);
                break;
            case TileTypes.BELT_UP_LEFT:
                console.log('BELT_UP_LEFT: belt turn Left and push')
                turnPlayerLeft();
                movePlayerInDirection(Directions.LEFT);
                break;
            case TileTypes.BELT_UP_RIGHT:
                console.log('BELT_UP_RIGHT: belt turn Right and push')
                turnPlayerRight();
                movePlayerInDirection(Directions.RIGHT);
                break;
            case TileTypes.BELT_LEFT_UP:
                console.log('BELT_LEFT_UP: belt turn Right and push')
                turnPlayerRight();
                movePlayerInDirection(Directions.UP);
                break;
            case TileTypes.BELT_RIGHT_UP:
                console.log('BELT_RIGHT_UP: belt turn Left and push')
                turnPlayerLeft();
                movePlayerInDirection(Directions.UP);
                break;
            case TileTypes.BELT_LEFT_DOWN:
                console.log('BELTLEFT_DOWN: belt turn Left and push')
                turnPlayerLeft();
                movePlayerInDirection(Directions.DOWN);
                break;
            case TileTypes.BELT_RIGHT_DOWN:
                console.log('BELT_RIGHT_DOWN belt turn Right and push')
                turnPlayerRight();
                movePlayerInDirection(Directions.DOWN);
                break;
        }
    } else {
        let tileType = mapModel[playerModel.posX][playerModel.posY].type;
        if(TileTypes.TURN_LEFT){
            turnPlayerLeft();
        }else if(tileType==TileTypes.TURN_RIGHT){
            turnPlayerRight();
        }
        clearInterval(actionHandlerIntervalHandle);
    }
}

function isMoverBeltTile(posX, posY){
    let tileType = mapModel[posX][posY].type;
    return tileType > 0 && tileType < 13;
}

function beltPushPlayerLeft(){
    gameTableHandle.rows[playerModel.posX].cells[playerModel.posY].innerHTML = '&nbsp;';
    --playerModel.posY;
    gameTableHandle.rows[playerModel.posX].cells[playerModel.posY].innerHTML = "";
    gameTableHandle.rows[playerModel.posX].cells[playerModel.posY].appendChild(playerElementHandle);
    checkGameOver();
}

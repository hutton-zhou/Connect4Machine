
let currentGameText=document.getElementById("current");
let turnText=document.getElementById("turn");

let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let grid;
let nextLoc;
let player;
let AiConfig;
let hoverSettings;

const hoverColors={
    1: "rgba(139, 0, 0, 0.3)",
    2: "rgba(0, 0, 139, 0.3)"
}
const normalColors={
    1: "rgb(139,0,0)",
    2: "rgb(0,0,139)"
}//change colors accordingly

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
        //vertical
        ctx.moveTo(i * 100, 0);
        ctx.lineTo(i * 100, 600);
    }
    for (let i = 0; i < 6; i++) {
        //horizontal
        ctx.moveTo(0, i * 100);
        ctx.lineTo(700, i * 100);
    }
    ctx.stroke();
    for(let i = 0; i < 7; i++){
        for(let j = 0; j < 6; j++){
            ctx.beginPath();
            ctx.arc(i*100+50, j*100+50, 40, 0, 2 * Math.PI);

            if(hoverSettings.x==i && hoverSettings.y==j && hoverSettings.player!=0){
                ctx.fillStyle = hoverSettings.player==1 ? hoverColors[1] : hoverColors[2];
                ctx.fill();
            }else{
                if(grid[i][j]==0){
                    ctx.stroke();
                }else if(grid[i][j]==1){
                    ctx.fillStyle = normalColors[1];
                    ctx.fill();
                }else if(grid[i][j]==2){
                    ctx.fillStyle = normalColors[2];
                    ctx.fill();
                }
            }
            
            
        }
    }
}


function run(TempAiConfig={1: false, 2: false}) {
    //setup players
    AiConfig=TempAiConfig;
    player=1;//1 is player 1, 2 is player 2

    //setup sidebar
    if(TempAiConfig[1] && TempAiConfig[2]){
        currentGameText.innerText="Current Game: AI vs AI";
    }else if(TempAiConfig[1]){
        currentGameText.innerText="Current Game: Player vs AI (AI First)";
    }else if(TempAiConfig[2]){
        currentGameText.innerText="Current Game: Player vs AI (Player First)";
    }else{
        currentGameText.innerText="Current Game: Player vs Player";
    }
    setPlayerText();
    //reset ui too
    hoverSettings={x: 0, y: 0, player: 0}; //0 for no hover

    grid=[
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0]
    ]//0 is empty, 1 is player 1, 2 is player 2
    //also its a list of columns not rows, so its [x][y] not [y][x]
    //a bit unstandard but it works because its easier to place stuff!
    //also right is bottom and left is top, so its a bit weird but it works!
    nextLoc=[5,5,5,5,5,5,5] //all bottom to top

    
    
    //every thing else will be operated by event listener

    draw();
    //also attempt to AI
    tryAiCode(player);
}
function runWithProtection(TempAiConfig){
    confirm("This will reset the current game, are you sure?") && run(TempAiConfig);
}

run();


function tryAiCode(player){
    if(!AiConfig[player])return;//if its not ai's turn, do nothing
    setTimeout(function(){
        asyncAiCode(player);
    });//no delay but allows ui to update before ai does its thing
    
}
function asyncAiCode(player){
    changeRow(actualAiFunction(player),player);
    swapPlayer();
    draw();
}

let maxDepth=document.getElementById("aiIQ").value; //at depth 10, heuristics? but for now no need for heuristics, just return 0 at depth 10 and it will be a bit smarter than random

function actualAiFunction(player){
    //ai code here
    //minimax alphabeta pruning
    //depth and heuristics
    return miniDigger(player, player, 0, -Infinity, Infinity, false, JSON.parse(JSON.stringify(grid)), JSON.parse(JSON.stringify(nextLoc)));//copy grid and nextloc for ai to use without affecting real game
}
function miniDigger(ogAIPlayer, player, depth, alpha, beta, mini, tempGrid, tempNextLoc){
    
    

    //top case
    tempFour=findFourInARow(tempGrid, ogAIPlayer);

    if(tempFour!=0){
        return tempFour*1_000_000
    }
    else if(depth>=maxDepth){
        return heuristicFunction(tempGrid, ogAIPlayer)
    }
    let possibleMoves=[];
    for(let i = 0; i < tempNextLoc.length; i++){
        if(tempNextLoc[i]>=0){
            possibleMoves.push(i);
        }
    }
    if(possibleMoves.length==0){
        //no moves left, its a tie
        return 0;
    }
    //shuffle possibleMoves
    for(let i = possibleMoves.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [possibleMoves[i], possibleMoves[j]] = [possibleMoves[j], possibleMoves[i]];
    }
    
    //we must return which move is best (or worst if mini)
    let bestScore=mini ? Infinity : -Infinity; //if mini, we want to decrease from infinity
    let bestMove=0;
    for(let move of possibleMoves){
        //make move
        let tempTempGrid=JSON.parse(JSON.stringify(tempGrid));
        let tempTempNextLoc=JSON.parse(JSON.stringify(tempNextLoc));
        tempTempGrid[move][tempTempNextLoc[move]]=player;
        tempTempNextLoc[move]--;
        //ok now recurse
        let score=miniDigger(ogAIPlayer, player==1?2:1, depth+1, alpha, beta, !mini, tempTempGrid, tempTempNextLoc);
        

        if(mini){
            if(score<bestScore){
                bestScore=score;
                bestMove=move;
            }
        }else{
            if(score>bestScore){
                bestScore=score;
                bestMove=move;
            }
        }

        //only time we run minidigger
        if(mini){
            if(score<beta)beta=score;
            if(beta<=alpha)break;//alpha beta pruning
        }else{
            if(score>alpha)alpha=score;
            if(beta<=alpha)break;//alpha beta pruning
        }

    }
    

    if(depth==0){
        return bestMove;//we want to return the move at the top level (but the first one as others can be bad ones pruned)
    }else{
        return bestScore;//we want to return the score at the lower levels
    }
    
}
function findFourInARow(tempGrid, player){
    //check if player has 4 in a row in tempGrid
    //horizontal first
    for(let i = 0; i < 7-3; i++){
        for(let j=0; j < 6; j++){
            if (tempGrid[i][j] == tempGrid[i+1][j] && tempGrid[i+1][j] == tempGrid[i+2][j] && tempGrid[i+2][j] == tempGrid[i+3][j]){
                if(tempGrid[i][j]==player){return 1;}
                else if(tempGrid[i][j]!=0){return -1;}
            }
        }
    }
    //vertical now
    for(let i = 0; i < 6-3; i++){
        for(let j=0; j < 7; j++){
            if (tempGrid[j][i] == tempGrid[j][i+1] && tempGrid[j][i+1] == tempGrid[j][i+2] && tempGrid[j][i+2] == tempGrid[j][i+3]){
                if(tempGrid[j][i]==player){return 1;}
                else if(tempGrid[j][i]!=0){return -1;}
            }
        }
    }
    //diagonal
    for(let i = 0; i < 7-3; i++){
        for(let j = 0; j < 6-3; j++){
            if (tempGrid[i][j] == tempGrid[i+1][j+1] && tempGrid[i+1][j+1] == tempGrid[i+2][j+2] && tempGrid[i+2][j+2] == tempGrid[i+3][j+3]){
                if(tempGrid[i][j]==player){return 1;}
                else if(tempGrid[i][j]!=0){return -1;}
            }
            else if (tempGrid[i][j+3] == tempGrid[i+1][j+2] && tempGrid[i+1][j+2] == tempGrid[i+2][j+1] && tempGrid[i+2][j+1] == tempGrid[i+3][j]){
                if(tempGrid[i][j+3]==player){return 1;}
                else if(tempGrid[i][j+3]!=0){return -1;}
            }
        }
    }
    return 0;//no winner
}
function heuristicFunction(tempGrid,player){
    //evaluate the board and return a score for the given player
    //positive score means good for player, negative means bad for player
    //unfinished
    return 0;
}

//event detection below
function setPlayerText(){
    if(player==1){
        if(AiConfig[1]){
            turnText.innerText="Red AI is thinking...";
        }else{
            turnText.innerText="Red Player Turn";
        }
    }else{
        if(AiConfig[2]){
            turnText.innerText="Blue AI is thinking...";
        }else{
            turnText.innerText="Blue Player Turn";
        }
    }
}


function swapPlayer(){

    //still draw
    draw();
    //check player win
    requestAnimationFrame(function(){
    requestAnimationFrame(function(){
        if(findFourInARow(grid, player)==1){
            alert((player==1 ? "Red" : "Blue") + (AiConfig[player] ? " AI" : " Player") + " Wins!");
            run(AiConfig)
            return;
        }else if(findFourInARow(grid, player)==-1){
            alert((player==2 ? "Red" : "Blue") + (AiConfig[player] ? " AI" : " Player") + " Wins!");
            run(AiConfig)//go again
            return;
        }

        player = player==1 ? 2 : 1;
        setPlayerText();

        

        //also try ai
        tryAiCode(player);
    });});
}

function detectLocation(ev){
    let rect = document.getElementById("game").getBoundingClientRect();
    let x = Math.floor((ev.clientX - rect.left)/rect.width*7);
    
    if(x>=0 && x < 7){
        let y = nextLoc[x];
        if(y>=0 && y<6){
            return {x: x, y: y, player: player};
        }
    }
    return null;
}
function changeRow(x, player){
    grid[x][nextLoc[x]]=player;
    nextLoc[x]--;
}

document.addEventListener("mousemove", function(ev){
    if(AiConfig[player]) return;//if its ai's turn, dont show hover as ai move
    hoverSettings = detectLocation(ev) || hoverSettings; //if null then previous
    draw();
})
document.addEventListener("click", function(ev){
    if(AiConfig[player]) return;

    let tempLocation=detectLocation(ev);
    if(tempLocation==null) return;//if click is invalid, do nothing

    changeRow(tempLocation.x, tempLocation.player); //use temploc for fast access and no looping
    //check win condition
    //unfinished

    //reset hover
    hoverSettings={x: 0, y: 0, player: 0};

    //switch player
    swapPlayer();
    draw();

})
document.getElementById("aiIQ").addEventListener("input", function(ev){
    maxDepth=ev.target.value;
    document.getElementById("labelIQ").innerText="AI Intelligence: "+ev.target.value;
})

let _guessIndex = 0;
let _charIndex = 0;
let _word = "";
let _wordIndex = 0;
let _guess = "";
let _previousGuess = [];
const CHARCOUNT = 5;
const MAXGUESSES = 5;
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const startDate = new Date(2025, 5, 1); // Month is 0-indexed, so June is 5
let guessHistory = {};
let stats = {};
let liveGame = false;
let shareWinText = "";

function init(pID){    
    _guessIndex = 0;
    _charIndex = 0;
    _word = "";
    _guess = "";
    _previousGuess = [];
    _loadGuessHistory();
    _loadStats();
    _resetGrid();
    _clearLetters();
    _loadWord(pID);    
    document.addEventListener('keydown', _keyPress);
}

function _loadGuessHistory(){
    guessHistory = window.localStorage.getItem("guessHistory");
    if(guessHistory === null || guessHistory === undefined){
        guessHistory = {};    
    } else{
        guessHistory = JSON.parse(guessHistory);
    }
}

function _loadStats(){
    stats = window.localStorage.getItem("stats");
    if(stats === null || stats === undefined){
        stats = {};    
    } else{
        stats = JSON.parse(stats);
    }
}

function _saveGuessHistory(){
    window.localStorage.setItem("guessHistory", JSON.stringify(guessHistory));
}

function _saveStats(){
    window.localStorage.setItem("stats", JSON.stringify(stats));
}

function _updateGuessHistory(){
    guessHistory[_wordIndex] = guessHistory[_wordIndex] ||  {};
    let vTemp = guessHistory[_wordIndex];
    vTemp.guessIndex = _guessIndex;
    vTemp.guesses =  vTemp.guesses || {};
    vTemp.guesses[_guessIndex] = _guess;
    _saveGuessHistory();
}

function _updateStats(bWin){
    stats.played = stats.played || 0;
    stats.won = stats.won || 0;
    stats.streak = stats.streak || 0;
    stats.beststreak = stats.beststreak || 0;
    stats.in1 = stats.in1 || 0;
    stats.in2 = stats.in2 || 0;
    stats.in3 = stats.in3 || 0;
    stats.in4 = stats.in4 || 0;
    stats.in5 = stats.in5 || 0;
    stats.in6 = stats.in6 || 0;    
    
    if(liveGame && bWin !== "DISPLAY" && stats.word !== _word){
        // Init stats        
        stats.played++;

        if(bWin){
            stats.won++;
            stats.streak++;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1); // Subtract one day
            const isoYesterdayDateString = yesterday.toISOString().split('T')[0];
            if(stats.date !== isoYesterdayDateString){
                stats.streak = 1;
            }
        } else{
            stats.streak = 0;
        }

        if(stats.streak > stats.beststreak){
            stats.beststreak++;
        }

        const today = new Date();
        const isoDateString = today.toISOString().split('T')[0];
        
        stats.date = isoDateString;
        stats.word = _word;
        let gI = (_guessIndex + 1).toFixed(0);
        
        stats["in" + gI] = stats["in" + gI] + 1;        
        _saveStats();
    }
    let vPercent = (stats.won / stats.played) * 100;
    
    if(vPercent === undefined || isNaN(vPercent) || !isFinite(vPercent)){
        vPercent = 0;
    }

    document.getElementById("statsPlayed").textContent = stats.played;
    document.getElementById("statsWon").textContent = stats.won;
    document.getElementById("statsPercent").textContent = vPercent.toFixed(0);
    document.getElementById("statsStreak").textContent = stats.streak;
    document.getElementById("statsBestStreak").textContent = stats.beststreak;
    _loadBarChart();
}

function _restoreGame(){
    if(guessHistory && guessHistory[_wordIndex] && guessHistory[_wordIndex].guesses !== undefined){
        let vRestore = guessHistory[_wordIndex];
        for(let i = 0; i < 6; i++){
            let vLine = vRestore.guesses[i];
            if(vLine && vLine.length > 0){
                for(let j = 0, k = vLine.length; j <k;j++){
                    _processLetter(vLine.substr(j,1));
                }
                if(vLine.length === 5){
                    makeGuess();
                }
            } else{
                break;
            }
        }
    }
    _showLetters();
}

function keyTap(e){
    _processLetter(e);
}

function _keyPress(event){
    let vChar = String.fromCharCode(event.keyCode).toUpperCase();
    if (event.key.toUpperCase() === 'DELETE' || event.key.toUpperCase() === 'ENTER' || event.key.toUpperCase() === 'BACKSPACE') {
        vChar = event.key;
    }
    _processLetter(vChar);    
}

function _processLetter(vChar){
    if(_guessIndex<6){
        let vDelete = false;
        
        // Add your logic here to handle the key press
        if (vChar.toUpperCase() === 'ENTER') {
            if(_charIndex > 4){
                makeGuess();
            }
            return;
        }            
        else if(vChar.toUpperCase() === "DELETE" || vChar.toUpperCase() === "BACKSPACE"){
            vDelete = true;
            vChar = "";
            _guess = _guess.substring(0,_guess.length - 1);
            _charIndex--;        
            if(_charIndex < 0){
                _charIndex = 0;
            }
        }
        else if(alphabet.indexOf(vChar.toUpperCase())<0){
            return;
        }
        if(_charIndex > 4 && !vDelete){
            _angryShake(4);
            return;
        }
        _guess += vChar;
        
        _updateGuessHistory();
        const vRow = document.getElementById("row" + _guessIndex.toFixed(0));
        const vCells = vRow.children;
        if(vCells && vCells.length === 5){
            const letterDiv = document.createElement('div');
            letterDiv.classList.add("cell-front");                    
            letterDiv.textContent = vChar;                
            if(vDelete){
                vCells[_charIndex].children[0].innerHTML = "";
            } else{
                vCells[_charIndex].children[0].appendChild(letterDiv);
            }        
            _happyDance(_charIndex,true);
        }

        if(!vDelete){
            _charIndex++;        
            if(_charIndex > 5){
                _charIndex = 5;
            }    
        }
        _showLetters();
    }
}

function _loadWord(pID){
    let vIndex = "";
    liveGame = false;
    if(pID){
        vIndex = pID;
    } else{
        const today = new Date(); // Get today's date
        
        // Calculate the difference in milliseconds
        const differenceInTime = today.getTime() - startDate.getTime();

        // Convert milliseconds to days
        let differenceInDays = parseInt(differenceInTime / (1000 * 3600 * 24));
        differenceInDays = differenceInDays % WordList.length;
        
        if(differenceInDays >= (WordList.length - 1)){
            differenceInDays = (WordList.length - 1);
        }    
        vIndex = differenceInDays;
        liveGame = true;
    }
    _wordIndex = vIndex;
    _word = WordList[vIndex].toUpperCase();
    
    const pastDate = new Date(startDate);
    if(typeof vIndex === 'string'){
        vIndex = parseInt(vIndex);
    }
    pastDate.setDate(startDate.getDate() + vIndex);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = pastDate.toLocaleDateString('en-US', options);
    const header = document.getElementById("gameID");
    header.textContent = formattedDate;

    _restoreGame();
}

function makeGuess(){    
    if(WordList.indexOf(_guess.toLowerCase()) < 0){
        _showToast("You did not enter a valid word");
        _angryShake();
        return;
    }    
    let vCorrect = _checkGuess(_guess.toUpperCase());        
    if(!vCorrect){        
        _guessIndex++;
        _charIndex = 0;
        _guess = "";
        _showLetters();
        if(_guessIndex > MAXGUESSES){
            document.removeEventListener('keydown', _keyPress);
            setTimeout(() => {
            _updateStats(false);
            _showModal(_word,"You did not guess the word");                
            }, (3000));
            
            setTimeout(() => {
                _angryShake();
            }, 1800);            
        }
    }
}

function _checkGuess(vGuess){    
    let vResult = "";
    let vCalcResult = 0;
    const vRow = document.getElementById("row" + _guessIndex.toFixed(0));
    const vCells = vRow.children;
    
    _previousGuess[_guessIndex] = _previousGuess[_guessIndex] || []; 

    for(let i =0; i < CHARCOUNT; i++){	
        let vDist = closestLetterDistance(_word[i],vGuess[i]);        
        if(vCells && vCells.length === 5){
            const letterDiv = document.createElement('div');
            letterDiv.classList.add("cell-back");                    
            letterDiv.textContent = vGuess[i];       
            if(vDist === 0){
                letterDiv.classList.add("exact");                    
            }
            else if(vDist < 3){
                letterDiv.classList.add("close");                    
            } else if (vDist < 6){
                letterDiv.classList.add("reasonable");                    
            } else if (vDist < 10){
                letterDiv.classList.add("far");                    
            } else{
                letterDiv.classList.add("out-of-bounds");                    
            }
            vCells[i].children[0].appendChild(letterDiv);
            setTimeout(() => {
                vCells[i].classList.toggle("cell-flip"); // Toggle the flip effect    
            }, (300 * (i)));
            
            _previousGuess[_guessIndex][i] = {
                letter: vGuess[i],
                distance: vDist
                };
        }
        vCalcResult += vDist;
        vResult += vDist.toFixed() + " ";
    }
    // Create the new div element
    const insertedDiv = document.createElement('div');
    // Add text content to the new div
    insertedDiv.textContent = vResult;
    // Append the new div to the parent div
    //document.getElementById("answer").appendChild(insertedDiv);
    if(vCalcResult === 0){        
        setTimeout(() => {
                _happyDance();
            }, 1800);  

        setTimeout(() => {
            _updateStats(true);
            _showModal(_word,"You guessed the word");
            }, (3000));
        document.removeEventListener('keydown', _keyPress);        
        return true;
    }
    return false;
}

function closestLetterDistance(letter1, letter2) {
    // Convert letters to their corresponding ASCII values
    const code1 = letter1.charCodeAt(0);
    const code2 = letter2.charCodeAt(0);

    // Calculate the direct distance
    let directDistance = Math.abs(code1 - code2);

    // Since the alphabet loops, calculate the wrap-around distance
    let wrapAroundDistance = 26 - directDistance;

    // Return the minimum of the two distances
    let vRawDistance = Math.min(directDistance, wrapAroundDistance);
    let vFinalDistance = 26;
    if(vRawDistance === 0){
        vFinalDistance = 0;
    }
    else if(vRawDistance < 3){
        vFinalDistance = 2;
    } else if (vRawDistance < 6){
        vFinalDistance = 5;
    } else if (vRawDistance < 10){
        vFinalDistance = 9;
    }

    return vFinalDistance;
}

function _showLetters(){    
    let vGuessLetters;
    let prevGuessIndex = _guessIndex - 1;
    if(prevGuessIndex >=0 && _previousGuess && _previousGuess[prevGuessIndex]){        
        vGuessLetters = _previousGuess[prevGuessIndex][_charIndex];
    }
    if(vGuessLetters){
        createAlphabetDivs(vGuessLetters.letter, vGuessLetters.distance); // This will center the letter 'M'
    }
}

function _clearLetters(){
    const letters = document.getElementsByClassName("letterBox");        
    for(let i = 0, j = letters.length;i<j;i++){
        letters[i].classList.remove("exact");
        letters[i].classList.remove("close");            
        letters[i].classList.remove("reasonable");            
        letters[i].classList.remove("far");            
        letters[i].classList.remove("out-of-bounds");  
        letters[i].classList.remove("highlighted");    
        letters[i].classList.remove("hidden");    
    }

}
function createAlphabetDivs(centerLetter, distance) {  
    const letterIndex = alphabet.indexOf(centerLetter.toUpperCase());
    let letters = [];
    if(centerLetter && distance !== undefined){
        letters = getWrappedLetterIndexes(centerLetter, distance);
    }

    if (letterIndex === -1) {
        console.error('Invalid letter provided. Please provide a single letter from A to Z.');
        return;
    }

    const totalLetters = alphabet.length;
    // Calculate the start index to center the letter
    const startIndex = (letterIndex - Math.floor(totalLetters / 2) + totalLetters) % totalLetters;    
    
    for (let i = 0; i < totalLetters; i++) {
        const currentIndex = (startIndex + i) % totalLetters;        
        const letterDiv = document.getElementById("lb" +alphabet[currentIndex]);
        letterDiv.classList.remove("exact");
        letterDiv.classList.remove("close");            
        letterDiv.classList.remove("reasonable");            
        letterDiv.classList.remove("far");            
        letterDiv.classList.remove("out-of-bounds");  
        letterDiv.classList.remove("highlighted");             
        if(letters.indexOf(alphabet[currentIndex]) <0){
            letterDiv.classList.add("hidden");                        
        } else{
            letterDiv.classList.add("highlighted");            
            letterDiv.classList.remove("hidden");         
            if(alphabet[currentIndex] === centerLetter){
                if(distance === 0){
                    letterDiv.classList.add("exact");                    
                }
                else if(distance < 3){
                    letterDiv.classList.add("close");                    
                } else if (distance < 6){
                    letterDiv.classList.add("reasonable");                    
                } else if (distance < 10){
                    letterDiv.classList.add("far");                    
                } else{
                    letterDiv.classList.add("out-of-bounds");                    
                }
            }   
        }
        
        for(let j = 0; j <  _previousGuess.length; j++){
            let vPrevGuess = _previousGuess[j];            
            if(vPrevGuess[_charIndex].letter === alphabet[currentIndex]){
                if(vPrevGuess[_charIndex].distance === 0){
                    letterDiv.classList.add("exact");                    
                }
                else if(vPrevGuess[_charIndex].distance < 3){
                    letterDiv.classList.add("close");                    
                } else if (vPrevGuess[_charIndex].distance < 6){
                    letterDiv.classList.add("reasonable");                    
                } else if (vPrevGuess[_charIndex].distance < 10){
                    letterDiv.classList.add("far");                    
                }                
            }
        }
        letterDiv.textContent = alphabet[currentIndex];        
    }
    
}

function createAlphabetDivs_old(centerLetter, distance) {  
    const letterIndex = alphabet.indexOf(centerLetter.toUpperCase());
    let letters = [];
    if(centerLetter && distance !== undefined){
        letters = getWrappedLetterIndexes(centerLetter, distance);
    }

    if (letterIndex === -1) {
        console.error('Invalid letter provided. Please provide a single letter from A to Z.');
        return;
    }

    const totalLetters = alphabet.length;
    const divs = [];

    // Calculate the start index to center the letter
    const startIndex = (letterIndex - Math.floor(totalLetters / 2) + totalLetters) % totalLetters;
    
    for (let i = 0; i < totalLetters; i++) {
        const currentIndex = (startIndex + i) % totalLetters;        
        const letterDiv = document.createElement('div');
        letterDiv.className = 'letterBox';        
        if(letters.indexOf(alphabet[currentIndex]) <0){
            letterDiv.classList.add("hidden");            
        } else{
            letterDiv.classList.add("highlighted");            
        }
        letterDiv.textContent = alphabet[currentIndex];
        divs.push(letterDiv);
    }

    // Append the divs to a container (you can change 'container' to your desired element)
    const container = document.getElementById("letterRange");    
    container.innerHTML = ''; // Clear previous content
    divs.forEach(div => container.appendChild(div));
}

function getWrappedLetterIndexes(centerLetter, offset) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const startIndex = alphabet.indexOf(centerLetter.toUpperCase());

    if (startIndex === -1) {
        console.error('Invalid center letter provided. Please provide a single letter from A to Z.');
        return [];
    }

    const totalLetters = alphabet.length;
    const result = [];

    // Calculate the range of indexes to include
    for (let i = -offset; i <= offset; i++) {
        const wrappedIndex = (startIndex + i + totalLetters) % totalLetters; // Ensure positive index
        result.push(alphabet[wrappedIndex]);
    }
    if(centerLetter && result.indexOf(centerLetter)<0){
        result.push(centerLetter);
    }
    
    return result;
}

function _hideAllPages(){
    isGamePageShown = false;
    const pages = document.getElementsByClassName("page");
    for(let i = 0, j = pages.length; i<j;i++){
        pages[i].classList.add("hiddenPage");
        pages[i].classList.remove("shownPage");
    }
}
let isGamePageShown = false;
function play(pID){
    _hideAllPages();
    isGamePageShown = true;
    document.getElementById("gamePage").classList.remove("hiddenPage");
    document.getElementById("gamePage").classList.add("shownPage");
    init(pID);
}

function howto(){
    _hideAllPages();
    document.getElementById("howToPage").classList.remove("hiddenPage");
    document.getElementById("howToPage").classList.add("shownPage");
}

function goHome(){    
    _hideAllPages();
    document.getElementById("homePage").classList.remove("hiddenPage");
    document.getElementById("homePage").classList.add("shownPage");    
}

function archive(){
    _hideAllPages();
    document.getElementById("archivePage").classList.remove("hiddenPage");
    document.getElementById("archivePage").classList.add("shownPage");    
    loadArchive();
}

function _angryShake(pIndex){
    let vGuess = _guessIndex;
    if(vGuess > 5){
        vGuess = 5;
    }
    const vRow = document.getElementById("row" + vGuess.toFixed(0));
    const vCells = vRow.children;    

    function _shakeCell(_index){
        if(_index !== undefined){
            const box = vCells[_index];        
            box.classList.add('angry-shake');
            // Remove the class after animation ends to allow re-triggering
            box.addEventListener('animationend', 
                () => {
                        box.classList.remove('angry-shake');
                    }, { once: true });                
        }    
    }
    if(pIndex){
        _shakeCell(pIndex);        
    } else{
        for(let i = 0, j = vCells.length;i<j;i++){
        _shakeCell(i);        
        }
    }
}

function _happyDance(pIndex,pFast) {
    const vRow = document.getElementById("row" + _guessIndex.toFixed(0));
    const vCells = vRow.children;    

    function _danceCell(_index){
        if(_index !== undefined){
            const box = vCells[_index];        
            let vDance = 'happy-dance';
            if(pFast){
                vDance = 'happy-dance-fast';
            }
            box.classList.add(vDance);
            // Remove the class after animation ends to allow re-triggering
            box.addEventListener('animationend', 
                () => {
                        box.classList.remove(vDance);
                    }, { once: true });                
        }    
    }
    if(pIndex !== undefined){
        _danceCell(pIndex);
    } else{
        for(let i = 0, j = vCells.length;i<j;i++){
            setTimeout(() => {
                _danceCell(i);            
            }, (75 * i));            
        }    
    }
}

function _showToast(sMessage){        
    const toast = document.getElementById('toast');
    toast.textContent = sMessage;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('invisible');
        toast.classList.remove('show');
        toast.classList.add('fade-out');
    }, 3000); // Start fading out after 3 seconds

    setTimeout(() => {
        toast.classList.add('invisible');
        toast.classList.remove('fade-out');
    }, 3500); // reset after 3.5 seconds    
}

function _loadArchiveHistory(index){
    let vResult = "";
    if(guessHistory && guessHistory[index] && guessHistory[index].guessIndex !== undefined){
        for(let i = 0; i < 6; i++){
            let vRecord = guessHistory[index].guesses[i];
            if(vRecord === WordList[index].toUpperCase()){
                vResult += "&#10004;";
            }
            else if(vRecord && vRecord.length === 5){
                vResult += "&#10060;";
            } else if (vRecord && vRecord.length < 5){
                vResult += "&#11093;";
            } else{
                break;
            }
        }
    }
    return vResult;
}

function loadArchive(){
    _loadGuessHistory();
    const today = new Date(); // Get today's date
    const yesterday = new Date(today); // Create a new date object for yesterday
    yesterday.setDate(today.getDate() - 1); // Subtract one day
    
    // Calculate the difference in milliseconds
    const differenceInTime = yesterday.getTime() - startDate.getTime();

    // Convert milliseconds to days
    let differenceInDays = parseInt(differenceInTime / (1000 * 3600 * 24));

    if(differenceInDays >= (WordList.length - 1)){
        differenceInDays = (WordList.length - 1);
    }    
    const vRow = document.getElementById("archiveGrid");
    vRow.innerHTML = "";
    for(let i = 0; i <= differenceInDays; i++){
        const pastDate = new Date(startDate);
        pastDate.setDate(startDate.getDate() + i);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = pastDate.toLocaleDateString('en-US', options);
        const archiveDiv = document.createElement('div');
        archiveDiv.classList.add("guessRow");
        const gameDiv = document.createElement('div');
        const textDiv = document.createElement('div');
        textDiv.textContent = formattedDate;
        textDiv.classList.add("archiveText");
        const gametextDiv = document.createElement('div');
        gametextDiv.innerHTML = _loadArchiveHistory(i);
        gametextDiv.classList.add("archiveText");
        const buttonDiv = document.createElement('button');
        buttonDiv.innerHTML = "&#9654;";        
        buttonDiv.classList.add("key");
        buttonDiv.setAttribute('data-id', i.toFixed());
        buttonDiv.onclick = _selectWord;
        gameDiv.appendChild(textDiv);
        gameDiv.appendChild(gametextDiv);
        archiveDiv.appendChild(gameDiv);                        
        archiveDiv.appendChild(buttonDiv);                        
        vRow.prepend(archiveDiv);                        
    }
}

function _selectWord(){
    if(this){
        const data = this.dataset;
        if(data && data.id){            
            play(data.id);
        }        
    }
}

function _resetGrid(){
    const theGrid = document.getElementById("guessGrid");
    const theCellsInner = theGrid.getElementsByClassName("cell-inner");
    for(let i = 0, j = theCellsInner.length;i < j; i++){
        theCellsInner[i].innerHTML = "";
    }    
    const theCells = theGrid.getElementsByClassName("cell");
    for(let i = 0, j = theCells.length;i < j; i++){
        theCells[i].classList.remove("cell-flip");
    }    
}
 
function _isGamePageShown(){
    return isGamePageShown;
}

function _showModal(sHeader, sTitle){
    _updateStats("DISPLAY");
    const modal = document.getElementById('modal');
    const header = document.getElementById('modalHeader');
    const title = document.getElementById('modalTitle');
    header.textContent = sHeader;
    title.textContent = sTitle;
    if(_isGamePageShown()){
        const backButton =document.getElementById("backButton");
        backButton.classList.remove("forceButton");
        modal.classList.add('show');
        modal.classList.remove("forceHide");
        setTimeout(() => {
            modal.classList.remove('invisible');        
        }, 500); // Start fading out after 3 seconds   
    } 
}

function closeModal(){    
    const modal = document.getElementById('modal');
    setTimeout(() => {
        modal.classList.remove('invisible');
        modal.classList.remove('show');
        modal.classList.add('fade-out');
    }, 1); // Start fading out after 3 seconds

    setTimeout(() => {
        modal.classList.add('invisible');
        modal.classList.remove('fade-out');        
    }, 500); // 

    setTimeout(() => {
        modal.classList.add("forceHide");
    }, 1500); // Start fading out after 3 seconds
    const backButton =document.getElementById("backButton");
    backButton.classList.add("forceButton");
}

function _loadBarChart(){
    const dataObject = {
            1: stats.in1,
            2: stats.in2,
            3: stats.in3,
            4: stats.in4,
            5: stats.in5,
            6: stats.in6
        };

        // Extracting labels and values
        const labels = Object.keys(dataObject);
        const values = Object.values(dataObject);

        // Maximum value for scaling
        const maxValue = Math.max(...values);

        // Creating the bars
        const chartDiv = document.getElementById('chart');
        chartDiv.innerHTML = "";
        labels.forEach((label, index) => {
            const value = values[index];            
            const percentage = (value / maxValue) * 100; // Calculate percentage for width

            const row = document.createElement('div');
            row.className = "barRow";
            const labelDiv = document.createElement('div');
            labelDiv.textContent = `${label}`;
            labelDiv.className = "barText";
            const valueDiv = document.createElement('div');
            valueDiv.textContent = `${value}`;
            valueDiv.className = "barText";
            const bar = document.createElement('div');            
            bar.classList.add("bar");                
            bar.style.width = percentage + '%';            
            if(index === _guessIndex){
                bar.classList.add("exact");                
            } else{
                bar.classList.add("barBlack");                
            }
            row.appendChild(labelDiv);
            row.appendChild(bar);
            row.appendChild(valueDiv);
            chartDiv.appendChild(row);
        });
}

function share(){

    shareWinText = "&#10004;" + "&#10060;" + "&#11093;";
    const shareText = "Epicentre.lol " + new Date().toISOString().split('T')[0] 
    + "\n\n"
    + shareWinText;

    const shareUrl = "https://epicentre.lol"; // Replace with your URL

    if (navigator.share) {
        // Use the Web Share API
        navigator.share({
            title: 'Share this content',
            text: shareText,
            url: shareUrl
        })
        .then(() => console.log('Share successful'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback for browsers that do not support the Web Share API
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

        // Open a new window for sharing
        window.open(facebookUrl, '_blank');
        window.open(twitterUrl, '_blank');
        window.open(linkedinUrl, '_blank');
    }

}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
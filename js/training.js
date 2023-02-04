const codeOutput = document.getElementById("code-output")
const startTrainingButton = document.getElementById("start-training")
const preTrainingSection = document.getElementById("pre-training-section")
const activeTrainingSection = document.getElementById("active-training-section")
const stopTrainingButton = document.getElementById("stop-training")
const codeSelect = document.getElementById("code-selection")
const currWord = document.getElementById("curr-word")

codeOutput.style.fontFamily = "monospace"

let chosenCode = null
let codeFunc = null
let trainingBegun = false
let wordLength = 0

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
const codeLength = 6
const inbetweenMs = 5000

// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
async function shuffle(array, randomFunc) {
    let currentIndex = array.length,  randomIndex
    while (currentIndex != 0) {
        // randomIndex = Math.floor((await randomFunc()) * currentIndex)
        randomIndex = await randomFunc(currentIndex)
        console.log(randomIndex)
        currentIndex--
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]]
    }
    return array
}

function generateRandomCode() {
    let code = ""
    let lastChar = ""
    for (let i = 0; i < codeLength; i++) {
        let randomIndex = Math.floor(Math.random() * codeAlphabet.length)
        let randomChar = codeAlphabet[randomIndex]
        while (randomChar === lastChar) {
            randomIndex = Math.floor(Math.random() * codeAlphabet.length)
            randomChar = codeAlphabet[randomIndex]
        }
        lastChar = randomChar
        code += randomChar
    }
    return code
}

function startTraining() {
    chosenCode = codeSelect.value

    if (chosenCode === "norsetable") {
        codeFunc = norseTable
    } else if (chosenCode === "norsecompress") {
        codeFunc = generatePattern
    } else {
        return
    }
    
    preTrainingSection.style.display = "none"
    activeTrainingSection.style.display = "block"
    chosenCode = codeSelect.value

    wordLength = calcWordsLength()
    trainingBegun = true
}

function stopTraining() {
    window.location.reload()
}

async function wordListFromCode(code) {
    let words = [...randomWords]
    let randomGenerator = new RandomGenerator(code)
    await shuffle(words, randomGenerator.randomMax.bind(randomGenerator))
    return words
}

function patternLength(pattern) {
    return pattern.reduce((a, b) => a + b, 0)
}

const code = generateRandomCode()
let words = []
let currIndex = -1

async function initWordList() {
    words = await wordListFromCode(code)
}

initWordList()

codeOutput.textContent = code
startTrainingButton.addEventListener("click", startTraining)
stopTrainingButton.addEventListener("click", stopTraining)

function loop() {
    if (trainingBegun === false) {
        window.requestAnimationFrame(loop)
        return
    }

    let [newIndex, wordProgress] = getCurrWordIndex()

    currWord.style.backgroundImage = `linear-gradient(to right, #00000000 ${wordProgress * 100}%, #000000 0%)`

    if (newIndex !== currIndex) {
        currIndex = newIndex
        let word = words[currIndex]

        currWord.textContent = word
    }

    window.requestAnimationFrame(loop)
}

function calcWordsLength() {
    let length = 0
    for (let word of words) {
        let pattern = codeFunc(word)
        length += patternLength(pattern)
        length += inbetweenMs
    }
    return length
}

function getCurrWordIndex() {
    let ms = Date.now() % wordLength
    let index = 0
    let length = 0
    let wordProgress = 0
    for (let word of words) {
        let pattern = codeFunc(word)
        let tempWordLength = patternLength(pattern)
        length += tempWordLength
        wordProgress = (ms - length + tempWordLength + inbetweenMs) / tempWordLength
        wordProgress = Math.min(wordProgress, 1)
        if (ms < length) {
            return [index, wordProgress]
        }
        length += inbetweenMs
        index++
    }
    return [index, wordProgress]
}

loop()
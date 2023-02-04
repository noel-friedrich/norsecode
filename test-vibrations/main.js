const HTML = {

    COMPLEXITY_INPUT: document.getElementById("complexity-inp"),
    START_TEST_BUTTON: document.getElementById("start-test-btn"),
    MAX_FREQUENCY_INPUT: document.getElementById("max-freq-inp"),
    MIN_FREQUENCY_INPUT: document.getElementById("min-freq-inp"),
    LOG_CONTAINER: document.getElementById("log"),
    BUTTONS_CONTAINER: document.getElementById("buttons-container"),
    PAUSE_LENGTH_INPUT: document.getElementById("pause-length-inp")

}

function log(msg, end="\n") {
    HTML.LOG_CONTAINER.textContent += msg + end
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const testLength = 10
const individualTestLength = 3

async function runTest(complexity, maxFreq, minFreq, pauseLength) {

    let tempAnswers = []

    function pushButton(buttonIndex) {
        tempAnswers.push(buttonIndex)
    }

    function removeButtons() {
        HTML.BUTTONS_CONTAINER.innerHTML = ""
    }

    function frequencyFromIndex(index) {
        return minFreq + (maxFreq - minFreq) * index / (complexity - 1)
    }

    function makeButtons() {
        removeButtons()
        for (let i = 0; i < complexity; i++) {
            let element = document.createElement("button")
            let f = Math.floor(frequencyFromIndex(i))
            element.textContent = `${f}ms`
            element.onclick = () => pushButton(i)
            HTML.BUTTONS_CONTAINER.appendChild(element)
        }
    }

    async function vibrate(pattern) {
        navigator.vibrate(pattern)
        let sum = pattern.reduce((a, b) => a + b, 0)
        await sleep(sum)
    }

    function randomFreq() {
        let freqIndex = Math.floor(Math.random() * complexity)
        return [freqIndex, frequencyFromIndex(freqIndex)]
    }

    function randomPattern(length=3) {
        let pattern = []
        let indeces = []
        for (let i = 0; i < length; i++) {
            let [index, freq] = randomFreq()
            pattern.push(freq)
            pattern.push(pauseLength)
            indeces.push(index)
        }
        return [pattern, indeces]
    }

    makeButtons()

    let correctCount = 0

    for (let i = 0; i < testLength; i++) {
        log(`Subtest ${i + 1} von ${testLength} gestartet.`)

        tempAnswers = []
        let [pattern, patternIndeces] = randomPattern(individualTestLength)
        await vibrate(pattern)

        while (tempAnswers.length < individualTestLength) {
            await sleep(100)
        }

        let correct = true
        for (let j = 0; j < individualTestLength; j++) {
            if (tempAnswers[j] != patternIndeces[j]) {
                correct = false
                break
            }
        }

        if (correct) {
            correctCount++
            log("> erfolgreich beendet.")
        } else {
            log("> fehlerhaft beendet.")
        }
    }

    removeButtons()

    let errorQuotient = Math.round((testLength - correctCount) / testLength * 10000) / 100
    return {"richtige Antworten": correctCount, "Fehlerquote (%)": errorQuotient}

}

let testRunning = false
async function startTest() {

    if (testRunning) {
        alert("Kann keinen Test starten, da bereits ein Test läuft.")
        return
    }

    testRunning = true

    const complexity = parseInt(HTML.COMPLEXITY_INPUT.value)
    const maxFreq = parseInt(HTML.MAX_FREQUENCY_INPUT.value)
    const minFreq = parseInt(HTML.MIN_FREQUENCY_INPUT.value)
    const pauseLength = parseInt(HTML.PAUSE_LENGTH_INPUT.value)

    log("Test startet mit folgenden Optionen:")
    log(JSON.stringify({
        complexity,
        maxFreq,
        minFreq,
        pauseLength
    }))

    try {

        var results = await runTest(complexity, maxFreq, minFreq, pauseLength)

    } catch (e) {
        log("Test beendet mit folgendem Fehler:")
        log(e)
    }

    log("Test beendet. Ergebnis:")
    for (let [key, value] of Object.entries(results)) {
        log(`${key}: ${value}`)
    }
    log("")

    testRunning = false

}

HTML.START_TEST_BUTTON.addEventListener("click", startTest)
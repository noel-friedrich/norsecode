const ELEMENTS = {
    encodeButton: document.getElementById("encode_button"),
    textInput: document.getElementById("text_input"),
    tableTbody: document.getElementById("table_tbody"),
    sidebar: document.getElementById("studio_sidebar"),
    studioContainer: document.querySelector(".studio-container"),
    studioContent: document.querySelector(".studio-content"),
    canvas: document.getElementById("studio_canvas"),
    controlbar: document.getElementById("control_bar"),
    playButton: document.getElementById("play_button"),
    vibrateButton: document.getElementById("vibrate_button"),
    pauseButton: document.getElementById("stop_button"),
    resetButton: document.getElementById("reset_button"),
    compressPauseMsInput: document.getElementById("compress_pause_ms_input"),
    compressShortPulseInput: document.getElementById("compress_short_pulse_input"),
    compressLongPulseInput: document.getElementById("compress_long_pulse_input"),
    compressNorseCheckbox: document.getElementById("compress_norse_checkbox"),
    tablePauseLetterInput: document.getElementById("table_pause_letter_input"),
    tablePauseWordInput: document.getElementById("table_pause_word_input"),
    tableShortPulseInput: document.getElementById("table_short_pulse_input"),
    tableLongPulseInput: document.getElementById("table_long_pulse_input"),
}

let audioCtx = null

async function playFrequency(frequency, duration) {
    return new Promise(resolve => {
        if (!audioCtx)
            audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        if (audioCtx.state === "suspended")
            audioCtx.resume()
        if (duration === undefined || duration < 50)
            duration = 50
        let oscillator = audioCtx.createOscillator()
        oscillator.type = "sine"
        oscillator.frequency.value = frequency
        oscillator.connect(audioCtx.destination)
        oscillator.start()
        setTimeout(() => {
            oscillator.stop()
            resolve()
        }, duration)
    })
}

class PatternSpeaker {

    constructor(pattern) {
        this.pattern = pattern
        this.stopSignal = false
        this.beepFrequency = 700
    }

    play() {
        let tempSum = 0
        for (let i = 0; i < this.pattern.length; i++) {
            let duration = this.pattern[i]
            let afterMs = tempSum
            if (i % 2 === 0 && duration > 0) {
                setTimeout(() => {
                    if (this.stopSignal)
                        return
                    playFrequency(this.beepFrequency, duration)
                }, afterMs)
            }
            tempSum += this.pattern[i]
        }
    }

    stop() {
        this.stopSignal = true
    }

}

class CodeVisualizer {

    constructor() {
        this.canvas = ELEMENTS.canvas
        this.context = this.canvas.getContext("2d")
        this.pattern = []
        this.currGraph = []
        this.patternLength = 0
        this.xScale = 3
        this.redLinePos = 0
        this.playStart = null
        this.stopPos = null
        this.currSpeaker = null
        this.prevSpeakers = []

        setInterval(() => {
            if (this.playStart === null)
                return
            if (this.stopPos !== null)
                return
            let timeElapsed = Date.now() - this.playStart
            if (timeElapsed > this.patternLength) {
                this.reset()
                return
            }
            let patternPos = timeElapsed / this.patternLength
            this.redLinePos = patternPos
            this.drawGraph()

            ELEMENTS.studioContent.scrollLeft = this.redlineX - ELEMENTS.studioContent.clientWidth / 3
        }, 1000 / 30)
    }

    patternLeftAfter(timeElapsed) {
        let newPattern = []
        let currSum = 0
        for (let i = 0; i < this.pattern.length; i++) {
            if (currSum > timeElapsed) {
                newPattern.push(this.pattern[i])
            } else if (currSum + this.pattern[i] > timeElapsed) {
                let newDuration = this.pattern[i] - (timeElapsed - currSum)
                newPattern.push(newDuration)
            }
            currSum += this.pattern[i]
        }
        if (newPattern.length % 2 === 1)
            newPattern.unshift(0)
        return newPattern
    }

    get redlineX() {
        return this.redLinePos * this.canvas.width
    }

    hasPattern() {
        return this.pattern.length > 0
    }

    calcPatternLength() {
        return this.pattern.reduce((a, b) => a + b, 0)
    }

    setPattern(pattern) {
        this.pattern = pattern
        this.patternLength = this.calcPatternLength()
        let newWidth = this.patternLength / this.xScale
        this.setWidth(newWidth)
    }

    setWidth(width, callUpdate=true) {
        width = Math.max(ELEMENTS.studioContent.clientWidth - 20, width)
        this.canvas.width = width
        this.canvas.style.width = width + "px"
        if (callUpdate)
            this.update()
    }

    drawRedline() {
        this.context.beginPath()
        this.context.moveTo(this.redlineX, 0)
        this.context.lineTo(this.redlineX, this.canvas.height)
        this.context.strokeStyle = "#ff0000"
        this.context.lineWidth = 2
        this.context.stroke()
    }

    drawBackground() {
        if (this.canvas.width === 0)
            this.setWidth(-1, false)
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        let squareSize = 30
        for (let x = 0; x < this.canvas.width; x += squareSize) {
            let currDarker = (x / squareSize) % 2 === 0
            for (let y = 0; y < this.canvas.height; y += squareSize) {
                this.context.fillStyle = "#000000"
                this.context.globalAlpha = 0.02
                if (currDarker)
                    this.context.globalAlpha = 0.05
                this.context.fillRect(x, y, squareSize, squareSize)
                currDarker = !currDarker
            }
        }
        this.context.globalAlpha = 1
    }

    drawGraph() {
        this.drawBackground()
        if (!this.hasPattern())
            return

        let maxY = Math.max(this.canvas.height / 2, Math.min(100, this.canvas.height * 0.8))
        this.context.beginPath()
        let middleY = this.canvas.height / 2
        for (let i = 0; i < this.yValues.length; i++) {
            let x = i / this.yValues.length * this.canvas.width
            let y = (1- this.yValues[i]) * maxY + middleY - maxY / 2
            if (i === 0)
                this.context.moveTo(x, y)
            else
                this.context.lineTo(x, y)
        }
        this.context.strokeStyle = "#000000"
        this.context.lineWidth = 3
        this.context.stroke()

        this.drawRedline()
    }

    resume() {
        this.playStart = Date.now() - this.stopPos * this.patternLength
        let timeElapsed = Date.now() - this.playStart
        let pattern = this.patternLeftAfter(timeElapsed)
        this.stopPos = null
        this.stopSpeaker()
        this.currSpeaker = new PatternSpeaker(pattern)
        this.currSpeaker.play()
    }

    play() {
        if (this.stopPos !== null) {
            this.resume()
            return
        }

        this.playStart = Date.now()

        this.stopSpeaker()
        this.currSpeaker = new PatternSpeaker(this.pattern)
        this.currSpeaker.play()
    }

    pause() {
        this.playStart = null
        this.stopPos = this.redLinePos
        this.stopSpeaker()
    }

    stopSpeaker() {
        if (this.currSpeaker !== null)
            this.currSpeaker.stop()
        this.prevSpeakers.push(this.currSpeaker)
        this.currSpeaker = null
        navigator.vibrate(0)
    }

    reset() {
        this.pause()
        this.redLinePos = 0
        this.stopPos = 0
        this.drawGraph()
        this.stopSpeaker()
        ELEMENTS.studioContent.scrollTo({
            left: 0,
            behavior: "smooth"
        })
    }

    vibrate() {
        let pattern = this.pattern
        navigator.vibrate(pattern)
    }

    isOnAfter(ms) {
        let currVibrating = false
        let currMs = 0
        for (let i = 0; i < this.pattern.length; i++) {
            if (currMs + this.pattern[i] > ms) {
                currVibrating = i % 2 === 0
                break
            }
            currMs += this.pattern[i]
        }
        return currVibrating
    }

    generateYValues() {
        let yValues = []

        for (let x = 0; x < this.canvas.width; x++) {
            let ms = Math.floor(x / this.canvas.width * this.patternLength)
            let isOn = this.isOnAfter(ms)
            yValues.push(isOn ? 1 : 0)
        }

        return yValues
    }

    refreshPattern() {
        this.setPattern(this.pattern)
    }

    update() {
        this.yValues = this.generateYValues()
        this.drawGraph()
    }

}

class SwitchManager {

    constructor() {
        this.switchData = {}
        this.switchListeners = {}
        this.switchElements = {}
        document.querySelectorAll(".studio-sidebar-switch").forEach(switchContainer => {
            let key = switchContainer.dataset.key
            let buttons = switchContainer.querySelectorAll(".studio-sidebar-switch-button")
            this.switchElements[key] = {
                container: switchContainer,
                buttons: []
            }
            buttons.forEach(button => {
                let value = button.dataset.value
                if (button.classList.contains("chosen"))
                    this.switchData[key] = value
                
                button.addEventListener("click", () => {
                    this.callListeners(key, value)

                    if (button.classList.contains("chosen"))
                        return
    
                    this.switchData[key] = value
                    buttons.forEach(button => button.classList.remove("chosen"))
                    button.classList.add("chosen")
                })
                this.switchElements[key].buttons.push({
                    element: button,
                    value: value
                })
            })
        })
    }

    setValue(key, value) {
        let switchElement = this.switchElements[key]
        if (switchElement === undefined)
            return
        switchElement.buttons.forEach(button => {
            if (button.value === value) {
                button.element.click()
                return
            }
        })
    }

    callListeners(key, value) {
        if (this.switchListeners[key] !== undefined) {
            for (let listener of this.switchListeners[key]) {
                listener(value)
            }
        }
    }

    getValue(key) {
        return this.switchData[key]
    }

    onValueChange(key, callback) {
        if (this.switchListeners[key] === undefined)
            this.switchListeners[key] = []
        this.switchListeners[key].push(callback)
    }

}

class SliderManager {

    constructor() {
        this.values = {}
        this.elements = {}
        this.listeners = {}
    }

    registerSlider(sliderId, name) {
        let container = document.querySelector(`.slider-container[data-key="${sliderId}"]`)
        let key = container.dataset.key
        let input = container.querySelector("input")
        this.values[key] = input.value
        let label = container.querySelector(".slider-label")
        const update = () => {
            label.textContent = `${name}: ${input.value}`
            input.value = this.values[key]
        }
        input.addEventListener("input", () => {
            this.values[key] = input.value
            this.callListeners(key, input.value)
            update()
        })
        this.elements[key] = {
            container,
            input,
            label,
            update 
        }
        update()
    }

    setValue(key, value) {
        this.values[key] = value
        this.elements[key].update()
    }

    getValue(key) {
        return this.values[key]
    }

    callListeners(key, value) {
        if (this.listeners[key] !== undefined) {
            for (let listener of this.listeners[key]) {
                listener(value)
            }
        }
    }

    onValueChange(key, callback) {
        if (this.listeners[key] === undefined)
            this.listeners[key] = []
        this.listeners[key].push(callback)
    }

}

const tableEncodingData = Object.assign({}, norseTableTranslationTable)

const compressConfig = {
    pause: 1000,
    short: 20,
    long: 200,
    norse: true
}

const tableConfig = {
    pauseLetter: 500,
    pauseWord: 1000,
    short: 100,
    long: 300,
}

class SidebarContent {

    static loadFuncs = {

        table: () => {
            ELEMENTS.tableTbody.innerHTML = ""
            function addRow(char, code) {
                let row = document.createElement("tr")
                let charCell = document.createElement("td")
                let codeCell = document.createElement("td")
                let codeInput = document.createElement("input")
                codeInput.type = "text"
                codeInput.value = code
                codeCell.classList.add("table-code-cell")
                function isValidCode(code) {
                    return /^[01]{1,8}$/.test(code)
                }
                codeInput.addEventListener("input", () => {
                    if (codeInput.value.trim() !== codeInput.value) {
                        codeInput.value = codeInput.value.trim()
                    }
                    if (!isValidCode(codeInput.value)) {
                        codeInput.classList.add("invalid")
                        codeInput.title = "Invalid code"
                        return
                    } else {
                        codeInput.classList.remove("invalid")
                        codeInput.title = ""
                    }
                    tableEncodingData[char] = codeInput.value
                })
                codeInput.classList.add("table-code-input")
                charCell.textContent = char
                codeCell.appendChild(codeInput)
                row.appendChild(charCell)
                row.appendChild(codeCell)
                ELEMENTS.tableTbody.appendChild(row)
            }
            for (let char in tableEncodingData) {
                addRow(char, tableEncodingData[char])
            }

            ELEMENTS.tablePauseLetterInput.value = tableConfig.pauseLetter
            ELEMENTS.tablePauseWordInput.value = tableConfig.pauseWord
            ELEMENTS.tableShortPulseInput.value = tableConfig.short
            ELEMENTS.tableLongPulseInput.value = tableConfig.long

            ELEMENTS.tablePauseLetterInput.classList.remove("invalid")
            ELEMENTS.tablePauseWordInput.classList.remove("invalid")
            ELEMENTS.tableShortPulseInput.classList.remove("invalid")
            ELEMENTS.tableLongPulseInput.classList.remove("invalid")
        },

        compress: () => {
            ELEMENTS.compressLongPulseInput.value = compressConfig.long
            ELEMENTS.compressShortPulseInput.value = compressConfig.short
            ELEMENTS.compressPauseMsInput.value = compressConfig.pause
            ELEMENTS.compressNorseCheckbox.checked = compressConfig.norse

            ELEMENTS.compressLongPulseInput.classList.remove("invalid")
            ELEMENTS.compressShortPulseInput.classList.remove("invalid")
            ELEMENTS.compressPauseMsInput.classList.remove("invalid")
        }

    }
    
    static load(key) {
        let contents = document.querySelectorAll(".studio-sidebar-content")
        contents.forEach(content => {
            let name = content.dataset.name
            if (name === key) {
                content.classList.remove("invisible")
            } else {
                content.classList.add("invisible")
            }
        })
        if (this.loadFuncs[key] !== undefined)  
            this.loadFuncs[key]()
    }

}

let switchManager = null
let sliderManager = null
let visualizer = null

function scaleCanvas() {
    ELEMENTS.canvas.width = ELEMENTS.canvas.clientWidth
    ELEMENTS.canvas.height = ELEMENTS.canvas.clientHeight
}

function encode() {
    let encoding = switchManager.getValue("encoding")
    let text = ELEMENTS.textInput.value.toLowerCase()
    if (text === "") {
        return
    }
    let pattern = []
    if (encoding === "table") {
        pattern = norseTable(text, {
            translationTable: tableEncodingData,
            letterPause: tableConfig.pauseLetter,
            wordPause: tableConfig.pauseWord,
            shortPulse: tableConfig.short,
            longPulse: tableConfig.long
        })
    } else if (encoding === "compress") {
        pattern = norseCompress(text, {
            pauseMs: compressConfig.pause ?? 1000,
            shortPulse: compressConfig.short ?? 20,
            longPulse: compressConfig.long ?? 200,
            norse: compressConfig.norse ?? true
        })
    }
    visualizer.reset()
    visualizer.setPattern(pattern)

    setTimeout(() => {
        ELEMENTS.studioContent.scrollTo({
            left: 0,
            behavior: "smooth"
        })
    }, 100)
}

function addInputListeners() {
    function addNumberListener(input, obj, propertyName) {
        function isValidValue(value) {
            let min = input.min ?? -Infinity
            let max = input.max ?? Infinity

            if (min >= 0) {
                if (!/^[0-9]+(?:\.[0-9]+)?$/.test(value))
                    return false
            } else {
                if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(value))
                    return false
            }

            value = parseFloat(value)
            return value >= min && value <= max
        }

        input.addEventListener("input", () => {
            if (isValidValue(input.value)) {
                input.classList.remove("invalid")
                obj[propertyName] = parseFloat(input.value)
            } else {
                input.classList.add("invalid")
            }
        })
    }

    addNumberListener(ELEMENTS.compressLongPulseInput, compressConfig, "long")
    addNumberListener(ELEMENTS.compressShortPulseInput, compressConfig, "short")
    addNumberListener(ELEMENTS.compressPauseMsInput, compressConfig, "pause")
    addNumberListener(ELEMENTS.tablePauseLetterInput, tableConfig, "pauseLetter")
    addNumberListener(ELEMENTS.tablePauseWordInput, tableConfig, "pauseWord")
    addNumberListener(ELEMENTS.tableShortPulseInput, tableConfig, "short")
    addNumberListener(ELEMENTS.tableLongPulseInput, tableConfig, "long")
}

function main() {
    switchManager = new SwitchManager()
    sliderManager = new SliderManager()
    visualizer = new CodeVisualizer()

    ELEMENTS.studioContainer.style.height = ELEMENTS.studioContainer.clientHeight + "px"
    scaleCanvas()
    window.addEventListener("resize", () => {
        scaleCanvas()
        visualizer.refreshPattern()
    })

    addInputListeners()

    switchManager.onValueChange("encoding", encodingMode => {
        SidebarContent.load(encodingMode)
    })
    switchManager.setValue("encoding", "table")

    sliderManager.registerSlider("xScale", "Dehnung")
    sliderManager.onValueChange("xScale", xScale => {
        visualizer.xScale = xScale
        visualizer.refreshPattern()
    })

    ELEMENTS.encodeButton.addEventListener("click", encode)
    ELEMENTS.playButton.addEventListener("click", visualizer.play.bind(visualizer))
    ELEMENTS.pauseButton.addEventListener("click", visualizer.pause.bind(visualizer))
    ELEMENTS.resetButton.addEventListener("click", visualizer.reset.bind(visualizer))
    ELEMENTS.vibrateButton.addEventListener("click", visualizer.vibrate.bind(visualizer))

    ELEMENTS.encodeButton.click()
}

window.addEventListener("load", main)
const visualizationCanvas = document.getElementById("visualization")
visualizationCanvas.width = visualizationCanvas.clientWidth
visualizationCanvas.height = visualizationCanvas.clientHeight
const context = visualizationCanvas.getContext("2d")

const textInput = document.getElementById("huge-input")

function randomChoice(lst) {
    return lst[Math.floor(Math.random() * lst.length)]
}

let barWidth = 20

function drawRoundedRect(x, y, width, height, radius=10) {
    radius = Math.min(radius, width / 2, height / 2)
    context.beginPath()
    context.moveTo(x + radius, y)
    context.lineTo(x + width - radius, y)
    context.quadraticCurveTo(x + width, y, x + width, y + radius)
    context.lineTo(x + width, y + height - radius)
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    context.lineTo(x + radius, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - radius)
    context.lineTo(x, y + radius)
    context.quadraticCurveTo(x, y, x + radius, y)
    context.closePath()
    context.fill()
}

function bezier(t) {
    return t * t * (3 - 2 * t);
}

class VibrationBar {

    constructor(x, height, delay=0) {
        this.x = x
        this.width = barWidth
        this.maxHeight = height
        this.createTime = Date.now()
        this.animationDelay = delay
        this.animationLength = 1000

        this.color = randomChoice([
            "#5599ff",
            "#80b3ff",
            "#aaccff"
        ])

        this.animationEndedTime = null
    }

    remove() {
        if (this.animationEndedTime === null)
            this.animationEndedTime = Date.now()
    }

    get t() {
        if (this.animationEndedTime !== null) {
            let timeSinceEnd = Date.now() - this.animationEndedTime
            return bezier(Math.max(0, 1 - timeSinceEnd / this.animationLength))
        }

        let timeSinceCreation = Date.now() - this.createTime
        if (timeSinceCreation < this.animationDelay)
            return 0
        else if (timeSinceCreation < this.animationDelay + this.animationLength)
            return bezier((timeSinceCreation - this.animationDelay) / this.animationLength)
        else
            return 1
    }

    get height() {
        return this.maxHeight * this.t
    }

    get y() {
        let middleY = visualizationCanvas.height / 2
        return middleY - this.height / 2
    }

    draw() {
        if (this.height == 0)
            return
        context.fillStyle = this.color
        drawRoundedRect(this.x, this.y, this.width, this.height)
    }

    get readyToRemove() {
        return this.animationEndedTime !== null && this.t === 0
    }

}

let bars = []

async function generate() {
    for (let i = 0; i < bars.length; i++) {
        bars[i].remove()
    }

    let pattern = generatePattern(textInput.value)

    let numBars = pattern.length
    barWidth = visualizationCanvas.width / (numBars + 2)  
    for (let i = 0; i < pattern.length; i++) {
        let isPause = i % 2 === 1
        let correctedIndex = i - numBars / 2
        let middleOffsetX = barWidth * correctedIndex
        let middleX = visualizationCanvas.width / 2
        let bar = new VibrationBar(middleX + middleOffsetX, pattern[i], i * 10)
        if (isPause) bar.color = "#eee"
        bars.push(bar)
    }
}

let activeTimeout = null

textInput.oninput = function(event) {
    if (activeTimeout !== null)
        clearTimeout(activeTimeout)
    activeTimeout = setTimeout(generate, 1000)
}

visualizationCanvas.onclick = function(event) {
    if (textInput.value === "") return
    vibrate(generatePattern(textInput.value))
}

function update() {
    context.clearRect(0, 0, visualizationCanvas.width, visualizationCanvas.height)

    for (let i = bars.length - 1; i >= 0; i--)
        bars[i].draw()

    bars = bars.filter(bar => !bar.readyToRemove)

    window.requestAnimationFrame(update)
}

update()
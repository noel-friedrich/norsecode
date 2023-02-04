class EncodedLetter {

    constructor(pattern, repeats=1) {
        this.shortPattern = Array.isArray(pattern) ? pattern : [pattern]
        this.pattern = arrRepeat(this.shortPattern, repeats)

        // Remove the last pause as it is added by the EncodedString
        this.pattern[this.pattern.length - 1] = 0
    }

    get lengthMs() {
        return this.pattern.reduce((a, b) => a + b, 0)
    }

    get intensity() {
        return this.shortPattern.reduce((a, b) => a + b) / this.shortPattern.length
    }

}

const EncodedLetters = {
    "a": [[100, 20], 3],
    "b": [[30, 10], 10],
    "c": [[100, 100, 100, 200, 100, 200, 100, 50]],
    "d": [[60, 30], 8],
    "e": [[100, 0]],
    "f": [[300, 100, 100, 100], 4],
    "g": [[300, 30, 300, 100, 80, 10]],
    "h": [[500, 100, 300, 100, 100, 100]],
    "i": [[50, 50], 5],
    "j": [[100, 100, 400, 100, 100, 100, 100, 100]],
    "k": [[50, 50, 50, 50, 300, 50], 2],
    "l": [[100, 100, 600, 100, 100, 100]],
    "m": [[200, 2], 6],
    "n": [[300, 0]],
    "o": [[150, 100], 3],
    "p": [[500, 0]],
    "q": [[100, 100, 300, 100, 300, 100, 300, 100]],
    "r": [[100, 100, 300, 100, 500, 100]],
    "s": [[500, 100], 3],
    "t": [[80, 100], 2],
    "u": [[600, 100, 100, 100, 600, 100]],
    "v": [[300, 100, 200, 100, 100, 100], 2],
    "w": [[30, 30], 7],
    "x": [[300, 100, 300, 100, 300, 100, 100, 100]],
    "y": [[100, 100, 100, 100, 400, 100, 100, 100]],
    "z": [[50, 10], 10],
    " ": [[0, 1000]],
    "unknown": [[5, 5], 10],
}

for (let letter in EncodedLetters) {
    EncodedLetters[letter] = new EncodedLetter(...EncodedLetters[letter])
}

class EncodedString {

    constructor(rawText) {
        this.pauseMs = 300
        this.rawText = rawText
        this.encodedLetters = []
        for (let char of rawText) {
            let letter = char.toLowerCase()
            if (letter in EncodedLetters)
                this.encodedLetters.push(EncodedLetters[letter])
            else
                this.encodedLetters.push(EncodedLetters["unknown"])
        }
    }

    get pattern() {
        let pattern = []
        for (let letter of this.encodedLetters) {
            let tempPattern = [...letter.pattern]
            tempPattern[tempPattern.length - 1] += this.pauseMs
            pattern = pattern.concat(tempPattern)
        }
        return pattern
    }

    get lengthMs() {
        return this.pattern.reduce((a, b) => a + b, 0)
    }

    async vibrate() {
        await vibrate(this.pattern)
    }

}

function norseEncode(text) {
    return new EncodedString(text)
}
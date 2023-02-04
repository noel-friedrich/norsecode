class Bits {

    constructor(length) {
        this.data = Array(length).fill(0)
        this.stepMs = 100
    }

    concat(bits, inplace=true) {
        if (inplace) {
            this.data = this.data.concat(bits.data)
            return this
        }
        let newBits = new Bits(this.length + bits.length)
        newBits.data = this.data.concat(bits.data)
        return newBits
    }

    push(bit) {
        return this.data.push(bit)
    }

    pop() {
        return this.data.pop()
    }

    get length() {
        return this.data.length
    }

    get(index) {
        return this.data[index] ?? 0
    }

    set(index, bit) {
        return this.data[index] = bit
    }

    toString() {
        return this.data.join('')
    }

    get pattern() {
        let pattern = []
        for (let i = 0; i < this.length; i++) {
            if (this.get(i) === 0)
                pattern.push(...[20, 200])
            else
                pattern.push(...[200, 20])
        }
        return pattern
    }

    get combinedPattern() {
        let duration = 0
        let currItem = 1
        let pattern = []

        for (let i = 0; i < this.length; i++) {
            if (this.get(i) === currItem) {
                duration += this.stepMs
            } else {
                pattern.push(duration)
                currItem = this.get(i)
                duration = this.stepMs
            }
        }

        if (duration > 0)
            pattern.push(duration)

        if (pattern.length % 2 === 1)
            pattern.push(0)

        return pattern
    }

    static fromString(str) {
        let alphabet = " abcdefghijklmnopqrstuvwxyz"
        let bits = new Bits(str.length * 5)
        for (let i = 0; i < str.length; i++) {
            let char = str[i].toLowerCase()
            let index = alphabet.indexOf(char)
            if (index !== -1) {
                let bitString = index.toString(2)
                for (let j = 0; j < bitString.length; j++) {
                    bits.set((i + 1) * 5 - (j + 1), bitString[bitString.length - (j + 1)])
                }
            }
        }
        return bits
    }

    norse() {
        return norse(this)
    }

}

function norse(bits) {
    const combineBits = (a, b) => a ^ b
    let newBits = new Bits(Math.ceil(bits.length / 2))
    for (let i = 0; i < bits.length; i += 2) {
        newBits.set(i / 2, combineBits(bits.get(i), bits.get(i + 1)))
    }
    return newBits
}

function generatePattern(str, {pauseMs=1000}={}) {
    let words = str.split(" ")
    let pattern = []
    for (let i = 0; i < words.length; i++) {
        let bits = Bits.fromString(words[i]).norse()
        pattern.push(...bits.pattern)
        if (i !== words.length - 1)
            pattern.push(...[0, pauseMs])
    }
    return pattern
}

function norseTable(string) {
    const translationTable = {
        "a": "01", "b": "0001", "c": "100", "d": "010",
        "e": "0", "f": "0100", "g": "0000", "h": "110",
        "i": "00", "j": "1000", "k": "0011", "l": "101",
        "m": "111", "n": "1", "o": "000", "p": "0101",
        "q": "1011", "r": "001", "s": "10", "t": "11",
        "u": "011", "v": "0111", "w": "0010", "x": "1010",
        "y": "1001", "z": "0110"
    }

    const morse1 = [300, 100]
    const morse0 = [100, 300]
    const pause = [0, 500]
    const wordPause = [0, 1000]

    let pattern = []

    for (let char of string) {
        if (translationTable[char] !== undefined) {
            let binary = translationTable[char]
            for (let bit of binary) {
                if (bit === "1") {
                    pattern.push(...morse1)
                } else {
                    pattern.push(...morse0)
                }
                pattern.push(...pause)
            }
        } else if (char === " ") {
            pattern.push(...wordPause)
        }
    }

    return pattern
}
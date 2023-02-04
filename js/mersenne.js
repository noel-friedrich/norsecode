class RandomGenerator {

    constructor(seed) {
        this.seed = seed
    }

    async sha256(message) {
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(message);                    
    
        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    
        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));
    
        // convert bytes to hex string                  
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async random() {
        let hexHash = await this.sha256(this.seed)
        hexHash = hexHash.slice(0, 6)
        let number = parseInt(hexHash, 16)
        this.seed += "0"
        return number / 16777215
    }

    async randomMax(max) {
        let hexHash = await this.sha256(this.seed)
        hexHash = hexHash.slice(0, 6)
        let number = parseInt(hexHash, 16)
        this.seed += "0"
        return number % max
    }

}
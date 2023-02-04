async function _loadScript(url, reload=false) {
    let script = document.createElement("script")
    if (reload === true)
        url += "?t=" + Date.now()
    script.src = url
    document.body.appendChild(script)
    return new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
    })
}

async function vibrate(pattern, {log=true}={}) {
    if (!window.navigator || !window.navigator.vibrate)
        throw new Error("Vibration API not supported")
    window.navigator.vibrate(pattern)
    if (log) console.log("Vibrating", pattern)
    let patternMs = pattern.reduce((a, b) => a + b)
    await new Promise(resolve => setTimeout(resolve, patternMs))
}

function arrRepeat(arr, n) {
    let result = []
    for (let i = 0; i < n; i++)
        result.push(...arr)
    return result
}
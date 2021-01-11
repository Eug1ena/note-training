VF = Vex.Flow;

const div = document.querySelector("#note");
let renderer, context, stave;

function init(clef) {
    div.innerHTML = "";

    renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(200, 300);

    context = renderer.getContext();
    context.setViewBox(15, 55, 100, 100);

    stave = new VF.Stave(30, 30, 70);
    stave.addClef(clef);
    stave.setContext(context).draw();
}

function draw(clef, sound, noteType = 4) {
    const notes = [
        new VF.StaveNote({ clef: clef, keys: sound, duration: noteType.toString(), auto_stem: true })
    ];

    const voices = [
        new VF.Voice({num_beats: 1, beat_value: noteType}).addTickables(notes)
    ];

    const formatter = new VF.Formatter().joinVoices(voices).format(voices, 400);

    voices.forEach( (v) => v.draw(context, stave) );
}

// based on https://github.com/0xfe/vexflow/wiki/The-VexFlow-Tutorial

// 0を足してるのは-0を避けるため
function mod(i, j) {
    return (i % j) < 0 ? (i % j) + 0 + (j < 0 ? -j : j) : (i % j + 0);
}
function division(i, j) {
    return (i - mod(i, j)) / j;
}

// pitchはC4を基準(0)とした数値を指定。音を"c/4"のような形で返す。形はオプションで変更可能。
function getNote(pitch, issharp = true, isupper = false, isslash = true, isflatb = true) {
    const quotient = division(pitch, 12);
    const remainder = mod(pitch, 12);

    let key, symbol;
    if(issharp){
        key = ["c", "c", "d", "d", "e", "f", "f", "g", "g", "a", "a", "b"][remainder];
        symbol = ["", "#", "", "#", "", "", "#", "", "#", "", "#", ""][remainder];
    }else{
        key = ["c", "d", "d", "e", "e", "f", "g", "g", "a", "a", "b", "b"][remainder];
        symbol = ["", "b", "", "b", "", "", "b", "", "b", "", "b", ""][remainder];
    }
    if(isupper){
        key = key.toUpperCase();
    }
    if(!isflatb && symbol === "b"){
        symbol = "♭";
    }

    if(isslash){
        return key + symbol + "/" + (quotient + 4);
    }else{
        return key + symbol + (quotient + 4);
    }
}

const keys = {
    "treble": ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5", "a/5"],
    "alto": ["d/3", "e/3", "f/3", "g/3", "a/3", "b/3", "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4"],
    "bass": ["e/2", "f/2", "g/2", "a/2", "b/2", "c/3", "d/3", "e/3", "f/3", "g/3", "a/3", "b/3", "c/4"],
}

function setLimitSelectBox(from, to, select1 = null, select2 = null) {
    if(select1 === null) select1 = from;
    if(select2 === null) select2 = to;
    const lowerLimitBox = document.querySelector("#note-lower-limit");
    const upperLimitBox = document.querySelector("#note-upper-limit");
    lowerLimitBox.innerHTML = "";
    upperLimitBox.innerHTML = "";

    for(let i = from; i <= to; i++) {
        if(mod(i, 12) === 1 || mod(i, 12) === 3 || mod(i, 12) === 6 || mod(i, 12) === 8 || mod(i, 12) === 10){
            continue;
        }
        const elem = document.createElement("option");
        elem.innerText = getNote(i, true, true, false, false);
        elem.value = i;

        const elem2 = elem.cloneNode(true);
        lowerLimitBox.appendChild(elem);
        upperLimitBox.appendChild(elem2);

        elem.classList.add("note-lower-option");
        elem2.classList.add("note-upper-option");
    }
    document.querySelector(`.note-lower-option[value='${select1}']`).setAttribute("selected", "selected");
    document.querySelector(`.note-upper-option[value='${select2}']`).setAttribute("selected", "selected");
}

setLimitSelectBox(-7, 28, 0, 21);

document.querySelectorAll("input[name='clef']").forEach( (elem) => {
    elem.addEventListener("change", (e) => {
        const pitchRange = document.querySelector("#pitch-range");

        const clef = e.target.value;
        if(clef === "treble"){
            setLimitSelectBox(-7, 28, 0, 21);
        }else if(clef === "bass"){
            setLimitSelectBox(-27, 7, -20, 0);
        }else if(clef === "alto"){
            setLimitSelectBox(-17, 17, -10, 11);
        }
    });
});

function random(n) { // 区間[0, n)内
    return Math.floor(Math.random() * n);
}
function randomR(l, r) { // 区間[l, r]内
    return random(r - l + 1) + l;
}

function chooseRandomPitch(from, to, exceptAccidental = true) {
    if(exceptAccidental){
        if(from === to && (mod(from, 12) === 1 || mod(from, 12) === 3 || mod(from, 12) === 6 || mod(from, 12) === 8 || mod(from, 12) === 10)){
            return;
        }
        let ret = randomR(from, to);
        while(mod(ret, 12) === 1 || mod(ret, 12) === 3 || mod(ret, 12) === 6 || mod(ret, 12) === 8 || mod(ret, 12) === 10){
            ret = randomR(from, to);
        }
        return ret;
    }else{
        return randomR(from, to);
    }
}

const stopRepeatButton = document.querySelector("#stop-repeat-button");
let intervalID = null;

function show() {
    if(intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
    stopRepeatButton.style.display = "none";

    const clef = document.querySelector("input[name='clef']:checked").value;
    const from = parseInt(document.querySelector("#note-lower-limit").value);
    const to = parseInt(document.querySelector("#note-upper-limit").value);
    if(from > to){
        div.innerHTML = "範囲が不適当です！";
        return;
    }
    const noteType = parseInt(document.querySelector("input[name='note-type']:checked").value);

    init(clef);
    draw(clef, [getNote(chooseRandomPitch(from, to), true, false, true, true)], noteType);
}

function repeat() {
    if(intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
    stopRepeatButton.style.display = "inline-block";

    const clef = document.querySelector("input[name='clef']:checked").value;
    const from = parseInt(document.querySelector("#note-lower-limit").value);
    const to = parseInt(document.querySelector("#note-upper-limit").value);
    if(from > to){
        div.innerHTML = "範囲が不適当です！";
        return;
    }
    const noteType = parseInt(document.querySelector("input[name='note-type']:checked").value);

    const f = () => {
        init(clef);
        draw(clef, [getNote(chooseRandomPitch(from, to), true, false, true, true)], noteType);
    };

    const interval = parseFloat(document.querySelector("#repeat-interval").value) * 1000;

    f();
    intervalID = setInterval(f, interval);
}

function stopRepeat() {
    if(intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
    stopRepeatButton.style.display = "none";

    div.innerHTML = "";
}

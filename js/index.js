var constainer_count = 0;
var token = localStorage.getItem("token");

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById("token").textContent += localStorage.getItem("token");
    // Attempt to get data from PlayTime.json
    let request = axios.get('data/'+String(token)+'/PlayTime.json').catch(function() {
        fakeresponse = {"data": {"000000 Nom Artist - Titre map": {"difficulties": {"Example de difficulté": 447000}}}}
        showFirstElement(fakeresponse)
    })

    // if succeed, then execute showFirstElement function
    request.then(showFirstElement);

    initEditor = true;
    // Attempt to get data from Editor.json
    request = axios.get('data/'+String(token)+'/Editor.json').catch(function() {
        fakeresponse = {"data": {"000000 Nom Artist - Titre map": {"difficulties": {"Example de difficulté": 447000}}}}
        showFirstElement(fakeresponse)
    })

    // if succeed, then execute showFirstElement function
    request.then(showFirstElement);

})

function showFirstElement(response) {
    
    let data = response["data"];
    firstElementName = Object.keys(data)[0];

    if (Object.keys(data).length != 0) {
        createChild(firstElementName, data);
    } else {
        data = {"000000 Nom Artist - Titre map": {"difficulties": {"Example de difficulté": 447000}}};
        firstElementName = Object.keys(data)[0];

        createChild(firstElementName, data);
    }
}

function createChild(ElementName, data) {
    
    var beatmap_container = document.querySelectorAll(".beatmap")[constainer_count]
    if (ElementName == "000000 Nom Artist - Titre map") {
        beatmap_container.style.backgroundColor = "lightgrey"
    } else {
        beatmap_container.style.backgroundImage = "url('./bg/"+firstElementName+"/bg.jpg')"
    }

    let mapTitleAndTime = document.createElement("p");
    mapTitleAndTime.appendChild(document.createTextNode(ElementName));

    beatmap_container.addEventListener("click", function() {
        if (this.querySelector("div").style.display == "none") {
            this.querySelector("div").style.display = "flex"
        } else {
            this.querySelector("div").style.display = "none"
        }
    })

    let totalTimePlayedContainer = document.createElement("span");
    var totalTimePlayed = 0;

    Object.keys(data[firstElementName]["difficulties"]).forEach(function(key) {
        totalTimePlayed += data[firstElementName]["difficulties"][key];
    })

    if (constainer_count == 0) {
        totalTimePlayedContainer.appendChild(document.createTextNode("Total Time Played: "+ msToTime(totalTimePlayed)));
    }
    if (constainer_count == 1) {
        totalTimePlayedContainer.appendChild(document.createTextNode("Total Time Edited: "+ msToTime(totalTimePlayed)));
    }

    mapTitleAndTime.appendChild(totalTimePlayedContainer);
    beatmap_container.appendChild(mapTitleAndTime);

    // create a div containing all the diff
    var diffList = document.createElement("div");
    diffList.classList.add("diff_list")

    // for each diff in the map, execute the next lines
    Object.keys(data[ElementName]["difficulties"]).forEach(function(key) {
        var diff_container = document.createElement("div");

        let diffTitleAndTime = document.createElement("p");
        diffTitleAndTime.appendChild(document.createTextNode(key));

        let TimePlayedContainer = document.createElement("span");

        if (constainer_count == 0) {
            TimePlayedContainer.appendChild(document.createTextNode("Time played: "+ msToTime(data[ElementName]["difficulties"][key])));
            initPlayTime = false;
        }
        if (constainer_count == 1) {
            TimePlayedContainer.appendChild(document.createTextNode("Time Edited: "+ msToTime(data[ElementName]["difficulties"][key])));
            initEditor = false;
        }

        diffTitleAndTime.appendChild(TimePlayedContainer);
        diff_container.appendChild(diffTitleAndTime);
        diffList.append(diff_container);
    })
    beatmap_container.appendChild(diffList)

    document.querySelectorAll(".diff_list").forEach(function(item) {
        item.style.display = "none"
    })
    constainer_count++
}

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100);
        seconds = Math.floor((duration / 1000) % 60);
        minutes = Math.floor((duration / (1000 * 60)) % 60);
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
        hours = (hours < 10) ? "0" + hours : hours;

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function showError(error) {
    console.log(error)
}
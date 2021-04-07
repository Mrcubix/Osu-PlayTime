document.addEventListener('DOMContentLoaded', function () {
    var requests = new XMLHttpRequest();
    var file = "log.json";
    var setting_menu_state = false;
    // hide the menu
    document.getElementsByClassName("settings_menu")[0].hidden = true;
    // hide the menu if the close button inside is clicked
    document.getElementsByClassName("settings_menu")[0].querySelector("button").addEventListener("click", function() {
        document.getElementsByClassName("settings_menu")[0].hidden = true;
        setting_menu_state = false;
    });
    
    // create new key in storage if it doesn't exist
    if (localStorage.getItem("diff_search") == undefined) {
        localStorage.setItem("diff_search", "")
    }

    if (localStorage.getItem("sort_setting") == undefined) {
        localStorage.setItem("sort_setting", "default")
    }

    // set the checkbox state to one stored in localStorage
    document.getElementById("diff_search_box").checked = Boolean(localStorage.getItem("diff_search"));
    // If the box state (checked of not) change, then set the new state in localStorage
    document.getElementById("diff_search_box").addEventListener("change", function() {
        setCheckBoxState(this)
    });

    // set the select dropdown state to the value stored in localStorage
    document.getElementById("sort_setting_select").value = localStorage.getItem("sort_setting")
    // If the dropdown option selected change, then store the new state in localStorage
    document.getElementById("sort_setting_select").addEventListener("change", function() {
        setSortSettingState(this)
    });

    // If the search setting icon is clicked, then set the menu state accordingly to the situation
    document.getElementsByClassName("search_settings")[0].addEventListener("click", function() {
        if (!setting_menu_state) { // if the state is false, then set the state to true and set the hidden css attribute to false
            document.getElementsByClassName("settings_menu")[0].hidden=false;
            setting_menu_state = true;
        } else { // if the state is true, then set the state to false and set the hidden css attribute to true
            setting_menu_state = false;
            document.getElementsByClassName("settings_menu")[0].hidden = true;
        }
    })

    requests.onreadystatechange = function() {
        // check the response code to make sure it's OK
        if (this.readyState == 4 && this.status == 200) {
            // Parse the data obtained from the request
            data = JSON.parse(this.responseText);
            // Place the maps in the webpage
            show_result(search_map("", data));
            var sort = false
            last_maps_matched = new Map();
            // on input in search bar, exucute the code contained inside
            document.getElementsByClassName("search_bar")[0].addEventListener("input", function() {
                // look for the maps that contain the specified string
                var maps_matched = search_map(this.value, data);
                console.log(maps_matched)
                console.log(last_maps_matched)
                // generate a new report if the maps found are the same as before
                if (!areEquals(maps_matched, last_maps_matched)) {
                    show_result(maps_matched);
                    last_maps_matched = maps_matched
                }
            });

        }
    };

    // Send the request
    requests.open("GET", file, true);
    requests.send();
    
});

function search_map(string, data) {
    
    var data = new Map(Object.entries(data));
    
    Array.from(data.keys()).forEach(function(item) {
        let temp = new Map(Object.entries(data.get(item)))
        data.set(item, temp)
        temp = new Map(Object.entries(data.get(item).get("difficulties")))
        data.get(item).set("difficulties", temp) 
    });

    data.forEach(function(value, map) {
        if (!(map.toLowerCase().indexOf(string.toLowerCase()) >=0)) {
            if (document.getElementById("diff_search_box").checked) {
                Array.from(data.get(map).get("difficulties").keys()).forEach(function(diff) {
                    if (!(diff.toLowerCase().indexOf(string) >= 0)) {
                       data.get(map).get("difficulties").delete(diff)
                    }
                })
                if (Array.from(data.get(map).get("difficulties").keys()).length == 0) {
                    data.delete(map)
                }
            } else {
                data.delete(map)
            }   
        }
    })
    return data
}

function show_result(data) {
    
    while (document.querySelector("header").nextElementSibling){
        document.querySelector("header").nextElementSibling.remove();
        console.log("removed")
    }

    data.forEach(function(value, map) {
        createChild(map, data)
    })

}

function createChild(map, data) {
    var body = document.querySelector("body");
    // create a section for each map
    let beatmap = document.createElement("section");
    beatmap.classList.add("beatmap");
    // set their background to the map background
    beatmap.setAttribute("style", "background-image: url('./bg/"+map+"/bg.jpg');")
    // set value to false for initialisation state of the menu
    beatmap.setAttribute("value", false)
    
    beatmap.addEventListener("click", function() {
        if (this.getAttribute("value") == "false") {
            // create a div containing all the diff
            var diff_list = document.createElement("div");
            diff_list.style.backgroundColor="rgba(0,0,0,0.4)";

            // for each diff in the map, execute the next lines
            data.get(this.querySelector("p").innerHTML.split("<span>")[0]).get("difficulties").forEach(function(time,diff) {
                var diff_container = createDiff(map, diff, data)
                diff_list.append(diff_container);
            })
            this.setAttribute("value", true);
            beatmap.appendChild(diff_list)
        } else {
            this.removeChild(this.querySelector("div"));
            this.setAttribute("value", false);
        }
    })

    beatmap.addEventListener("mouseenter", function() {
        this.querySelector("p").style.backgroundColor="rgba(0,0,0,0.4)";
        if (this.querySelector("div")){
            this.querySelector("div").style.backgroundColor="rgba(0,0,0,0.4)";
        }
    });
    beatmap.addEventListener("mouseleave", function() {
        this.querySelector("p").style.backgroundColor="";
        if (this.querySelector("div")){
            this.querySelector("div").style.backgroundColor="";
        }
    });
    var map_text = document.createElement("p");

    var map_name = document.createTextNode(map);
    map_text.appendChild(map_name);

    var total_time_played_node = document.createElement("span");
    var total_time_played = 0;
    
    data.get(map).get("difficulties").forEach(function(time, diff) {
        total_time_played += time
    })

    var total_played_text = document.createTextNode("Total time played: "+msToTime(total_time_played));

    total_time_played_node.appendChild(total_played_text);
    
    map_text.appendChild(total_time_played_node)
    
    beatmap.appendChild(map_text);

    body.appendChild(beatmap);

}

function createDiff(map, diff, data) {
    // create a div for the diff
    var diff_container = document.createElement("div");
                    
    // create a paragraph for diff name
    var diff_text_node = document.createElement("p"); 
    diff_text_node.innerHTML = diff 
    // Current: 
    // <p> diff </p>

    // create a span for the time played in diff
    var diff_node = document.createElement("span");

    // create a text node containing the time played
    var time = document.createTextNode("Time played: "+msToTime(data.get(map).get("difficulties").get(diff)));
    // create the tag p
    var diff_time_played = document.createElement("p");

    // append the time played to the previously created tag p
    diff_time_played.appendChild(time);
    // append the span "diff_node" the time played
    diff_node.appendChild(diff_time_played);

    // append to the difficulty container, the difficulty name and the time played
    diff_container.appendChild(diff_text_node);
    // Current:
    // <div>
    //     <p> diff
    //         <span> Time played: + time </span>
    //     </p>
    // </div>
    diff_container.appendChild(diff_node)

    return diff_container
}

function setCheckBoxState(checkbox){
    if (checkbox.checked){
        localStorage.setItem("diff_search", true)
        var maps_matched = search_map(document.getElementsByClassName("search_bar")[0].value, data);
        if (areEquals(maps_matched, last_maps_matched)) {
            string = document.getElementsByClassName("search_bar")[0].value.toLowerCase();
            if (document.getElementById("diff_search_box").checked){
                show_result(maps_matched);
                last_maps_matched = maps_matched
            } else {
                show_result(maps_matched);
                last_maps_matched = maps_matched
            }
        }
    } else {
        localStorage.setItem("diff_search", "")
    }
}

function setSortSettingState(selected) {
    if (selected.value == "default") {
        localStorage.setItem("sort_setting", "default")
    }
    if (selected.value == "time") {
        localStorage.setItem("sort_setting", "time")
    }
    if (selected.value == "alpha") {
        localStorage.setItem("sort_setting", "alpha")
    }
}

function areEquals(firstMap, secondMap) {
    if (typeof(firstMap) != typeof(secondMap)) {
        return false
    }
    if (Array.from(firstMap.keys()).length != Array.from(secondMap.keys()).length) {
        return false
    }
    firstMap.forEach(function(value,map) {
        if (!secondMap.get(map)) {
            return false
        }
        if (Array.from(firstMap.get(map).get("difficulties").keys()).length != Array.from(secondMap.get(map).get("difficulties")).keys().length) {
            console.log("case 3")
            return false
        }
        Array.from(firstMap.get(map).get("difficulties").keys()).forEach(function(diff) {
            if (!secondMap.get(map).get("difficulties").get(diff)) {
                console.log("case 4")
                return false
            }
        })
    })
    console.log("case 5")
    return true
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
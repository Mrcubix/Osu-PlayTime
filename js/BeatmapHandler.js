//var maps_matched;
var last_maps_matched;
var data;
var nextMode;
var token = localStorage.getItem("token");

document.addEventListener('DOMContentLoaded', async function () {

    var setting_menu_state = false;

    document.getElementsByClassName("settings_menu")[0].querySelector("button").addEventListener("click", function() {
        alert("Your token is: "+localStorage.getItem("token")+"\n"+"(Copied to your clipboard)")

        let tokenToCopy = document.createElement("textarea");
        tokenToCopy.classList.add("tokenarea");
        tokenToCopy.appendChild(document.createTextNode(localStorage.getItem("token")));
        document.querySelector("body").appendChild(tokenToCopy);
        let old_scroll = document.documentElement.scrollTop
        tokenToCopy.focus();
        tokenToCopy.select();
        
        try{
            document.execCommand('copy');
            document.getElementsByClassName("tokenarea")[0].remove()
            scroll(0,old_scroll)
        } catch(err) {
            console.log(err)
        }

    })
    // hide the menu
    document.getElementsByClassName("settings_menu")[0].hidden = true;
    // hide the menu if the close button inside is clicked
    document.getElementsByClassName("settings_menu")[0].querySelectorAll("button")[1].addEventListener("click", function() {
        document.getElementsByClassName("settings_menu")[0].hidden = true;
        setting_menu_state = false;
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

    // create new key in storage if it doesn't exist
    if (localStorage.getItem("diff_search") == undefined) {
        localStorage.setItem("diff_search", "")
    }

    if (localStorage.getItem("sort_method") == undefined) {
        localStorage.setItem("sort_method", "default")
    }

    if (localStorage.getItem("sort_dir") == undefined) {
        localStorage.setItem("sort_dir", "Dsc")
    }

    if (localStorage.getItem("hand") == undefined) {
        localStorage.setItem("hand", "right")
    }

    if (localStorage.getItem("MultiPlayer") == undefined) {
        localStorage.setItem("MultiPlayer", "")
    }

    // set the checkbox state to one stored in localStorage
    document.getElementById("diff_search_box").checked = Boolean(localStorage.getItem("diff_search"));
    // If the box state (checked of not) change, then set the new state in localStorage
    document.getElementById("diff_search_box").addEventListener("change", function() {
        setCheckBoxState(this)

        // look for the maps that contain the specified string
        maps_matched = search_map(document.getElementsByClassName("search_bar")[0].value, new Map(data));
        // generate a new report if the maps found are the same as before
        show_result(maps_matched);
        last_maps_matched = new Map(maps_matched);
    });

    // set the select dropdown state to the value stored in localStorage
    document.getElementById("sort_method_dropdown").value = localStorage.getItem("sort_method")
    // If the dropdown option selected change, then store the new state in localStorage
    document.getElementById("sort_method_dropdown").addEventListener("change", function() {
        setSortmethodState(this)
        
        if (this.value == "default") {
            maps_matched = search_map(document.getElementsByClassName("search_bar")[0].value, new Map(data));
        }
        
        maps_matched = SortElements(new Map(maps_matched));
        show_result(maps_matched, true);
        last_maps_matched = new Map(maps_matched);
    });

    document.getElementById("sort_dir_dropdown").value = localStorage.getItem("sort_dir")
    // If the dropdown option selected change, then store the new state in localStorage
    document.getElementById("sort_dir_dropdown").addEventListener("change", function() {
        setSortdirState(this)
        
        if (document.getElementById("sort_method_dropdown").value == "default") {
            maps_matched = search_map(document.getElementsByClassName("search_bar")[0].value, data);
        }

        maps_matched = SortElements(new Map(maps_matched));
        show_result(maps_matched, true);
        last_maps_matched = new Map(maps_matched);
    });

    document.getElementById("hand").value = localStorage.getItem("hand")
    setMenuState(document.getElementById("hand"))
    // If the dropdown option selected change, then store the new state in localStorage
    document.getElementById("hand").addEventListener("change", function() {
        setHandState(this)
    })

    // set the checkbox state to one stored in localStorage
    document.getElementById("multiplayer_checkbox").checked = Boolean(localStorage.getItem("MultiPlayer"));
    // If the box state (checked of not) change, then set the new state in localStorage
    document.getElementById("multiplayer_checkbox").addEventListener("change", async function() {
        setMultiplayerState(this)

        data = await setdata()

        // Sort the Array using the user settings
        maps_matched = SortElements(new Map(data));
        show_result(maps_matched, true);
        last_maps_matched = new Map(maps_matched);
    });

    data = await setdata()

    // Sort the Array using the user settings
    maps_matched = SortElements(new Map(data));
    show_result(maps_matched, true);
    last_maps_matched = new Map(maps_matched);
    

    // on input in search bar, exucute the code contained inside
    document.getElementsByClassName("search_bar")[0].addEventListener("input", function() {
        // look for the maps that contain the specified string
        maps_matched = search_map(this.value, new Map(data));
        // generate a new report if the maps found are the same as before
        if (!areEquals(maps_matched, last_maps_matched)) {
            show_result(maps_matched);
            last_maps_matched = new Map(maps_matched);
        }
    });
})

async function setdata() {
    var data;
    if (!document.getElementById("multiplayer_checkbox").checked) {
        let header_links = document.getElementsByClassName("navigation_menu")[0].querySelectorAll("a");
        nextMode = header_links[header_links.length - 1].textContent.replace(/\s/g,"");
        if (nextMode == "Editor") {
            var request = axios.get('data/'+String(token)+'/PlayTime.json')
        } else {
            var request = axios.get('data/'+String(token)+'/Editor.json')
        }
        
        // if succeed, then execute showFirstElement function
        await request.then(function(response) {
            data = response["data"]

            // Convert object to map in order to sort it and remove elements at will easily
            data = new Map(Object.entries(data))

            // loop throught all keys of map to convert the value of these keys in map_data
            // do the same for sub maps
            Array.from(data.keys()).forEach(function(item) {
                let temp = new Map(Object.entries(data.get(item)))
                data.set(item, temp)
                temp = new Map(Object.entries(data.get(item).get("difficulties")))
                data.get(item).set("difficulties", temp) 
            });
        })
        return data
    } else {

        
        var new_data = new Map()

        let header_links = document.getElementsByClassName("navigation_menu")[0].querySelectorAll("a");
        nextMode = header_links[header_links.length - 1].textContent.replace(/\s/g,"");
        var request_tokens = axios.get("data");
        await request_tokens.then(async function(folder) {
            var parser = new DOMParser();

            // Workaround for different http servers
            var token_list = new Array()
            var folder_list = Array.from(parser.parseFromString(folder["data"],'text/html').querySelectorAll("a"))
            folder_list.forEach(function(item){
                if (!isNaN(item.textContent.split("/")[0])) {
                    token_list.push(item)
                    console.log(token_list)
                }
            })

            for (let i = 0; i != token_list.length; i++) {
                item = token_list[i]
                var request;
                if (nextMode == "Editor") {
                    request = axios.get('data/'+item.textContent+'/PlayTime.json')
                } else {
                    request = axios.get('data/'+item.textContent+'/Editor.json')
                }
                await request.then(function(response) {
                    var map_data = response["data"]
                    
                    map_data = new Map(Object.entries(map_data))

                    // loop throught all keys of map to convert the value of these keys in map_data
                    // do the same for sub maps
                    Array.from(map_data.keys()).forEach(function(item) {
                        let temp = new Map(Object.entries(map_data.get(item)))
                        map_data.set(item, temp)
                        temp = new Map(Object.entries(map_data.get(item).get("difficulties")))
                        map_data.get(item).set("difficulties", temp) 
                    });
                    
                    map_data.forEach(function(value, map) {
                        if (new_data.get(map)) {
                            map_data.get(map).get("difficulties").forEach(function(value, diff) {
                                if (new_data.get(map).get("difficulties").get(diff)) {
                                    new_data.get(map).get("difficulties").set(diff, new_data.get(map).get("difficulties").get(diff) + map_data.get(map).get("difficulties").get(diff))
                                } else {
                                    new_data.get(map).get("difficulties").set(diff, map_data.get(map).get("difficulties").get(diff))
                                }
                            })
                        } else {
                            new_data.set(map, map_data.get(map))
                        }
                    })
                })
            }
        })
        return new_data
    }
}

function search_map(string, map_data) {
    //
    //  loop throught all the maps in map_data to find the specified string
    //  if the string is found, then we go to the next one
    //  else, we check if the "search diddiculty" box is checked in the user settings
    //      if it's checked then check the difficulties
    //          if the specified string is found in the difficulty name, then it's added 
    //          else delete the difficulty
    //          when no difficulty are located in the object, then we delete the parent element (map)
    //      else 
    //          we delete the parent element (map)
    //  we finally return the map under it's final form
    //
    map_data.forEach(function(value, map) {
        if (!(map.toLowerCase().indexOf(string.toLowerCase()) >=0)) {
            if (document.getElementById("diff_search_box").checked) {
                Array.from(map_data.get(map).get("difficulties").keys()).forEach(function(diff) {
                    if (!(diff.toLowerCase().indexOf(string) >= 0)) {
                        map_data.get(map).get("difficulties").delete(diff)
                    }
                })
                if (Array.from(map_data.get(map).get("difficulties").keys()).length == 0) {
                    map_data.delete(map)
                }
            } else {
                map_data.delete(map)
            }   
        }
    })
    return map_data
}

function show_result(data, init=false) {
    
    if (document.querySelectorAll(".beatmap")) {
        document.querySelectorAll(".beatmap").forEach(function(item) {
            item.style.display = "none"
        })
    }
    
    if (init) {
        data.forEach(function(value, map) {
            createChild(map, data)
        })
        init = false;
    } else {
        document.querySelectorAll(".beatmap").forEach(function(item) {
            if (data.get(item.querySelector("p").textContent.split("Total")[0])) {
                item.style.display = ""
            }
        })
    }
}

function createChild(map, data) {
    var body = document.querySelector("body");
    // create a section for each map
    let beatmap = document.createElement("section");
    beatmap.classList.add("beatmap");
    // set their background to the map background
    beatmap.style.backgroundImage = 'url("bg/'+map+'/bg.jpg")'

    var mapText = document.createElement("p");
    mapText.appendChild(document.createTextNode(map));
    var total_time_played_node = document.createElement("span");
    var total_time_played = 0;

    data.get(map).get("difficulties").forEach(function(time, diff) {
        total_time_played += time
    })

    if (nextMode == "Editor") {
        total_time_played_node.appendChild(document.createTextNode("Total Time Played: "+msToTime(total_time_played)));
    } else {
        total_time_played_node.appendChild(document.createTextNode("Total Time Edited: "+msToTime(total_time_played)));
    }

    mapText.appendChild(total_time_played_node);
    beatmap.appendChild(mapText);

    beatmap.addEventListener("click", function() {
        if (this.querySelector("div").style.display == "none") {   
            this.querySelector("div").style.display = ""
        } else {
            this.querySelector("div").style.display = "none"
        }
    })
    
    var diffList = document.createElement("div");
    diffList.classList.add("diffList")

    data.get(map).get("difficulties").forEach(function(value, difficulty) {
        let diffContainer = document.createElement("div");
        let DiffContent = document.createElement("p");
        DiffContent.appendChild(document.createTextNode(difficulty));
        let TimePlayed = document.createElement("span")

        if (nextMode == "Editor") {
            TimePlayed.appendChild(document.createTextNode("Time Played: "+msToTime(value)))
        } else {
            TimePlayed.appendChild(document.createTextNode("Time Edited: "+msToTime(value)))
        }

        DiffContent.appendChild(TimePlayed);
        diffContainer.appendChild(DiffContent);
        diffList.appendChild(diffContainer);
    })
    diffList.style.display = "none"
    beatmap.appendChild(diffList);

    body.appendChild(beatmap);
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
            return false
        }
        Array.from(firstMap.get(map).get("difficulties").keys()).forEach(function(diff) {
            if (!secondMap.get(map).get("difficulties").get(diff)) {
                return false
            }
        })
    })
    return true
}

function SortElements(map_data) {
    let method = document.getElementById("sort_method_dropdown").value
    let direction = document.getElementById("sort_dir_dropdown").value
    if (method == "default") {
        if (direction == "Dsc") {
            return new Map(Array.from(map_data).reverse())
        } else {
            return map_data
        }
    }
    if (method == "time") {
        if (direction == "Dsc") {
            return new Map(Array.from(sortByTime(map_data)).reverse())
        } else {
            return sortByTime(map_data)
        }
    } else {
        return new Map(Array.from(map_data));
    }
}

function sortByTime(map_data) {
    return new Map(Array.from(map_data).sort(function(firstElement,secondElement) {
        let a = 0;
        let b = 0;
        map_data.get(firstElement[0]).get("difficulties").forEach(function(time, difficulty) {
            a += time;
        });
        map_data.get(secondElement[0]).get("difficulties").forEach(function(time, difficulty) {
            b += time;
        });
        return a - b;
    }))
}

function setCheckBoxState(selected){
    if (selected.checked == false) {
        localStorage.setItem("diff_search", "")
    }
    if (selected.checked == true) {
        localStorage.setItem("diff_search", "true")
    }
}

function setSortmethodState(selected) {
    if (selected.value == "default") {
        localStorage.setItem("sort_method", "default")
    }
    if (selected.value == "time") {
        localStorage.setItem("sort_method", "time")
    }
    if (selected.value == "alpha") {
        localStorage.setItem("sort_method", "alpha")
    }
}

function setSortdirState(selected) {
    if (selected.value == "Asc") {
        localStorage.setItem("sort_dir", "Asc")
    }
    if (selected.value == "Dsc") {
        localStorage.setItem("sort_dir", "Dsc")
    }
}

function setMenuState(selected) {
    if (selected.value == "left") {
        document.querySelector(".menu").style.flexDirection = "row-reverse"
        document.querySelector(".search_sort").style.flexDirection = "row-reverse"
        document.querySelector(".search_settings").style.padding = "0 2rem 0 3rem"
        document.querySelector(".settings_menu").style.right = "auto"
        document.querySelector(".settings_menu").style.left = "1rem"
    }
    if (selected.value == "right") {
        document.querySelector(".menu").style.flexDirection = ""
        document.querySelector(".search_sort").style.flexDirection = ""
        document.querySelector(".search_settings").style.padding = ""
        document.querySelector(".settings_menu").style.right = ""
        document.querySelector(".settings_menu").style.left = ""
    }
}

function setHandState(selected) {
    if (selected.value == "right") {
        localStorage.setItem("hand", "right")
        setMenuState(selected)
    }
    if (selected.value == "left") {
        localStorage.setItem("hand", "left")
        setMenuState(selected)
    }
}

function setMultiplayerState(selected) {
    if (selected.checked == false) {
        localStorage.setItem("MultiPlayer", "")
    }
    if (selected.checked == true) {
        localStorage.setItem("MultiPlayer", "true")
    }
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
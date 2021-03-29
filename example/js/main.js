document.addEventListener('DOMContentLoaded', function () {
    var requests = new XMLHttpRequest();
    var file = "log.json";

    requests.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            write_report(data);
        }
    };

    requests.open("GET", file, true);
    requests.send();
});

function write_report(data) {
    var body = document.querySelector("body");
    for (var map in data) {
        

        var figure = document.createElement("section");
        figure.setAttribute("value", false)
        figure.addEventListener("click", function() {
            console.log(this.getAttribute("value"));
            if (this.getAttribute("value") == "false") {
                var diff_list = document.createElement("div");
                for (var diff in data[this.querySelector("p").innerHTML]["difficulties"]) {
                    var diff_container = document.createElement("div");

                    var diff_text_node = document.createElement("p");
                    var diff_text = document.createTextNode(diff);
                    diff_text_node.appendChild(diff_text);
                    diff_container.appendChild(diff_text_node);

                    var diff_node = document.createElement("span");
                    var diff_text_node = document.createElement("p");
                    var diff_text = document.createTextNode(msToTime(data[this.querySelector("p").innerHTML]["difficulties"][diff]));
                    diff_text_node.appendChild(diff_text);
                    diff_node.appendChild(diff_text_node);
                    diff_container.appendChild(diff_node);

                    diff_list.append(diff_container);
                    this.setAttribute("value", true);
                }
                this.appendChild(diff_list);
            } else {
                diffs = this.querySelectorAll("p");
                this.removeChild(this.querySelector("div"));
                this.setAttribute("value", false);
            }
        });

        var figcaption = document.createElement("p");
        var text = document.createTextNode(map);
        figcaption.appendChild(text);

        var total_time_played_parent_node = document.createElement("span");
        var total_time_played = 0;
        for (var difficulty in data[map]["difficulties"]) {
            total_time_played += data[map]["difficulties"][difficulty]
        }
        var total_time_played_node = document.createElement("p");
        
        var total_played_text = document.createTextNode("Time played: "+msToTime(total_time_played));

        total_time_played_node.appendChild(total_played_text);
        total_time_played_parent_node.appendChild(total_time_played_node);

        figure.appendChild(figcaption);
        figure.appendChild(total_time_played_parent_node);

        body.appendChild(figure);
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
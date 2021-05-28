var doExist = false;

document.addEventListener('DOMContentLoaded', async function () {
    if (localStorage.getItem("token") == undefined) {
        var token = "";
        var generating = true;
        while (generating) {
            token = ""
            while (token.length != 64) {
                token += Math.round(Math.random() * 10)
            }
            
            var request = axios.get("data/");
            result = await request.then(checkToken)
            
            if (result == false) {
                generating = false
            }     
        }
        localStorage.setItem("token", token)
    }
})

function checkToken(response) {
    var parser = new DOMParser();
    parser.parseFromString(response["data"],'text/html').querySelectorAll("li").forEach(function(item) {
        if (token == item.textContent) {
                return true
        }
    })
    return false
}

function showError(error) {
    console.log(error)
}
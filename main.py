import json
import os
import sys
try:
    import shutil
except:
    a = input("shutil need to be installed in order for this script to be used, do you wish to install shutil now? Y/n: ")
    if a == "Y" or a == "y" or a == "YES" or a == "yes":
        import subprocess
        import sys
        subprocess.call([sys.executable, "-m", "pip", "install", "shutil"])
        import shutil
from time import sleep
try:
    import asyncio
except:
    a = input("asyncio need to be installed in order for this script to be used, do you wish to install asyncio now? Y/n: ")
    if a == "Y" or a == "y" or a == "YES" or a == "yes":
        import subprocess
        import sys
        subprocess.call([sys.executable, "-m", "pip", "install", "asyncio"])
        import asyncio
try:
    from PIL import Image
except:
    a = input("Pillow need to be installed in order for this script to be used, do you wish to install Pillow now? Y/n: ")
    if a == "Y" or a == "y" or a == "YES" or a == "yes":
        import subprocess
        import sys
        subprocess.call([sys.executable, "-m", "pip", "install", "Pillow"])
        from PIL import Image
import threading
import websocket as websockets
import traceback
import requests

old_time = 0
time_passed = 0
last_state = 0
interval = .3
Timings = [old_time, time_passed]
data = None
api_endpoint = "ws://localhost:24050/ws"
websocket_thread = None

def runserver():
    os.system(sys.executable+" -m http.server --bind 0.0.0.0")

threading.Thread(target=runserver).start()

if not os.path.exists("settings.json"):
    prompt = True
    while prompt:
        token = input("Input token obtained from the website here: ")
        if token.isdigit:
            with requests.get("http://localhost:8000/data/"+token+"/") as r:
                if r.status_code == 200:
                    with open("settings.json", "w") as f:
                        json.dump({"token":token}, f)
                        prompt = False
with open("settings.json", "r") as f:
    token = json.load(f)["token"]

async def movebg(bm, songpath):
    title = bm["metadata"]["artist"] + " - " + bm["metadata"]["title"]
    title = str(bm["set"])+" "+title
    char_list_excl = ["/","\\",'"',"*","?","<",">","|",":","."]
    for s in char_list_excl:
        title = title.replace(s,"")
    if title[-1] == " ":
        title = title[-1]
    if title in os.listdir("bg"):
        pass
    else:
        os.makedirs("bg/"+title)
        shutil.copy(songpath+"\\"+bm["path"]["full"], os.path.abspath("bg/"+title+"/bg."+bm["path"]["bg"].split(".")[-1]))
        try:
            path = os.path.abspath("bg/"+title+"/"+os.listdir(os.path.abspath("bg/"+title))[0])
            img = Image.open(path)
            img = img.convert('RGB')
            img.save(os.path.abspath("bg/"+title+"/bg.jpg"))
            print("conversion successful")
        except:
            pass


async def getTimePassed(Timings, data):
    old_time, time_passed = Timings[0], Timings[1]
    bm, state, songpath = None, None, None
    # try sending POST request to gosumemory web output, GET can't be used here due to the limited size of the output data using that method
    try:
        # Check if the game is playing while gosumemory is still open
        if "error" not in data:
            state = data["menu"]["state"]
            songpath = data["settings"]["folders"]["songs"]
            bm = data["menu"]["bm"]
            current_time = data["menu"]["bm"]["time"]["current"]
            # Check if the player is actually playing the map, if that's the case, time_passed and  current_time - old_time are sumed, also set current time to old_time
            if current_time > 0 and current_time - old_time > 0 and (state == 2 or state == 1):
                time_passed += current_time - old_time
                old_time = current_time
            # Prevent time_passed from increasing due to increasing old_time at intro before 00:00:00 if this check was missing
            if current_time < 0:
                old_time = 0
            return [old_time,time_passed], state, bm, songpath
        return Timings, state,bm, songpath
    except:
        return Timings, state, bm, songpath
    

async def SaveToFile(Timings, bm, last_state):
    global token
    title = bm["metadata"]["artist"] + " - " + bm["metadata"]["title"]
    title = str(bm["set"])+" "+title
    char_list_excl = ["/","\\",'"',"*","?","<",">","|",":","."]
    for s in char_list_excl:
        title = title.replace(s,"")
    difficulty = bm["metadata"]["difficulty"]
    filepath = __file__.split("main.py")[0]+"data/"+token+"/"+("PlayTime.json" if last_state == 2 else "Editor.json")
    # if log file exist, then check if it's size is 0, else, create a new file with the previous map's data
    if os.path.exists(filepath):
        # if log size is 0, the file is empty, fill the file with previous map's data, else, load log.json into memory then look for the map title in data
        if os.path.getsize(filepath) != 0:
            with open(filepath, "r") as f:
                data = json.load(f)
            # if the title of the map is in the loaded data, then check the difficulty name contained in it, else, write the previous map and difficulty data to file
            if title in data:
                # if the difficulty of the previous played map is in data, then sum time_passed and the time contained in the data for the previous played map, else set the difficulty time to time_passed
                if bm["metadata"]["difficulty"] in data[title]["difficulties"]:
                    data[title]["difficulties"][difficulty] = data[title]["difficulties"][difficulty] + Timings[1]
                else:
                    data[title]["difficulties"][difficulty] = Timings[1]
            else:
                data[title] = {"difficulties": {difficulty: Timings[1]}}
            with open(filepath, "w") as f:
                json.dump(data, f, indent=4)
        else:

            with open(filepath, "w") as f:
                json.dump({title: {"difficulties": {difficulty: Timings[1]}}}, f, indent=4)
    else:
        with open(filepath, "w") as f:
            json.dump({title: {"difficulties": {difficulty: Timings[1]}}}, f, indent=4)
    print("data write")

def on_message(ws, message):
    global last_state
    global Timings
    try:
        data = json.loads(message)
        # Check time passed every [interval] passed
        Timings, state, bm, songpath = asyncio.run(getTimePassed(Timings, data))
        # Save Time passed to file once player is back to menu if the player actually played part of the map
        if (state != 2 and state != 1) and Timings[1] != 0:
            asyncio.run(SaveToFile(Timings, bm, last_state))
            # reset time passed on a map to 0 once done
            Timings[1] = 0
            Timings[0] = 0
            if os.path.exists("bg"):
                asyncio.run(movebg(bm, songpath))
            else:
                os.mkdir("bg")
                asyncio.run(movebg(bm, songpath))
        last_state = state
    except Exception:
        traceback.print_exc()

def on_error(ws, error=None):
    print(error)

def run_ws():
    global api_endpoint
    print("Running websocket and check for messages on "+api_endpoint)
    websocket = websockets.WebSocketApp(api_endpoint, on_message=on_message, on_error=on_error, on_close=on_error)

    websocket.run_forever()

def check_thread_is_alive():
    global websocket_thread

    if websocket_thread is not None:
        if not websocket_thread.is_alive():
            websocket_thread = threading.Thread(target=run_ws)
            websocket_thread.daemon = True
            websocket_thread.start()

websocket_thread = threading.Thread(target=run_ws)
websocket_thread.daemon = True
websocket_thread.start()

running = True
while running:
    check_thread_is_alive()
    # interval present to avoid high cpu usage 
    sleep(interval)




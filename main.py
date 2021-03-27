import json
import os
import requests
from time import sleep
import asyncio

old_time = 0
time_passed = 0
interval = .3
Timings = [old_time, time_passed]
data = None

async def getTimePassed(Timings):
    old_time, time_passed = Timings[0], Timings[1]
    bm, state = None, None
    # try sending POST request to gosumemory web output, GET can't be used here due to the limited size of the output data using that method
    try:
        with requests.post("http://localhost:24050/json") as r:
            json = r.json()
            # Check if the game is playing while gosumemory is still open
            if "error" not in json:
                state = json["menu"]["state"]
                bm = json["menu"]["bm"]
                current_time = json["menu"]["bm"]["time"]["current"]
                # Check if the player is actually playing the map, if that's the case, time_passed and  current_time - old_time are sumed, also set current time to old_time
                if current_time > 0 and current_time - old_time > 0 and state == 2:
                    time_passed += current_time - old_time
                    old_time = current_time
                # Prevent time_passed from increasing due to increasing old_time at intro before 00:00:00 if this check was missing
                if current_time < 0:
                    old_time = 0
                return [old_time,time_passed], state, bm
            return Timings,state,bm
    except:
        return Timings,state,bm
    

async def SaveToFile(Timings, bm):
    title = bm["metadata"]["artist"] + " - " + bm["metadata"]["title"]
    title = "'{}'".format(title).replace("'", "")
    difficulty = bm["metadata"]["difficulty"]
    filepath = __file__.split("main.py")[0]+"log.json"
    # if log file exist, then check if it's size is 0, else, create a new file with the previous map's data
    if os.path.exists(filepath):
        # if log size is 0, the file is empty, fill the file with previous map's data, else, load log.json into memory then look for the map title in data
        if os.path.getsize(filepath) != 0:
            with open(filepath, "r") as f:
                data = json.load(f)
            # if the title of the map is in the loaded data, then check the difficulty name contained in it, else, write the previous map and difficulty data to file
            if title in data:
                # if the difficulty of the previous played map is in data, then sum time_passed and the time contained in the data for the previous played map, else set the difficulty time to time_passed
                if bm["metadata"]["difficulty"] in data[title]:
                    data[title][difficulty] = data[title][difficulty] + Timings[1]
                else:
                    data[title][difficulty] = Timings[1]
            else:
                data[title] = {difficulty: Timings[1]}
            with open(filepath, "w") as f:
                f.write(json.dumps(data))
        else:

            with open(filepath, "w") as f:
                json.dump({title: {difficulty: Timings[1]}}, f)
    else:
        with open(filepath, "w") as f:
            json.dump({title: {difficulty: Timings[1]}}, f)
    print("data write")

running = True
while running:
    # Check time passed every [interval] passed
    Timings, state, bm = asyncio.run(getTimePassed(Timings))
    # Save Time passed to file once player is back to menu if the player actually played part of the map
    if state != 2 and Timings[1] != 0:
        asyncio.run(SaveToFile(Timings, bm))
        # reset time passed on a map to 0 once done
        Timings[1] = 0
    # interval present to avoid high cpu usage 
    sleep(interval)
    

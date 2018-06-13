import os
import sys

def runjmetertests():
    try:
        directory = sys.argv[1]
    except:
        print("Error: Enter a valid local repository")
        return "None"
    try:
        path = './' + directory
        files = os.listdir(path)
    except IOError:
        print("Error: Configuration file not found or inaccessible.")
        return "None"
    for file in files:
        if file.endswith('.jmx'):
            return file
    return "None"
print(runjmetertests())

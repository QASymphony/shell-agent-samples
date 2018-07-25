import sys
import os

def runseleniumtests():
    try:
        directory = sys.argv[1]
    except:
        print("Error: Enter a valid local repository")
        return "None"
    try:
        path = './' + directory + '/bin/Debug'
        files = os.listdir(path)
    except IOError:
        print("Error: Configuration file not found or inaccessible.")
        return "None"
    for file in files:
        if directory in file and '.dll' in file:
            return file
    return "None"
print(runseleniumtests())

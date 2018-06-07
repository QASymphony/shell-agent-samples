import sys
import ast

def runmvntests():
    try:
        dictionary = ast.literal_eval(sys.argv[1])
        arg = ""
        for key in dictionary:
            first = True
            string = key + '#'
            for elem in dictionary.get(key):
                if first is True:
                    string = string + elem
                else:
                    string = string + '+' + elem
                first = False
            if arg is not "":
                arg = arg + ";" + string
            else:
                arg = arg + string
        return arg
    except:
        return "No Scheduled Tests"


print(runmvntests())

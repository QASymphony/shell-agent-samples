import sys
import ast

def run_robot_tests():
    try:
        dictionary = ast.literal_eval(sys.argv[1])
        arg = ""
        for key in dictionary:
            key = key.replace(" ", "_")
            if arg is not "":
                arg = arg + ";" + key
            else:
                arg = arg + key + ";"
        return arg
    except:
        return "No Scheduled Tests"

print(run_robot_tests())

from functions import get_config

try:
    qtest_config = get_config()
    url = qtest_config["git_url"]
    print(url)
except:
    print("Not using Github Repository")